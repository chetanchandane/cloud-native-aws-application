# output "lambda_function_name" {
#   value = aws_lambda_function.diet_dashboard.function_name
# }

output "rest_api_url" {
  value = "https://${var.api_id}.execute-api.${var.aws_region}.amazonaws.com/prod/plans"
}

output "integration" {
  value = aws_api_gateway_integration.lambda_integration
}