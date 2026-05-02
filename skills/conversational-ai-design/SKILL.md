---
name: conversational-ai-design
description: Design conversational AI systems with Rasa 3.x NLU pipelines, intent/entity models, dialogue policies, custom actions, and LLM-based chatbot patterns using LangChain conversational memory and retrieval-augmented generation.
context: fork
argument-hint: "Conversational AI task — describe chatbot domain, intents, entities, dialogue flows, and channels to support"
globs: ["**/domain/**", "**/chatbot/**", "**/nlu/**"]
alwaysApply: false
---

# Conversational AI Design Skill

## When to Use

Use this skill when:
- Designing NLU pipelines (tokenizer -> featurizer -> classifier -> entity extractor)
- Defining intents, entities, synonyms, regex features, and lookup tables
- Writing story flows, happy paths, edge cases, and slot-filling forms
- Configuring dialogue policies (rule-based vs ML-based)
- Implementing custom action servers with API integrations
- Building multi-turn context management and disambiguation
- Evaluating chatbot performance with confusion matrices and test scripts
- Integrating LLM-based conversational memory and RAG patterns

## 1. NLU Pipeline Design

### Standard Pipeline (Rasa 3.x)

```yaml
# config.yml
pipeline:
  - name: WhitespaceTokenizer
  - name: RegexFeaturizer
  - name: LexicalSyntacticFeaturizer
  - name: CountVectorsFeaturizer
  - name: CountVectorsFeaturizer
    analyzer: char_wb
    min_ngram: 1
    max_ngram: 4
  - name: DIETClassifier
    epochs: 100
    constrain_similarities: true
    model_confidence: softmax
  - name: EntitySynonymMapper
  - name: ResponseSelector
    epochs: 100
  - name: FallbackClassifier
    threshold: 0.3
    ambiguity_threshold: 0.1
```

### Language-Specific Pipelines

```yaml
# config.yml - Chinese tokenization
pipeline:
  - name: MitieNLP
    model: "data/total_word_feature_extractor.dat"
  - name: JiebaTokenizer
  - name: CountVectorsFeaturizer
  - name: DIETClassifier
    epochs: 100

# config.yml - spaCy for multilingual
pipeline:
  - name: SpacyNLP
    model: "pt_core_news_sm"
  - name: SpacyTokenizer
  - name: SpacyFeaturizer
  - name: CountVectorsFeaturizer
  - name: CountVectorsFeaturizer
    analyzer: char_wb
    min_ngram: 1
    max_ngram: 4
  - name: DIETClassifier
    epochs: 100
```

## 2. Intent & Entity Design

### Naming Conventions

```
# Intents: lowercase_snake_case with domain prefix
greet
greet.hello
greet.bye
order.status
order.cancel
order.track
support.human_handoff
support.faq
chitchat.weather
chitchat.joke

# Entities: lowercase_snake_case
product_name
order_id
date_of_birth
shipping_address
```

### Training Data Format

```yaml
# nlu.yml
version: "3.0"
nlu:
  - intent: greet
    examples: |
      - Hi
      - Hello
      - Hey there
      - Good morning
      - What's up
      - hey

  - intent: order.status
    examples: |
      - Where is my order?
      - What's the status of [ORD-12345](order_id)
      - Check order [#ABC-789](order_id)
      - Has my order [3982](order_id) shipped yet?
      - I want to track [ORD-999](order_id)

  - intent: order.cancel
    examples: |
      - I want to cancel [ORD-12345](order_id)
      - Cancel my order please
      - Can I cancel the [laptop](product_name)?
      - Stop the shipment for [order 5](order_id:ORD-00005)

  - intent: inform
    examples: |
      - My email is [john@example.com](email)
      - It's [2024-03-15](date)
      - The address is [123 Main St](shipping_address)
      - My name is [Alice](name)
```

### Synonym Maps

```yaml
# nlu.yml (included in entity definitions)
  - synonym: laptop
    examples: |
      - notebook
      - notebook computer
      - portable computer
      - macbook
      - thinkpad

  - synonym: smartphone
    examples: |
      - mobile phone
      - cell phone
      - handset
      - iPhone
      - android

  - synonym: cancel
    examples: |
      - stop
      - void
      - terminate
      - undo
      - reverse
```

### Regex Features

