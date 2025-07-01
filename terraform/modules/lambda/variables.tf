
variable "lambda_function_name" {
  description = "Name for the Lambda function"
  type        = string
}

variable "lambda_zip_path" {
    type = string
    default = "lambda_function_chatbot.zip"
    description = "Path to the lambda zip file - Lex bot handler"
}

variable "api_id" {
    type = string
    default = "aws_api_gateway_rest_api.this.id"
    description = "API Gateway ID"
}

variable "http_method" {
    type = string
    default = "POST"
    description = "HTTP Method"
}

variable "path_part" {
    type = string
    default = "chat"
    description = "Path part"
}

variable "bot_name" {
    type = string
    description = "Name of the Lex bot"
}

variable "region" {
    type = string
    description = "AWS region"
}