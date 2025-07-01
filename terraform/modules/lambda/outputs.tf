output "lambda_function_name" {
  value = aws_lambda_function.generate_diet_plan.function_name 
}

output "invoke_arn" {
  value = aws_lambda_function.generate_diet_plan.invoke_arn
}

output "lambda_function_arn" {
  value = aws_lambda_function.generate_diet_plan.arn
}
