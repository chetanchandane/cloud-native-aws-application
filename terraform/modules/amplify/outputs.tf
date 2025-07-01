output "app_id" {
  value = aws_amplify_app.this.id
}

output "app_url" {
  description = "The Amplify branch web URL"
  value       = "https://${var.branch_name}.${aws_amplify_app.this.default_domain}"
}