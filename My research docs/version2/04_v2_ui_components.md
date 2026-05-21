# Version 2: UI/UX Component Guidelines

**🚨 CRITICAL RULE FOR AI:** 
जितनी भी चीजें UI में बनेंगी, वे सभी **Shadcn/ui Library** से ही आनी चाहिए। AI कोई भी कस्टम (Custom) UI कॉम्पोनेन्ट खुद से स्क्रैच (Scratch) से नहीं बनाएगा। हर कॉम्पोनेन्ट हमारे मौजूदा प्रीमियम 'Glassmorphism' थीम और Tailwind कलर्स को फॉलो करेगा।

## 1. Onboarding Survey Modal (Stepper)
- **UI पैटर्न:** Shadcn/ui के `Dialog` या `Card` का इस्तेमाल करें जिसका बैकग्राउंड ब्लर (backdrop-blur-sm) हो।
- **कम्पोनेंट्स:**
  - प्रोग्रेस बार के लिए Shadcn/ui का `Progress` कम्पोनेन्ट इस्तेमाल करें।
  - 'Next' और 'Skip' बटन के लिए Shadcn/ui का `Button` (ghost/default variant) इस्तेमाल करें।
  - इनपुट्स के लिए Shadcn/ui का `Input` और `Select` इस्तेमाल करें।

## 2. Interactive Product Tour (Tooltip Guide)
- **UI पैटर्न:** Shadcn/ui के `Popover` या `Tooltip` का इस्तेमाल करें जो स्क्रीन के किसी खास हिस्से को हाईलाइट करे। 

## 3. Inline Client Modal
- **UI पैटर्न:** Shadcn/ui का `Sheet` (Slide-over) या `Dialog` (Modal) इस्तेमाल करें ताकि पेज रिफ्रेश न हो।
- **एक्सपीरियंस:** फॉर्म में Shadcn/ui का `Form` और `zod` वैलिडेशन इस्तेमाल करें।

## 4. Dashboard "Quick Start" Banner
- **UI पैटर्न:** Shadcn/ui का `Card` इस्तेमाल करें जिसमें वाइब्रेंट (Vibrant) थीम हो।
