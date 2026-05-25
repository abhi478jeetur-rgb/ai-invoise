# ChaseFree AI - Comprehensive Product Requirements Document (PRD)

## 1. Project Overview (प्रोजेक्ट का विवरण)
**ChaseFree AI** एक AI-फर्स्ट इनवॉइसिंग और पेमेंट फॉलो-अप असिस्टेंट है जो फ्रीलांसर्स और छोटी एजेंसियों के लिए बनाया गया है। यह लेट पेमेंट्स को ट्रैक करता है और AI का उपयोग करके परफेक्ट टोन में रिमाइंडर ईमेल ड्राफ्ट करता है।

## 2. Recent Updates (सबसे आखिरी काम)
प्रोजेक्ट में सबसे आखिरी काम **Version 3 (v3)** के कोर फीचर्स और एन्हांसमेंट्स पर किया गया था। इसमें शामिल है:
1. **Review & Send Modal Enhancements:** अमाउंट और करेंसी को रिव्यू और सेंड मोडल में डिस्प्ले करने का फीचर जोड़ा गया।
2. **AI Knowledge Base with Document Uploads:** यूज़र्स अब अपने बिज़नेस कॉन्टेक्स्ट के लिए डॉक्यूमेंट्स अपलोड कर सकते हैं, जिसे AI इनवॉइस रिमाइंडर जेनरेट करते समय रेफ़र कर सकता है।
3. **Live Invoice Preview (react-pdf):** Puppeteer को हटाकर `@react-pdf/renderer` का इस्तेमाल किया गया ताकि इनवॉइस बनाते समय लाइव PDF प्रीव्यू (Two-pane layout) देखा जा सके।
4. **Business Profile & Settings:** PO Number, Currency Dropdown, और AI नॉलेज बेस इंजेक्शन जैसी सेटिंग्स जोड़ी गईं।
5. **Multiple Line Items Support:** एक ही इनवॉइस में मल्टीपल सर्विसेज़/आइटम्स ऐड करने, डिलीट करने और टोटल अमाउंट कैलकुलेट करने का डायनामिक फीचर जोड़ा गया (डेटाबेस में `line_items` JSONB कॉलम का इस्तेमाल करके)।

## 3. Core Functionalities (अब तक बने फीचर्स)

### 3.1. Urgency-Aware Dashboard
- **Outstanding & Overdue Balances:** डैशबोर्ड पर रियल-टाइम स्नैपशॉट जो अलग-अलग करेंसी (जैसे ₹ और $) के हिसाब से ग्रुप किया गया है।
- **Due This Week:** अगले 7 दिनों में ड्यू होने वाले इनवॉइस की लिस्ट ताकि कैश फ्लो मैनेज किया जा सके।
- **Recent Invoices:** हाल ही के इनवॉइस और उनके पेमेंट स्टेटस की रिएक्टिव लिस्ट।

### 3.2. "Who to Chase Today" Panel
- एक एल्गोरिदम-बेस्ड प्रायोरिटाइज़ेशन पैनल जो उन अनपेड और ओवरड्यू इनवॉइस को हाईलाइट करता है जिनपर तुरंत एक्शन लेने की ज़रुरत है।
- इसमें इनवॉइस नंबर, ड्यू डेट, अमाउंट, क्लाइंट का नाम और कितने दिन से ओवरड्यू है, यह जानकारी दिखती है।
- हर इनवॉइस के सामने सीधा **"Generate Reminder"** बटन उपलब्ध है।

### 3.3. Context-Aware AI Reminder Generator
- **AI Integration:** OpenAI-compatible API (जैसे NVIDIA AI Foundation, Meta Llama 3.1 8B Instruct या Groq) का इस्तेमाल।
- **4 Relationship-Safe Presets:** 
  - *Friendly Nudge:* एक वार्म और पोलाइट रिमाइंडर।
  - *Professional:* सीधा और बिज़नेस के लिए उपयुक्त।
  - *Firm:* एक स्पष्ट पेमेंट डेडलाइन के साथ।
  - *Final Notice:* अंतिम चेतावनी।
- **Zustand-Powered Modal UI:** ड्राफ्ट का रियल-टाइम प्रीव्यू, कॉपी टू क्लिपबोर्ड और "Mark as Sent" का फीचर।

### 3.4. Activity Logs & Timeline
- हर इनवॉइस के लिए जेनरेटेड ड्राफ्ट, क्लिपबोर्ड कॉपी, स्टेटस चेंज और पेमेंट इवेंट को क्रोनोलॉजिकल ऑर्डर में ट्रैक करने के लिए एक टाइमलाइन।

### 3.5. Smart PDF Builder & Invoicing
- **Two-Pane Layout:** बाईं ओर इनवॉइस फॉर्म और दाईं ओर लाइव PDF प्रीव्यू।
- डायनामिक आइटम्स और टैक्स/डिस्काउंट कैलकुलेशन।

## 4. Architecture & Technology Stack (आर्किटेक्चर और टेक स्टैक)

### 4.1. Frontend & UI
- **Framework:** Next.js 16 (App Router, Server Actions, React Server Components)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4), CSS Variables
- **UI Components:** shadcn/ui primitives, lucide-react
- **State Management:** Zustand (क्लाइंट-साइड स्टेट और Modal UI के लिए)

### 4.2. Backend & Database
- **Database & Auth:** Supabase (PostgreSQL, Row-Level Security, Supabase Auth)
- **Database Schema:** 
  - Profiles, Invoices, Clients टेबल्स। 
  - `line_items` के लिए JSONB डेटाटाइप का इस्तेमाल।
- **Storage:** Supabase Storage (AI Knowledge Base और PDF जनरेशन के लिए पब्लिक बकेट्स)।

### 4.3. External APIs & AI
- **LLM Abstraction:** ऐप सेटिंग्स में कस्टम AI प्रोवाइडर (Base URL, Model Name, API Key) सेटअप करने की सुविधा ताकि किसी भी OpenAI-compatible API का उपयोग किया जा सके।

## 5. Security, Validation & Testing
- **Validation:** Zod स्कीमा वैलिडेशन (`react-hook-form` के साथ)।
- **E2E Testing:** Playwright के ज़रिए हेडेड E2E टेस्ट्स (`test_1a_auth_dashboard`, `e2e-verify`) जो पूरी फ्लो (लॉगिन से लेकर रिमाइंडर ड्राफ्ट करने तक) को ऑटोमेटेड तरीके से वैलिडेट करते हैं।
- **Row-Level Security (RLS):** Supabase में डेटा प्राइवेसी और ओनरशिप एन्श्योर करने के लिए RLS पॉलिसीज लागू हैं, जिससे हर यूजर को सिर्फ अपना डेटा ही दिखाई दे।
