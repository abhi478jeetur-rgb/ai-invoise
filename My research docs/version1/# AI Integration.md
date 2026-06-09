# AI Integration.md

## Document Purpose
This document defines how AI should be integrated into ChaseFree AI V1.

The goal is not just to “call an LLM.”

The goal is to build a reliable AI reminder assistant that:
- understands invoice context
- considers reminder history
- respects client relationship context
- uses the correct tone
- avoids reckless or random drafts
- stays fast, structured, and predictable
- works with OpenAI-compatible APIs

This document must guide implementation so the AI behaves like a context-aware assistant, not a button that generates generic text.

---

## V1 AI Integration Goal
Use an OpenAI-compatible text generation API to power invoice reminder drafting.

The AI must:
- understand the invoice state
- understand the client context
- understand what has already happened before
- generate useful reminders in the correct tone
- support fast UX
- return predictable outputs for the app

---

## Core AI Philosophy

### 1. Context First
The model must never generate reminder text from only a button click and invoice amount.

The model must receive enough structured context to understand:
- who the client is
- what invoice this is
- whether it is due soon or overdue
- how late it is
- what reminders were already generated or sent
- what tone the user wants now
- whether the relationship is sensitive

### 2. Human in the Loop
The AI must suggest drafts, not autonomously act.

V1 should:
- generate
- format
- assist
- suggest

V1 should not:
- auto-send
- auto-escalate
- threaten
- invent facts
- make payment promises
- mention legal consequences unless explicitly instructed in future features

### 3. Fast and Reliable
The AI should feel fast enough for interactive use.

The user experience should support:
- one-click draft generation
- multiple draft variants
- consistent formatting
- low confusion

### 4. Structured Outputs Over Loose Text
Whenever possible, the AI should return structured JSON instead of unpredictable free-form prose.

This makes the app easier to build, safer to validate, and easier to render.

---

## Initial Provider Strategy
For V1, use an OpenAI-compatible provider.

This means the app should support providers that expose an OpenAI-style API surface, including:
- base URL
- API key
- model name
- chat completion style request format

The provider layer must be abstracted so the app can swap models later without rewriting reminder logic.

---

## Recommended Integration Approach

### Use a Provider-Agnostic AI Service Layer
Create one internal service for all AI generation.

Example concept:
- `generateReminderDrafts(context)`
- `buildReminderPrompt(context)`
- `validateReminderResponse(response)`
- `mapProviderConfigToOpenAICompatibleClient(settings)`

Do not scatter raw AI calls across UI components.

The UI should call one safe server-side action or API endpoint.

---

## Recommended Architecture

### Frontend
The frontend should:
- collect user input
- collect tone selection
- trigger generation
- show loading state
- render structured draft results
- allow copy/edit/use actions

The frontend should not:
- build the entire prompt itself
- hold secret keys
- directly trust model responses without validation

### Backend / Server Action
The server side should:
- fetch invoice context
- fetch client context
- fetch recent reminder history
- fetch user AI settings
- build the final message payload
- call the OpenAI-compatible provider
- validate the response
- save reminder drafts
- save reminder events

---

## Minimum Context Package for Reminder Generation
Every reminder generation request must include a structured context object.

### Required Context
- user id
- invoice id
- client name
- contact name if available
- invoice number
- invoice title
- invoice amount
- currency
- issue date
- due date
- invoice status
- overdue days or due-soon status
- payment link if available
- invoice notes if relevant
- reminder count
- last reminder timestamp if any
- recent reminder history summary
- selected tone
- optional relationship notes
- optional user editing instruction

### Why This Matters
Without this context, the model may:
- generate the wrong tone
- repeat the same message
- escalate too early
- miss urgency
- ignore past attempts
- sound disconnected from the real situation

---

## History Handling Strategy

### Problem
The AI should not behave as if each reminder is the first reminder ever written.

### Required History Awareness
The system must include recent context from past reminder activity.

At minimum, pass:
- reminder count
- last reminder date
- 1 to 3 recent reminder summaries or excerpts
- whether the current draft should feel like first follow-up, second follow-up, or escalation

