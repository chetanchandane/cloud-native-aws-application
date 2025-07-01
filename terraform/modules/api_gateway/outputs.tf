output "api_id" {
  value = aws_api_gateway_rest_api.this.id
}

output "root_resource_id" {
  value = aws_api_gateway_rest_api.this.root_resource_id
}

output "api_execution_arn" {
  value = aws_api_gateway_rest_api.this.execution_arn
  
}

output "api_url" {
  value = "https://${aws_api_gateway_rest_api.this.id}.execute-api.us-east-1.amazonaws.com/prod"
}
