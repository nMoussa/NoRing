# Contributing to NoRing

## Branch naming

| Prefix | Use for |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `phase/` | Phased implementation milestones |
| `ci/` | CI/CD workflow changes |
| `docs/` | Documentation only |
| `refactor/` | Structural improvements without behaviour change |
| `review/` | Code review follow-up branches |

Always branch off the latest `main`:
```bash
git checkout main && git pull
git checkout -b feature/my-feature
```

---

## Commit messages

Follow the imperative mood with a 72-character subject line:

```
Add French prefix normalization for 0X national codes

Handles 03, 04, 06, 07, 08, 09 via libphonenumber-js country hint.
Emergency numbers (15, 17, 18, 112) bypass all rules.
```

- Subject: what the commit does (imperative: "Add", "Fix", "Remove")
- Body (optional): why and any non-obvious details
- No issue tracker references in the subject line

---

## Before opening a PR

The pre-push hook runs these automatically, but verify manually if needed:

```bash
npm run lint                        # 0 errors
npx tsc --noEmit                    # 0 errors
npm test -- --ci --coverage=false   # all tests green
```

For Android changes:
```bash
cd android && ./gradlew assembleDebug --no-daemon
```

For iOS changes:
```bash
cd ios && bundle exec pod install
```

---

## PR checklist

- [ ] Branch is off latest `main`
- [ ] Lint exits 0
- [ ] TypeScript exits 0
- [ ] All existing tests pass; new tests added for new behaviour
- [ ] New constants added to `src/constants/` rather than inline strings
- [ ] i18n strings added to both `en.json` and `fr.json`
- [ ] Accessibility labels use `s.a11y.*` keys, not hardcoded English
- [ ] If MMKV key names changed, both `src/constants/storageKeys.ts` and the Kotlin files are updated in the same PR

---

## Code style

ESLint and Prettier are enforced via the pre-commit hook. The configuration extends `@react-native`. Key rules:

- No inline styles — use `StyleSheet.create`
- No unused imports — `@typescript-eslint/no-unused-vars` is an error
- Prefer `import type` for type-only imports
- No hardcoded English strings in components — use `useTranslation()`
