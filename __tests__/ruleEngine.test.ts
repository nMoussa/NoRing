import {evaluate, detectConflicts} from '../src/services/ruleEngine';
import type {Rule} from '../src/types/Rule';

function makeRule(overrides: Partial<Rule>): Rule {
  return {
    id: 'test-id',
    enabled: true,
    country: 'FR',
    matchType: 'prefix',
    patternRaw: '03',
    patternNormalized: '+333',
    action: 'block_voicemail',
    priority: 100,
    createdAt: '2026-06-03T00:00:00.000Z',
    ...overrides,
  };
}

const frenchCallerPrefix = makeRule({
  id: 'r1',
  matchType: 'prefix',
  patternRaw: '03',
  patternNormalized: '+333',
  action: 'block_voicemail',
  priority: 100,
});

const exactBlock = makeRule({
  id: 'r2',
  matchType: 'exact',
  patternRaw: '03 12 34 56 78',
  patternNormalized: '+33312345678',
  action: 'allow',
  priority: 100,
});

describe('evaluate — basic matching', () => {
  test('prefix rule blocks matching number', () => {
    const result = evaluate('03 99 88 77 66', [frenchCallerPrefix]);
    expect(result.action).toBe('block_voicemail');
    expect(result.match?.rule.id).toBe('r1');
  });

  test('no rules → allow', () => {
    expect(evaluate('03 99 88 77 66', []).action).toBe('allow');
  });

  test('non-matching prefix → allow', () => {
    const result = evaluate('06 12 34 56 78', [frenchCallerPrefix]);
    expect(result.action).toBe('allow');
    expect(result.match).toBeNull();
  });

  test('exact match wins over prefix at same priority', () => {
    // exactBlock is 'allow' for +33312345678; frenchCallerPrefix is 'block_voicemail' for +333...
    const result = evaluate('03 12 34 56 78', [frenchCallerPrefix, exactBlock]);
    expect(result.action).toBe('allow');
    expect(result.match?.rule.id).toBe('r2');
  });

  test('disabled rule is ignored', () => {
    const disabled = {...frenchCallerPrefix, enabled: false};
    expect(evaluate('03 12 34 56 78', [disabled]).action).toBe('allow');
  });

  test('higher priority rule wins', () => {
    const highPriority = makeRule({
      id: 'high',
      matchType: 'prefix',
      patternNormalized: '+333',
      action: 'reject',
      priority: 200,
    });
    const lowPriority = makeRule({
      id: 'low',
      matchType: 'prefix',
      patternNormalized: '+333',
      action: 'silent',
      priority: 50,
    });
    expect(evaluate('03 99 88 77 66', [lowPriority, highPriority]).action).toBe('reject');
  });

  test('unknown/private number (empty string) → allow', () => {
    expect(evaluate('', [frenchCallerPrefix]).action).toBe('allow');
  });

  test('null number → allow', () => {
    expect(evaluate(null, [frenchCallerPrefix]).action).toBe('allow');
  });

  test('unparseable number → allow', () => {
    expect(evaluate('NOT_A_NUMBER', [frenchCallerPrefix]).action).toBe('allow');
  });
});

describe('evaluate — emergency numbers always pass through', () => {
  const blockAll = makeRule({
    matchType: 'prefix',
    patternNormalized: '+33',
    action: 'reject',
    priority: 999,
  });

  test('112 passes through even with catch-all block', () => {
    expect(evaluate('112', [blockAll]).action).toBe('allow');
  });

  test('15 (SAMU) passes through', () => {
    expect(evaluate('15', [blockAll]).action).toBe('allow');
  });

  test('17 (Police) passes through', () => {
    expect(evaluate('17', [blockAll]).action).toBe('allow');
  });

  test('18 (Fire) passes through', () => {
    expect(evaluate('18', [blockAll]).action).toBe('allow');
  });
});

describe('evaluate — all actions', () => {
  test('reject action', () => {
    const r = makeRule({action: 'reject'});
    expect(evaluate('0312345678', [r]).action).toBe('reject');
  });

  test('silent action', () => {
    const r = makeRule({action: 'silent'});
    expect(evaluate('0312345678', [r]).action).toBe('silent');
  });

  test('allow action (explicit allowlist)', () => {
    const r = makeRule({action: 'allow'});
    expect(evaluate('0312345678', [r]).action).toBe('allow');
  });
});

describe('detectConflicts', () => {
  test('detects overlapping rules with same priority and different actions', () => {
    const prefix = makeRule({
      id: 'p',
      matchType: 'prefix',
      patternNormalized: '+333',
      action: 'block_voicemail',
      priority: 100,
    });
    const exact = makeRule({
      id: 'e',
      matchType: 'exact',
      patternNormalized: '+33312345678',
      action: 'allow',
      priority: 100,
    });
    const conflicts = detectConflicts([prefix, exact]);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].a.id === 'p' || conflicts[0].b.id === 'p').toBe(true);
  });

  test('no conflict when priorities differ', () => {
    const high = makeRule({id: 'h', action: 'allow', priority: 200});
    const low = makeRule({id: 'l', action: 'block_voicemail', priority: 50});
    expect(detectConflicts([high, low])).toHaveLength(0);
  });

  test('no conflict when actions are the same', () => {
    const a = makeRule({id: 'a', action: 'reject'});
    const b = makeRule({id: 'b', action: 'reject'});
    expect(detectConflicts([a, b])).toHaveLength(0);
  });

  test('disabled rules are excluded from conflict detection', () => {
    const active = makeRule({id: 'active', action: 'block_voicemail'});
    const disabled = makeRule({id: 'disabled', action: 'allow', enabled: false});
    expect(detectConflicts([active, disabled])).toHaveLength(0);
  });
});
