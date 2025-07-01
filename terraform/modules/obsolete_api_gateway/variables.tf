
#api gateway
variable "api_name" {
  type = string
  description = "value of the API Gateway name"
}

variable "stage_name" {
  type    = string
  description = "value of the API Gateway stage name"
}

variable "lambda_invoke_arn" {
  type = string
  description = "Lambda Invoke ARN"
}

variable "region" {
  type = string
  description = "aws region"
  
}

variable "lambda_function_name" {
  type        = string
  description = "Name of the Lambda function to connect with API Gateway"
}

variable "api_cognito_user_pool_arn" {
  type        = string
  description = "ARN of Cognito user pool for securing API Gateway"
}