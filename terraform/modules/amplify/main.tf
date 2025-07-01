locals {
  amplify_env_variables = {
    # REACT_APP_API_ENDPOINT                       = var.api_url
    REACT_APP_aws_cognito_identity_pool_id       = var.identity_pool_id
    REACT_APP_aws_user_pools_id                  = var.user_pool_id
    REACT_APP_aws_user_pools_web_client_id       = var.user_pool_client_id
    REACT_APP_aws_api_base_url                   = var.api_base_url
    # REACT_APP_aws_textract_upload_api_url        = var.textract_upload_api_url
    # REACT_APP_aws_textract_result_api_url        = var.textract_result_api_url
  }
}

resource "aws_iam_role" "amplify_service_role" {
  name = "amplify-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = {
        Service = "amplify.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "amplify_attach" {
  role       = aws_iam_role.amplify_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}

resource "aws_amplify_app" "this" {
  name       = var.app_name
  repository = var.repo_url
  oauth_token = var.github_token

  build_spec = <<EOT
version: 1.0
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm install
    build:
      commands: 
        - npm run build
  artifacts:
    baseDirectory: frontend/build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*

EOT
  # depends_on = [ aws_api_gateway_deployment.chat-deploy, aws_cognito_identity_pool.this, aws_cognito_user_pool.this, aws_cognito_user_pool_client.this ]  
#   enable_branch_auto_build = true
  environment_variables = local.amplify_env_variables
}

resource "aws_amplify_branch" "frontend_branch" {
  app_id      = aws_amplify_app.this.id
  branch_name = var.branch_name
  enable_auto_build = true
  environment_variables = local.amplify_env_variables

}
