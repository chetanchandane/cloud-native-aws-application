# You can extend this to parameterize function name, memory, etc.

variable "lambda_zip_file" {
  default = "lambda.zip"
}

variable "region" {
  description = "AWS region to deploy resources in"
  default     = "us-east-1"
}

variable "lambda_role_arn" {
  type        = string
  description = "ARN of the Lambda execution role"
  
}

variable "lambda_role_name" {
  type        = string
  description = "Name of the Lambda execution role"
  
}

variable "api_id" {
  type        = string
  description = "ID of the API Gateway"
  
}

variable "root_resource_id" {
  type        = string
  description = "Root resource ID of the API Gateway"
  
}

variable "api_execution_arn" {
  type        = string
  description = "Execution ARN of the API Gateway"
  
}