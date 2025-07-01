
# S3 bucket
# resource "aws_s3_bucket" "image_bucket" {
#   bucket = var.bucket_name
# }

# resource "aws_s3_bucket_cors_configuration" "image_bucket_cors" {
#   bucket = aws_s3_bucket.image_bucket.id

#   cors_rule {
#     allowed_headers = ["*"]
#     allowed_methods = ["GET", "PUT", "POST"]
#     allowed_origins = ["*"]
#     max_age_seconds = 3000
#   }
# }

# IAM role for Lambda
# resource "aws_iam_role" "lambda_exec_role" {
#   name = "lambda_exec_nutrition_role"
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [{
#       Action = "sts:AssumeRole",
#       Effect = "Allow",
#       Principal = {
#         Service = "lambda.amazonaws.com"
#       }
#     }]
#   })
# }

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "rekognition_access" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/AmazonRekognitionReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "s3_full_access" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# Lambda to process S3 image upload and call Nutritionix
resource "aws_lambda_function" "nutrition_lambda" {
  function_name = "NutritionProcessor"
  role          = var.lambda_role_arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.9"
  timeout       = 15

  filename         = data.archive_file.nutrition_zip.output_path
  source_code_hash = data.archive_file.nutrition_zip.output_base64sha256

  environment {
    variables = {
      APP_ID     = var.nutritionix_app_id
      API_KEY    = var.nutritionix_api_key
    }
  }
}

data "archive_file" "nutrition_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

# Trigger nutrition lambda from S3
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.nutrition_lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.bucket_arn
}

resource "aws_s3_bucket_notification" "s3_trigger" {
  bucket = var.bucket_id

  lambda_function {
    lambda_function_arn = aws_lambda_function.nutrition_lambda.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

# Upload Proxy Lambda (to get pre-signed URL)
resource "aws_lambda_function" "upload_proxy_lambda" {
  function_name = "ImageUploadProxy"
  role          = var.lambda_role_arn
  handler       = "upload_proxy.lambda_handler"
  runtime       = "python3.9"
  timeout       = 5

  filename         = data.archive_file.upload_zip.output_path
  source_code_hash = data.archive_file.upload_zip.output_base64sha256

  environment {
    variables = {
      BUCKET_NAME = var.bucket_name
    }
  }
}

data "archive_file" "upload_zip" {
  type        = "zip"
  source_dir  = "${path.module}/upload"
  output_path = "${path.module}/upload.zip"
}

resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_proxy_lambda.function_name
  principal     = "apigateway.amazonaws.com"
}

# resource "aws_apigatewayv2_api" "upload_api" {
#   name          = "UploadAPI"
#   protocol_type = "HTTP"
# }

# resource "aws_apigatewayv2_integration" "lambda_integration" {
#   api_id                 = aws_apigatewayv2_api.upload_api.id
#   integration_type       = "AWS_PROXY"
#   integration_uri        = aws_lambda_function.upload_proxy_lambda.invoke_arn
#   integration_method     = "POST"
#   payload_format_version = "2.0"
# }

# resource "aws_apigatewayv2_route" "upload_route" {
#   api_id    = aws_apigatewayv2_api.upload_api.id
#   route_key = "GET /"
#   target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
# }

# resource "aws_apigatewayv2_stage" "default_stage" {
#   api_id      = aws_apigatewayv2_api.upload_api.id
#   name        = "$default"
#   auto_deploy = true
# }



resource "aws_dynamodb_table" "nutrition_results" {
  name         = "NutritionResults"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "image_key"

  attribute {
    name = "image_key"
    type = "S"
  }

  tags = {
    Environment = "dev"
    Project     = "NutritionTracker"
  }
}

# Policy attachment for DynamoDB access
resource "aws_iam_role_policy" "lambda_dynamodb_write" {
  name = "LambdaDynamoDBWritePolicy"
  role = var.lambda_role_name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["dynamodb:PutItem"],
        Resource = aws_dynamodb_table.nutrition_results.arn
      },
      {
        Effect   = "Allow",
        Action   = ["dynamodb:GetItem"],
        Resource = aws_dynamodb_table.nutrition_results.arn
      }
    ]
  })
}

# get_nutrition Lambda function
resource "aws_lambda_function" "get_nutrition_lambda" {
  function_name = "GetNutritionDetails"
  role          = var.lambda_role_arn
  handler       = "get_nutrition.lambda_handler"
  runtime       = "python3.9"
  timeout       = 5

  filename         = data.archive_file.get_nutrition_zip.output_path
  source_code_hash = data.archive_file.get_nutrition_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.nutrition_results.name
    }
  }
}

data "archive_file" "get_nutrition_zip" {
  type        = "zip"
  source_dir  = "${path.module}/get_nutrition"
  output_path = "${path.module}/get_nutrition.zip"
}

