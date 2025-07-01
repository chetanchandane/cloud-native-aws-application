# ✅ Fully working main.tf with working CORS for API Gateway V2 (HTTP API)
#######################
# S3 Bucket with CORS #
#######################
resource "aws_s3_bucket" "nutrition_labels_bucket" {
  bucket = var.s3_bucket_name
}

resource "aws_s3_bucket_cors_configuration" "cors" {
  bucket = aws_s3_bucket.nutrition_labels_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

###################
# DynamoDB Table  #
###################
resource "aws_dynamodb_table" "nutrition_data" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "imageKey"

  attribute {
    name = "imageKey"
    type = "S"
  }
}

######################
# IAM Role for Lambda
######################
# resource "aws_iam_role" "lambda_exec_role" {
#   name = "lambda_s3_textract_role"

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [{
#       Effect = "Allow",
#       Principal = { Service = "lambda.amazonaws.com" },
#       Action    = "sts:AssumeRole"
#     }]
#   })
# }

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/AmazonTextractFullAccess"
}

resource "aws_iam_role_policy_attachment" "dynamodb_policy_attach" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "s3_policy_attach" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs_attach" {
  role       = var.lambda_role_name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

####################################
# Textract Lambda (triggered by S3)
####################################
resource "aws_lambda_function" "textract_lambda" {
  filename         = "${path.module}/lambda_function_payload.zip"
  function_name    = "nutrition-label-textract"
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = var.lambda_role_arn
  source_code_hash = filebase64sha256("${path.module}/lambda_function_payload.zip")

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.nutrition_data.name
      BUCKET_NAME = aws_s3_bucket.nutrition_labels_bucket.bucket
    }
  }
}

resource "aws_lambda_permission" "s3_invoke_permission" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.textract_lambda.arn
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.nutrition_labels_bucket.arn
}

resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.nutrition_labels_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.textract_lambda.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.s3_invoke_permission]
}

#############################################
# Lambda for generating pre-signed upload URL
#############################################
resource "aws_lambda_function" "generate_upload_url" {
  filename         = "${path.module}/generateUploadUrl.zip"
  function_name    = "generate-upload-url"
  handler          = "generateUploadUrl.handler"
  runtime          = "nodejs18.x"
  role             = var.lambda_role_arn
  source_code_hash = filebase64sha256("${path.module}/generateUploadUrl.zip")

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.nutrition_labels_bucket.bucket
    }
  }
}

resource "aws_iam_role_policy" "lambda_s3_put" {
  name = "lambda-s3-put-policy"
  role = var.lambda_role_name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["s3:PutObject"],
      Resource = "${aws_s3_bucket.nutrition_labels_bucket.arn}/*"
    }]
  })
}

###################
# API Gateway V2  #
###################
# resource "aws_apigatewayv2_api" "http_api" {
#   name          = "NutritionAPI"
#   protocol_type = "HTTP"
# }

# resource "aws_apigatewayv2_stage" "default" {
#   api_id      = aws_apigatewayv2_api.http_api.id
#   name        = "$default"
#   auto_deploy = true
# }

# # Route: /generate-upload-url
# resource "aws_apigatewayv2_integration" "upload_url_integration" {
#   api_id             = aws_apigatewayv2_api.http_api.id
#   integration_type   = "AWS_PROXY"
#   integration_uri    = aws_lambda_function.generate_upload_url.invoke_arn
#   integration_method = "POST"
#   payload_format_version = "2.0"
# }

# resource "aws_apigatewayv2_route" "upload_url_route" {
#   api_id    = aws_apigatewayv2_api.http_api.id
#   route_key = "GET /generate-upload-url"
#   target    = "integrations/${aws_apigatewayv2_integration.upload_url_integration.id}"
# }

# # Route: /get-label-data
# resource "aws_apigatewayv2_integration" "lambda_integration" {
#   api_id             = aws_apigatewayv2_api.http_api.id
#   integration_type   = "AWS_PROXY"
#   integration_uri    = aws_lambda_function.textract_lambda.invoke_arn
#   integration_method = "POST"
#   payload_format_version = "2.0"
# }

# resource "aws_apigatewayv2_route" "get_label_route" {
#   api_id    = aws_apigatewayv2_api.http_api.id
#   route_key = "GET /get-label-data"
#   target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
# }

# two api - generate-ipload-url, get-label-data
resource "aws_api_gateway_resource" "upload_url" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "generate-upload-url"
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
  uri                     = aws_lambda_function.generate_upload_url.invoke_arn
}

resource "aws_lambda_permission" "upload_url_permission" {
  statement_id  = "AllowAPIGatewayInvokeUploadUrl"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.generate_upload_url.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/GET/generate-upload-url"
}

# Route: /get-label-data

resource "aws_api_gateway_resource" "label_data" {
  rest_api_id = var.api_id
  parent_id   = var.root_resource_id
  path_part   = "get-label-data"
}

resource "aws_api_gateway_method" "get_label_data" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.label_data.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "label_data_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.label_data.id
  http_method             = aws_api_gateway_method.get_label_data.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.textract_lambda.invoke_arn
}

resource "aws_lambda_permission" "label_data_permission" {
  statement_id  = "AllowAPIGatewayInvokeTextract"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.textract_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/GET/get-label-data"
}

# # Enable CORS for the API Gateway

resource "aws_api_gateway_method" "options_upload_url" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.upload_url.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_upload_url_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.upload_url.id
  http_method             = aws_api_gateway_method.options_upload_url.http_method
  type                    = "MOCK"
  request_templates       = {
    "application/json" = "{\"statusCode\": 200}"
  }
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
}

resource "aws_api_gateway_integration_response" "options_upload_url_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.upload_url.id
  http_method = aws_api_gateway_method.options_upload_url.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [
  aws_api_gateway_integration.options_upload_url_integration,
  aws_api_gateway_method_response.options_upload_url_response
]
}

# cors for get-label-data
resource "aws_api_gateway_method" "options_label_data" {
  rest_api_id   = var.api_id
  resource_id   = aws_api_gateway_resource.label_data.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_label_data_integration" {
  rest_api_id             = var.api_id
  resource_id             = aws_api_gateway_resource.label_data.id
  http_method             = aws_api_gateway_method.options_label_data.http_method
  type                    = "MOCK"
  integration_http_method = "POST"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_label_data_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.label_data.id
  http_method = aws_api_gateway_method.options_label_data.http_method
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

resource "aws_api_gateway_integration_response" "options_label_data_integration_response" {
  rest_api_id = var.api_id
  resource_id = aws_api_gateway_resource.label_data.id
  http_method = aws_api_gateway_method.options_label_data.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }
  depends_on = [
  aws_api_gateway_integration.options_label_data_integration,
  aws_api_gateway_method_response.options_label_data_response
]
}