### V1 Rule
Do not send the full entire database history blindly.

Instead, send a concise history summary object such as:
- reminder count
- last reminder sent/generated date
- most recent tone used
- short summaries of recent messages

### Example History Summary
```json
{
  "reminder_count": 2,
  "last_reminder_at": "2026-05-12T10:30:00Z",
  "recent_history": [
    {
      "tone": "friendly",
      "summary": "Friendly reminder asking if payment timeline is available."
    },
    {
      "tone": "professional",
      "summary": "Professional follow-up referencing invoice due date and asking for update."
    }
  ]
}
```

### History Rule
The model must use history to avoid:
- repeating the same wording
- starting again from a soft tone when escalation is needed
- sounding more aggressive than necessary
- ignoring relationship continuity

---

## System Prompt Requirements

### Purpose of the System Prompt
The system prompt defines the permanent behavior of the reminder assistant.

It should ensure the model:
- understands the product role
- stays within business rules
- respects context
- outputs structured content
- does not improvise dangerous content

### System Prompt Principles
The system prompt must instruct the model to:
- act as a professional invoice follow-up assistant
- prioritize clarity, professionalism, and relationship safety
- use provided context before writing
- consider reminder history
- avoid hallucinating facts
- avoid legal or aggressive claims
- avoid robotic language
- produce concise drafts
- keep outputs useful and editable
- follow output schema exactly

---

## Recommended System Prompt
Use a system prompt close to this:

```text
You are the AI reminder assistant for ChaseFree AI, a product that helps freelancers and small agencies follow up on unpaid invoices professionally.

Your job is to generate high-quality payment reminder drafts based on the provided structured context.

You must always:
- understand the invoice details before writing
- consider due date status and days overdue
- consider reminder history before generating a new message
- avoid repeating prior messaging too closely
- match the requested tone
- remain professional, calm, and natural
- protect the client relationship while still helping the user ask for payment
- keep drafts concise and easy to send
- use only the facts provided in the input
- never invent timelines, agreements, promises, or consequences
- never threaten legal action
- never mention penalties, contracts, or late fees unless the user context explicitly includes them
- never claim that a reminder was previously sent unless history clearly shows it
- never output anything outside the required response format

When reminder history exists, treat the draft as part of an ongoing conversation, not as a brand new request.

When the invoice is only due soon, the tone should stay lighter than for overdue invoices.

When the invoice is overdue and reminders already exist, escalation may increase, but the wording must still remain professional and non-hostile.

Return structured output only.
```

---

## Message Construction Strategy

### Recommended Message Order
Use a message array with:
1. system message
2. developer-style instruction or application instruction if needed
3. user message containing the structured reminder-generation request

OpenAI-compatible chat APIs use message-based conversation input, and prior messages can be included explicitly so the model can respond using conversation state rather than stateless prompting.[cite:75][cite:79]

### Important Rule
Do not rely only on one giant raw prompt string.

Prefer a structured request body with:
- system instructions
- JSON-like context
- explicit output requirements

---

## Recommended Request Shape
Use a server-side payload concept like this:

```json
{
  "task": "generate_invoice_reminder_drafts",
  "context": {
    "client": {
      "client_name": "Acme Studio",
      "contact_name": "Riya"
    },
    "invoice": {
      "invoice_number": "INV-1024",
      "title": "Website redesign milestone 2",
      "amount": 1200,
      "currency": "USD",
      "issue_date": "2026-05-01",
      "due_date": "2026-05-10",
      "status": "overdue",
      "days_overdue": 8,
      "payment_link": "https://example.com/pay/inv-1024"
    },
    "follow_up": {
      "selected_tone": "professional",
      "reminder_count": 2,
      "last_reminder_at": "2026-05-14T09:00:00Z",
      "recent_history": [
        {
          "tone": "friendly",
          "summary": "Friendly check-in about invoice due date."
        },
        {
          "tone": "professional",
          "summary": "Asked whether payment could be processed this week."
        }
      ]
    },
    "relationship_context": {
      "notes": "Long-term client, usually pays late but reliably."
    }
  }
}
```

---

## Structured Output Requirement