```yaml
# nlu.yml
  - regex: order_number
    examples: |
      - ORD-\d{5}
      - #\d{3}-\d{3}
      - \b\d{4,6}\b
```

### Lookup Tables

```yaml
# nlu.yml
  - lookup: country
    examples: |
      - United States
      - Brazil
      - Germany
      - Japan
      - Australia

  - lookup: product_name
    examples: |
      - MacBook Pro
      - iPhone 15
      - Galaxy S24
      - Surface Pro
```

### Entity Roles and Groups

```yaml
# nlu.yml - disambiguating multiple same-type entities
  - intent: book_flight
    examples: |
      - Book from [New York](city:departure) to [London](city:destination)
      - I want to fly [SFO](city:departure) to [JFK](city:destination)
      - [Paris](city:destination) leaving [Berlin](city:departure)

  - intent: schedule_meeting
    examples: |
      - Meet [Alice](person:organizer) and [Bob](person:attendee)
      - Schedule with [Carol](person:attendee) organized by [Dave](person:organizer)
```

## 3. Story & Dialogue Flow Design

### Happy Path Story

```yaml
# stories.yml
version: "3.0"
stories:
  - story: order status - happy path
    steps:
      - intent: greet
      - action: utter_greet
      - intent: order.status
      - action: utter_ask_order_id
      - intent: inform
        entities:
          - order_id: ORD-12345
      - action: action_check_order_status
      - action: utter_order_status
      - intent: thanks
      - action: utter_thanks

  - story: cancel order - full flow
    steps:
      - intent: order.cancel
      - action: utter_ask_reason
      - intent: inform
        entities:
          - order_id: ORD-12345
      - action: action_cancel_order
      - slot_was_set:
          - cancelled: true
      - action: utter_order_cancelled
```

### Edge Cases and Recovery

```yaml
# stories.yml
  - story: order status - no order id then provide
    steps:
      - intent: order.status
      - action: utter_ask_order_id
      - intent: inform
        entities:
          - order_id: ORD-12345
      - action: action_check_order_status
      - action: utter_order_status

  - story: order status - negative flow (not found)
    steps:
      - intent: order.status
      - action: utter_ask_order_id
      - intent: inform
        entities:
          - order_id: INVALID-999
      - action: action_check_order_status
      - slot_was_set:
          - found: false
      - action: utter_order_not_found
      - action: utter_ask_alternative_help

  - story: out of scope - handoff to human
    steps:
      - intent: out_of_scope
      - action: utter_out_of_scope
      - intent: affirm
      - action: action_human_handoff
      - action: utter_connecting_agent

  - story: chitchat interrupt resume
    steps:
      - intent: greet
      - action: utter_greet
      - intent: chitchat.weather
      - action: utter_chitchat_weather
      - intent: order.status
      - action: action_check_order_status  # resume main flow
      - action: utter_order_status
```

### Chitchat Stories

```yaml
# stories.yml
  - story: ask joke
    steps:
      - intent: chitchat.joke
      - action: action_tell_joke
      - action: utter_ask_can_help

  - story: compliment
    steps:
      - intent: compliment
      - action: utter_thanks
      - action: utter_ask_can_help
```

### Conditional Branching with Slots

```yaml
# stories.yml
  - story: logged in user - show orders
    steps:
      - intent: order.status
      - slot_was_set:
          - logged_in: true
      - action: action_get_user_orders
      - action: utter_show_orders

  - story: anonymous user - ask login
    steps:
      - intent: order.status
      - slot_was_set:
          - logged_in: false
      - action: utter_ask_login
      - intent: inform
        entities:
          - email: alice@example.com
      - action: action_lookup_user
      - slot_was_set:
          - logged_in: true
      - action: action_get_user_orders
      - action: utter_show_orders
```

### Slot-Filling Forms

```yaml
# stories.yml
  - story: new order - form flow
    steps:
      - intent: order.new
      - action: new_order_form
      - active_loop: new_order_form
      - slot_was_set:
          - requested_slot: product_name
      - slot_was_set:
          - product_name: laptop
      - slot_was_set:
          - requested_slot: quantity
      - slot_was_set:
          - quantity: 2
      - slot_was_set:
          - requested_slot: shipping_address
      - slot_was_set:
          - shipping_address: 123 Main St
      - slot_was_set:
          - requested_slot: null
      - active_loop: null
      - action: action_confirm_order
      - action: utter_order_confirmed
```

