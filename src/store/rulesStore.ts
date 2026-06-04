import {create} from 'zustand';
import {v4 as uuidv4} from 'uuid';
import type {Rule} from '../types/Rule';
import {normalizePrefixPattern} from '../services/phoneNumber';
import {loadRules, saveRules, loadPlatformStatus, PlatformStatus} from '../services/storage';
import {detectConflicts} from '../services/ruleEngine';

interface RulesState {
  rules: Rule[];
  platformStatus: PlatformStatus;
  conflicts: Array<{a: Rule; b: Rule; reason: string}>;
  loadFromStorage: () => void;
  addRule: (input: Omit<Rule, 'id' | 'createdAt' | 'patternNormalized'>) => Rule | null;
  updateRule: (id: string, updates: Partial<Omit<Rule, 'id' | 'createdAt'>>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  reorderPriority: (id: string, priority: number) => void;
  refreshPlatformStatus: () => void;
}

export const useRulesStore = create<RulesState>((set, get) => ({
  rules: [],
  platformStatus: loadPlatformStatus(),
  conflicts: [],

  loadFromStorage() {
    const rules = loadRules();
    set({rules, conflicts: detectConflicts(rules)});
  },

  addRule(input) {
    const normalized = normalizePrefixPattern(input.patternRaw, input.country);
    if (!normalized) {
      return null;
    }
    const rule: Rule = {
      ...input,
      id: uuidv4(),
      patternNormalized: normalized,
      createdAt: new Date().toISOString(),
    };
    const rules = [...get().rules, rule];
    saveRules(rules);
    set({rules, conflicts: detectConflicts(rules)});
    return rule;
  },

  updateRule(id, updates) {
    const rules = get().rules.map(r => {
      if (r.id !== id) {
        return r;
      }
      const merged = {...r, ...updates};
      if (updates.patternRaw || updates.country) {
        const normalized = normalizePrefixPattern(
          merged.patternRaw,
          merged.country,
        );
        merged.patternNormalized = normalized ?? r.patternNormalized;
      }
      return merged;
    });
    saveRules(rules);
    set({rules, conflicts: detectConflicts(rules)});
  },

  deleteRule(id) {
    const rules = get().rules.filter(r => r.id !== id);
    saveRules(rules);
    set({rules, conflicts: detectConflicts(rules)});
  },

  toggleRule(id) {
    const rules = get().rules.map(r =>
      r.id === id ? {...r, enabled: !r.enabled} : r,
    );
    saveRules(rules);
    set({rules, conflicts: detectConflicts(rules)});
  },

  reorderPriority(id, priority) {
    const rules = get().rules.map(r =>
      r.id === id ? {...r, priority} : r,
    );
    saveRules(rules);
    set({rules, conflicts: detectConflicts(rules)});
  },

  refreshPlatformStatus() {
    set({platformStatus: loadPlatformStatus()});
  },
}));
