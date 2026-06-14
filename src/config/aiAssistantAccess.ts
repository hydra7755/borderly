/** AI assistant access limits by subscription tier (matches Pricing page). */

export type AiAccessTier = 'free' | 'premium' | 'enterprise';

export interface AiAssistantLimits {
  hasAccess: boolean;
  dailyLimit: number;
  planLabel: string;
}

/** Map profile tiers (including legacy names) to AI access tier. */
export function normalizeAiTier(tier?: string | null): AiAccessTier {
  const value = (tier || 'free').toLowerCase();
  if (value === 'enterprise' || value === 'business') return 'enterprise';
  if (value === 'premium' || value === 'monthly' || value === 'lifetime') return 'premium';
  return 'free';
}

export function getAiAssistantLimits(tier?: string | null): AiAssistantLimits {
  const normalized = normalizeAiTier(tier);

  switch (normalized) {
    case 'enterprise':
      return { hasAccess: true, dailyLimit: Infinity, planLabel: 'Enterprise' };
    case 'premium':
      return { hasAccess: true, dailyLimit: 25, planLabel: 'Premium' };
    default:
      return { hasAccess: false, dailyLimit: 0, planLabel: 'Free' };
  }
}

const USAGE_STORAGE_KEY = 'borderly_ai_daily_usage';

interface DailyUsage {
  date: string;
  count: number;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getAiDailyUsage(): DailyUsage {
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const parsed = JSON.parse(raw) as DailyUsage;
    if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

export function incrementAiDailyUsage(): void {
  const usage = getAiDailyUsage();
  const next = { date: todayKey(), count: usage.count + 1 };
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(next));
}

export function getRemainingAiMessages(tier?: string | null): number {
  const limits = getAiAssistantLimits(tier);
  if (!limits.hasAccess) return 0;
  if (!Number.isFinite(limits.dailyLimit)) return Infinity;
  return Math.max(0, limits.dailyLimit - getAiDailyUsage().count);
}

export function canSendAiMessage(tier?: string | null): boolean {
  const limits = getAiAssistantLimits(tier);
  if (!limits.hasAccess) return false;
  return getRemainingAiMessages(tier) > 0;
}
