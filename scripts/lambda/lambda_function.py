import json

def lambda_handler(event, context):
    intent_name = event['currentIntent']['name']
    slots = event['currentIntent']['slots']
    invocation_source = event['invocationSource']

    diet_type = slots['DietType']
    goal = slots['Goal']
    calories = slots['Calories']

    if invocation_source == "DialogCodeHook":
        # Ask for DietType
        if not diet_type:
            return elicit_slot(
                event,
                slot_to_elicit="DietType",
                message="What is your diet type?",
                buttons=["Vegan", "Vegetarian", "Keto", "High Protein"]
            )

        # Ask for Goal
        if not goal:
            return elicit_slot(
                event,
                slot_to_elicit="Goal",
                message="What is your fitness goal?",
                buttons=["Weight Loss", "Muscle Gain", "Fat Loss", "Energy Boost"]
            )

        # Ask for Calories
        if not calories:
            return elicit_slot(
                event,
                slot_to_elicit="Calories",
                message="How many calories do you want per day?"
            )

        # All slots filled - delegate to Lex to fulfill
        return {
            "dialogAction": {
                "type": "Delegate",
                "slots": slots
            }
        }

    # Fulfillment: Generate a diet plan
    plan = generate_diet_plan(diet_type.lower(), goal.lower(), calories)

    return {
        "dialogAction": {
            "type": "Close",
            "fulfillmentState": "Fulfilled",
            "message": {
                "contentType": "PlainText",
                "content": plan
            }
        }
    }


# 🔹 Helper: Elicit slot with optional buttons
def elicit_slot(event, slot_to_elicit, message, buttons=None):
    response_card = None

    if buttons:
        response_card = {
            "version": 1,
            "contentType": "application/vnd.amazonaws.card.generic",
            "genericAttachments": [
                {
                    "title": "Choose one:",
                    "buttons": [{"text": b, "value": b} for b in buttons]
                }
            ]
        }

    return {
        "sessionAttributes": event.get("sessionAttributes", {}),
        "dialogAction": {
            "type": "ElicitSlot",
            "intentName": event['currentIntent']['name'],
            "slots": event['currentIntent']['slots'],
            "slotToElicit": slot_to_elicit,
            "message": {
                "contentType": "PlainText",
                "content": message
            },
            **({"responseCard": response_card} if response_card else {})
        }
    }


# 🔹 Helper: Generate diet plan text
def generate_diet_plan(diet_type, goal, calories):
    plans = {
        "vegan": {
            "Breakfast": "Oatmeal with almond milk and berries",
            "Lunch": "Lentil and quinoa salad with lemon dressing",
            "Dinner": "Stir-fried tofu with broccoli and brown rice"
        },
        "vegetarian": {
            "Breakfast": "Greek yogurt with honey and granola",
            "Lunch": "Vegetable curry with basmati rice",
            "Dinner": "Spinach and ricotta stuffed shells"
        },
        "keto": {
            "Breakfast": "Avocado and eggs with black coffee",
            "Lunch": "Grilled chicken salad with olive oil",
            "Dinner": "Salmon with asparagus and butter sauce"
        },
        "high protein": {
            "Breakfast": "Scrambled eggs with spinach",
            "Lunch": "Grilled chicken with sweet potatoes",
            "Dinner": "Beef stir-fry with quinoa"
        }
    }

    fallback = {
        "Breakfast": "Smoothie with banana and oats",
        "Lunch": "Grain bowl with beans and veggies",
        "Dinner": "Grilled protein with salad"
    }

    selected = plans.get(diet_type, fallback)

    return (
        f"Here is your {diet_type} diet plan for {goal}, targeting {calories} calories per day:\n"
        f"- Breakfast: {selected['Breakfast']}\n"
        f"- Lunch: {selected['Lunch']}\n"
        f"- Dinner: {selected['Dinner']}"
    )