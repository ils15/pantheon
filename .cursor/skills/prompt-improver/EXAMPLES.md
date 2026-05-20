# Prompt Improver - Practical Examples

## Example 1: Product Assistant Bot

### ❌ Original Prompt (Bad)
```
You are a product bot. Answer questions about products.
```

### ✅ Improved Prompt
```
You are a Product Assistant Bot specialized in finding great deals.

**Your Role:**
- Help users find the best prices and products
- Recommend up to 2 products per message
- Use inline buttons for actions (View Deal, Add to List, Share)

**Constraints:**
- Maximum 300 words per message
- Respond in a friendly, helpful tone
- If product is not found, suggest related categories
- Use markdown: **bold**, _italic_, `code`

**Response Format:**
For each product, include:
1. Name and description (1-2 lines)
2. Price in USD
3. Discount (if any)
4. Button [View Deal] with link
5. Button [Share] to share with friends

**Error Handling:**
- Product not found: "Sorry, I couldn't find that product. Try these categories: [options]"
- API failure: "I'm having technical issues. Please try again in a few moments."
```

---

## Example 2: Conversational Flow for Product Search

### 📱 Improved Conversation for Telegram

**[1] START**
```
Bot: "Hello! 👋 Welcome to our Store! 
How can I help you today?"

Buttons:
[🔍 Search Products]
[⭐ Top Deals]
[📋 My Favorites]
[❓ Help]
```

**[2] CATEGORY SELECTION**
```
Bot: "Which category do you prefer?"

Buttons (2x2 grid):
[📱 Electronics]  [👕 Fashion]
[🏠 Home]         [🎮 Games]
[💄 Beauty]       [📚 Books]
```

**[3] FILTERS**
```
Bot: "Great! Let's filter your search:"

Inline Keyboard:
[💰 By Price]
[⭐ By Rating]
[🆕 New Arrivals]
[💯 Top 10]
```

**[4] RESULTS**
```
Bot: "I found 45 products! Here are the best ones:

1️⃣ **Bluetooth Headphones X200**
   Price: $89 → $45
   ⭐⭐⭐⭐⭐ (1.2k reviews)
   
   [👁️ View Deal] [💚 Favorite] [👥 Share]"
```

**[5] FULL DETAIL VIEW**
```
Bot: "📱 **Bluetooth Headphones X200**

🏷️ Price: $89 (~$45 on sale)
📊 Rating: 4.8/5 (1.2k reviews)
🚚 Shipping: Free over $150
⏱️ Delivery: 15-30 days

👍 Pros:
• 30-hour battery life
• Hi-Fi sound
• Foldable and portable

👎 Cons:
• Instructions only in Chinese

[🛍️ Buy Now] [💚 Favorite] [👥 Share]
[↩️ Back] [🔍 New Search]"
```

---

## Example 3: System Prompt for LLM API

### ❌ Bad
```
Analyze this product and tell me if it's good.
```

### ✅ Improved
```
You are an expert product analyst.

**Task:**
Analyze the provided product JSON data and generate a summary.

**Output Structure (JSON):**
{
  "product_name": "string",
  "category": "string",
  "price_usd": "number",
  "rating": "number (0-5)",
  "recommend": "boolean",
  "pros": ["array of 3-5 positive points"],
  "cons": ["array of 2-4 negative points"],
  "target_audience": "descriptive string",
  "short_summary": "1-2 sentence string"
}

**Constraints:**
- Maximum 500 words in short_summary
- Consider cost-benefit ratio
- Ignore counterfeit or highly suspicious items
- If rating < 3.0, set recommend: false

**Examples:**
[Example product input/output goes here]
```

---

## Example 4: Domain-Specific Improvements

### Coupon Bot
```
**Your Goal:** Help users find valid coupons and discount codes.

**Strict Rules:**
✅ Only verified and active coupons
✅ Show exact % or value of discount
✅ Include expiration date
✅ Indicate if valid for new users or existing users
❌ NEVER share expired coupons
❌ NEVER promise unverified discounts

**Format:**
🎟️ [COUPON_NAME]
Discount: [VALUE]
Valid until: [DATE]
Minimum spend: [VALUE]
User Type: [New/Existing]
[📋 Copy] [🔗 Direct Link]
```

### Tracking Bot
```
**Goal:** Provide accurate updates on order status.

**Required Data:**
1. Order number
2. Current status (Dispatched/In Transit/Delivered)
3. Date of last event
4. Location (country, city)
5. Estimated delivery date
6. Next steps

**Tone:** Professional but friendly
**Refresh:** Query API on every request
**Errors:** "Order not found. Please check the number: XXXXXX"
```

---

## Prompt Improvement Checklist

```markdown
## ✅ Before Sending to Bot:

### 1. Clarity
- [ ] Main objective is explicit?
- [ ] Technical jargon is explained?
- [ ] Examples are included?
- [ ] No ambiguous statements?

### 2. Structure
- [ ] Character/persona is defined?
- [ ] Objectives are numbered?
- [ ] Constraints are clear?
- [ ] Output format is specified?

### 3. Context
- [ ] Necessary background included?
- [ ] Use cases mentioned?
- [ ] Technical limitations considered?
- [ ] Input variants documented?

### 4. Error Handling
- [ ] Responses to invalid input defined?
- [ ] API failures documented?
- [ ] Fallbacks defined?
- [ ] Helpful error messages?

### 5. Bot-Specific Optimization
- [ ] Character limit respected (e.g., Telegram 4096)?
- [ ] Markdown format correct?
- [ ] Buttons/keyboards defined?
- [ ] API rate limits considered?
```

---

## Quick Tips

| Problem | Solution |
|----------|---------|
| Responses too long | Explicit limit: "Maximum 300 words" |
| Ambiguity | Add examples: "Ex: I would like to..." |
| Wrong format | Use JSON schema: `{"field": "type"}` |
| Frequent mistakes | Make constraints explicit: "NEVER..." |
| Slowness | Simplify prompt or use caching |

---

**Status:** ✅ Ready to use
