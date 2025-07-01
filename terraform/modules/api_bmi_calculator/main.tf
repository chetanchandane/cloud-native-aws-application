



resource "aws_iam_policy_attachment" "lambda_logs" {
  name       = "lambda_logs"
  roles      = [var.lambda_role_name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "bmi_calculator" {
  function_name = "bmi-calculator"
  role          = var.lambda_role_arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  timeout       = 3
  memory_size   = 128
  filename      = "${path.module}/lambda_function.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda_function.zip")
}


resource "aws_api_gateway_resource" "bmi" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "calculate-bmi"
}

resource "aws_api_gateway_method" "post_bmi" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.bmi.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.bmi.id
  http_method = aws_api_gateway_method.post_bmi.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.bmi_calculator.invoke_arn
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.bmi_calculator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/*"
}


# CORs configuration
# OPTIONS method
resource "aws_api_gateway_method" "options_bmi" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.bmi.id
  http_method = "OPTIONS"
  authorization = "NONE"
}

# MOCK integration for OPTIONS
resource "aws_api_gateway_integration" "options_bmi_mock" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.bmi.id
  http_method = aws_api_gateway_method.options_bmi.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }

  depends_on = [
    aws_api_gateway_method.options_bmi
  ]
}

# Method response for OPTIONS with CORS headers
resource "aws_api_gateway_method_response" "options_bmi_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.bmi.id
  http_method = aws_api_gateway_method.options_bmi.http_method
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
    aws_api_gateway_integration.options_bmi_mock
  ]
}

# Integration response for OPTIONS with CORS headers
resource "aws_api_gateway_integration_response" "options_bmi_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.bmi.id
  http_method = aws_api_gateway_method.options_bmi.http_method
  status_code = aws_api_gateway_method_response.options_bmi_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }

  depends_on = [
    aws_api_gateway_method_response.options_bmi_response
  ]
}
