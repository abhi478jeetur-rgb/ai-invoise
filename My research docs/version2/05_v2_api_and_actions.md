# Version 2: API & Server Actions

Version 2 के फ़ीचर्स के लिए हमें कुछ नए Server Actions बनाने होंगे और पुरानों को अपडेट करना होगा।

## 1. Onboarding API (`/lib/profile/actions.ts`)
- **Action:** `updateUserOnboardingAction(data: OnboardingData)`
- **पैरामीटर्स:** नाम, प्रोफेशन, प्रॉब्लम, सोर्स।
- **रिटर्न:** Success (boolean), Error message.
- **रूल:** यह Action `profiles` टेबल को अपडेट करेगा और Session को रिफ्रेश करेगा।

## 2. Client API (`/lib/clients/actions.ts`)
- **Action:** `createClientInlineAction(data: ClientData)`
- **फंक्शन:** यह पहले से मौजूद `createClientAction` का ही इस्तेमाल कर सकता है, लेकिन इसे इस तरह हैंडल करना होगा कि यह फॉर्म के बीच में बिना पेज रिफ्रेश किए काम करे (React useTransition या Server Action के ज़रिए) और नया बना हुआ Client ID तुरंत रिटर्न करे।

## 3. Invoice API (`/lib/invoices/actions.ts`)
- **Action:** `updateInvoiceStatusAction(invoiceId: string, status: string)`
- **फंक्शन:** किसी इनवॉइस को 'Paused' या 'Promised to Pay' मार्क करने के लिए। 
- **Action:** `updateInvoiceAmountPaidAction(invoiceId: string, amountPaid: number)`
- **फंक्शन:** पार्शियल पेमेंट (आधा पेमेंट) को सेव करने के लिए।

## 4. Invoice Number Generation
- **Action:** `getNextInvoiceNumberAction()`
- **फंक्शन:** यह डेटाबेस में यूज़र के सबसे ताज़ा (latest) इनवॉइस को देखेगा और अगला नंबर (जैसे 'INV-008' के बाद 'INV-009') रिटर्न करेगा।
