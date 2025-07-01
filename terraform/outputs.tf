# output "bucket_name" {
#   value = module.s3.bucket_name
# }

# output "dynamodb_table_name" {
#   value = module.dynamodb.dynamodb_table_name
# }

output "app_url" {
  value = "https://frontend.${module.amplify.app_id}.amplifyapp.com"
}


output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
  
}

output "cognito_user_pool_client_id" {
  value = module.cognito.user_pool_client_id
  
}

output "cognito_identity_pool_id" {
  value = module.cognito.identity_pool_id
  
}


