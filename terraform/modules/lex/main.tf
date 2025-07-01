# Custom Slot Types
resource "aws_lex_slot_type" "diet_type" {
  name                     = "DietTypeSlot"
  description              = "Type of diet preferred"
  enumeration_value {
    value = "vegan"
  }
  enumeration_value {
    value = "vegetarian"
  }
  enumeration_value {
    value = "keto"
  }
  enumeration_value {
    value = "balanced"
  }
  enumeration_value {
    value = "paleo"
  }
}

resource "aws_lex_slot_type" "goal" {
  name                     = "GoalSlot"
  description              = "Fitness goal"
  enumeration_value {
    value = "weight loss"
  }
  enumeration_value {
    value = "muscle gain"
  }
  enumeration_value {
    value = "endurance"
  }
}

# Lex Intent
resource "aws_lex_intent" "diet_plan_intent" {
  name = var.intent_name

  fulfillment_activity {
    type = "CodeHook"
    code_hook {
      message_version = "1.0"
      uri             = var.lambda_function_arn
    }
  }

  dialog_code_hook {
    message_version = "1.0"
    uri             = var.lambda_function_arn
  }

  slot {
    name           = "DietType"
    slot_type      = aws_lex_slot_type.diet_type.name
    slot_constraint = "Required"
    slot_type_version  = "$LATEST"  
    value_elicitation_prompt {
      max_attempts = 2
      message {
        content_type = "PlainText"
        content      = "What type of diet do you prefer?"
      }
    }
  }

  slot {
    name           = "Goal"
    slot_type      = aws_lex_slot_type.goal.name
    slot_type_version  = "$LATEST"
    slot_constraint = "Required"
    value_elicitation_prompt {
      max_attempts = 2
      message {
        content_type = "PlainText"
        content      = "What’s your fitness goal?"
      }
    }
  }

  slot {
    name           = "Calories"
    slot_type      = "AMAZON.NUMBER"
    # slot_type_version  = "$LATEST"  
    slot_constraint = "Required"
    value_elicitation_prompt {
      max_attempts = 2
      message {
        content_type = "PlainText"
        content      = "How many calories do you want per day?"
      }
    }
  }

  sample_utterances = [
    "I need a {DietType} diet plan",
    "Create a {DietType} meal plan for {Goal}",
    "Generate a {Calories} calorie {DietType} plan"
  ]
}

# Lex Bot
resource "aws_lex_bot" "diet_bot" {
  name           = var.bot_name
  description    = "Bot for generating diet plans"
  child_directed = false
  idle_session_ttl_in_seconds = 300
  process_behavior = "SAVE"
  locale          = "en-US"
  voice_id        = "Salli"

  abort_statement {
    message {
      content_type = "PlainText"
      content      = "Sorry, I couldn't process your request. Please try again."
    }
  }

  intent {
    intent_name    = aws_lex_intent.diet_plan_intent.name
    intent_version = "$LATEST"
  }
}