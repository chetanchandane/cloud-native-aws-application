variable "diet_plans_table" {
  type        = string
  default     = "DietPlans"
  description = "Name of the Diet Plans DynamoDB table"
}

variable "customized_subscription" {
  type        = string
  default     = "CustomizedDietSubscription"
  description = "Name of the Customized Diet Subscription table"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "lambda_role_arn" { }

variable "lambda_role_name" { }

variable api_id { }
variable root_resource_id { }
variable "api_execution_arn" {}