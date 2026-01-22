/**
 * Centralized Program Configuration for Supabase Edge Functions
 *
 * This mirrors the frontend config at src/config/programs.js
 * Keep these in sync when adding new programs.
 */

export const PROGRAM_IDS = {
  QARI: 'qari',
  TAJWEED: 'tajweed',
  ESSENTIALS: 'essentials',
} as const;

export type ProgramId = typeof PROGRAM_IDS[keyof typeof PROGRAM_IDS];

interface ProgramPricing {
  type: 'one-time' | 'subscription';
  oneTime?: number;
  oneTimeCents?: number;
  monthly?: number;
  monthlyCents?: number;
  annual?: number;
  annualCents?: number;
  currency: string;
}

interface ProgramDuration {
  months: number;
  weeks: number;
  years: number;
}

interface ProgramConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  duration: ProgramDuration;
  pricing: ProgramPricing;
}

export const PROGRAMS: Record<ProgramId, ProgramConfig> = {
  [PROGRAM_IDS.QARI]: {
    id: 'qari',
    name: "Qur'an & Arabic Reading Literacy",
    shortName: 'QARI',
    description: "1-Year Qur'an & Arabic Reading Literacy Course",
    duration: {
      months: 12,
      weeks: 52,
      years: 1,
    },
    pricing: {
      type: 'one-time',
      oneTime: 300,
      oneTimeCents: 30000,
      currency: 'NZD',
    },
  },

  [PROGRAM_IDS.TAJWEED]: {
    id: 'tajweed',
    name: 'Tajweed Mastery Program',
    shortName: 'TMP',
    description: '6-Month Tajweed Mastery Course',
    duration: {
      months: 6,
      weeks: 24,
      years: 1,
    },
    pricing: {
      type: 'one-time',
      oneTime: 150,
      oneTimeCents: 15000,
      currency: 'NZD',
    },
  },

  [PROGRAM_IDS.ESSENTIALS]: {
    id: 'essentials',
    name: 'Essential Arabic & Islamic Studies',
    shortName: 'EASI',
    description: '2-Year Essential Islamic Studies Course',
    duration: {
      months: 24,
      weeks: 104,
      years: 2,
    },
    pricing: {
      type: 'subscription',
      monthly: 35,
      monthlyCents: 3500,
      annual: 375,
      annualCents: 37500,
      currency: 'NZD',
    },
  },
};

/**
 * Get program config by ID
 */
export const getProgram = (programId: string): ProgramConfig | null => {
  return PROGRAMS[programId as ProgramId] || null;
};

/**
 * Check if a program ID is valid
 */
export const isValidProgram = (programId: string): programId is ProgramId => {
  return programId in PROGRAMS;
};

/**
 * Get total fees for a program based on payment type
 */
export const getTotalFees = (programId: string, planType: string): number => {
  const program = getProgram(programId);
  if (!program) return 0;

  if (program.pricing.type === 'one-time') {
    return program.pricing.oneTime || 0;
  }

  // Subscription program
  if (planType === 'monthly') {
    return (program.pricing.monthly || 0) * program.duration.months;
  }
  // Annual payment
  return (program.pricing.annual || 0) * program.duration.years;
};

/**
 * Get single payment amount (for recording individual payments)
 */
export const getPaymentAmount = (programId: string, planType: string): number => {
  const program = getProgram(programId);
  if (!program) return 0;

  if (program.pricing.type === 'one-time') {
    return program.pricing.oneTime || 0;
  }

  return planType === 'monthly'
    ? (program.pricing.monthly || 0)
    : (program.pricing.annual || 0);
};

/**
 * Get price in cents for Stripe
 */
export const getPriceCents = (programId: string, planType: string): number => {
  const program = getProgram(programId);
  if (!program) return 0;

  if (program.pricing.type === 'one-time') {
    return program.pricing.oneTimeCents || 0;
  }

  return planType === 'monthly'
    ? (program.pricing.monthlyCents || 0)
    : (program.pricing.annualCents || 0);
};

export default PROGRAMS;
