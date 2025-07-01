# output "api_endpoint" {
#   value = aws_apigatewayv2_api.http_api.api_endpoint
# }

output "s3_bucket" {
  value = aws_s3_bucket.nutrition_labels_bucket.bucket
}

output "generate_upload_url_integration" {
  value = aws_api_gateway_integration.upload_url_integration
}

output "get_label_data_integration" {
  value = aws_api_gateway_integration.label_data_integration
}
