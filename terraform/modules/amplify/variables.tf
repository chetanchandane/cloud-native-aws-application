variable "app_name" {
  type = string
}

variable "repo_url" {
  type = string
}

variable "branch_name" {
  type = string
}

variable "github_token" {
  type      = string
  sensitive = true
}

# variable "build_spec" {
#   type = string
#   description = "build spec for amplify-react app"
# }
# variable "api_url" {
#   type        = string
#   description = "The API Gateway endpoint URL"
# }

variable "identity_pool_id" {
  type        = string
  description = "The Cognito Identity Pool ID"
}

variable "user_pool_id" {
  type        = string
  description = "The Cognito User Pool ID"
}

variable "user_pool_client_id" {
  type        = string
  description = "The Cognito User Pool Client ID"
}

variable "api_base_url" {
  type = string
    description = "API endpoint for the diet generator"
}

# variable "textract_upload_api_url" {
#   type        = string
#   description = "The API Gateway endpoint URL for Textract upload"
  
# }

# variable "textract_result_api_url" {
#   type        = string
#   description = "The API Gateway endpoint URL for Textract result"
  
# }
