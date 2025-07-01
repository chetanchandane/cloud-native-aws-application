
############################
# IAM Role for Lambda
############################


resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

############################
# Lambda Function
############################
resource "aws_lambda_function" "macro_calculator" {
  function_name = "macro-calculator"
  filename      = "${path.module}/lambda_function.zip"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  role          = var.lambda_role_arn
  memory_size   = 128
  timeout       = 3

  source_code_hash = filebase64sha256("${path.module}/lambda_function.zip")
}

############################
# API Gateway REST API
############################

resource "aws_api_gateway_resource" "calculate_macro" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "calculate-macro"
}

resource "aws_api_gateway_method" "post_method" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.calculate_macro.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.calculate_macro.id
  http_method             = aws_api_gateway_method.post_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.macro_calculator.invoke_arn
}

resource "aws_lambda_permission" "allow_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.macro_calculator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/*"
}


# CORS configuration

resource "aws_api_gateway_method" "options_method" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.calculate_macro.id
  http_method = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.calculate_macro.id
  http_method = aws_api_gateway_method.options_method.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }

  depends_on = [
    aws_api_gateway_method.options_method
  ]
}

resource "aws_api_gateway_method_response" "options_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.calculate_macro.id
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

  depends_on = [
    aws_api_gateway_integration.options_integration
  ]
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.calculate_macro.id
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

  depends_on = [
    aws_api_gateway_method_response.options_response
  ]
}
