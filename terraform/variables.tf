variable "environment" {
  default = "Production"
}

variable "region" {
  default = "us-east-1"
}

variable "repository_url" {
  description = "URL of the GitHub repository"
  type        = string
  default     = "https://github.com/chetanchandane/term-project-team3-cloudcatalysts"
  
}

variable "frontend_branch" {
  description = "Branch of the GitHub repository for the frontend"
  type        = string
  default     = "frontend"
}

variable "user_pool_name" {
  type        = string
  default = "ai-nutrition-auth"
  description = "Name for the Cognito User Pool"
}

variable "api_name" {
  type        = string
  description = "Name for the API Gateway"
  default     = "ai-nutrition-api-gateway"
}

variable "stage_name" {
  type        = string
  description = "Stage for API Gateway deployment"
  default     = "prod"
}

variable "github_token" {
  type      = string
  sensitive = true
}


variable "bucket_name" {
  description = "Name of the S3 bucket to upload food images"
  default     = "meal-uploaded-images-awesome-nutrition"
}

variable "nutritionix_app_id" {
  description = "Nutritionix Application ID"
  type        = string
}

variable "nutritionix_api_key" {
  description = "Nutritionix Application Key"
  type        = string
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
}