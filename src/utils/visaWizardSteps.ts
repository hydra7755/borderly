import { FaBriefcase, FaCalendarAlt, FaCamera, FaCreditCard, FaPassport, FaUsers } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { isSchengenCountry } from './schengenCountries';
import { isUnitedStates } from './unitedStatesVisa';

export interface WizardStepDefinition {
  id: number;
  key: WizardStepKey;
  title: string;
  icon: IconType;
  description: string;
}

export type WizardStepKey =
  | 'photo'
  | 'passport'
  | 'personal'
  | 'travel'
  | 'travelers'
  | 'checkout';

export interface VisaWizardStepConfig {
  isSchengen: boolean;
  isUnitedStates: boolean;
  steps: WizardStepDefinition[];
  totalSteps: number;
  photoStep: number;
  passportStep: number;
  personalStep: number | null;
  travelStep: number;
  travelersStep: number;
  checkoutStep: number;
  /** US flow uses sub-panels within main steps (passport has 2, travel has 3) */
  usPassportSubSteps: number;
  usTravelSubSteps: number;
}

const BASE_STEPS: Omit<WizardStepDefinition, 'id'>[] = [
  { key: 'photo', title: 'Photo', icon: FaCamera, description: 'Take or upload your photo' },
  { key: 'passport', title: 'Passport', icon: FaPassport, description: 'Scan your passport' },
];

const SCHENGEN_PERSONAL_STEP: Omit<WizardStepDefinition, 'id'> = {
  key: 'personal',
  title: 'Personal Life',
  icon: FaBriefcase,
  description: 'Professional & demographic details',
};

const TAIL_STEPS: Omit<WizardStepDefinition, 'id'>[] = [
  { key: 'travel', title: 'Travel Details', icon: FaCalendarAlt, description: 'Enter travel dates' },
  { key: 'travelers', title: 'Travelers', icon: FaUsers, description: 'Add additional travelers' },
  { key: 'checkout', title: 'Checkout', icon: FaCreditCard, description: 'Complete payment' },
];

export function getVisaWizardStepConfig(destinationCode: string): VisaWizardStepConfig {
  const schengen = isSchengenCountry(destinationCode);
  const us = isUnitedStates(destinationCode);

  const stepDefs: Omit<WizardStepDefinition, 'id'>[] = schengen
    ? [...BASE_STEPS, SCHENGEN_PERSONAL_STEP, ...TAIL_STEPS]
    : [...BASE_STEPS, ...TAIL_STEPS];

  if (us) {
    stepDefs[1] = { ...stepDefs[1], description: 'Passport & bio-data (DS-160)' };
    stepDefs[2] = { ...stepDefs[2], description: 'Travel, family & employment history' };
  }

  const steps: WizardStepDefinition[] = stepDefs.map((step, index) => ({
    ...step,
    id: index + 1,
  }));

  const findStep = (key: WizardStepKey) => steps.find((s) => s.key === key)!.id;

  return {
    isSchengen: schengen,
    isUnitedStates: us,
    steps,
    totalSteps: steps.length,
    photoStep: findStep('photo'),
    passportStep: findStep('passport'),
    personalStep: schengen ? findStep('personal') : null,
    travelStep: findStep('travel'),
    travelersStep: findStep('travelers'),
    checkoutStep: findStep('checkout'),
    usPassportSubSteps: us ? 2 : 1,
    usTravelSubSteps: us ? 3 : 1,
  };
}

export function isStepKey(
  currentStep: number,
  config: VisaWizardStepConfig,
  key: WizardStepKey
): boolean {
  const step = config.steps.find((s) => s.key === key);
  return step ? currentStep === step.id : false;
}
