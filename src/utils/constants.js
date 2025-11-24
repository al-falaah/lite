// src/utils/constants.js

export const PROGRAMS = {
  FOUNDATIONAL: {
    id: 'foundational',
    name: '1-Year Foundational Certificate',
    duration: '1 Year',
    description: 'Perfect for busy Muslims who want to strengthen their Islamic foundation with personalized instruction',
    requirements: 'Basic Islamic knowledge',
    fee: 240,
    feePerYear: 240,
    installments: 5,
    installmentAmount: 48,
    format: 'flexible', // Can be one-on-one OR cohort
    formatOptions: ['one-on-one', 'cohort'],
    formatDescription: 'Choose between individual sessions or small group learning',
    schedule: 'Twice a week, 1 hour per session',
    scheduleDetails: '2 sessions per week'
  },
  ESSENTIALS: {
    id: 'essentials',
    name: '3-Year Essentials Program',
    duration: '3 Years',
    description: 'Comprehensive Islamic education for dedicated learners in a supportive cohort environment',
    requirements: 'Must be able to read Quran with basic tajweed',
    fee: 300, // Per year
    feePerYear: 300,
    totalFee: 900, // 3 years total
    installments: 5,
    installmentAmount: 60,
    format: 'cohort', // Cohort ONLY
    formatOptions: ['cohort'],
    formatDescription: 'Learn alongside peers in small groups (max 12 students per cohort)',
    schedule: 'Twice a week, 2 hours per session',
    scheduleDetails: '2 sessions per weekend'
  }
};

// Payment plan options
export const PAYMENT_PLAN_OPTIONS = [
  {
    id: 'full',
    name: 'Full Payment',
    description: 'Pay the full amount upfront',
    installments: 1,
    amount: 300,
    discount: 0 // Could add discount: 20 for $20 off if paid in full
  },
  {
    id: 'five',
    name: '5 Installments',
    description: 'Pay in 5 equal installments every 60 days',
    installments: 5,
    amount: 60,
    discount: 0
  },
  {
    id: 'three',
    name: '3 Installments',
    description: 'Pay in 3 equal installments every 100 days',
    installments: 3,
    amount: 100,
    discount: 0
  },
  {
    id: 'two',
    name: '2 Installments',
    description: 'Pay in 2 equal installments every 150 days',
    installments: 2,
    amount: 150,
    discount: 0
  }
];

export const PAYMENT_METHODS = {
  STRIPE: 'stripe',
  BANK_DEPOSIT: 'bank_deposit'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  PENDING_VERIFICATION: 'pending_verification'
};

export const BANK_DETAILS = {
  ACCOUNT_NAME: 'Al-Falaah Islamic Institute',
  ACCOUNT_NUMBER: 'XX-XXXX-XXXXXXX-XX',
  BANK_NAME: 'Bank Name',
  REFERENCE_FORMAT: 'ALFALAAH-[STUDENT_ID]-[INSTALLMENT]'
};

export const CLASS_FORMATS = {
  ONE_ON_ONE: 'one-on-one',
  COHORT: 'cohort'
};

export const APPLICATION_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ENROLLED: 'enrolled'
};

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin'
};

export const MINIMUM_AGE = 13;

export const CONTACT = {
  EMAIL: 'admin@alfalaah.co.nz',
  WHATSAPP: '+64 XXX XXX XXX',
  LOCATION: 'Auckland, New Zealand'
};

export const ACADEMIC_YEAR = {
  START_MONTH: 1,
  END_MONTH: 12,
  APPLICATION_OPEN_MONTH: 12
};

export const INTEREST_REASONS = [
  { id: 'strengthen_foundation', label: 'Strengthen my Islamic foundation' },
  { id: 'learn_quran', label: 'Learn to read/understand the Quran better' },
  { id: 'islamic_knowledge', label: 'Deepen my Islamic knowledge' },
  { id: 'practice_faith', label: 'Practice my faith more correctly' },
  { id: 'teach_family', label: 'Teach my family' },
  { id: 'community', label: 'Connect with a learning community' },
  { id: 'personal_growth', label: 'Personal spiritual growth' },
  { id: 'other', label: 'Other' }
];