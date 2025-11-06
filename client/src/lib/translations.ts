export type TranslationKey = 'welcome' | 'share-advice' | 'connect-contractors';

export type LocaleStrings = Record<TranslationKey, string>;

const translations: Record<string, LocaleStrings> = {
  'en-US': {
    welcome: 'Exchange Leads. Grow Together.',
    shareAdvice: 'Share advice with the global builder community.',
    connectContractors: 'Connect with contractors in your region and beyond.',
  },
  'pt-BR': {
    welcome: 'Compartilhe projetos. Cresçam juntos.',
    shareAdvice: 'Compartilhe conselhos com a comunidade global de construtores.',
    connectContractors: 'Conecte-se com empreiteiros na sua região e além.',
  },
  'zh-CN': {
    welcome: '共享项目，共同成长。',
    shareAdvice: '与全球建筑社区分享建议。',
    connectContractors: '与本地及海外承包商建立联系。',
  },
  'ar-EG': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    shareAdvice: 'شارك النصائح مع مجتمع البنّائين العالمي.',
    connectContractors: 'تواصل مع المقاولين في منطقتك وحول العالم.',
  },
  'id-ID': {
    welcome: 'Tukar proyek. Tumbuh bersama.',
    shareAdvice: 'Bagikan saran dengan komunitas kontraktor global.',
    connectContractors: 'Terhubung dengan kontraktor di wilayah Anda dan sekitarnya.',
  },
  'ja-JP': {
    welcome: '案件を共有し、ともに成長しましょう。',
    shareAdvice: '世界中の建設コミュニティと知見を共有しましょう。',
    connectContractors: '国内外の建設パートナーとつながりましょう。',
  },
  'ar-KW': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    shareAdvice: 'شارك النصائح مع مجتمع البنّائين العالمي.',
    connectContractors: 'تواصل مع المقاولين في الكويت وخارجها.',
  },
  'ar-OM': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    shareAdvice: 'شارك النصائح مع مجتمع البنّائين العالمي.',
    connectContractors: 'تواصل مع المقاولين في منطقتك وخارجها.',
  },
  'es-PA': {
    welcome: 'Comparte proyectos. Crezcan juntos.',
    shareAdvice: 'Comparte consejos con la comunidad global de constructores.',
    connectContractors: 'Conéctate con contratistas en tu región y más allá.',
  },
  'ar-QA': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    shareAdvice: 'شارك النصائح مع مجتمع البنّائين العالمي.',
    connectContractors: 'تواصل مع المقاولين في قطر وخارجها.',
  },
  'ar-SA': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    shareAdvice: 'شارك النصائح مع مجتمع البنّائين العالمي.',
    connectContractors: 'تواصل مع المقاولين في المملكة وخارجها.',
  },
  'sl-SI': {
    welcome: 'Delite projekte. Rastite skupaj.',
    shareAdvice: 'Delite nasvete z globalno skupnostjo gradbenikov.',
    connectContractors: 'Povežite se s strokovnjaki doma in v tujini.',
  },
  'th-TH': {
    welcome: 'แบ่งปันโปรเจ็กต์ เติบโตไปด้วยกัน',
    shareAdvice: 'แบ่งปันคำแนะนำกับชุมชนผู้รับเหมาทั่วโลก',
    connectContractors: 'เชื่อมต่อกับผู้รับเหมาทั้งในและต่างประเทศ',
  },
  'tr-TR': {
    welcome: 'Projeleri paylaşın. Birlikte büyüyün.',
    shareAdvice: 'Küresel yüklenici topluluğuyla önerilerinizi paylaşın.',
    connectContractors: 'Bölgenizdeki ve dünyadaki müteahhitlerle bağlantı kurun.',
  },
  'ar-AE': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    shareAdvice: 'شارك النصائح مع مجتمع البنّائين العالمي.',
    connectContractors: 'تواصل مع المقاولين في الإمارات وخارجها.',
  },
  'default': {
    welcome: 'Exchange Leads. Grow Together.',
    shareAdvice: 'Share advice with the global builder community.',
    connectContractors: 'Connect with contractors in your region and beyond.',
  },
};

export const getTranslationsForLocale = (locale: string): LocaleStrings => {
  return translations[locale] ?? translations[locale.split('-')[0] ?? ''] ?? translations.default;
};
