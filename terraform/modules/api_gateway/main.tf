

resource "aws_api_gateway_rest_api" "this" {
  name        = var.api_name
  description = "Unified API Gateway for AI Diet Assistant"
}