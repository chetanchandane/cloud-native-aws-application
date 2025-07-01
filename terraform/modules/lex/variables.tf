variable "bot_name" {
  description = "Name for the Lex bot"
  type        = string
}

variable "intent_name" {
  description = "Name for the Lex intent"
  type        = string

}

variable "lambda_function_arn" {
  type = string
  description = "value of the Lambda function ARN"
}