## 4. Response Design

### Utter Templates

```yaml
# responses.yml
version: "3.0"
responses:
  utter_greet:
    - text: "Hello! Welcome to SupportBot. How can I help you today?"
    - text: "Hi there! How can I assist you?"

  utter_ask_order_id:
    - text: "Sure, could you please provide your order ID?"
    - text: "I'd be happy to help! What's your order number?"

  utter_order_status:
    - text: "Your order {order_id} is currently **{status}** and is expected to arrive by **{estimated_delivery}**."
    - text: "Status update: Order {order_id} → {status}. ETA: {estimated_delivery}."

  utter_order_not_found:
    - text: "I'm sorry, I couldn't find an order with ID **{order_id}**. Could you double-check the number?"
    - text: "No order found for **{order_id}**. It might be under a different email address."

  utter_out_of_scope:
    - text: "I'm not equipped to handle that request. Would you like me to connect you with a human agent?"
```

### Buttons and Quick Replies

```yaml
# responses.yml
  utter_ask_how_help:
    - text: "What would you like to do?"
      buttons:
        - title: "📦 Track Order"
          payload: "/order.status"
        - title: "❌ Cancel Order"
          payload: "/order.cancel"
        - title: "🆕 New Order"
          payload: "/order.new"
        - title: "💬 Talk to Human"
          payload: "/support.human_handoff"

  utter_did_that_help:
    - text: "Did that resolve your issue?"
      buttons:
        - title: "✅ Yes"
          payload: "/affirm"
        - title: "❌ No"
          payload: "/deny"
        - title: "🔧 Something else"
          payload: "/out_of_scope"

  utter_ask_product_category:
    - text: "Which category are you interested in?"
      buttons:
        - title: "💻 Electronics"
          payload: '/inform{"product_category": "electronics"}'
        - title: "👗 Clothing"
          payload: '/inform{"product_category": "clothing"}'
        - title: "📚 Books"
          payload: '/inform{"product_category": "books"}'
```

### Rich Responses (Images, Custom JSON)

```yaml
# responses.yml
  utter_product_recommendation:
    - text: "I recommend this product:"
      image: "https://example.com/images/product_123.jpg"
      buttons:
        - title: "View Details"
          url: "https://example.com/products/123"
        - title: "Add to Cart"
          payload: '/add_to_cart{"product_id": 123}'

  utter_show_cart:
    - text: "Here's your cart summary:"
      custom:
        type: "cart_summary"
        items:
          - name: "MacBook Pro"
            quantity: 1
            price: 1999.99
          - name: "USB-C Hub"
            quantity: 2
            price: 39.99
        total: 2079.97
        action:
          title: "Checkout"
          payload: "/checkout"
```

### Channel-Specific Responses

```yaml
# responses.yml - Slack vs Telegram differentiation
  utter_welcome:
    - text: "Welcome! Type /help to see available commands."
      channel: "slack"

    - text: "Welcome to SupportBot! Send /start to begin."
      channel: "telegram"

    - text: "Welcome! How can I help you today?"

  utter_open_ticket:
    - text: "I've created a ticket for you."
      channel: "web"
      custom:
        ticket_url: "https://support.example.com/tickets/{ticket_id}"
```

## 5. Dialogue Policies

### Default Policy Configuration

```yaml
# config.yml
policies:
  - name: MemoizationPolicy
    max_history: 5
  - name: RulePolicy
    core_fallback_threshold: 0.3
    core_fallback_action_name: "action_default_fallback"
  - name: TEDPolicy
    max_history: 5
    epochs: 100
    constrain_similarities: true
    model_confidence: softmax
  - name: UnexpecTEDIntentPolicy
    max_history: 5
    epochs: 100
  - name: AugmentedMemoizationPolicy
    max_history: 3
```

### Rule-Based Policies

