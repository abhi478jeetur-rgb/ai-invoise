# Version 2: Database Schema Updates & Future Proofing

चूँकि हम Version 2 में नए फ़ीचर्स ला रहे हैं और भविष्य (Version 3) की तैयारी कर रहे हैं, हमें डेटाबेस (Supabase) में ये ज़रूरी बदलाव (Migrations) करने होंगे:

## 1. User Profiles & Monetization (भविष्य की तैयारी)
जब यूज़र सर्वे भरेगा, तो उसकी जानकारी सेव करने के लिए `profiles` टेबल में ये कॉलम जुड़ेंगे:
- `onboarding_completed` (boolean, default: false)
- `profession` (text, nullable)
- `primary_problem` (text, nullable)
- `discovery_source` (text, nullable)
- **भविष्य की तैयारी (Monetization):** 
  - `credits_balance` (integer, default: 5) - Paid AI फीचर्स के लिए।
  - `stripe_customer_id` (text, nullable) - भविष्य में पेमेंट्स जोड़ने के लिए।

## 2. Invoices Table Updates (Status & Localization)
इनवॉइस के नए स्टेटस और सेटिंग्स के लिए `invoices` टेबल में बदलाव:
- `status` ENUM में नए विकल्प: 'promised', 'paused', 'partial'
- `amount_paid` (numeric, default: 0) - पार्शियल पेमेंट के लिए।
- `payment_terms` (text, default: 'receipt') - Net-30, Net-60 ट्रैक करने के लिए।
- **भविष्य की तैयारी (Analytics & Scale):**
  - `paid_at` (timestamp, nullable) - यह ट्रैक करने के लिए कि इनवॉइस असल में किस दिन पे हुआ (इससे हम एवरेज टाइम कैलकुलेट कर सकेंगे)।
  - `currency_code` (text, default: 'USD') - भविष्य में वर्ल्डवाइड यूज़र्स के लिए अलग-अलग करेंसी सपोर्ट करने के लिए।

## 3. Clients Table (Soft Deletes)
- **भविष्य की तैयारी (Safety):**
  - `is_deleted` (boolean, default: false) - अगर यूज़र गलती से कोई क्लाइंट डिलीट कर दे, तो हम उसे हमेशा के लिए डेटाबेस से नहीं हटाएंगे (Hard Delete नहीं करेंगे)। इससे यूज़र का डेटा सेफ रहेगा (Soft Delete)।
