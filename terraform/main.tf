

module "lambda" {
  source                = "./modules/lambda"
  lambda_function_name  = "GenerateDietPlanFunction"
  bot_name              = "ChatAssistantBot"
  region = var.region
}

module "api_gateway" {
  source            = "./modules/api_gateway"
  api_name          = var.api_name

}

# module "api_gateway" {
#   source            = "./modules/api_gateway"
#   api_name          = var.api_name
#   stage_name        = var.stage_name
#   lambda_invoke_arn = module.lambda.invoke_arn  # Or from lambda module output
#   lambda_function_name = module.lambda.lambda_function_name
#   region = var.region
#   api_cognito_user_pool_arn = module.cognito.user_pool_arn
# }
  

# S3 Bucket
resource "aws_s3_bucket" "image_bucket" {
  bucket = var.bucket_name
  # force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "s3_block" {
  bucket = aws_s3_bucket.image_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_cors_configuration" "cors" {
  bucket = aws_s3_bucket.image_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Lambda IAM Role

module "lambda_iam_role" {
  source = "./modules/lambda_iam_role"
}


module "cognito" {
  source          = "./modules/cognito"
  user_pool_name  = var.user_pool_name
  environment     = var.environment
}

################ Diet generator Lambda ################
module "diet_generator" {
  source = "./modules/diet_generator"
  users_table = "Users"
  diet_plans_table = "DietPlans"
  subscription_table = "CustomizedDietSubscription"
  meal_logs_table = "MealLogs"
  openai_api_key = var.openai_api_key
  environment = var.environment
  region = var.region
  project = "NutritionTracking"
  lambda_role_arn = module.lambda_iam_role.lambda_role_arn
  lambda_role_name = module.lambda_iam_role.lambda_role_name
  api_id = module.api_gateway.api_id
  root_resource_id = module.api_gateway.root_resource_id
  api_execution_arn = module.api_gateway.api_execution_arn

}

module "calorie_calculator" {
  source = "./modules/calorie_calculator"
  api_id = module.api_gateway.api_id
  root_resource_id = module.api_gateway.root_resource_id
  api_execution_arn = module.api_gateway.api_execution_arn
  lambda_role_arn = module.lambda_iam_role.lambda_role_arn
  lambda_role_name = module.lambda_iam_role.lambda_role_name
  region = var.region
}

module "api_store_user_dynamo" {
  source = "./modules/api_store_user_dynamo"
  users_table = module.diet_generator.users_table_name
  api_id = module.api_gateway.api_id
  root_resource_id = module.api_gateway.root_resource_id
  api_execution_arn = module.api_gateway.api_execution_arn
  lambda_role_name = module.lambda_iam_role.lambda_role_name
  lambda_role_arn = module.lambda_iam_role.lambda_role_arn
  
}

module "api_extract_user_diet_plans" {
  source = "./modules/api_extract_user_diet_plans"
  api_id = module.api_gateway.api_id
  root_resource_id = module.api_gateway.root_resource_id
  api_execution_arn = module.api_gateway.api_execution_arn
  lambda_role_name = module.lambda_iam_role.lambda_role_name
  lambda_role_arn = module.lambda_iam_role.lambda_role_arn
}

module "api_food_scanner" {
  source = "./modules/api_food_scanner"
  api_id = module.api_gateway.api_id
  root_resource_id = module.api_gateway.root_resource_id
  api_execution_arn = module.api_gateway.api_execution_arn
  lambda_role_name = module.lambda_iam_role.lambda_role_name
  lambda_role_arn = module.lambda_iam_role.lambda_role_arn
  bucket_name = aws_s3_bucket.image_bucket.bucket
  bucket_arn = aws_s3_bucket.image_bucket.arn
  bucket_id = aws_s3_bucket.image_bucket.id
  nutritionix_api_key = var.nutritionix_api_key
  nutritionix_app_id = var.nutritionix_app_id
}

module "api_bmi_calculator" {
  source = "./modules/api_bmi_calculator"
  api_id = module.api_gateway.api_id
  root_resource_id = module.api_gateway.root_resource_id
  lambda_role_arn = module.lambda_iam_role.lambda_role_arn
  lambda_role_name = module.lambda_iam_role.lambda_role_name
  api_execution_arn = module.api_gateway.api_execution_arn
  
}

module "api_macro_calculator" {
  source = "./modules/api_macro_calculator"
  api_id = module.api_gateway.api_id
  root_resource_id = module.api_gateway.root_resource_id
  lambda_role_arn = module.lambda_iam_role.lambda_role_arn
  lambda_role_name = module.lambda_iam_role.lambda_role_name
  api_execution_arn = module.api_gateway.api_execution_arn
}


module "meal_logging" {
  source = "./modules/meal_logging"
  api_id = module.api_gateway.api_id
  root_resource_id = module.api_gateway.root_resource_id
  api_execution_arn = module.api_gateway.api_execution_arn
  lambda_role_arn = module.lambda_iam_role.lambda_role_arn
  lambda_role_name = module.lambda_iam_role.lambda_role_name
  openai_api_key = var.openai_api_key
}

module "textract"{
  source = "./modules/textract"
  dynamodb_table_name = "NutritionLabelData"
  s3_bucket_name = "vinayaka-nutrition-labels-bucket-prod"
  lambda_role_arn = module.lambda_iam_role.lambda_role_arn
  lambda_role_name = module.lambda_iam_role.lambda_role_name
  api_id = module.api_gateway.api_id
  root_resource_id = module.api_gateway.root_resource_id
  api_execution_arn = module.api_gateway.api_execution_arn
}

module "api_chatbot" {
  source = "./modules/api_chatbot"
  api_id = module.api_gateway.api_id
  root_resource_id = module.api_gateway.root_resource_id
  api_execution_arn = module.api_gateway.api_execution_arn
  lambda_role_arn = module.lambda_iam_role.lambda_role_arn
  openai_api_key = var.openai_api_key
}

resource "aws_api_gateway_deployment" "api_deploy" {
  depends_on = [
    module.calorie_calculator.calorie_calculator_integration, 
    module.diet_generator.diet_generator_integration,
    module.api_store_user_dynamo.store_user_profile_integration,
    module.api_extract_user_diet_plans.integration,
    module.api_food_scanner.upload_url_integration,
    module.api_food_scanner.get_result_integration,
    module.api_bmi_calculator.integration, 
    module.api_macro_calculator.integration,
    #meal logging
    module.meal_logging.post_calories_integration,
    module.meal_logging.get_meal_logs_integration,
    module.meal_logging.post_insert_meal_log_integration,
    #textract
    module.textract.generate_upload_url_integration,
    module.textract.get_label_data_integration,
    #chatbot
    module.api_chatbot.post_chat_integration,
    module.api_chatbot.options_chat_integration,

  ]
  rest_api_id = module.api_gateway.api_id
  triggers = {
    # redeploy = sha1(jsonencode(aws_api_gateway_rest_api.api.body))
    redeploy = uuid()
  }
}

resource "aws_api_gateway_stage" "prod" {
  stage_name    = "prod"
  rest_api_id   = module.api_gateway.api_id
  deployment_id = aws_api_gateway_deployment.api_deploy.id
}


# Amplify
module "amplify" {
  source        = "./modules/amplify"
  app_name      = "ai-diet-assistant-frontend"
  #repo updated https://github.com/chetanchandane/term-project-team3-cloudcatalysts
  repo_url      = var.repository_url
  branch_name   = var.frontend_branch  # the branch that has your React app
  github_token  = var.github_token
  identity_pool_id    = module.cognito.identity_pool_id         # from Cognito module outputs
  user_pool_id        = module.cognito.user_pool_id             # from Cognito module outputs
  user_pool_client_id = module.cognito.user_pool_client_id      # from Cognito module outputs
  api_base_url = module.api_gateway.api_url  # from Diet Generator module outputs
}