```yaml
# rules.yml
version: "3.0"
rules:
  - rule: greet user
    steps:
      - intent: greet
      - action: utter_greet

  - rule: say goodbye
    steps:
      - intent: goodbye
      - action: utter_goodbye

  - rule: handle thanks
    steps:
      - intent: thanks
      - action: utter_thanks

  - rule: fallback to human
    steps:
      - intent: nlu_fallback
      - action: utter_out_of_scope
      - action: utter_ask_human_handoff

  - rule: activate form
    steps:
      - intent: order.new
      - action: new_order_form
      - active_loop: new_order_form

  - rule: submit form
    condition:
      - active_loop: new_order_form
    steps:
      - action: new_order_form
      - active_loop: null
      - slot_was_set:
          - requested_slot: null
      - action: action_confirm_order

  - rule: ask for slot
    condition:
      - active_loop: new_order_form
      - slot_was_set:
          - requested_slot: product_name
      - action: utter_ask_product_name

  - rule: handle form interruption
    condition:
      - active_loop: new_order_form
    steps:
      - intent: chitchat
      - action: utter_chitchat_response
      - action: new_order_form
      - active_loop: new_order_form
```

### One-Shot vs ML Policy Decision

```
Rule-based:
  - Deterministic flows (greet → utter_greet)
  - Form activation/submission
  - FAQs with exact intent match
  - Human handoff fallback

ML-based (TEDPolicy):
  - Multi-turn context-dependent flows
  - Slot-dependent branching
  - NLU prediction fallback
  - Non-linear conversations
  - Context window > 3 turns

Hybrid pattern:
  - RulePolicy handles 40-60% of turns (greetings, forms, FAQ)
  - TEDPolicy handles complex multi-turn reasoning
  - Memoization caches exact matches for speed
```

## 6. Custom Actions

### Action Server Setup

```python
# actions/actions.py
import logging
from typing import Any, Text, Dict, List

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, FollowupAction, AllSlotsReset
from rasa_sdk.forms import FormValidationAction

logger = logging.getLogger(__name__)
```

### Simple Custom Action

```python
class ActionCheckOrderStatus(Action):

    def name(self) -> Text:
        return "action_check_order_status"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        order_id = next(tracker.get_latest_entity_values("order_id"), None)
        if not order_id:
            dispatcher.utter_message(text="I need an order ID to check status.")
            return [SlotSet("found", False)]

        status = await self._get_order_status(order_id)

        if status:
            dispatcher.utter_message(
                text=f"Order {order_id} is currently **{status['state']}**. "
                     f"Estimated delivery: {status['eta']}."
            )
            return [SlotSet("found", True), SlotSet("status", status["state"])]
        else:
            dispatcher.utter_message(
                text=f"Sorry, I couldn't find order **{order_id}**."
            )
            return [SlotSet("found", False)]

    async def _get_order_status(self, order_id: str) -> Dict:
        # Integration with external API
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://api.example.com/orders/{order_id}"
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
        return None
```

### Form Validation Action

```python
class ValidateNewOrderForm(FormValidationAction):

    def name(self) -> Text:
        return "validate_new_order_form"

    async def validate_product_name(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        products = ["laptop", "smartphone", "tablet", "headphones"]
        if slot_value.lower() not in products:
            dispatcher.utter_message(
                text=f"Sorry, we only carry: {', '.join(products)}"
            )
            return {"product_name": None}
        return {"product_name": slot_value.lower()}

    async def validate_quantity(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        try:
            qty = int(slot_value)
            if qty < 1 or qty > 10:
                dispatcher.utter_message(
                    text="Quantity must be between 1 and 10."
                )
                return {"quantity": None}
            return {"quantity": qty}
        except (ValueError, TypeError):
            dispatcher.utter_message(text="Please provide a valid number.")
            return {"quantity": None}

    async def validate_shipping_address(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        if len(str(slot_value)) < 10:
            dispatcher.utter_message(
                text="Please provide a complete shipping address."
            )
            return {"shipping_address": None}
        return {"shipping_address": slot_value}
```

### API Integration Action

```python
class ActionLookupUser(Action):

    def name(self) -> Text:
        return "action_lookup_user"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        email = next(tracker.get_latest_entity_values("email"), None)
        if not email:
            dispatcher.utter_message(text="Please provide your email address.")
            return [SlotSet("logged_in", False)]

        user = await self._find_user_by_email(email)
        if user:
            dispatcher.utter_message(
                text=f"Welcome back, {user['name']}!"
            )
            return [
                SlotSet("logged_in", True),
                SlotSet("user_id", user["id"]),
                SlotSet("user_name", user["name"]),
            ]
        else:
            dispatcher.utter_message(
                text="No account found with that email."
            )
            return [SlotSet("logged_in", False)]

    async def _find_user_by_email(self, email: str) -> Dict:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://api.example.com/users?email={email}"
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("user")
        return None
```