# # API Gateway for get_nutrition
# resource "aws_apigatewayv2_api" "get_nutrition_api" {
#   name          = "GetNutritionAPI"
#   protocol_type = "HTTP"
# }

# resource "aws_apigatewayv2_integration" "get_nutrition_integration" {
#   api_id                 = aws_apigatewayv2_api.get_nutrition_api.id
#   integration_type       = "AWS_PROXY"
#   integration_uri        = aws_lambda_function.get_nutrition_lambda.invoke_arn
#   integration_method     = "POST"
#   payload_format_version = "2.0"
# }

# resource "aws_apigatewayv2_route" "get_nutrition_route" {
#   api_id    = aws_apigatewayv2_api.get_nutrition_api.id
#   route_key = "GET /result/{image_key}"
#   target    = "integrations/${aws_apigatewayv2_integration.get_nutrition_integration.id}"
# }

# resource "aws_apigatewayv2_stage" "get_nutrition_stage" {
#   api_id      = aws_apigatewayv2_api.get_nutrition_api.id
#   name        = "$default"
#   auto_deploy = true
# }

# resource "aws_lambda_permission" "allow_apigw_get" {
#   statement_id  = "AllowAPIGatewayGetNutrition"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.get_nutrition_lambda.function_name
#   principal     = "apigateway.amazonaws.com"
# }

# GET /upload-url
resource "aws_api_gateway_resource" "upload_url" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "upload-url"
}

resource "aws_api_gateway_method" "get_upload_url" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.upload_url.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "upload_url_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.upload_url.id
  http_method             = aws_api_gateway_method.get_upload_url.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.upload_proxy_lambda.invoke_arn
  depends_on              = [aws_api_gateway_method.get_upload_url]
}

#GET /result/{image-key}
resource "aws_api_gateway_resource" "result" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "result"
}

resource "aws_api_gateway_resource" "image_key_param" {
  rest_api_id = var.api_id
  parent_id   = aws_api_gateway_resource.result.id
  path_part   = "{image_key}"
}

resource "aws_api_gateway_method" "get_result" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.image_key_param.id
  http_method   = "GET"
  authorization = "NONE"
  request_parameters = {
    "method.request.path.image_key" = true
  }
}

resource "aws_api_gateway_method_response" "get_result_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.image_key_param.id
  http_method = "GET"
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }

  response_models = {
    "application/json" = "Empty"
  }
  depends_on = [
    aws_api_gateway_method.get_result  # ensure method is created first
  ]
}

resource "aws_api_gateway_integration" "get_result_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.image_key_param.id
  http_method             = aws_api_gateway_method.get_result.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_nutrition_lambda.invoke_arn
  depends_on              = [aws_api_gateway_method.get_result]
}

resource "aws_api_gateway_integration_response" "get_result_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.image_key_param.id
  http_method = "GET"
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }

  depends_on = [aws_api_gateway_integration.get_result_integration,
  aws_api_gateway_method_response.get_result_response]
}

# CORS for /upload_url
resource "aws_api_gateway_method" "options_upload_url" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.upload_url.id
  http_method = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_upload_url" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.upload_url.id
  http_method = "OPTIONS"
  type        = "MOCK"
  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
  depends_on = [
    aws_api_gateway_method.options_upload_url
  ]
}

resource "aws_api_gateway_method_response" "options_upload_url_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.upload_url.id
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
    depends_on = [
    aws_api_gateway_method.options_upload_url
  ]
}

resource "aws_api_gateway_integration_response" "options_upload_url_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.upload_url.id
  http_method = "OPTIONS"
  status_code = aws_api_gateway_method_response.options_upload_url_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  response_templates = {
    "application/json" = ""
  }
    depends_on = [
    aws_api_gateway_integration.options_upload_url,
    aws_api_gateway_method_response.options_upload_url_response
  ]
}

# CORS for /result/{image-key}
resource "aws_api_gateway_method" "options_result" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.image_key_param.id
  http_method = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_result_mock" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.image_key_param.id
  http_method = "OPTIONS"
  type        = "MOCK"
  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
  depends_on = [ aws_api_gateway_method.options_result ]
}

resource "aws_api_gateway_method_response" "options_result_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.image_key_param.id
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
    depends_on = [
    aws_api_gateway_method.options_result
  ]
}

resource "aws_api_gateway_integration_response" "options_result_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.image_key_param.id
  http_method = "OPTIONS"
  status_code = aws_api_gateway_method_response.options_result_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  response_templates = {
    "application/json" = ""
  }
  depends_on = [
    aws_api_gateway_integration.options_result_mock,
    aws_api_gateway_method_response.options_result_response
  ]
}
