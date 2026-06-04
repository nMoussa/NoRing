# Architecture Decision Records

Short records of key design choices made during NoRing's development.

---

## ADR-1: React Native over fully native

**Status:** Accepted

**Context:** The app needs a UI for rule management and two completely separate native call-filtering integrations: Android `CallScreeningService` and iOS `Call Directory` extension.

**Decision:** Use React Native for the UI layer. The call-filtering logic must be written in Kotlin/Swift regardless of the choice, so going fully native would mean writing the rule-management UI twice without meaningful benefit.

**Trade-offs:**
- Pro: single TypeScript rule engine + UI, native modules for the platform-specific parts
- Con: React Native Metro bundler adds complexity; native bridge must be tested independently
- Con: `react-native-mmkv` v4 uses NitroModules (C++ bridge) — requires explicit `io.github.zhongwuzw:mmkv:2.4.0` in `android/app/build.gradle` because the library's own dep is declared `implementation` (not `api`)

---

## ADR-2: iOS exact-number blocking only (reduced feature set)

**Status:** Accepted

**Context:** Android `CallScreeningService` can evaluate arbitrary rules in real time. iOS `CXCallDirectory` requires a pre-computed list of exact phone numbers; it cannot do prefix matching at runtime.

**Decision:** iOS MVP supports exact-number blocking only. Prefix rules are stored and applied on Android; on iOS they display a warning badge ("Android only") and are excluded from the extension's number list.

**Trade-offs:**
- Pro: unblocks Android delivery without waiting for an iOS workaround
- Pro: honest UX — users see which features work on each platform
- Con: iOS users cannot block broad prefixes (e.g. "all 03... numbers")

---

## ADR-3: react-native-mmkv for cross-process storage

**Status:** Accepted

**Context:** Android `CallScreeningService` runs in the same app process but without a JavaScript runtime. It needs to read the current rule set at the moment a call arrives.

**Decision:** Use `react-native-mmkv` (NitroMmkv v4). MMKV files are written by the JS layer and read natively by Kotlin using the same `io.github.zhongwuzw:mmkv` library under the hood, with no IPC overhead.

**Key implementation detail:** NitroMmkv v4 declares `io.github.zhongwuzw:mmkv:2.4.0` as `implementation` in its Gradle build, so `com.tencent.mmkv.MMKV` is not on the app's compile classpath by default. The app's `android/app/build.gradle` must repeat the declaration explicitly.

**Trade-offs:**
- Pro: zero-overhead in-process reads from the native service
- Pro: same file format on Android and iOS (App Group path on iOS)
- Con: JS API changed in v4 (`new MMKV()` → `createMMKV()`); Jest mocks must be updated accordingly

---

## ADR-4: Zustand over Redux or Context

**Status:** Accepted

**Context:** The app state is shallow: a list of rules, platform status, and conflict warnings. It needs to be shared between 5 screens.

**Decision:** Use Zustand. The store has 7 actions and a flat shape; Redux would add significant boilerplate for no benefit. React Context would require careful memoisation to avoid re-render cascades.

**Trade-offs:**
- Pro: minimal setup (one `create()` call, no Provider wrapping)
- Pro: actions are plain functions, easy to unit-test by calling `useRulesStore.getState().action()`
- Con: Zustand is less familiar than Redux to some React Native developers
- Con: no built-in devtools (can be added via `zustand/middleware`)
