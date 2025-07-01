resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

############################
# DynamoDB Tables
############################
resource "aws_dynamodb_table" "users" {
  name         = var.users_table
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "diet_plans" {
  name         = var.diet_plans_table
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "plan_date"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "plan_date"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "customized_subscription" {
  name         = var.subscription_table
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "subscription_start_date"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "subscription_start_date"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "meal_logs" {
  name           = var.meal_logs_table
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "meal_log_id"

  attribute {
    name = "meal_log_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name               = "UserIndex"
    hash_key           = "user_id"
    projection_type    = "ALL"
    read_capacity      = 5
    write_capacity     = 5
  }

  tags = local.common_tags
}

############################
# Lambda Function
############################
resource "aws_lambda_function" "dietgenerator" {
  function_name = "dietgenerator"
  role          = var.lambda_role_arn
  runtime       = "nodejs22.x"
  handler       = "index.handler"
  filename         = "${path.module}/lambda_function.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda_function.zip")
  memory_size = 128
  timeout     = 210

  environment {
    variables = {
      USERS_TABLE              = var.users_table
      DIET_PLANS_TABLE         = var.diet_plans_table
      CUSTOMIZED_SUBSCRIPTION  = var.subscription_table
      OPENAI_API_KEY           = var.openai_api_key
    }
  }

  tags = local.common_tags

  depends_on = [
  aws_iam_role_policy_attachment.lambda_dynamodb,
  aws_iam_role_policy_attachment.lambda_logs
]

}


############################
# REST API Gateway Setup
############################
# resource "aws_api_gateway_rest_api" "diet_api" {
#   name        = "dietgenerator-API"
#   description = "REST API for diet generation Lambda"
# }

resource "aws_api_gateway_resource" "generate_diet" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "generate-diet"
}

resource "aws_api_gateway_method" "post_method" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.generate_diet.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.generate_diet.id
  http_method             = aws_api_gateway_method.post_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.dietgenerator.invoke_arn
}

resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.generate_diet.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.generate_diet.id
  http_method             = aws_api_gateway_method.options_method.http_method
  type                    = "MOCK"
  request_templates       = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_method_response" "options_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.generate_diet.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.generate_diet.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }
}

resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.dietgenerator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/*"
}

############################
# Locals
############################
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project
  }
}
