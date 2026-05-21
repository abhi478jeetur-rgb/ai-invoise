# Version 2: Features & Priority List (Implementation Roadmap)

यह दस्तावेज़ (document) उन सभी फ़ीचर्स को क्रमबद्ध (Sequential) तरीके से परिभाषित करता है जिन्हें हम वर्जन 2 में बिल्ड करेंगे। 
हर फ़ीचर यूज़र के किसी न किसी 'Pain Point' को सॉल्व करेगा। 

हम इन फ़ीचर्स को बिल्कुल इसी क्रम (Top to Bottom) में इम्प्लीमेंट करेंगे ताकि कोड में कोई रुकावट या कॉम्प्लेक्सिटी न आए।

---

## 🚀 प्राथमिकता 1: The First-Time User Experience (Onboarding Journey)
**1. Onboarding Survey (Multi-step Modal)**
- **समस्या:** हमें यूज़र के बारे में जानकारी नहीं मिलती (वह कौन है, उसे क्या चाहिए), जिससे एंगेजमेंट कम होती है।
- **समाधान:** साइनअप के तुरंत बाद एक मल्टी-स्टेप पॉप-अप (Stepper के साथ)। 
  - स्टेप 1: नाम (Mandatory)। 
  - स्टेप 2: प्रोफेशन और पिछली इनवॉइसिंग समस्या (Skippable)। 
  - स्टेप 3: हमारे बारे में कहाँ से पता चला (Skippable)।

**2. Interactive Product Tour (Guided Walkthrough)**
- **समस्या:** सर्वे के बाद यूज़र को पता नहीं होता कि कौन सी चीज़ कहाँ है।
- **समाधान:** एक टूलटिप-बेस्ड पॉप-अप गाइड जो स्क्रीन पर हाइलाइट करके बताए कि 'Invoices यहाँ से बनाएँ' और 'Clients यहाँ जोड़ें'।

**3. Empty State & "Quick Start" Dashboard Banner**
- **समस्या:** नया यूज़र खाली डैशबोर्ड देखकर कन्फ्यूज़ हो जाता है।
- **समाधान:** एक सिंपल 3-स्टेप बैनर (Add Client -> Create Invoice -> Chase Payment) और डमी (Demo) डेटा का विकल्प देना।

**4. Auto-Generate Invoice Numbers**
- **समस्या:** इनवॉइस नंबर बार-बार सोचना पड़ता है।
- **समाधान:** सिस्टम अपने आप (INV-001, INV-002) सीक्वेंस जेनरेट करेगा।

**5. Inline Client Creation (Modal/Dropdown)**
- **समस्या:** इनवॉइस बनाते समय नए क्लाइंट को जोड़ने के लिए पेज छोड़ना पड़ता है।
- **समाधान:** Invoices पेज के 'New Invoice' फॉर्म के अंदर ही `+ Add New Client` का बटन देना।

---

## 🚀 प्राथमिकता 2: Reducing Friction in Core Workflow
**6. API Key Setup Helper / Simplified UI**
- **समस्या:** API Key सेटअप करना डरावना लगता है।
- **समाधान:** Settings पेज पर एक साफ़ 'How to get your free key in 1 min' वीडियो/लिंक या टूलटिप देना।

**7. Direct Email Integration ("Open in Gmail")**
- **समस्या:** ईमेल को कॉपी-पेस्ट करना पड़ता है।
- **समाधान:** AI द्वारा जनरेट किए गए ड्राफ्ट के नीचे `mailto:` का इस्तेमाल करके एक बटन देना, जो सीधे Gmail/Outlook खोल दे।

---

## 🚀 प्राथमिकता 3: Professional Flexibility & Status Control
**8. Flexible Payment Terms (Net-30 / Net-60 Dropdown)**
- **समस्या:** कॉर्पोरेट क्लाइंट्स के लिए तारीख मैन्युअली गिननी पड़ती है।
- **समाधान:** Due Date में एक ड्रॉपडाउन देना (Due on Receipt, Net-15, Net-30, Net-60)।

**9. Advanced Invoice Statuses ("Promised to Pay", "Partial Payment")**
- **समस्या:** अगर क्लाइंट ने वादा कर दिया है, तो भी इनवॉइस 'Overdue' ही दिखता है।
- **समाधान:** स्टेटस को 'Pause' करने या 'Promised to Pay' मार्क करने का विकल्प देना।

**10. "Who to Chase Today" Focused View**
- **समस्या:** बहुत सारे लाल इनवॉइस देखकर डर लगता है।
- **समाधान:** डैशबोर्ड पर एक साफ सेक्शन बनाना जो सिर्फ उन्हें दिखाए जिन्हें *आज* रिमाइंडर भेजना ज़रूरी है।
