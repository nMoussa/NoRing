import {
  toE164,
  normalizePrefixPattern,
  isEmergencyNumber,
} from '../src/services/phoneNumber';

describe('toE164 — French number normalization', () => {
  test('national format with spaces', () => {
    expect(toE164('03 12 34 56 78')).toBe('+33312345678');
  });

  test('national format no spaces', () => {
    expect(toE164('0312345678')).toBe('+33312345678');
  });

  test('international 00-prefix', () => {
    expect(toE164('0033312345678')).toBe('+33312345678');
  });

  test('E.164 passthrough', () => {
    expect(toE164('+33312345678')).toBe('+33312345678');
  });

  test('national format other zones (06 mobile)', () => {
    expect(toE164('06 12 34 56 78')).toBe('+33612345678');
  });

  test('national format landline 01 (Paris)', () => {
    expect(toE164('01 23 45 67 89')).toBe('+33123456789');
  });

  test('with dashes', () => {
    expect(toE164('03-12-34-56-78')).toBe('+33312345678');
  });

  test('with parentheses', () => {
    expect(toE164('(03)12345678')).toBe('+33312345678');
  });

  test('malformed — too short', () => {
    expect(toE164('031')).toBeNull();
  });

  test('malformed — empty string', () => {
    expect(toE164('')).toBeNull();
  });

  test('malformed — letters', () => {
    expect(toE164('NOTANUMBER')).toBeNull();
  });
});

describe('normalizePrefixPattern — French prefix expansion', () => {
  test('national prefix "03" → "+333"', () => {
    expect(normalizePrefixPattern('03')).toBe('+333');
  });

  test('national prefix "01" → "+331"', () => {
    expect(normalizePrefixPattern('01')).toBe('+331');
  });

  test('E.164 prefix already normalized', () => {
    expect(normalizePrefixPattern('+333')).toBe('+333');
  });

  test('00-prefixed international prefix', () => {
    expect(normalizePrefixPattern('0033')).toBe('+33');
  });

  test('empty string returns null', () => {
    expect(normalizePrefixPattern('')).toBeNull();
  });

  test('"07" mobile prefix → "+337"', () => {
    expect(normalizePrefixPattern('07')).toBe('+337');
  });

  test('"04" Southeast France prefix → "+334"', () => {
    expect(normalizePrefixPattern('04')).toBe('+334');
  });
});

describe('isEmergencyNumber', () => {
  test('112 — European emergency', () => {
    expect(isEmergencyNumber('+33112')).toBe(true);
  });

  test('15 — SAMU', () => {
    expect(isEmergencyNumber('+3315')).toBe(true);
  });

  test('17 — Police', () => {
    expect(isEmergencyNumber('+3317')).toBe(true);
  });

  test('18 — Fire', () => {
    expect(isEmergencyNumber('+3318')).toBe(true);
  });

  test('normal number is not emergency', () => {
    expect(isEmergencyNumber('+33312345678')).toBe(false);
  });
});
