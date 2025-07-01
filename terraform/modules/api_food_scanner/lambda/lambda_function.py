import json
import boto3
import urllib.request
import os
from decimal import Decimal

# Initialize clients
s3 = boto3.client('s3')
rekognition = boto3.client('rekognition')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('NutritionResults')

def lambda_handler(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    print(f"Triggered by {bucket}/{key}")

    # Rekognition
    response = rekognition.detect_labels(
        Image={'S3Object': {'Bucket': bucket, 'Name': key}},
        MaxLabels=5
    )
    labels = [label['Name'] for label in response['Labels']]
    food_item = labels[0] if labels else "unknown"
    print(f"Detected food item: {food_item}")

    # Nutritionix API
    app_id = os.environ.get("APP_ID")
    api_key = os.environ.get("API_KEY")

    headers = {
        "x-app-id": app_id,
        "x-app-key": api_key,
        "Content-Type": "application/json"
    }

    payload = json.dumps({"query": food_item}).encode("utf-8")
    req = urllib.request.Request(
        url="https://trackapi.nutritionix.com/v2/natural/nutrients",
        data=payload,
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())

        if data.get("foods"):
            food = data["foods"][0]
            summary = {
                "image_key": key,
                "food_name": food.get("food_name"),
                "calories": Decimal(str(food.get("nf_calories", 0))),
                "carbohydrates": Decimal(str(food.get("nf_total_carbohydrate", 0))),
                "protein": Decimal(str(food.get("nf_protein", 0))),
                "fat": Decimal(str(food.get("nf_total_fat", 0)))
            }

            print("Nutrition Summary:", summary)
            table.put_item(Item=summary)

            return {
                "statusCode": 200,
                "body": json.dumps({"message": "Stored nutrition result"})
            }

        else:
            return {
                "statusCode": 404,
                "body": json.dumps({"error": "No food data returned"})
            }

    except Exception as e:
        print("Error calling Nutritionix or storing result:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
