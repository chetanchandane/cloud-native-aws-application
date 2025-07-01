output "lambda_function_name" {
  value = aws_lambda_function.dietgenerator.function_name
}

# output "diet_generator_api_endpoint" {
#   value = "https://${aws_api_gateway_rest_api.diet_api.id}.execute-api.${var.region}.amazonaws.com/prod/generate-diet"
# }


output "users_table_name" {
  value = aws_dynamodb_table.users.name
}


output "diet_generator_integration" {
  value = aws_api_gateway_integration.lambda_integration
}
