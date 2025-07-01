variable "users_table" {
  type        = string
  description = "Users table name"
}

variable "api_id" {
  type        = string
  description = "API Gateway ID"
}

variable "root_resource_id" {
  type        = string
  description = "Root resource ID of the API Gateway"
  
}

variable "api_execution_arn" {
  type        = string
  description = "API Gateway execution ARN"
  
}
variable "diet_plans_table" {
  type        = string
}

variable "subscription_table" {
  type        = string
}

variable "meal_logs_table" {
  type        = string
}

variable "openai_api_key" {
  type        = string
  sensitive   = true
}

variable "environment" {
  type    = string
}

variable "project" {
  type    = string
}

variable "region" {
  type    = string
}

variable "lambda_role_arn" {
  type        = string
  description = "ARN of the IAM role for Lambda execution"
  
}

variable "lambda_role_name" {
  type        = string
  description = "Name of the IAM role for Lambda execution"
}

