
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

# Lambda Functions
resource "aws_lambda_function" "food_count" {
  function_name = "food-count-lambda"
  role          = var.lambda_role_arn
  runtime       = "nodejs22.x"
  handler       = "foodCalories.handler"
  filename         = "${path.module}/food-count-lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/food-count-lambda.zip")
  timeout          = 30
  memory_size      = 128

  environment {
    variables = {
      OPENAI_API_KEY = var.openai_api_key
    }
  }
}

resource "aws_lambda_function" "meal_logs" {
  function_name = "meal-logs-lambda"
  role          = var.lambda_role_arn
  runtime       = "nodejs22.x"
  handler       = "mealLogsRouter.handler"
  filename         = "${path.module}/meal-logs-lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/meal-logs-lambda.zip")
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      MEAL_LOGS_TABLE    = var.meal_logs_table
      SUBSCRIPTION_TABLE = var.subscription_table
    }
  }
}

# We'll stop here and continue the rest (API Gateway + CORS + Deployments) in the next cell due to length

# ------------------------------
# API Gateway - food-calorie-API
# ------------------------------
# resource "aws_api_gateway_rest_api" "food_api" {
#   name = "food-calorie-API"
# }

resource "aws_api_gateway_resource" "calories" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "calories"
}

resource "aws_api_gateway_method" "post_calories" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.calories.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "calories_lambda" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.calories.id
  http_method             = aws_api_gateway_method.post_calories.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.food_count.invoke_arn
}

resource "aws_lambda_permission" "food_api_permission" {
  statement_id  = "AllowAPIGatewayInvokeFood"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.food_count.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/POST/calories"
}

resource "aws_api_gateway_method" "options_calories" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.calories.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_calories_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.calories.id
  http_method             = aws_api_gateway_method.options_calories.http_method
  type                    = "MOCK"
  request_templates       = {
    "application/json" = "{\"statusCode\": 200}"
  }
  integration_http_method = "POST"
}

resource "aws_api_gateway_method_response" "options_calories_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.calories.id
  http_method = "OPTIONS"
  status_code = "200"

  depends_on = [aws_api_gateway_method.options_calories]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_calories_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.calories.id
  http_method = aws_api_gateway_method.options_calories.http_method
  status_code = "200"

  depends_on = [aws_api_gateway_integration.options_calories_integration]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# ------------------------------
# API Gateway - meal-logs-API
# ------------------------------
# resource "aws_api_gateway_rest_api" "meal_logs_api" {
#   name = "meal-logs-API"
# }

resource "aws_api_gateway_resource" "insert_meal_log" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "insert-meal-log"
}

resource "aws_api_gateway_method" "post_insert" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.insert_meal_log.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "insert_lambda" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.insert_meal_log.id
  http_method             = aws_api_gateway_method.post_insert.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.meal_logs.invoke_arn
}

resource "aws_lambda_permission" "meal_logs_post" {
  statement_id  = "AllowAPIGatewayInvokeMealLogsPOST"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.meal_logs.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/POST/insert-meal-log"
}


resource "aws_api_gateway_method" "options_insert" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.insert_meal_log.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_insert_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.insert_meal_log.id
  http_method             = aws_api_gateway_method.options_insert.http_method
  type                    = "MOCK"
  request_templates       = {
    "application/json" = "{\"statusCode\": 200}"
  }
  integration_http_method = "POST"
}

resource "aws_api_gateway_method_response" "options_insert_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.insert_meal_log.id
  http_method = "OPTIONS"
  status_code = "200"

  depends_on = [aws_api_gateway_method.options_insert]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_insert_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.insert_meal_log.id
  http_method = aws_api_gateway_method.options_insert.http_method
  status_code = "200"

  depends_on = [aws_api_gateway_integration.options_insert_integration]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_resource" "get_meal_logs" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "get-meal-logs"
}

resource "aws_api_gateway_method" "get_logs" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.get_meal_logs.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_lambda" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.get_meal_logs.id
  http_method             = aws_api_gateway_method.get_logs.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.meal_logs.invoke_arn
}

resource "aws_lambda_permission" "meal_logs_get" {
  statement_id  = "AllowAPIGatewayInvokeMealLogsGET"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.meal_logs.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/GET/get-meal-logs"
}

resource "aws_api_gateway_method" "options_get_logs" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.get_meal_logs.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_get_logs_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.get_meal_logs.id
  http_method             = aws_api_gateway_method.options_get_logs.http_method
  type                    = "MOCK"
  request_templates       = {
    "application/json" = "{\"statusCode\": 200}"
  }
  integration_http_method = "POST"
}

resource "aws_api_gateway_method_response" "options_get_logs_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.get_meal_logs.id
  http_method = "OPTIONS"
  status_code = "200"

  depends_on = [aws_api_gateway_method.options_get_logs]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_get_logs_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.get_meal_logs.id
  http_method = aws_api_gateway_method.options_get_logs.http_method
  status_code = "200"

  depends_on = [aws_api_gateway_integration.options_get_logs_integration]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

