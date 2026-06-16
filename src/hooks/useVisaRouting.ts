import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  evaluateVisaRouting,
  normalizeCountryCode,
  parseEligibilityFromSearchParams,
} from '../engine/visaRoutingEngine';
import type {
  PremiumVisaType,
  ResidenceMode,
  VisaEligibilityInput,
  VisaRoutingResult,
  VisaRoutingUpdatedDetail,
} from '../types/visaRouting';
import { VISA_ROUTING_UPDATED_EVENT } from '../types/visaRouting';

const STORAGE_KEY = 'borderly_visa_eligibility_context';

export interface UseVisaRoutingOptions {
  passportNationality: string;
  destinationCode: string;
  initialSearch?: string;
  profileResidency?: string | null;
}

function deriveResidenceMode(
  passportNationality: string,
  residenceCountry: string | null
): ResidenceMode {
  if (!residenceCountry) return 'home';
  return normalizeCountryCode(residenceCountry) === normalizeCountryCode(passportNationality)
    ? 'home'
    : 'abroad';
}

function normalizeEligibility(
  passportNationality: string,
  input: Omit<VisaEligibilityInput, 'passportNationality'> & { passportNationality?: string }
): VisaEligibilityInput {
  const passport = normalizeCountryCode(passportNationality);
  const residenceCountry = input.residenceCountry
    ? normalizeCountryCode(input.residenceCountry)
    : null;
  return {
    passportNationality: passport,
    residenceCountry,
    residenceMode: deriveResidenceMode(passport, residenceCountry),
    heldPremiumVisas: input.heldPremiumVisas ?? [],
  };
}
function loadStoredEligibility(
  passportNationality: string,
  destinationCode: string
): VisaEligibilityInput | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VisaEligibilityInput & {
      destinationCode?: string;
    };
    if (
      normalizeCountryCode(parsed.passportNationality) !== normalizeCountryCode(passportNationality) ||
      normalizeCountryCode(parsed.destinationCode ?? '') !== normalizeCountryCode(destinationCode)
    ) {
      return null;
    }
    return normalizeEligibility(passportNationality, {
      residenceCountry: parsed.residenceCountry
        ? normalizeCountryCode(parsed.residenceCountry)
        : null,
      residenceMode: parsed.residenceMode ?? 'home',
      heldPremiumVisas: parsed.heldPremiumVisas ?? [],
    });
  } catch {
    return null;
  }
}

function persistEligibility(
  destinationCode: string,
  eligibility: VisaEligibilityInput
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...eligibility,
      destinationCode: normalizeCountryCode(destinationCode),
    })
  );
}

function emitRoutingUpdated(detail: VisaRoutingUpdatedDetail) {
  window.dispatchEvent(
    new CustomEvent(VISA_ROUTING_UPDATED_EVENT, { detail })
  );
}

export function useVisaRouting({
  passportNationality,
  destinationCode,
  initialSearch = '',
  profileResidency,
}: UseVisaRoutingOptions) {
  const [eligibility, setEligibility] = useState<VisaEligibilityInput>(() => {
    const fromUrl = initialSearch
      ? parseEligibilityFromSearchParams(passportNationality, initialSearch)
      : null;
    const fromStorage = loadStoredEligibility(passportNationality, destinationCode);
    const base = fromUrl ?? fromStorage ?? {
      passportNationality: normalizeCountryCode(passportNationality),
      residenceMode: 'home' as ResidenceMode,
      residenceCountry: null,
      heldPremiumVisas: [] as PremiumVisaType[],
    };

    let normalized = normalizeEligibility(passportNationality, {
      residenceCountry: base.residenceCountry,
      heldPremiumVisas: base.heldPremiumVisas,
      residenceMode: base.residenceMode,
    });

    if (
      !normalized.residenceCountry &&
      profileResidency &&
      normalizeCountryCode(profileResidency) !== normalizeCountryCode(passportNationality)
    ) {
      normalized = normalizeEligibility(passportNationality, {
        ...normalized,
        residenceCountry: normalizeCountryCode(profileResidency),
      });
    }

    return normalized;
  });

  const routingResult = useMemo(
    () =>
      evaluateVisaRouting(destinationCode, {
        ...eligibility,
        passportNationality: normalizeCountryCode(passportNationality),
      }),
    [destinationCode, eligibility, passportNationality]
  );

  useEffect(() => {
    const normalizedPassport = normalizeCountryCode(passportNationality);
    setEligibility((prev) =>
      normalizeEligibility(normalizedPassport, {
        residenceCountry: prev.residenceCountry,
        residenceMode: prev.residenceMode,
        heldPremiumVisas: prev.heldPremiumVisas,
      })
    );
  }, [passportNationality]);

  useEffect(() => {
    persistEligibility(destinationCode, eligibility);
    emitRoutingUpdated({
      destinationCode: normalizeCountryCode(destinationCode),
      passportNationality: normalizeCountryCode(passportNationality),
      result: routingResult,
      eligibility,
    });
  }, [destinationCode, passportNationality, eligibility, routingResult]);

  const setResidenceCountry = useCallback(
    (countryCode: string) => {
      setEligibility((prev) =>
        normalizeEligibility(passportNationality, {
          ...prev,
          residenceCountry: normalizeCountryCode(countryCode),
        })
      );
    },
    [passportNationality]
  );

  const togglePremiumVisa = useCallback((visa: PremiumVisaType) => {
    setEligibility((prev) => {
      const has = prev.heldPremiumVisas.includes(visa);
      return {
        ...prev,
        heldPremiumVisas: has
          ? prev.heldPremiumVisas.filter((v) => v !== visa)
          : [...prev.heldPremiumVisas, visa],
      };
    });
  }, []);

  return {
    eligibility,
    routingResult,
    setResidenceCountry,
    togglePremiumVisa,
    setEligibility,
  };
}
