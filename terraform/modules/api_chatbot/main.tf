##################################
# /chat Resource
##################################
resource "aws_api_gateway_resource" "chat" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "chat"
}

##################################
# POST /chat Method and Integration
##################################
resource "aws_api_gateway_method" "post_chat" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.chat.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_lambda_function" "chatbot_lambda" {
  filename         = "${path.module}/chatbot_lambda.zip" # <- zip file for your chatbot code
  function_name    = "chatbot-interaction"
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  memory_size      = 128
  timeout          = 30
  role             = var.lambda_role_arn # IAM role passed from your root module

  environment {
    variables = {
      OPENAI_API_KEY = var.openai_api_key # You should define this securely
    }
  }
}


resource "aws_api_gateway_integration" "post_chat_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.chat.id
  http_method             = aws_api_gateway_method.post_chat.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.chatbot_lambda.invoke_arn # <- replace correctly
  passthrough_behavior    = "WHEN_NO_MATCH"
  content_handling        = "CONVERT_TO_TEXT"
  timeout_milliseconds    = 29000
}

resource "aws_lambda_permission" "chat_lambda_permission" {
  statement_id  = "AllowAPIGatewayInvokeChat"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chatbot_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/POST/chat"
}

##################################
# POST /chat Method Response and Integration Response (CORS)
##################################
resource "aws_api_gateway_method_response" "post_chat_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.post_chat.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

# resource "aws_api_gateway_integration_response" "post_chat_integration_response" {
#   rest_api_id = var.api_id
#   resource_id = aws_api_gateway_resource.chat.id
#   http_method = aws_api_gateway_method.post_chat.http_method
#   status_code = aws_api_gateway_method_response.post_chat_response.status_code

#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Origin" = "'*'"
#   }

#   response_templates = {
#     "application/json" = ""
#   }
# }

##################################
# OPTIONS /chat (CORS Preflight)
##################################
resource "aws_api_gateway_method" "options_chat" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_chat_integration" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.options_chat.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_chat_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.options_chat.http_method
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

resource "aws_api_gateway_integration_response" "options_chat_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.options_chat.http_method
  status_code = aws_api_gateway_method_response.options_chat_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }
}
