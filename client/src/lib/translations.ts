export type TranslationKey = 'welcome' | 'share-advice' | 'connect-contractors';

export type LocaleStrings = Record<TranslationKey, string>;

const translations: Record<string, LocaleStrings> = {
  'en-US': {
    welcome: 'Exchange Leads. Grow Together.',
    'share-advice': 'Share advice with the global builder community.',
    'connect-contractors': 'Connect with contractors in your region and beyond.',
  },
  'pt-BR': {
    welcome: 'Compartilhe projetos. Cresçam juntos.',
    'share-advice': 'Compartilhe conselhos com a comunidade global de construtores.',
    'connect-contractors': 'Conecte-se com empreiteiros na sua região e além.',
  },
  'zh-CN': {
    welcome: '共享项目，共同成长。',
    'share-advice': '与全球建筑社区分享建议。',
    'connect-contractors': '与本地及海外承包商建立联系。',
  },
  'ar-EG': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    'share-advice': 'شارك النصائح مع مجتمع البنّائين العالمي.',
    'connect-contractors': 'تواصل مع المقاولين في منطقتك وحول العالم.',
  },
  'id-ID': {
    welcome: 'Tukar proyek. Tumbuh bersama.',
    'share-advice': 'Bagikan saran dengan komunitas kontraktor global.',
    'connect-contractors': 'Terhubung dengan kontraktor di wilayah Anda dan sekitarnya.',
  },
  'ja-JP': {
    welcome: '案件を共有し、ともに成長しましょう。',
    'share-advice': '世界中の建設コミュニティと知見を共有しましょう。',
    'connect-contractors': '国内外の建設パートナーとつながりましょう。',
  },
  'ar-KW': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    'share-advice': 'شارك النصائح مع مجتمع البنّائين العالمي.',
    'connect-contractors': 'تواصل مع المقاولين في الكويت وخارجها.',
  },
  'ar-OM': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    'share-advice': 'شارك النصائح مع مجتمع البنّائين العالمي.',
    'connect-contractors': 'تواصل مع المقاولين في منطقتك وخارجها.',
  },
  'es-PA': {
    welcome: 'Comparte proyectos. Crezcan juntos.',
    'share-advice': 'Comparte consejos con la comunidad global de constructores.',
    'connect-contractors': 'Conéctate con contratistas en tu región y más allá.',
  },
  'ar-QA': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    'share-advice': 'شارك النصائح مع مجتمع البنّائين العالمي.',
    'connect-contractors': 'تواصل مع المقاولين في قطر وخارجها.',
  },
  'ar-SA': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    'share-advice': 'شارك النصائح مع مجتمع البنّائين العالمي.',
    'connect-contractors': 'تواصل مع المقاولين في المملكة وخارجها.',
  },
  'sl-SI': {
    welcome: 'Delite projekte. Rastite skupaj.',
    'share-advice': 'Delite nasvete z globalno skupnostjo gradbenikov.',
    'connect-contractors': 'Povežite se s strokovnjaki doma in v tujini.',
  },
  'th-TH': {
    welcome: 'แบ่งปันโปรเจ็กต์ เติบโตไปด้วยกัน',
    'share-advice': 'แบ่งปันคำแนะนำกับชุมชนผู้รับเหมาทั่วโลก',
    'connect-contractors': 'เชื่อมต่อกับผู้รับเหมาทั้งในและต่างประเทศ',
  },
  'tr-TR': {
    welcome: 'Projeleri paylaşın. Birlikte büyüyün.',
    'share-advice': 'Küresel yüklenici topluluğuyla önerilerinizi paylaşın.',
    'connect-contractors': 'Bölgenizdeki ve dünyadaki müteahhitlerle bağlantı kurun.',
  },
  'ar-AE': {
    welcome: 'تبادل المشاريع. انموا معًا.',
    'share-advice': 'شارك النصائح مع مجتمع البنّائين العالمي.',
    'connect-contractors': 'تواصل مع المقاولين في الإمارات وخارجها.',
  },
  'default': {
    welcome: 'Exchange Leads. Grow Together.',
    'share-advice': 'Share advice with the global builder community.',
    'connect-contractors': 'Connect with contractors in your region and beyond.',
  },
};

export const getTranslationsForLocale = (locale: string): LocaleStrings => {
  return translations[locale] ?? translations[locale.split('-')[0] ?? ''] ?? translations.default;
};
