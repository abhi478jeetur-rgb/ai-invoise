export interface ReminderPromptContext {
  senderName: string;
  senderCompany: string;
  clientName: string;
  companyName: string;
  clientEmail: string | null;
  invoiceNumber: string;
  invoiceTitle: string | null;
  amount: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
  paymentLink: string | null;
  description: string | null;
  rulesSection: string;
  kbSection: string;
  reminderCount: number;
  tone: 'friendly' | 'professional' | 'firm' | 'final_notice';
  customInstructions?: string;
  styleInstruction?: string;
}

const TONE_DESCRIPTIONS: Record<string, string> = {
  friendly: 'Soft, warm, and polite. Assume the client simply forgot. Be understanding and gentle. Use casual professional language.',
  professional: 'Standard business-appropriate. Polite but clear about the outstanding payment. Neutral and courteous tone.',
  firm: 'Urgent and direct. Set clear expectations and a specific deadline. Professional but assertive. Convey seriousness.',
  final_notice: 'Extremely direct final warning. State this is the last notice before further action. Professional but unyielding. Create urgency.',
};

export function buildPaymentReminderPrompt(context: ReminderPromptContext): { system: string; user: string } {
  const {
    senderName,
    senderCompany,
    clientName,
    companyName,
    clientEmail,
    invoiceNumber,
    invoiceTitle,
    amount,
    currency,
    dueDate,
    daysOverdue,
    paymentLink,
    description,
    rulesSection,
    kbSection,
    reminderCount,
    tone,
    customInstructions,
    styleInstruction,
  } = context;

  const system = `You are ChaseFree AI, a highly empathetic yet highly effective professional communication expert specializing in writing payment follow-ups for business owners and freelancers. 
              
Your goal is to write natural, human-sounding emails that get invoices paid faster without ruining client relationships.

CRITICAL INSTRUCTIONS:
1. Speak 100% as the sender (business owner/freelancer) writing directly to the client. Never speak as an assistant.
2. Structure the email logically:
   - Appropriate salutation (e.g., "Hi [Client Name]", "Dear [Client Name]" depending on tone).
   - A clear opening explaining the status of the invoice.
   - Body showing invoice number, amount due, and due date clearly.
   - A direct, clean call-to-action (prominently referencing the payment link if provided).
   - Professional, warm sign-off (e.g., "Best regards,", "Thanks," followed by sender name).
3. Do not sound robotic, boilerplate, or over-formal unless the tone strictly demands it. Make the text sound fresh and tailored to the invoice details.
4. Output formatting: You MUST respond ONLY with a single JSON object in the exact schema below. Do not wrap it in markdown code blocks (\`\`\`json ... \`\`\`), do not write any pre-text or post-text. Escape double quotes inside the subject and body properly.
{"subject": "The email subject line", "body": "The full email body including salutations, paragraphs separated by double newlines \\n\\n, and sign-off. DO NOT include the subject line inside the body."}`;

  const user = `You are an expert email writer specializing in payment follow-up reminders for freelancers.

Generate a payment reminder email with the following context:

SENDER:
- Name: ${senderName}
${senderCompany ? `- Company: ${senderCompany}` : ''}

RECIPIENT:
- Client Name: ${clientName}
${companyName ? `- Company: ${companyName}` : ''}
${clientEmail ? `- Email: ${clientEmail}` : ''}

INVOICE DETAILS:
- Invoice Number: ${invoiceNumber}
${invoiceTitle ? `- Title: ${invoiceTitle}` : ''}
- Amount: ${currency} ${amount.toFixed(2)}
- Due Date: ${dueDate}
- Days ${daysOverdue > 0 ? 'Overdue' : 'Until Due'}: ${daysOverdue > 0 ? daysOverdue : Math.abs(daysOverdue)}
${paymentLink ? `- Payment Link: ${paymentLink}` : ''}
${description ? `- Description: ${description}` : ''}
${rulesSection}
TONE: ${tone}
Tone Guidelines: ${TONE_DESCRIPTIONS[tone]}

${reminderCount > 0 ? `This is reminder #${reminderCount + 1}. Previous reminders have already been sent.` : 'This is the first reminder for this invoice.'}
${customInstructions ? `\nCUSTOM INSTRUCTIONS FROM SENDER:\n${customInstructions}` : ''}
${styleInstruction ? `\nSTYLE: ${styleInstruction}` : ''}
${kbSection}

IMPORTANT RULES:
- Write as if you are ${senderName} sending to ${clientName}.
- Keep the email concise (3-5 short paragraphs max).
- Include the invoice number and amount clearly.
${paymentLink ? '- Include the payment link prominently.' : ''}
- Be human-sounding, not robotic.
- Do NOT include a subject line in the body text.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"subject": "Your subject line here", "body": "The full email body here"}`;

  return { system, user };
}

export async function callAIApi(
  baseUrl: string,
  modelName: string,
  apiKey: string,
  prompt: { system: string; user: string }
): Promise<{ subject: string; body: string }> {
  const normalizedUrl = baseUrl.replace(/\/+$/, '');
  const endpoint = `${normalizedUrl}/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: 0.4,
      max_tokens: 8000,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AI provider error (HTTP ${response.status}): ${errorText.slice(0, 200) || response.statusText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content?.trim() ?? '';

  let subject = 'Payment Reminder';
  let body = '';

  try {
    const cleanContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    let jsonStr = cleanContent;
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonStr);
    if (parsed.subject) subject = parsed.subject;
    if (parsed.body) body = parsed.body;
    else throw new Error('JSON parsed but missing body');
  } catch (e) {
    // If it fails to parse as JSON, we fallback, but log it properly in the calling code
    if (rawContent.includes('{') || rawContent.includes('}')) {
      body = 'We are following up regarding the outstanding invoice. Please let us know if you need any assistance.';
    } else {
      body = rawContent || 'Please find the payment reminder details enclosed.';
    }
    const err = new Error('Failed to parse AI response as JSON');
    (err as any).rawContent = rawContent;
    throw err;
  }

  return { subject, body };
}
