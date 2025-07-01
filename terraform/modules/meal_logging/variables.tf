
variable "openai_api_key" {}

variable "meal_logs_table" {
  description = "DynamoDB MealLogs table name"
  type        = string
  default     = "MealLogs"
}

variable "subscription_table" {
  description = "DynamoDB CustomizedDietSubscription table name"
  type        = string
  default     = "CustomizedDietSubscription"
}

variable "lambda_role_name"{}
variable "lambda_role_arn" {}
variable "api_id" {}
variable "root_resource_id" {}
variable "api_execution_arn" {}