### Slot Setting and Followup Actions

```python
class ActionHumanHandoff(Action):

    def name(self) -> Text:
        return "action_human_handoff"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(text="Connecting you to a human agent...")

        # Trigger handoff API
        await self._create_ticket(tracker.sender_id, tracker.latest_message)

        return [
            SlotSet("handoff_initiated", True),
            FollowupAction("utter_waiting_agent"),
        ]

    async def _create_ticket(self, sender_id: str, message: Dict) -> None:
        async with aiohttp.ClientSession() as session:
            await session.post(
                "https://api.example.com/tickets",
                json={"user_id": sender_id, "message": message.get("text")},
            )
```

### Disambiguation Action

```python
class ActionHandleDisambiguation(Action):

    def name(self) -> Text:
        return "action_handle_disambiguation"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        intent_ranking = tracker.latest_message.get("intent_ranking", [])
        top_two = intent_ranking[:2]

        buttons = [
            {
                "title": i["name"].replace(".", " ").title(),
                "payload": f"/{i['name']}",
            }
            for i in top_two
        ]

        dispatcher.utter_message(
            text="I'm not sure what you meant. Did you mean:",
            buttons=buttons,
        )
        return []
```

## 7. Testing & Evaluation

### Intent Confusion Matrix

```python
# test/confusion_matrix.py
import json
from rasa_model_report import ConfusionMatrix

def analyze_intent_confusion(nlu_report: str) -> None:
    """Parse Rasa NLU report and analyze confusion."""
    with open(nlu_report) as f:
        report = json.load(f)

    intent_errors = []
    for intent, metrics in report["intent_evaluation"].items():
        precision = metrics["precision"]
        recall = metrics["recall"]
        f1 = metrics["f1-score"]

        if f1 < 0.7:
            intent_errors.append({
                "intent": intent,
                "f1": f1,
                "precision": precision,
                "recall": recall,
                "support": metrics["support"],
            })

    # Log intents with confusion issues
    for e in sorted(intent_errors, key=lambda x: x["f1"]):
        print(f"[LOW F1] {e['intent']}: f1={e['f1']:.2f} "
              f"precision={e['precision']:.2f} recall={e['recall']:.2f}")

    # Print confusion matrix
    cm = ConfusionMatrix(report["intent_evaluation"]["confusion_matrix"])
    cm.plot(title="Intent Confusion Matrix", save_path="data/confusion_matrix.png")
```

### Story Success Rate Testing

```python
# test/test_stories.py
import asyncio
from rasa.core.test import test as rasa_test

async def evaluate_stories(config_path: str, stories_path: str) -> Dict:
    """Run Rasa core evaluation and report story success rate."""
    results = await rasa_test(
        config=config_path,
        stories=stories_path,
        max_stories=None,
        e2e=False,
    )

    total = len(results["stories"])
    successful = sum(1 for s in results["stories"] if s["success"])
    failed = [s for s in results["stories"] if not s["success"]]

    report = {
        "total": total,
        "successful": successful,
        "failed_count": len(failed),
        "success_rate": f"{successful / total * 100:.1f}%",
        "failed_stories": [
            {
                "story": s["story"],
                "step_number": s.get("failed_steps", [None])[0],
                "actual_action": s.get("actual_actions", [])[-1]
                    if s.get("actual_actions") else None,
                "expected_action": s.get("predicted_actions", [])[-1]
                    if s.get("predicted_actions") else None,
            }
            for s in failed
        ],
    }

    # Print summary
    print(f"Story Success Rate: {report['success_rate']}")
    print(f"Passed: {report['successful']}/{report['total']}")
    for f in report["failed_stories"]:
        print(f"  ❌ {f['story']} — expected {f['expected_action']} "
              f"got {f['actual_action']}")

    return report
```

### End-to-End Testing

