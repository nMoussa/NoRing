export type Country = 'FR';
export type MatchType = 'exact' | 'prefix';
export type RuleAction = 'block_voicemail' | 'reject' | 'silent' | 'allow';

export interface Rule {
  id: string;
  enabled: boolean;
  country: Country;
  matchType: MatchType;
  patternRaw: string;
  patternNormalized: string;
  action: RuleAction;
  priority: number;
  createdAt: string;
}

export interface RuleMatch {
  rule: Rule;
  action: RuleAction;
}

export interface EvaluationResult {
  action: RuleAction;
  match: RuleMatch | null;
}
