# Testing Strategy

## What is tested

All tests are in `__tests__/` and run with Jest via `npm test`.

| File | What it covers |
|---|---|
| `phoneNumber.test.ts` | E.164 normalisation for all French number formats; prefix expansion; emergency number detection |
| `ruleEngine.test.ts` | Rule evaluation (priority, specificity, disabled rules, emergency bypass, all actions); conflict detection including 3-way overlaps |
| `storage.test.ts` | MMKV-backed CRUD; `PlatformStatus` partial updates including null-clearing; sync callback wiring; forward-compat with unknown JSON fields |
| `nativeBridge.test.ts` | Platform.OS branching (Android vs iOS) for all six bridge functions |
| `platformSync.test.ts` | iOS sync trigger: rule filtering (exact/enabled/non-allow), error swallowing |
| `rulesStore.test.ts` | Zustand store mutations: add/delete/toggle/update/loadFromStorage; conflict detection wired to load |
| `useTranslation.test.ts` | Locale detection on iOS (AppleLocale, AppleLanguages fallback) and Android (I18nManager); null module handling; unrecognised locale fallback |

**Current count:** 98 tests across 8 suites.

---

## What is NOT tested by Jest

| Area | Why not / how to test |
|---|---|
| `CallScreeningService` (Kotlin) | Requires Android device/emulator; test by calling a French number manually |
| `CallDirectoryHandler` (Swift) | Requires real iOS device (cellular); test by adding a rule and verifying iOS blocks the number |
| UI rendering / navigation | Screens use React Native components that need a real bridge; test via Expo or device |
| Kotlin `RuleEngine`/`RuleStorage` | No JVM in the Node.js test environment; add Android JUnit tests in `android/app/src/test/` |

---

## Running tests

```bash
# all tests
npm test -- --ci --coverage=false

# single file
npm test -- --ci --coverage=false --testPathPattern=ruleEngine

# with coverage report
npm test -- --coverage
```

---

## Adding a test

1. Create `__tests__/<name>.test.ts`.
2. If the module under test imports `react-native-mmkv`, mock it inside the `jest.mock()` factory (not in outer-scope variables) to avoid Jest hoisting / Temporal Dead Zone issues:

```ts
jest.mock('react-native-mmkv', () => {
  const _store: Record<string, string> = {};
  return {
    createMMKV: () => ({
      getString: (k: string) => _store[k],
      set: (k: string, v: string) => { _store[k] = v; },
    }),
    __clear: () => { Object.keys(_store).forEach(k => delete _store[k]); },
  };
});
```

3. If the module uses `Platform.OS`, mock `react-native` with a mutable getter:

```ts
let mockOS = 'android';
jest.mock('react-native', () => ({
  get Platform() { return {OS: mockOS}; },
}));
```

4. Describe blocks should mirror the file structure. Use `beforeEach` to reset shared state.

---

## Coverage goal

Target: **80 % line coverage** for `src/services/` and `src/store/`. Run `npm test -- --coverage` and check the summary table. The `src/screens/` and `src/components/` directories are excluded from coverage targets because they require a rendered native environment.