```python
# test/e2e_test.py
import asyncio
from rasa.core.agent import Agent
from rasa.shared.core.events import UserUttered, BotUttered

async def run_e2e_test(model_path: str, conversation: list) -> dict:
    """Run end-to-end test with expected bot responses."""
    agent = await Agent.load(model_path)

    results = {"passed": True, "steps": []}
    for turn in conversation:
        user_input = turn["user"]
        expected_responses = turn.get("expected_responses", [])
        expected_slots = turn.get("expected_slots", {})

        responses = await agent.handle_text(user_input)

        actual_texts = [
            r.get("text", "") for r in responses
            if r.get("recipient_id")
        ]

        step = {
            "input": user_input,
            "expected": expected_responses,
            "actual": actual_texts,
            "slots": {},
        }

        for exp in expected_responses:
            if not any(exp in a for a in actual_texts):
                step["result"] = "FAIL"
                results["passed"] = False

        results["steps"].append(step)

    return results

# Test scenario
test_scenario = [
    {"user": "Hello", "expected_responses": ["Hello"]},
    {"user": "Where is my order?",
     "expected_responses": ["order ID", "order number"]},
    {"user": "ORD-12345",
     "expected_responses": ["shipped", "status"]},
]
```

### A/B Testing Framework

```python
# test/ab_testing.py
import random
import hashlib

class ConversationABTest:
    """Route users to pipeline A or B for controlled A/B testing."""

    def __init__(self, model_a: str, model_b: str, experiment_name: str):
        self.model_a = model_a
        self.model_b = model_b
        self.experiment_name = experiment_name
        self.metrics = {"A": {"sessions": 0, "success": 0, "fallbacks": 0},
                        "B": {"sessions": 0, "success": 0, "fallbacks": 0}}

    def assign_bucket(self, user_id: str) -> str:
        """Deterministic bucket assignment by user_id hash."""
        h = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        return "A" if h % 2 == 0 else "B"

    def record_turn(self, user_id: str, success: bool, fallback: bool):
        bucket = self.assign_bucket(user_id)
        self.metrics[bucket]["sessions"] += 1
        if success:
            self.metrics[bucket]["success"] += 1
        if fallback:
            self.metrics[bucket]["fallbacks"] += 1

    def report(self) -> Dict:
        a = self.metrics["A"]
        b = self.metrics["B"]
        return {
            "experiment": self.experiment_name,
            "model_a": {
                "sessions": a["sessions"],
                "success_rate": f"{a['success'] / a['sessions'] * 100:.1f}%"
                    if a["sessions"] else "N/A",
                "fallback_rate": f"{a['fallbacks'] / a['sessions'] * 100:.1f}%"
                    if a["sessions"] else "N/A",
            },
            "model_b": {
                "sessions": b["sessions"],
                "success_rate": f"{b['success'] / b['sessions'] * 100:.1f}%"
                    if b["sessions"] else "N/A",
                "fallback_rate": f"{b['fallbacks'] / b['sessions'] * 100:.1f}%"
                    if b["sessions"] else "N/A",
            },
        }
```

### Train-Test Split Script

```python
# scripts/train_test_split.py
import yaml
import random
from pathlib import Path

def split_nlu_data(
    nlu_path: str, train_ratio: float = 0.8, seed: int = 42
) -> tuple:
    """Split NLU intent examples into train/test sets."""
    random.seed(seed)

    with open(nlu_path) as f:
        data = yaml.safe_load(f)

    train_examples = []
    test_examples = []

    for intent_group in data["nlu"]:
        if "examples" not in intent_group:
            continue

        examples = [
            line.strip("- ")
            for line in intent_group["examples"].strip().split("\n")
            if line.strip()
        ]
        random.shuffle(examples)

        split_idx = int(len(examples) * train_ratio)
        train_ex = examples[:split_idx]
        test_ex = examples[split_idx:]

        if train_ex:
            train_examples.append({
                "intent": intent_group["intent"],
                "examples": "\n".join(f"- {e}" for e in train_ex),
            })
        if test_ex:
            test_examples.append({
                "intent": intent_group["intent"],
                "examples": "\n".join(f"- {e}" for e in test_ex),
            })

    train_data = {"version": "3.0", "nlu": train_examples}
    test_data = {"version": "3.0", "nlu": test_examples}

    return train_data, test_data
```

## 8. Multi-Turn Context Management

### Slot Persistence Configuration

