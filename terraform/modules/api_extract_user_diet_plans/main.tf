############################
# IAM Role for Lambda
############################


resource "aws_iam_role_policy_attachment" "lambda_basic_logs" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

############################
# Lambda Function
############################
resource "aws_lambda_function" "diet_dashboard" {
  function_name = "diet-dashboard"
  filename      = "${path.module}/lambda_function.zip"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  source_code_hash = filebase64sha256("${path.module}/lambda_function.zip")
  timeout       = 120
  memory_size   = 128
  role          = var.lambda_role_arn

  environment {
    variables = {
      DIET_PLANS_TABLE         = var.diet_plans_table
      CUSTOMIZED_SUBSCRIPTION  = var.customized_subscription
    }
  }
}

############################
# API Gateway REST
############################

resource "aws_api_gateway_resource" "plans" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "plans"
}

resource "aws_api_gateway_method" "get_plans" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.plans.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.plans.id
  http_method             = aws_api_gateway_method.get_plans.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.diet_dashboard.invoke_arn
  depends_on = [ aws_api_gateway_method.get_plans ]
}

resource "aws_api_gateway_method" "options_method" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.plans.id
  http_method = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.plans.id
  http_method = "OPTIONS"
  type = "MOCK"
  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
  depends_on = [ aws_api_gateway_method.options_method ]
}

resource "aws_api_gateway_method_response" "options_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.plans.id
  http_method = "OPTIONS"
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
  response_models = {
    "application/json" = "Empty"
  }
  depends_on = [ aws_api_gateway_method.options_method ]
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.plans.id
  http_method = "OPTIONS"
  status_code = aws_api_gateway_method_response.options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'*'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  response_templates = {
    "application/json" = ""
  }
    depends_on = [
    aws_api_gateway_integration.options_integration,
    aws_api_gateway_method_response.options_response
  ]
}


############################
# Lambda Permissions
############################
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.diet_dashboard.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/*"
}