### Why Structured Output Matters
The app should not parse unreliable prose if it can avoid it.

A structured response makes it easier to:
- render drafts
- validate fields
- store drafts
- track variant quality
- prevent malformed UI behavior

OpenAI supports structured outputs and JSON-oriented generation patterns, which are useful when the app needs responses to conform to a predictable schema.[cite:76][cite:80]

### Required Output Shape
The model should return:
- `tone_used`
- `reasoning_summary`
- `drafts`

Where `drafts` is an array of 2 to 3 options.

Each draft should contain:
- `label`
- `subject`
- `body`
- `short_follow_up`

### Example Response Shape
```json
{
  "tone_used": "professional",
  "reasoning_summary": "This invoice is overdue by 8 days and two previous reminders exist, so the drafts should be professional and direct without sounding hostile.",
  "drafts": [
    {
      "label": "Option 1",
      "subject": "Follow-up on Invoice INV-1024",
      "body": "Hi Riya,\n\nI wanted to follow up on Invoice INV-1024 for $1,200, which was due on May 10. Please let me know when payment is expected.\n\nThank you,\n[Your Name]",
      "short_follow_up": "Hi Riya, following up on Invoice INV-1024. Please let me know the expected payment timeline. Thank you."
    },
    {
      "label": "Option 2",
      "subject": "Payment update for Invoice INV-1024",
      "body": "Hi Riya,\n\nJust checking in regarding Invoice INV-1024 for $1,200, which is now 8 days overdue. Please share an update on the payment timeline when you can.\n\nBest,\n[Your Name]",
      "short_follow_up": "Hi Riya, could you share a payment update for Invoice INV-1024 when possible?"
    }
  ]
}
```

---

## Response Validation Rules
The backend must validate AI output before saving or rendering.

Validate:
- JSON parses correctly
- required keys exist
- 2 to 3 drafts returned
- subject is non-empty
- body is non-empty
- output tone matches allowed tone set
- output length stays reasonable
- no banned language exists

If validation fails:
- retry once with stricter instructions
- if still invalid, show graceful error to user

---

## Recommended Server-Side Generation Flow

### Flow
1. Receive generation request from UI
2. Authenticate user
3. Load invoice by id
4. Verify invoice belongs to user
5. Load related client
6. Load recent reminder drafts and/or reminder events
7. Build history summary
8. Load AI provider settings
9. Build system message
10. Build structured user context payload
11. Call OpenAI-compatible model
12. Validate output
13. Save reminder drafts
14. Save reminder event
15. Return structured result to UI

---

## Reminder Generation Rules

### Tone Mapping
Tone must depend on both:
- user selection
- invoice context

Examples:
- Friendly: due soon or first light reminder
- Professional: standard overdue follow-up
- Firm: repeated overdue follow-up
- Final Notice: serious but still non-hostile late-stage reminder

### Hard Rules
- Due soon should not sound threatening
- First reminder should not sound like escalation
- Repeated reminders should not ignore prior history
- Long-term valued clients should not receive harsh drafts unless explicitly intended
- Final notice must still remain professional and factual

---

## Prompt Input Design Rules
The prompt payload must clearly separate:
- facts
- history
- user intent
- output format

Do not bury critical state in prose paragraphs.

Use structured sections like:
- invoice facts
- client context
- reminder history
- requested tone
- output instructions

---

## Example User Message Template
Use something like this as the final user message sent to the model:

```text
Generate invoice reminder drafts using the following structured context.

Invoice facts:
- Invoice number: {{invoice_number}}
- Title: {{title}}
- Amount: {{amount}} {{currency}}
- Issue date: {{issue_date}}
- Due date: {{due_date}}
- Status: {{status}}
- Days overdue: {{days_overdue}}

Client context:
- Client name: {{client_name}}
- Contact name: {{contact_name}}
- Relationship notes: {{relationship_notes}}

Reminder history:
- Reminder count: {{reminder_count}}
- Last reminder at: {{last_reminder_at}}
- Recent summaries: {{recent_history}}

Requested tone:
- {{selected_tone}}

Instructions:
- Use the provided facts only
- Consider reminder history carefully
- Do not repeat previous messages too closely
- Stay concise, professional, and natural
- Return JSON only in the required schema
```