```yaml
# domain.yml
version: "3.0"
session_config:
  session_expiration_time: 60
  carry_over_slots_to_new_session: true

slots:
  order_id:
    type: text
    mappings:
      - type: from_entity
        entity: order_id
    influence_conversation: true

  logged_in:
    type: bool
    initial_value: false
    mappings:
      - type: custom
    influence_conversation: true

  user_id:
    type: text
    mappings:
      - type: custom
    influence_conversation: false

  handoff_initiated:
    type: bool
    initial_value: false
    mappings:
      - type: custom
    influence_conversation: false

  conversation_history:
    type: list
    mappings:
      - type: custom
    influence_conversation: false

  requested_slot:
    type: text
    mappings:
      - type: from_trigger_intent
        intent: order.new
        value: product_name

  product_name:
    type: text
    mappings:
      - type: from_entity
        entity: product_name
    influence_conversation: true
```

### Context Switching Pattern

```python
class ActionContextSwitch(Action):
    """Handle switching between conversation contexts."""

    def name(self) -> Text:
        return "action_context_switch"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        current_context = tracker.get_slot("current_context")
        active_loop = tracker.active_loop.get("name")

        events = []

        if active_loop and current_context != active_loop:
            # Save current form state before switching
            events.append(SlotSet("_saved_context", current_context))
            events.append(SlotSet(
                "_saved_slots",
                {
                    "product_name": tracker.get_slot("product_name"),
                    "quantity": tracker.get_slot("quantity"),
                },
            ))
            events.append(FollowupAction("action_deactivate_loop"))
            events.append(SlotSet("current_context", "chitchat"))

        elif not active_loop and current_context == "chitchat":
            # Restore previous context
            saved = tracker.get_slot("_saved_context")
            if saved:
                events.append(SlotSet("current_context", saved))
                events.append(FollowupAction(saved))

        dispatcher.utter_message(text="Sure! What would you like to discuss?")
        return events
```

### Disambiguation Handler

```yaml
# config.yml - NLU fallback + disambiguation
pipeline:
  - name: WhitespaceTokenizer
  - name: CountVectorsFeaturizer
  - name: DIETClassifier
    epochs: 100
  - name: FallbackClassifier
    threshold: 0.7
    ambiguity_threshold: 0.1

# rules.yml - disambiguation rule
rules:
  - rule: trigger disambiguation
    steps:
      - intent: nlu_fallback
      - action: action_handle_disambiguation
```

### LLM-Based Conversational Memory (LangChain)

```python
# actions/llm_memory.py
from langchain.memory import ConversationBufferWindowMemory
from langchain.schema import BaseMessage, HumanMessage, AIMessage

class RasaLangChainMemory:
    """Bridge between Rasa tracker and LangChain conversational memory."""

    def __init__(self, window_size: int = 5):
        self.memory = ConversationBufferWindowMemory(
            k=window_size,
            return_messages=True,
        )

    def load_from_tracker(self, tracker) -> None:
        """Reconstruct memory from Rasa tracker events."""
        events = tracker.events
        for event in events:
            if event.get("event") == "user":
                self.memory.chat_memory.add_user_message(event["text"])
            elif event.get("event") == "bot":
                self.memory.chat_memory.add_ai_message(
                    event.get("text", "")
                )

    def get_context(self) -> str:
        return self.memory.load_memory_variables({})["history"]

    def add_turn(self, user: str, bot: str) -> None:
        self.memory.chat_memory.add_user_message(user)
        self.memory.chat_memory.add_ai_message(bot)

class ActionLLMResponse(Action):
    """Generate responses using LLM with conversation context."""

    def name(self) -> Text:
        return "action_llm_response"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        # Build conversation history
        memory = RasaLangChainMemory(window_size=5)
        memory.load_from_tracker(tracker)
        context = memory.get_context()

        prompt = self._build_prompt(
            user_message=tracker.latest_message.get("text"),
            context=context,
            slots={s: tracker.get_slot(s)
                   for s in ["order_id", "product_name"]},
        )

        response = await self._call_llm(prompt)

        dispatcher.utter_message(text=response)
        return []

    def _build_prompt(
        self, user_message: str, context: str, slots: Dict
    ) -> str:
        return (
            f"Conversation history:\n{context}\n\n"
            f"Current slots: {slots}\n"
            f"User: {user_message}\n"
            f"Assistant:"
        )

    async def _call_llm(self, prompt: str) -> str:
        # Integration with any LLM provider
        # e.g., OpenAI, Anthropic, local model
        return "Generated response based on conversation context."
```

