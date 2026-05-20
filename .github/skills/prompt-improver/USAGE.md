# Prompt Improver - Usage Guide

## 🚀 How to Use

### Use Case 1: Improve a Simple Prompt

**You ask:**
```
@prompt-improver Analyze and improve this prompt for my coupon bot:

"You are a bot that shows coupons and discount codes. 
If the user asks for a coupon, show valid coupons.
If there are no coupons, say you don't have any."
```

**Skill Responds:**

```markdown
## 📊 ORIGINAL PROMPT ANALYSIS
- Clarity: 4/10 ❌ Too vague
- Specificity: 2/10 ❌ Lacks structure
- Bot Compatibility: ⚠️ No formatting
- Key Issues:
  - No response structure
  - No error handling
  - No character limits
  - No emojis/formatting

## 🎯 RECOMMENDATIONS

1. **Add Clear Persona**
   "Your Goal: Help users find valid coupons"

2. **Structure Rules**
   Use numbered lists with ✅/❌

3. **Define Format**
   JSON or structured markdown

4. **Add Constraints**
   Telegram: max 4096 characters

## ✨ IMPROVED PROMPT

You are an **E-Commerce Coupon Bot** specialized in finding discount codes.

### Your Goal:
- Find valid and active coupons
- Show exact discount (% or value)
- Indicate expiration and requirements
- Help users save money

### Strict Rules:
✅ Only verified coupons
✅ Show expiration date
✅ Indicate minimum spend
✅ Differentiate new/returning customers
❌ NEVER share expired coupons
❌ NEVER promise fake discounts

### Response Format:
\`\`\`
🎟️ [COUPON_CODE]
Discount: [VALUE] (% or $)
Valid until: [EXPIRATION_DATE]
Min Spend: [$]
Type: [New/Returning/Both]
Category: [Category]

[📋 Copy Code] [🔗 Direct Link] [📱 Share]
\`\`\`

### Error Handling:
- "Coupon not found. Try: [suggestions]"
- "Coupon expired on [date]. Try these: [list]"
- "No coupons at the moment. Check back tomorrow!"

---

**Expected Improvement:** +6 clarity points, professional structure, better UX
```

---

### Use Case 2: Platform Optimization

```
@prompt-improver Optimize this prompt for WhatsApp Bot (WAHA):

"Bot that searches for products and shows results."
```

**Skill Responds:**

```markdown
## 🔄 WHATSAPP (WAHA) OPTIMIZATION

### WAHA vs Telegram Considerations:
❌ No inline keyboards (Telegram feature)
✅ Uses template messages
✅ Buttons (max 3 per message)
⚠️ Limited Markdown

### Optimized Prompt:

You are a Product Search Bot for WhatsApp (WAHA).

**WhatsApp Constraints:**
- Max 4096 characters (rarely reached but keep it concise)
- No complex markdown (only *bold* and _italic_)
- Maximum 3 buttons per message
- Templates for bulk notifications
- No inline keyboards (use list buttons instead)

**Response Format:**
Main message (up to 1000 characters)
[Button 1] [Button 2] [Button 3]

**Example:**
*Product found!*
_iPhone 14_ 
Price: $899 → $799

[👁️ View Details]
[💚 Favorite]
[👥 Share]
```

---

## 📋 Available Improvement Types

| Type | Command | Output |
|------|---------|--------|
| **General** | `@prompt-improver Improve...` | Full analysis + improved version |
| **Platform** | `@prompt-improver Optimize for [Telegram/WhatsApp]` | Platform-adapted version |
| **Flow Design** | `@prompt-improver Design conversation flow` | Multi-turn structure |
| **API Prep** | `@prompt-improver Prepare for [Gemini/GPT] API` | JSON schema + examples |
| **Audit** | `@prompt-improver Audit this prompt` | Quality checklist |

---

## 🎯 Common Scenarios

