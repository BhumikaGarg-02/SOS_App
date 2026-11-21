export interface HelplineItem {
  nameEn: string;
  nameHi: string;
  number: string;
  telLink?: string; // only for user-tapped links, never 112/100
  descEn: string;
  descHi: string;
}

export interface SahayataCardContent {
  id: string;
  titleEn: string;
  titleHi: string;
  badgeEn?: string;
  badgeHi?: string;
  helplines?: HelplineItem[];
  pointsEn: string[];
  pointsHi: string[];
  footnoteEn?: string;
  footnoteHi?: string;
}

export const DISCLAIMER_EN = 'General information, not legal advice.';
export const DISCLAIMER_HI = 'सामान्य जानकारी, कानूनी सलाह नहीं।';

export const legalCards: SahayataCardContent[] = [
  {
    id: 'helplines',
    titleEn: 'Emergency & Support Helplines',
    titleHi: 'आपातकालीन एवं सहायता हेल्पलाइन',
    badgeEn: 'Direct Support',
    badgeHi: 'सीधी सहायता',
    helplines: [
      {
        nameEn: 'National Commission for Women (NCW)',
        nameHi: 'राष्ट्रीय महिला आयोग (NCW)',
        number: '7827170170',
        telLink: 'tel:7827170170',
        descEn: '24/7 national helpline for women facing domestic violence and abuse.',
        descHi: 'घरेलू हिंसा और उत्पीड़न से पीड़ित महिलाओं के लिए 24/7 राष्ट्रीय हेल्पलाइन।',
      },
      {
        nameEn: 'Women Helpline (Pan-India)',
        nameHi: 'महिला हेल्पलाइन (अखिल भारतीय)',
        number: '181',
        telLink: 'tel:181',
        descEn: 'Toll-free 24/7 emergency response and referral support for women.',
        descHi: 'महिलाओं के लिए टोल-फ्री 24/7 आपातकालीन प्रतिक्रिया एवं परामर्श सहायता।',
      },
      {
        nameEn: 'Sakhi One-Stop Centres',
        nameHi: 'सखी वन-स्टॉप सेंटर',
        number: '181',
        telLink: 'tel:181',
        descEn:
          'Integrated support, medical aid, legal aid, counselling, and temporary shelter under one roof. Reachable via 181.',
        descHi:
          'एक ही छत के नीचे चिकित्सा सहायता, कानूनी सहायता, मनोवैज्ञानिक परामर्श और अस्थायी आश्रय। 181 के माध्यम से संपर्क करें।',
      },
    ],
    pointsEn: [
      'Tap any number to copy it to your clipboard.',
      'Tap the phone icon to open your dialer (the app will never auto-dial).',
    ],
    pointsHi: [
      'नंबर कॉपी करने के लिए उस पर टैप करें।',
      'फ़ोन डायलर खोलने के लिए कॉल आइकन पर टैप करें (ऐप कभी अपने-आप कॉल नहीं करेगा)।',
    ],
    footnoteEn: 'Verify numbers before relying on them.',
    footnoteHi: 'इस्तेमाल करने से पहले नंबर सत्यापित करें।',
  },
  {
    id: 'pwdva',
    titleEn: 'Your Rights under PWDVA 2005',
    titleHi: 'घरेलू हिंसा संरक्षण कानून (PWDVA 2005) के तहत अधिकार',
    badgeEn: 'Domestic Violence Act',
    badgeHi: 'घरेलू हिंसा अधिनियम',
    pointsEn: [
      'Who is covered: Any woman who is or was in a domestic relationship with the respondent, living together in a shared household.',
      'What counts as domestic violence: Physical abuse, sexual abuse, verbal and emotional abuse (insults, humiliation), and economic abuse (denying financial resources or stridhan).',
      'Right to reside in shared household: You have a legal right to reside in the shared household. You cannot be evicted without due process of law.',
      'Protection Orders: The Magistrate can pass an order restraining the respondent from entering your workplace or contacting you.',
      'Monetary Relief & Maintenance: You can claim expenses incurred for medical treatment, loss of earnings, and monthly maintenance.',
      'Custody Orders: The Magistrate may grant temporary custody of children to the aggrieved woman.',
      'Role of Protection Officers: Appointed in every district to prepare a Domestic Incident Report (DIR), help you file applications, and arrange free shelter or legal aid.',
    ],
    pointsHi: [
      'किसे संरक्षण प्राप्त है: कोई भी महिला जो प्रतिवादी के साथ घरेलू रिश्ते या साझे घर में रही हो।',
      'घरेलू हिंसा में क्या शामिल है: शारीरिक हिंसा, यौन उत्पीड़न, मौखिक व भावनात्मक प्रताड़ना (अपमान, ताने), और आर्थिक प्रताड़ना (पैसे रोकना या स्त्रीधन छीनना)।',
      'साझे घर में रहने का अधिकार: आपको साझे घर में रहने का कानूनी अधिकार है। कानून के बिना कोई आपको निकाल नहीं सकता।',
      'संरक्षण आदेश (Protection Order): मजिस्ट्रेट प्रतिवादी को आपसे संपर्क करने या आपके कार्यस्थल पर आने से रोक सकते हैं।',
      'आर्थिक राहत एवं गुजारा भत्ता: चिकित्सा खर्च, आय की हानि की भरपाई और मासिक गुजारा भत्ता की मांग की जा सकती है।',
      'बच्चों की अभिरक्षा (Custody Order): मजिस्ट्रेट बच्चों की अस्थायी देखरेख महिला को सौंप सकते हैं।',
      'संरक्षण अधिकारी (Protection Officer): हर जिले में नियुक्त अधिकारी जो घटना रिपोर्ट (DIR) दर्ज करते हैं और मुफ्त विधिक सहायता दिलवाते हैं।',
    ],
  },
  {
    id: 'posh',
    titleEn: 'Workplace Safety: POSH Act 2013',
    titleHi: 'कार्यस्थल पर सुरक्षा: पॉश कानून (POSH Act 2013)',
    badgeEn: 'Workplace Rights',
    badgeHi: 'कार्यस्थल अधिकार',
    pointsEn: [
      'What counts as sexual harassment: Unwelcome physical contact, advances, sexually colored remarks, showing pornography, or any unwelcome physical, verbal or non-verbal conduct of sexual nature.',
      'Internal Committee (IC): Mandatory for every workplace having 10 or more employees, presided over by a senior woman employee.',
      'Local Committee (LC): Formed in every district for organizations with fewer than 10 employees or where the complaint is against the employer.',
      'Complaint window: Complaints must be submitted in writing within 3 months of the incident, extendable by another 3 months if justifiable reasons prevented earlier filing.',
      'Interim Relief: During inquiry, the IC can recommend transfer of the complainant or respondent, or grant paid leave up to 3 months.',
      'Strict Confidentiality: The law strictly prohibits disclosing the identity or address of the aggrieved woman, respondent, or witnesses.',
    ],
    pointsHi: [
      'यौन उत्पीड़न में क्या शामिल है: अवांछित शारीरिक स्पर्श, अनुचित मांग, अश्लील फब्तियां, अश्लील सामग्री दिखाना, या कोई अन्य अवांछित यौन व्यवहार।',
      'आंतरिक समिति (IC): 10 या अधिक कर्मचारियों वाले हर कार्यस्थल पर आंतरिक समिति का गठन अनिवार्य है, जिसकी अध्यक्षता वरिष्ठ महिला कर्मचारी करती हैं।',
      'स्थानीय समिति (LC): जहां 10 से कम कर्मचारी हों या शिकायत नियोक्ता के खिलाफ हो, वहां जिला स्तर की स्थानीय समिति में शिकायत होती है।',
      'शिकायत की समय-सीमा: घटना के 3 महीने के भीतर लिखित शिकायत दर्ज करानी होती है (उचित कारण होने पर 3 महीने और बढ़ाया जा सकता है)।',
      'अंतरिम राहत: जांच चलने के दौरान स्थानांतरण या 3 महीने तक की सवैतनिक छुट्टी दी जा सकती है।',
      'सख्त गोपनीयता: पीड़िता, आरोपी या गवाहों की पहचान सार्वजनिक करना कानूनन अपराध है।',
    ],
  },
  {
    id: 'evidence',
    titleEn: 'Valid Digital Evidence Checklist',
    titleHi: 'वैध डिजिटल साक्ष्य मार्गदर्शिका',
    badgeEn: 'Legal Evidence',
    badgeHi: 'कानूनी साक्ष्य',
    pointsEn: [
      'Keep originals unedited: Never edit, crop, or apply filters to photos, screenshots, or voice recordings.',
      'Record context: Always note exact date, time, location, and who else was present when the incident occurred.',
      'Keep a continuous log: Maintain a contemporaneous diary or log rather than isolated sporadic notes.',
      'Preserve metadata: Screenshots should clearly show the sender name, phone number, and exact timestamp.',
      'Do not delete messages: Even abusive or harassing messages should be preserved in context without selective clearing.',
      'Tamper-evident seal: Maintain cryptographic SHA-256 hash records to prove records have not been altered after creation.',
      'BSA 2023 Section 63 Certificate: Under the Bharatiya Sakshya Adhiniyam, 2023, electronic evidence in Indian courts may require an electronic certificate certifying device custody and system integrity.',
      'Free Legal Aid: You can obtain free legal representation through the District Legal Services Authority (DLSA) or National Legal Services Authority (NALSA).',
    ],
    pointsHi: [
      'मूल साक्ष्य सुरक्षित रखें: फोटो, ऑडियो या स्क्रीनशॉट में कोई काट-छांट या फ़िल्टर न लगाएं।',
      'तारीख और समय नोट करें: हर घटना की सही तारीख, समय, स्थान और गवाहों के नाम लिख कर रखें।',
      'लगातार लॉग बनाएं: घटनाओं का निरंतर रिकॉर्ड बनाएं, न कि केवल बिखरी हुई बातें।',
      'स्क्रीनशॉट में विवरण रखें: स्क्रीनशॉट में भेजने वाले का नंबर, नाम और समय साफ दिखना चाहिए।',
      'मैसेज डिलीट न करें: अपमानजनक या धमकी भरे संदेशों को बातचीत के संदर्भ में ही सहेजें।',
      'अपरिवर्तनीय सील (SHA-256): रिकॉर्ड बनने के बाद उसमें बदलाव न होने का प्रमाण रखने के लिए डिजिटल हैश सुरक्षित रखें।',
      'भारतीय साक्ष्य अधिनियम 2023 (BSA धारा 63): भारतीय अदालतों में डिजिटल साक्ष्य पेश करते समय धारा 63 का प्रमाणपत्र आवश्यक हो सकता है।',
      'मुफ्त कानूनी सहायता: जिला विधिक सेवा प्राधिकरण (DLSA) या NALSA के माध्यम से मुफ्त वकील प्राप्त कर सकते हैं।',
    ],
  },
  {
    id: 'danger',
    titleEn: 'Immediate Danger Protocol',
    titleHi: 'तात्कालिक खतरे की स्थिति में क्या करें',
    badgeEn: 'Safety Protocol',
    badgeHi: 'सुरक्षा नियम',
    pointsEn: [
      'Move to a safe place: Prioritize immediate physical safety by moving near other people, neighbours, or open public spaces.',
      'Contact a Trusted Guardian: Alert your pre-verified personal contacts immediately.',
      'Call emergency numbers yourself if you can: Dial 112 for emergency police response or 181 for the women helpline directly from your phone.',
      'Important: This application is a client-side documentation tool. It will NEVER auto-dial emergency numbers, dial 112, or dispatch alerts to police on its own.',
    ],
    pointsHi: [
      'सुरक्षित स्थान पर जाएँ: सबसे पहले अपनी जान की सुरक्षा करें। पड़ोसियों, परिचितों या सार्वजनिक स्थान की ओर जाएं।',
      'भरोसेमंद संरक्षकों को सूचित करें: अपने चुने हुए विश्वस्त संपर्कों को तुरंत संदेश दें।',
      'स्वयं आपातकालीन नंबर डायल करें: यदि संभव हो तो स्वयं 112 या 181 डायल करें।',
      'महत्वपूर्ण: यह ऐप केवल साक्ष्य सहेजने का उपकरण है। यह कभी भी अपने-आप 112 डायल नहीं करेगा और न ही पुलिस को संपर्क करेगा।',
    ],
  },
];