---

## Model Output Safety Rules
The model must avoid:
- invented due dates
- invented promises
- invented agreements
- legal threats
- fake urgency not present in data
- accusations
- emotional manipulation
- over-apologizing
- robotic AI wording

Examples of bad behavior:
- “As mentioned several times...” when history does not support it
- “Per our agreement, penalties now apply” when no such data exists
- “This is your final legal warning” in V1
- “I hope this message finds you well” repeated mechanically in every draft

---

## Editing and User Control
The user must always be able to:
- view all generated variants
- copy one variant
- edit before sending
- regenerate with another tone
- regenerate after modifying context if needed

The AI is an assistant, not an autopilot.

---

## Recommended OpenAI-Compatible Request Settings

### Suggested Starting Defaults
These are practical starting points, not hard requirements:
- temperature: low to moderate
- max tokens: enough for 2 to 3 concise drafts
- no streaming required initially unless UI needs it
- server-side timeout protection required

### Why
Reminder drafting needs:
- consistency
- clarity
- low hallucination risk
- small variation between options

This usually benefits from lower randomness than creative writing tasks.

---

## Error Handling Strategy

### Common Failure Modes
- provider unavailable
- timeout
- invalid JSON
- empty output
- malformed drafts
- missing API settings
- unauthorized access to invoice data

### UX Requirements
If AI generation fails:
- show a clear non-technical error message
- do not lose user context
- allow retry
- do not create broken draft rows
- avoid exposing raw provider errors directly to end users

---

## Performance Strategy
AI generation should feel fast.

Recommended strategies:
- keep prompt context concise
- send only relevant recent history
- avoid dumping raw long notes
- avoid unnecessarily huge system prompts
- save compact summaries of previous reminders
- use server-side caching only where safe and useful later

---

## Suggested Database Interaction for AI History
When generating a reminder:
- fetch the most recent 3 reminder drafts for the invoice
- fetch the most recent important reminder events
- summarize them into a compact history object
- pass the summary to the model

Do not pass the full raw text of every historic message forever.

---

## Recommended Internal Types

### ReminderGenerationInput
```ts
type ReminderGenerationInput = {
  invoiceId: string
  selectedTone: "friendly" | "professional" | "firm" | "final_notice"
  userInstruction?: string
}
```

### ReminderDraftResult
```ts
type ReminderDraftResult = {
  tone_used: "friendly" | "professional" | "firm" | "final_notice"
  reasoning_summary: string
  drafts: Array<{
    label: string
    subject: string
    body: string
    short_follow_up: string
  }>
}
```

---

## Recommended API Boundary
Create one server-side function or route similar to:
- `POST /api/ai/reminders/generate`

Input:
- invoiceId
- selectedTone
- optional userInstruction

Output:
- structured reminder draft result

Do not expose raw provider payload format to frontend components.

---

## Logging and Observability
Log enough to debug failures, but do not log secrets carelessly.

Safe things to log:
- provider label
- model name
- generation duration
- validation success/failure
- invoice id
- user id
- retry attempts

Do not log:
- raw API key
- sensitive secrets
- unnecessary full confidential payloads in production

---

## V1 Anti-Patterns to Avoid
Do not build AI integration like this:
- prompt created entirely in frontend
- API key exposed client-side
- no history awareness
- one generic prompt for every situation
- free-form unvalidated text output
- no ownership check before generation
- no schema validation
- no draft persistence
- no event logging
- auto-send email behavior

---

## Final Agent Instruction
Implement AI integration for ChaseFree AI V1 as a structured, server-side, OpenAI-compatible reminder generation system.

The AI must:
- use structured invoice context
- use recent reminder history
- use client relationship context when available
- follow a strict system prompt
- return structured JSON
- generate concise, professional reminder drafts
- stay human-in-the-loop
- never act blindly from a button press alone

The AI layer must be:
- provider-agnostic
- fast
- predictable
- safe
- easy to extend later
- tightly integrated with invoice history and reminder context