### 1. Product Bot
```
@prompt-improver Improve this prompt for a product bot:
[your prompt here]

Additional Context:
- Platform: Telegram
- Users: 50k/month
- Response: Max 300 words
```

### 2. Support Bot
```
@prompt-improver Design conversational flow for support bot

Requirements:
- Categorize issue
- Clarify request type
- Provide solution or escalate
```

### 3. API Prompt
```
@prompt-improver Prepare prompt for Gemini integration

Task: E-commerce product analysis
Input: JSON with product data
Output: Recommendation + detailed analysis
```

### 4. Quality Validation
```
@prompt-improver Audit the quality of this prompt:
[current prompt]

Criteria:
- Clarity
- Telegram compatibility
- Error handling
```

---

## ⚡ Quick Tips

### ✅ GOOD
```
"Maximum 300 words, always use markdown, JSON format"
```

### ❌ BAD
```
"Answer nicely, use formatting, be professional"
```

---

### ✅ GOOD (Example)
```
For each product, respond:
{
  "name": "string",
  "price": "number",
  "link": "url"
}
```

### ❌ BAD
```
"Show product and price and link"
```

---

## 🔗 Integration with Other Skills

### With Frontend Analyzer
```
1. Frontend Analyzer extracts colors/fonts
2. Prompt Improver optimizes UI instructions
3. Result: Bot replies with correct UI tokens
```

### With Telegram UI Design
```
1. Telegram UI designs keyboard layout
2. Prompt Improver writes instructions for the layout
3. Result: Bot implements UI correctly
```

---

## 📊 Improvement Metrics

```markdown
## Before vs After

### Original Prompt: "Product bot"
- Clarity: 2/10
- Tokens (est.): 450
- Error rate: ~40%

### Improved Prompt
- Clarity: 9/10 (+350%)
- Tokens (est.): 600 (+33%)
- Error rate: ~5% (-87.5%)

**Benefit:** Major clarity boost with acceptable token cost increase
```

---

## 🚫 Anti-Patterns (Avoid!)

| Anti-Pattern | Problem | Solution |
|--------------|----------|---------|
| "Be creative" | Imprecise, inconsistent output | "Respond with exactly..." |
| "Use emojis" | Bot doesn't know when to use them | "Use 1 emoji per line: 🎯" |
| "Be professional" | Ambiguous meaning | "Tone: formal, respectful, concise" |
| "Answer everything" | Responses get too long | "Maximum [N] words" |

---

## 💬 Chat Patterns

### Pattern 1: Analysis + Improvement (Most Common)
```
You: "Improve this prompt: [X]"
Skill: [Analysis + Improvements + New Version]
You: "Use more emojis"
Skill: [Updated version with more emojis]
```

### Pattern 2: Flow Design
```
You: "Design conversation flow for..."
Skill: [ASCII Diagram + Prompts for each turn]
You: "Add price filters"
Skill: [Updated flow with new branch]
```

### Pattern 3: Iterative Validation
```
You: "Audit this prompt"
Skill: [10-criteria analysis]
You: "Fix the 3 critical issues"
Skill: [Fixed version]
You: "Ready?"
Skill: "✅ Ready for production!"
```

---

## 🎓 Template for Custom Prompts

Copy this template and fill it out:

```
### 🤖 Your Bot [Name]

**Your Goal:**
- [Goal 1]
- [Goal 2]

**Your Audience:**
[Describe users]

**Constraints:**
✅ [Rule 1]
✅ [Rule 2]
❌ [Never 1]
❌ [Never 2]

**Output Format:**
[Expected structure: JSON, markdown, etc]

**Examples:**
[1-2 input/output examples]

**Error Handling:**
- Case 1: [Response]
- Case 2: [Response]
```

---

**Next Steps:**
1. Choose an existing prompt
2. Ask @prompt-improver to test it
3. Iterate until satisfied
4. Deploy to production
5. Gather user feedback

---

**Last Updated:** December 19, 2025  
**Status:** ✅ Production Ready
