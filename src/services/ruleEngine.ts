import type { Rule, EvaluationResult } from '../types/Rule';
import { toE164, isEmergencyNumber } from './phoneNumber';

export function extractBlockedE164Numbers(rules: Rule[]): string[] {
  return rules
    .filter(r => r.enabled && r.matchType === 'exact' && r.action !== 'allow')
    .map(r => r.patternNormalized);
}

// Specificity score: exact beats prefix when priority is equal
const SPECIFICITY: Record<Rule['matchType'], number> = {
  exact: 2,
  prefix: 1,
};

function sortRules(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return SPECIFICITY[b.matchType] - SPECIFICITY[a.matchType];
  });
}

function matchesRule(rule: Rule, normalizedNumber: string): boolean {
  const p = rule.patternNormalized;
  if (rule.matchType === 'exact') {
    return normalizedNumber === p;
  }
  if (rule.matchType === 'prefix') {
    return normalizedNumber.startsWith(p);
  }
  return false;
}

export function evaluate(
  rawNumber: string | null | undefined,
  rules: Rule[],
): EvaluationResult {
  const defaultResult: EvaluationResult = { action: 'allow', match: null };

  // Unknown/private number — allow by default
  if (!rawNumber || rawNumber.trim() === '') {
    return defaultResult;
  }

  const e164 = toE164(rawNumber);

  // Unparseable number — allow by default
  if (!e164) {
    return defaultResult;
  }

  // Emergency numbers always pass through
  if (isEmergencyNumber(e164)) {
    return defaultResult;
  }

  const enabledRules = rules.filter(r => r.enabled);
  const sorted = sortRules(enabledRules);

  for (const rule of sorted) {
    if (matchesRule(rule, e164)) {
      return { action: rule.action, match: { rule, action: rule.action } };
    }
  }

  return defaultResult;
}

// Returns pairs of rules that overlap and conflict (different actions, same priority)
export function detectConflicts(
  rules: Rule[],
): Array<{ a: Rule; b: Rule; reason: string }> {
  const conflicts: Array<{ a: Rule; b: Rule; reason: string }> = [];
  const enabled = rules.filter(r => r.enabled);

  for (let i = 0; i < enabled.length; i++) {
    for (let j = i + 1; j < enabled.length; j++) {
      const a = enabled[i];
      const b = enabled[j];
      if (a.action === b.action) {
        continue;
      }
      const overlaps =
        (a.matchType === 'exact' &&
          b.matchType === 'prefix' &&
          a.patternNormalized.startsWith(b.patternNormalized)) ||
        (b.matchType === 'exact' &&
          a.matchType === 'prefix' &&
          b.patternNormalized.startsWith(a.patternNormalized)) ||
        (a.matchType === 'prefix' &&
          b.matchType === 'prefix' &&
          (a.patternNormalized.startsWith(b.patternNormalized) ||
            b.patternNormalized.startsWith(a.patternNormalized)));

      if (overlaps && a.priority === b.priority) {
        conflicts.push({
          a,
          b,
          reason: `Rules "${a.patternRaw}" and "${b.patternRaw}" overlap with equal priority but different actions`,
        });
      }
    }
  }
  return conflicts;
}