### RAG-Enhanced Responses

```python
# actions/rag_action.py
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS

class ActionRAGResponse(Action):
    """Retrieval-Augmented Generation for FAQ/document queries."""

    def name(self) -> Text:
        return "action_rag_response"

    def __init__(self):
        self.vector_store = FAISS.load_local(
            "data/faq_index",
            OpenAIEmbeddings(),
        )

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        query = tracker.latest_message.get("text")
        docs = self.vector_store.similarity_search(query, k=3)
        context = "\n\n".join(d.page_content for d in docs)

        prompt = (
            f"Context from knowledge base:\n{context}\n\n"
            f"User question: {query}\n"
            f"Answer concisely using only the context above."
        )

        answer = await self._call_llm(prompt)
        dispatcher.utter_message(text=answer)
        return []

    async def _call_llm(self, prompt: str) -> str:
        # LLM call here
        return "Answer from knowledge base."
```

### Follow-Up Question Detection

```python
class ActionDetectFollowUp(Action):
    """Detect if user message is a follow-up needing context."""

    def name(self) -> Text:
        return "action_detect_follow_up"

    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        text = tracker.latest_message.get("text", "").lower()
        follow_up_keywords = [
            "it", "that", "this", "they", "them",
            "what about", "and then", "also",
        ]

        is_follow_up = any(
            text.startswith(kw) or f" {kw} " in text
            for kw in follow_up_keywords
        )

        if is_follow_up and not tracker.get_slot("current_context"):
            dispatcher.utter_message(
                text="Are you referring to something we discussed earlier? "
                     "Could you be more specific?"
            )
            return [SlotSet("awaiting_clarification", True)]

        return [SlotSet("awaiting_clarification", False)]
```

## Domain File Structure

```yaml
# domain.yml - Complete domain example
version: "3.0"

intents:
  - greet
  - goodbye
  - affirm
  - deny
  - thanks
  - order.status
  - order.cancel
  - order.new
  - inform
  - chitchat.joke
  - chitchat.weather
  - out_of_scope
  - support.human_handoff
  - nlu_fallback

entities:
  - order_id
  - product_name
  - quantity
  - shipping_address
  - email
  - name
  - date

slots:
  order_id:
    type: text
    mappings:
      - type: from_entity
        entity: order_id
  product_name:
    type: text
    mappings:
      - type: from_entity
        entity: product_name
  quantity:
    type: float
    mappings:
      - type: from_entity
        entity: quantity
  shipping_address:
    type: text
    mappings:
      - type: from_entity
        entity: shipping_address
  logged_in:
    type: bool
    initial_value: false
    mappings:
      - type: custom

responses:
  utter_greet:
    - text: "Hello! How can I help you today?"
  utter_goodbye:
    - text: "Goodbye! Have a great day."
  utter_ask_order_id:
    - text: "Please provide your order ID."

actions:
  - action_check_order_status
  - action_cancel_order
  - action_confirm_order
  - action_lookup_user
  - action_human_handoff
  - action_handle_disambiguation
  - action_llm_response
  - action_rag_response
  - validate_new_order_form

forms:
  new_order_form:
    required_slots:
      - product_name
      - quantity
      - shipping_address

session_config:
  session_expiration_time: 60
  carry_over_slots_to_new_session: true
```

## Output Format

```markdown
## Conversational AI Design Review

### Pipeline Analyzed
- NLU Pipeline - ✅ WhitespaceTokenizer + DIETClassifier + FallbackClassifier
- Dialogue Policies - ✅ RulePolicy + TEDPolicy + Memoization

### Issues Found
1. [Component] - [Issue] - [Fix]

### Recommendations
1. Add synonym maps for high-variance entity values
2. Implement disambiguation handler for low-confidence intents
3. Add slot-filling form for order creation flow
4. Set up end-to-end test suite for critical story paths
5. Configure session carry-over for multi-turn context persistence
```

## References

- Rasa 3.x Documentation: https://rasa.com/docs/rasa/
- LangChain Memory: https://python.langchain.com/docs/modules/memory/
- Rasa SDK Custom Actions: https://rasa.com/docs/action-server/
- DIET Classifier: https://arxiv.org/abs/2004.07314
- TED Policy: https://arxiv.org/abs/1910.00486
