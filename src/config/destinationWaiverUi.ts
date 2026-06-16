import {
  isMoroccoWaiverUnlocked,
  shouldShowMoroccoWaiverInfo,
} from './moroccoWaiver';
import {
  isTurkeyWaiverUnlocked,
  shouldShowTurkeyWaiverInfo,
} from './turkeyWaiver';
import type { VisaRoutingResult } from '../types/visaRouting';

export interface DestinationWaiverUiState {
  showMoroccoWaiver: boolean;
  showTurkeyWaiver: boolean;
  moroccoEligible: boolean;
  turkeyEligible: boolean;
  anyEligible: boolean;
  anyWaiverRoute: boolean;
}

export function getDestinationWaiverUiState(
  destinationCode: string,
  visaRequirement: string | undefined,
  routing: VisaRoutingResult
): DestinationWaiverUiState {
  const showMoroccoWaiver = shouldShowMoroccoWaiverInfo(destinationCode, visaRequirement);
  const showTurkeyWaiver = shouldShowTurkeyWaiverInfo(destinationCode, visaRequirement);
  const moroccoEligible = isMoroccoWaiverUnlocked(routing);
  const turkeyEligible = isTurkeyWaiverUnlocked(routing);

  return {
    showMoroccoWaiver,
    showTurkeyWaiver,
    moroccoEligible,
    turkeyEligible,
    anyEligible: moroccoEligible || turkeyEligible,
    anyWaiverRoute: showMoroccoWaiver || showTurkeyWaiver,
  };
}

export function getWaiverResultTitle(waiver: DestinationWaiverUiState): string | null {
  if (waiver.turkeyEligible) return 'Turkey e-Visa Available (Supporting Document Route)';
  if (waiver.moroccoEligible) return 'Morocco e-Visa Available (Waiver Program)';
  return null;
}

export function getWaiverResultMessage(
  waiver: DestinationWaiverUiState,
  nationalityName: string,
  destinationName: string
): string | null {
  if (waiver.turkeyEligible) {
    return `You qualify for Turkey's e-Visa supporting-document route. Continue to the ${destinationName} visa page for full requirements, pricing, and to start your application.`;
  }
  if (waiver.moroccoEligible) {
    return `You qualify for Morocco's e-Visa waiver program. Continue to the ${destinationName} visa page for full requirements, pricing, and to start your application.`;
  }
  if (waiver.showTurkeyWaiver) {
    return `Citizens of ${nationalityName} normally need a traditional embassy visa for ${destinationName}. You may qualify for an e-Visa with a physical supporting visa or residence permit from the USA, UK, Schengen, or Ireland — see the ${destinationName} visa page for full rules.`;
  }
  if (waiver.showMoroccoWaiver) {
    return `Citizens of ${nationalityName} normally need a traditional embassy visa for ${destinationName}. You may qualify for an e-Visa with a supporting multi-entry visa or residence permit — see the ${destinationName} visa page for full eligibility rules.`;
  }
  return null;
}
