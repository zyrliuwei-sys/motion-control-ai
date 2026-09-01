export type ProactivFeature = {
  title: string;
  description: string;
  illustration: 'social' | 'analytics' | 'ai' | 'collaboration' | 'audience';
  featured?: boolean;
};

export type ProactivTool = {
  title: string;
  description: string;
  image: string;
  icon: 'mail' | 'social' | 'terminal';
};

export type ProactivTestimonial = {
  name: string;
  designation: string;
  quote: string;
  image: string;
};

export type ProactivPriceTier = {
  title: string;
  description: string;
  monthlyPrice: number | null;
  monthlyCredits: number | null;
  monthlyProductId?: string;
  yearlyPrice: number | null;
  yearlyCredits: number | null;
  yearlyProductId?: string;
  oneTimePrice: number | null;
  oneTimeCredits: number | null;
  oneTimeProductId?: string;
  cta: string;
  features: string[];
  featured?: boolean;
};

export type ProactivFaq = {
  question: string;
  answer: string;
};
