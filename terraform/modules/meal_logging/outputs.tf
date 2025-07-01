# output "food_calorie_api_url" {
#   value = "https://${aws_api_gateway_rest_api.food_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.food_stage.stage_name}/calories"
# }

# output "meal_logs_insert_url" {
#   value = "https://${aws_api_gateway_rest_api.meal_logs_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.meal_logs_stage.stage_name}/insertMealLog"
# }

# output "meal_logs_get_url" {
#   value = "https://${aws_api_gateway_rest_api.meal_logs_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.meal_logs_stage.stage_name}/getMealLogs"
# }

output "post_calories_integration" {
  value = aws_api_gateway_integration.calories_lambda
}

output "post_insert_meal_log_integration" {
  value = aws_api_gateway_integration.insert_lambda
}

output "get_meal_logs_integration" {
  value = aws_api_gateway_integration.get_lambda
}
