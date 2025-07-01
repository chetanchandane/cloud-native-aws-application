#!/bin/bash
set -e

# mkdir -p dist

# -------------------------------
# Bundle food-count-lambda
# -------------------------------
echo "Zipping food-count-lambda..."
# mkdir -p temp/food-count
# cp lambda/foodCalories.mjs temp/food-count/
cd food-count-lambda
npm init -y >/dev/null
npm install axios >/dev/null
zip -r ../food-count-lambda.zip *
cd ..

# -------------------------------
# Bundle meal-logs-lambda
# -------------------------------
echo "Zipping meal-logs-lambda..."
# mkdir -p temp/meal-logs
# cp lambda/insertMealLog.mjs lambda/getMealLogs.mjs lambda/mealLogsRouter.mjs temp/meal-logs/
cd meal-logs-lambda
npm init -y >/dev/null
npm install uuid @aws-sdk/client-dynamodb >/dev/null
zip -r ../meal-logs-lambda.zip *
cd ..

# Clean up temp build folders
# rm -rf temp

echo "✅ Lambda ZIPs created with dependencies inside ./dist"
