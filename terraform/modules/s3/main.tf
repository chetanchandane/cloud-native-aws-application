resource "aws_s3_bucket" "meal_storage" {
  bucket = var.bucket_name

  tags = {
    Name        = "MealImageStorage"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "meal_storage_block" {
  bucket = aws_s3_bucket.meal_storage.id

  block_public_acls       = true
  block_public_policy     = true
  restrict_public_buckets = true
}
