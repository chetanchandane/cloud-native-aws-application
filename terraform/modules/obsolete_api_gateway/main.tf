resource "aws_api_gateway_rest_api" "this" {
  name        = var.api_name
  description = "API Gateway for AI Diet Assistant - Chatbot"
}

# Resource path /chat
resource "aws_api_gateway_resource" "chat" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "chat"
}

# Method: POST /chat
resource "aws_api_gateway_method" "chat_post" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.chat.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

# Authorizer
resource "aws_api_gateway_authorizer" "cognito_auth" {
  name                   = "cognito_auth"
  rest_api_id            = aws_api_gateway_rest_api.this.id
  type                   = "COGNITO_USER_POOLS"
  identity_source        = "method.request.header.Authorization"
  provider_arns          = [var.api_cognito_user_pool_arn]
}

# Integration with Lambda
resource "aws_api_gateway_integration" "chat_integration" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.chat_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arn  # Lambda invoke ARN - need to look into this
}

# Deployment
resource "aws_api_gateway_deployment" "chat-deploy" {
  depends_on = [aws_api_gateway_integration.chat_integration]
  rest_api_id = aws_api_gateway_rest_api.this.id

}

# Stage
resource "aws_api_gateway_stage" "stage" {
    deployment_id = aws_api_gateway_deployment.chat-deploy.id
    rest_api_id = aws_api_gateway_rest_api.this.id
    stage_name  = var.stage_name
    }



# ACM Certificate 
# resource "aws_api_gateway_domain_name" "domain_name" {
#   certificate_arn = var.certificate_arn
#   domain_name = var.domain_name
  
# }
# resource "aws_api_gateway_base_path_mapping" "path_mapping" {
#   base_path = "v1"
#   api_id = aws_api_gateway_rest_api.this.id
#   stage_name = aws_api_gateway_stage.stage.stage_name
  
# }
