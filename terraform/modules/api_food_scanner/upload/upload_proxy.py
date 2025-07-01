
import json
import boto3
import os
import uuid

s3 = boto3.client("s3")
BUCKET_NAME = os.environ["BUCKET_NAME"]

def lambda_handler(event, context):
    image_id = str(uuid.uuid4()) + ".jpg"
    presigned_url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={"Bucket": BUCKET_NAME, "Key": image_id, "ContentType": "image/jpeg"},
        ExpiresIn=300,
    )
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*"
        },
        "body": json.dumps({"upload_url": presigned_url, "image_key": image_id}),
    }
