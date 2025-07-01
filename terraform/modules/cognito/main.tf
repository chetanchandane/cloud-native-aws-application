resource "aws_cognito_user_pool" "this" {
  name = var.user_pool_name

  #  lambda_config {
  #   post_confirmation = aws_lambda_function.post_confirmation_trigger.arn
  # }

  # schema {
  #   name = "name"
  #   attribute_data_type = "String"
  #   mutable = true
  #   required = false
  # }
  # schema {
  #   name = "height"
  #   attribute_data_type = "Number"
  #   mutable = true
  #   required = false
  # }

  # schema {
  #   name = "weight"
  #   attribute_data_type = "Number"
  #   mutable = true
  #   required = false
  # }

  # schema {
  #   name = "date_of_birth"
  #   attribute_data_type = "Number"
  #   mutable = true
  #   required = false
  # }

  # schema {
  #   name = "gender"
  #   attribute_data_type = "String"
  #   mutable = false
  #   required = false
  # }

  # schema {
  #   name = "phone_number"
  #   attribute_data_type = "String"
  #   mutable = true
  #   required = false
  # }

  # schema {
  #   name = "health_conditions"
  #   attribute_data_type = "String"
  #   mutable = true
  #   required = false
  # }

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = false
    require_uppercase = false
    require_numbers   = false
    require_symbols   = false
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_client" "this" {
  name         = "${var.user_pool_name}-client"
  user_pool_id = aws_cognito_user_pool.this.id
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows = ["code", "implicit"]
  allowed_oauth_scopes = [
    "email",
    "openid",
    "aws.cognito.signin.user.admin"]
  supported_identity_providers = ["COGNITO"]
  explicit_auth_flows = ["USER_PASSWORD_AUTH", "ADMIN_NO_SRP_AUTH"]
  callback_urls = ["https://example.com/callback"] ## for now
  prevent_user_existence_errors = "ENABLED"
}

resource "aws_cognito_identity_pool" "this" {
  identity_pool_name               = "${var.user_pool_name}-identity-pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id         = aws_cognito_user_pool_client.this.id
    provider_name     = aws_cognito_user_pool.this.endpoint
    server_side_token_check = false
  }
}

resource "aws_iam_role" "authenticated" {
  name = "${var.user_pool_name}-auth-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.this.id
          },
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })
}

resource "aws_cognito_identity_pool_roles_attachment" "this" {
  identity_pool_id = aws_cognito_identity_pool.this.id

  roles = {
    authenticated = aws_iam_role.authenticated.arn
  }
}

