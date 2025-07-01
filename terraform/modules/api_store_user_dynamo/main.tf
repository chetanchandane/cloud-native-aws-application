# # Upload your Lambda zip separately to this path

# resource "aws_lambda_function" "store_user_profile" {
#   function_name = "store-user-profile"
#   handler       = "index.handler"
#   runtime       = "nodejs18.x"
#   role          = var.lambda_role_arn

#   filename         = "${path.module}/lambda_function.zip"
#   source_code_hash = filebase64sha256("${path.module}/lambda_function.zip")

#   environment {
#     variables = {
#       USER_TABLE = var.users_table
#     }
#   }
# }

# #api

# resource "aws_api_gateway_resource" "store_user_profile" {
#   rest_api_id = var.api_id
#   parent_id   = var.root_resource_id
#   path_part   = "complete-profile"
# }

# resource "aws_api_gateway_method" "post_store_user_profile" {
#   rest_api_id   = var.api_id
#   resource_id   = aws_api_gateway_resource.store_user_profile.id
#   http_method   = "POST"
#   authorization = "NONE"
# }

# resource "aws_api_gateway_method_response" "post_store_user_profile_response" {
#   rest_api_id = var.api_id
#   resource_id = aws_api_gateway_resource.store_user_profile.id
#   http_method = "POST"
#   status_code = "200"

#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Origin" = true
#   }

#   response_models = {
#     "application/json" = "Empty"
#   }
# }

# resource "aws_api_gateway_integration_response" "post_store_user_profile_integration_response" {
#   rest_api_id = var.api_id
#   resource_id = aws_api_gateway_resource.store_user_profile.id
#   http_method = "POST"
#   status_code = "200"

#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Origin" = "'*'" # or your frontend origin
#   }

#   response_templates = {
#     "application/json" = ""
#   }
# }


# resource "aws_api_gateway_integration" "post_lambda_integration" {
#     depends_on = [aws_api_gateway_method.post_store_user_profile]
#   rest_api_id             = var.api_id
#   resource_id             = aws_api_gateway_resource.store_user_profile.id
#   http_method             = aws_api_gateway_method.post_store_user_profile.http_method
#   integration_http_method = "POST"
#   type                    = "AWS_PROXY"
#   uri                     = aws_lambda_function.store_user_profile.invoke_arn
# }

# resource "aws_lambda_permission" "allow_apigw_invoke" {
#   statement_id  = "AllowAPIGatewayInvokeStoreUserProfile"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.store_user_profile.function_name
#   principal     = "apigateway.amazonaws.com"
#   source_arn    = "${var.api_execution_arn}/*/*"
# }

# # CORS Configuration

# resource "aws_api_gateway_method" "options_store_user_profile" {
#   rest_api_id   = var.api_id
#   resource_id   = aws_api_gateway_resource.store_user_profile.id
#   http_method   = "OPTIONS"
#   authorization = "NONE"
# }

# resource "aws_api_gateway_integration" "options_mock_integration" {
#     depends_on = [aws_api_gateway_method.options_store_user_profile]
#   rest_api_id             = var.api_id
#   resource_id             = aws_api_gateway_resource.store_user_profile.id
#   http_method             = "OPTIONS"
#   type                    = "MOCK"
#   request_templates = {
#     "application/json" = "{\"statusCode\": 200}"
#   }
# }

# resource "aws_api_gateway_method_response" "options_response" {
#   rest_api_id = var.api_id
#   resource_id = aws_api_gateway_resource.store_user_profile.id
#   http_method = "OPTIONS"
#   status_code = "200"

#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Headers" = true
#     "method.response.header.Access-Control-Allow-Methods" = true
#     "method.response.header.Access-Control-Allow-Origin"  = true
#   }

#   response_models = {
#     "application/json" = "Empty"
#   }
# }

# resource "aws_api_gateway_integration_response" "options_integration_response" {
#   depends_on = [ aws_api_gateway_method_response.options_response ]
#   rest_api_id = var.api_id
#   resource_id = aws_api_gateway_resource.store_user_profile.id
#   http_method = "OPTIONS"
#   status_code = aws_api_gateway_method_response.options_response.status_code

#   response_parameters = {
#     "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
#     "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
#     "method.response.header.Access-Control-Allow-Origin"  = "'*'"
#   }

#   response_templates = {
#     "application/json" = ""
#   }
# }

# Upload your Lambda zip separately to this path
resource "aws_lambda_function" "store_user_profile" {
  function_name = "store-user-profile"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = var.lambda_role_arn

  filename         = "${path.module}/lambda_function.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda_function.zip")

  environment {
    variables = {
      USER_TABLE = var.users_table
    }
  }
}

# API Gateway resource for /complete-profile
resource "aws_api_gateway_resource" "store_user_profile" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "complete-profile"
}

# POST /complete-profile
resource "aws_api_gateway_method" "post_store_user_profile" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.store_user_profile.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_lambda_integration" {
  depends_on              = [aws_api_gateway_method.post_store_user_profile]
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.store_user_profile.id
  http_method             = aws_api_gateway_method.post_store_user_profile.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.store_user_profile.invoke_arn
}

resource "aws_api_gateway_method_response" "post_store_user_profile_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.store_user_profile.id
  http_method = "POST"
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }

  response_models = {
    "application/json" = "Empty"
  }
  depends_on = [
    aws_api_gateway_method.post_store_user_profile
  ]
}

resource "aws_api_gateway_integration_response" "post_store_user_profile_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.store_user_profile.id
  http_method = "POST"
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'" # or replace with your frontend origin
  }

  response_templates = {
    "application/json" = ""
  }
  depends_on = [
    aws_api_gateway_integration.post_lambda_integration,
    aws_api_gateway_method_response.post_store_user_profile_response
  ]
}

# Lambda permission for API Gateway to invoke it
resource "aws_lambda_permission" "allow_apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvokeStoreUserProfile"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.store_user_profile.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/*"
}

# OPTIONS /complete-profile for CORS preflight
resource "aws_api_gateway_method" "options_store_user_profile" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.store_user_profile.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_mock_integration" {
  depends_on              = [aws_api_gateway_method.options_store_user_profile]
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.store_user_profile.id
  http_method             = "OPTIONS"
  type                    = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.store_user_profile.id
  http_method = "OPTIONS"
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
  depends_on = [
    aws_api_gateway_method.options_store_user_profile
  ]
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  # depends_on  = [aws_api_gateway_method_response.options_response]
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.store_user_profile.id
  http_method = "OPTIONS"
  status_code = aws_api_gateway_method_response.options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'" # or use your Amplify frontend domain
  }

  response_templates = {
    "application/json" = ""
  }
  depends_on = [
    aws_api_gateway_integration.options_mock_integration,
    aws_api_gateway_method_response.options_response
  ]
}
