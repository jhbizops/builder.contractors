export type GeoPageFaq = {
  question: string;
  answer: string;
};

type Highlight = {
  title: string;
  description: string;
};

type Step = {
  title: string;
  description: string;
};

type PricingTier = {
  name: string;
  priceLabel: string;
  description: string;
  features: string[];
};

type GeoPageContent = {
  slug: string;
  title: string;
  summary: string;
  keywords: string[];
  faqs: GeoPageFaq[];
  highlights?: Highlight[];
  steps?: Step[];
  tiers?: PricingTier[];
};

export const geoPages: Record<"home" | "about" | "howItWorks" | "faq" | "pricing", GeoPageContent> = {
  home: {
    slug: "/",
    title: "Builder.Contractors - Exchange Leads, Grow Together",
    summary:
      "Join the global network of builders and contractors sharing projects, exchanging work opportunities, and supporting each other's growth.",
    keywords: [
      "builder network",
      "contractor leads",
      "construction leads exchange",
      "global contractors",
      "construction network",
      "trade partners",
    ],
    faqs: [],
  },
  about: {
    slug: "/about",
    title: "About Builder.Contractors",
    summary:
      "Builder.Contractors is a private exchange for builders and contractors to share leads, build trusted partnerships, and grow across regions.",
    keywords: [
      "builder referral network",
      "contractor lead exchange",
      "trade partner marketplace",
      "multi-region builder network",
    ],
    highlights: [
      {
        title: "Built for verified trade teams",
        description: "Every profile represents a real company, so referrals stay professional and accountable.",
      },
      {
        title: "Designed for cross-region growth",
        description: "Share work with trusted partners when projects fall outside your service area.",
      },
      {
        title: "Security-first by default",
        description: "We protect customer information while helping you collaborate safely with peers.",
      },
    ],
    faqs: [
      {
        question: "Who can join Builder.Contractors?",
        answer: "Licensed builders, contractors, and verified trade businesses that want to exchange vetted leads and partnerships.",
      },
      {
        question: "Is this a public directory?",
        answer: "No. Profiles are private by default, and invitations are designed to keep work referrals controlled and trustworthy.",
      },
    ],
  },
  howItWorks: {
    slug: "/how-it-works",
    title: "How Builder.Contractors Works",
    summary: "A streamlined workflow to share, verify, and collaborate on projects in minutes.",
    keywords: [
      "how builder referrals work",
      "trade collaboration workflow",
      "contractor lead handoff",
      "verified builder matching",
    ],
    steps: [
      {
        title: "Create a trusted profile",
        description: "Highlight your service areas, specialties, and credentials so partners know when to loop you in.",
      },
      {
        title: "Share or receive leads",
        description: "Send projects to partners who match the scope, location, and trade requirements.",
      },
      {
        title: "Coordinate delivery",
        description: "Track handoffs, communicate inside the platform, and keep homeowners informed.",
      },
    ],
    faqs: [
      {
        question: "How fast can we get started?",
        answer: "Most teams can publish their profile and begin exchanging leads the same day.",
      },
      {
        question: "Do you support multi-region teams?",
        answer: "Yes. You can manage teams, territories, and partners across multiple regions in one account.",
      },
    ],
  },
  faq: {
    slug: "/faq",
    title: "Builder.Contractors FAQ",
    summary: "Answers to the most common questions about partnering, security, and lead exchange.",
    keywords: [
      "builder contractor faq",
      "lead exchange security",
      "partner verification",
      "trade referrals",
    ],
    faqs: [
      {
        question: "How do you verify builders and contractors?",
        answer: "We confirm business details during onboarding and maintain ongoing checks for compliance and reputation.",
      },
      {
        question: "Can I control who receives my leads?",
        answer: "Yes. You decide which partners receive projects, and you can revoke access at any time.",
      },
      {
        question: "Is customer data protected?",
        answer: "We share only the information required to deliver the project and keep sensitive details secure.",
      },
      {
        question: "Do you support multiple trades?",
        answer: "Absolutely. Teams can list multiple specialties and build curated partner lists per trade.",
      },
      {
        question: "What regions do you support?",
        answer: "Builder.Contractors supports global teams with configurable regions and localised workflows.",
      },
      {
        question: "How do I invite a partner?",
        answer: "Invite verified partners directly from your dashboard and start collaborating immediately.",
      },
    ],
  },
  pricing: {
    slug: "/pricing",
    title: "Pricing for Builder.Contractors",
    summary: "Transparent plans designed for growing trade businesses and enterprise builders.",
    keywords: [
      "builder contractor pricing",
      "lead exchange plans",
      "trade collaboration platform cost",
      "builder network subscription",
    ],
    tiers: [
      {
        name: "Starter",
        priceLabel: "Free",
        description: "For independent builders testing lead exchange workflows.",
        features: [
          "Verified profile",
          "Up to 5 partner invites",
          "Basic lead handoff",
        ],
      },
      {
        name: "Growth",
        priceLabel: "$99 / month",
        description: "For growing teams managing multiple trades and regions.",
        features: [
          "Unlimited partner invites",
          "Regional lead routing",
          "Shared project notes",
          "Priority support",
        ],
      },
      {
        name: "Enterprise",
        priceLabel: "Custom",
        description: "For multi-region builders with advanced security and reporting needs.",
        features: [
          "Dedicated success manager",
          "Custom compliance workflows",
          "Advanced reporting",
          "SAML-ready authentication",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I change plans later?",
        answer: "Yes. Upgrade or downgrade any time without losing your data or partner network.",
      },
      {
        question: "Do you offer annual pricing?",
        answer: "Annual billing is available for Growth and Enterprise plans with custom discounts.",
      },
    ],
  },
};
