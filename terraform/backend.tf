terraform {
    backend "s3" {
        bucket         = "swen-team3-terraform-state-bucket"
        key            = "terraform.tfstate"
        region         = "us-east-1"
        encrypt        = true
        dynamodb_table = "swen-team3-terraform-state-lock"
    }
}
