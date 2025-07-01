variable "lambda_role_name"{}
variable "lambda_role_arn" {}
variable "api_id" {}
variable "root_resource_id" {}
variable "api_execution_arn" {}  
variable "lambda_memory" {
  default = 128
}
variable "lambda_timeout" {
  default = 3
}
variable "region" {
  default = "us-east-1"
}
