variable "user_pool_name" {
  type        = string
  description = "Name of the Cognito User Pool"
}

variable "environment" {
  type        = string
  description = "Environment tag (prod)"
}

# variable "lambda_role_arn" {
#   type        = string
#   description = "ARN of the Lambda execution role"
  
# }

# variable "lambda_role_name" {
#   type        = string
#   description = "Name of the Lambda execution role"
  
# }

# variable "users_table_arn" {
#   type        = string
#   description = "ARN of the DynamoDB table for users"
  
# }