# Version 2: Database Schema Updates

चूँकि हम Version 2 में कुछ नए फ़ीचर्स जोड़ रहे हैं, इसलिए डेटाबेस (Supabase) में ये बदलाव (Migrations) करने होंगे:

## 1. User Profiles & Onboarding
जब यूज़र सर्वे भरेगा, तो उसकी जानकारी सेव करने के लिए `profiles` टेबल में कॉलम जोड़ने होंगे:
- `onboarding_completed` (boolean, default: false)
- `profession` (text, nullable)
- `primary_problem` (text, nullable)
- `discovery_source` (text, nullable)

## 2. Invoices Table Updates
इनवॉइस के नए स्टेटस और सेटिंग्स के लिए `invoices` टेबल में बदलाव:
- `status` ENUM में नए विकल्प: 'promised', 'paused', 'partial'
- `amount_paid` (numeric, default: 0) - पार्शियल पेमेंट के लिए
- `payment_terms` (text, default: 'receipt') - Net-30, Net-60 को ट्रैक करने के लिए
