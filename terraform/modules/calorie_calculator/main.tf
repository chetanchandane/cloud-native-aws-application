
# resource "aws_iam_role" "lambda_exec_role" {
#   name = "lambda-calorie-role"

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [{
#       Effect    = "Allow",
#       Principal = { Service = "lambda.amazonaws.com" },
#       Action    = "sts:AssumeRole"
#     }]
#   })
# }

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "calorie_calculator" {
  filename         = "${path.module}/lambda.zip"
  function_name    = "calorie-calculator"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  source_code_hash = filebase64sha256("${path.module}/lambda.zip")
  timeout          = 3
  memory_size      = 128
}

# resource "aws_api_gateway_rest_api" "api" {
#   name = "calorie-calculator-api"
# }

resource "aws_api_gateway_resource" "calculate_calorie" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "calculate-calorie"
}

resource "aws_api_gateway_method" "post_calorie" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.calculate_calorie.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_calorie" {
  depends_on = [ aws_api_gateway_method.post_calorie ]
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.calculate_calorie.id
  http_method = aws_api_gateway_method.post_calorie.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.calorie_calculator.invoke_arn
}

resource "aws_lambda_permission" "apigw_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.calorie_calculator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/*"
}

# CORS Configuration
resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.calculate_calorie.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_integration" {
  depends_on = [ aws_api_gateway_method.options_method ]
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.calculate_calorie.id
  http_method             = aws_api_gateway_method.options_method.http_method
  type                    = "MOCK"
  request_templates       = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

# resource "aws_api_gateway_method_response" "options_response" {
#   depends_on = [ aws_api_gateway_method.options_method ]
#   rest_api_id = var.api_id
#   resource_id = aws_api_gateway_resource.calculate_calorie.id
#   http_method = aws_api_gateway_method.options_method.http_method
#   status_code = "200"

#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Headers" = true,
#     "method.response.header.Access-Control-Allow-Methods" = true,
#     "method.response.header.Access-Control-Allow-Origin"  = true
#   }

#   response_models = {
#     "application/json" = "Empty"
#   }
# }
resource "aws_api_gateway_method_response" "options_response" {
  depends_on = [aws_api_gateway_method.options_method]

  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.calculate_calorie.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

# resource "aws_api_gateway_integration_response" "options_integration_response" {
#   depends_on = [ aws_api_gateway_integration.options_response ]
#   rest_api_id = var.api_id
#   resource_id = aws_api_gateway_resource.calculate_calorie.id
#   http_method = aws_api_gateway_method.options_method.http_method
#   status_code = aws_api_gateway_method_response.options_response.status_code

#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
#     "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'",
#     "method.response.header.Access-Control-Allow-Origin"  = "'*'"
#   }

#   response_templates = {
#     "application/json" = ""
#   }
# }
resource "aws_api_gateway_integration_response" "options_integration_response" {
  depends_on = [aws_api_gateway_method_response.options_response]

  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.calculate_calorie.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }
}




