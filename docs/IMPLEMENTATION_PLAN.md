# NoRing — Call Filtering App Implementation Plan

## Context

NoRing lets users define phone-number patterns (e.g., "all French numbers starting with 03") and choose what happens when an incoming call matches: block to voicemail, reject outright, or silence the ring. The spec surfaces a key platform asymmetry: Android supports real-time prefix matching via `CallScreeningService`, while iOS `Call Directory` only accepts precomputed exact-number lists. The plan embraces this asymmetry — iOS ships with a reduced but honest feature set while Android gets the full experience.

**Confirmed decisions:**
- Stack: React Native (TypeScript) + native Kotlin (Android) + native Swift (iOS)
- iOS: reduced feature set accepted — exact-number blocking only for MVP
- Country scope: France only for MVP

---

## Repository Structure

```
NoRing/
├── docs/
│   └── IMPLEMENTATION_PLAN.md            # This document
├── src/                                  # React Native TypeScript app
│   ├── navigation/
│   │   └── RootNavigator.tsx             # Stack navigator (5 screens)
│   ├── screens/
│   │   ├── OnboardingScreen.tsx          # Permission/role setup flow
│   │   ├── HomeScreen.tsx                # Rule list + platform status banner
│   │   ├── RuleEditorScreen.tsx          # Create / edit a rule
│   │   ├── SimulatorScreen.tsx           # Type a number → see which rule fires
│   │   └── DiagnosticsScreen.tsx         # Role status, iOS extension status, last reload
│   ├── components/
│   │   ├── RuleCard.tsx                  # Rule list item with toggle + action badge
│   │   ├── ActionBadge.tsx               # Block / Reject / Silent chip
│   │   ├── NumberPreview.tsx             # Live E.164 preview while typing a pattern
│   │   └── StatusBanner.tsx              # Amber permission-warning tap-to-fix banner
│   ├── services/
│   │   ├── ruleEngine.ts                 # Normalize, match, conflict-detect
│   │   ├── phoneNumber.ts                # libphonenumber-js wrapper (France focus)
│   │   ├── storage.ts                    # MMKV abstraction (rules + settings)
│   │   ├── nativeBridge.ts               # Typed JS wrappers for Android/iOS native modules
│   │   └── platformSync.ts               # Wires MMKV write callback to iOS extension reload
│   ├── store/
│   │   └── rulesStore.ts                 # Zustand store: rules[], platformStatus, conflicts
│   ├── types/
│   │   └── Rule.ts                       # Shared Rule interface and action/matchType enums
│   └── i18n/
│       ├── en.json                       # English strings
│       ├── fr.json                       # French strings
│       └── useTranslation.ts             # Locale hook (reads device locale, returns typed strings)
├── android/
│   └── app/src/main/java/com/noring/
│       ├── NoRingCallScreeningService.kt # CallScreeningService — real-time screening
│       ├── RuleEngine.kt                 # Kotlin mirror of ruleEngine.ts (runs without JS runtime)
│       ├── RuleStorage.kt                # Reads MMKV rules from native side
│       ├── CallScreeningModule.kt        # RN bridge: role status, request role, last blocked ts
│       └── CallScreeningPackage.kt       # ReactPackage registering CallScreeningModule
├── ios/
│   ├── NoRing/
│   │   ├── AppGroupStorage.swift         # Shared UserDefaults writer/reader (group.com.noring.shared)
│   │   ├── CallDirectoryManager.swift    # Triggers extension reload, reports status
│   │   ├── CallDirectoryBridge.m         # Objective-C RN bridge declarations (RCT_EXTERN_MODULE)
│   │   └── CallDirectoryBridge.swift     # Swift implementation of the RN bridge methods
│   ├── CallDirectoryExtension/
│   │   ├── CallDirectoryHandler.swift    # CXCallDirectoryProvider — reads App Group → blocks numbers
│   │   ├── CallDirectoryExtension.entitlements
│   │   └── Info.plist                    # NSExtension keys (merged with generated base by Xcode)
│   ├── NoRing.entitlements               # App Group capability for main target
│   └── Podfile                           # CocoaPods: NoRing + empty CallDirectoryExtension target
├── __tests__/
│   ├── phoneNumber.test.ts               # 10 French format + emergency tests
│   ├── ruleEngine.test.ts                # 32 match / priority / conflict tests
│   └── storage.test.ts                   # 14 CRUD + callback tests
└── package.json
```

---

## Rule Data Model

```typescript
// src/types/Rule.ts
interface Rule {
  id: string;                              // UUID v4
  enabled: boolean;
  country: 'FR';                           // MVP: France only
  matchType: 'exact' | 'prefix';          // MVP types; regex is Android-only later
  patternRaw: string;                      // User input: "03" or "+33312345678"
  patternNormalized: string;               // E.164 form: "+333" or "+33312345678"
  action: 'block_voicemail' | 'reject' | 'silent' | 'allow';
  priority: number;                        // Higher wins; allowlist rules use high priority
  createdAt: string;                       // ISO 8601
}
```

iOS note: for `block_voicemail` / `reject` / `silent`, iOS will display a single "blocked" outcome. The UX must state this in the rule editor when an action is selected.

---

## Phase 0 — Project Bootstrap + Feasibility Spikes

**Goal:** Running skeleton + prove OS APIs work on real devices before building full UI.

### 0.1 Initialize React Native project
```bash
npx react-native@latest init NoRing --template react-native-template-typescript
```
Immediately add:
- `react-native-mmkv` — fast local storage (replaces AsyncStorage; native reads from Kotlin/Swift)
- `libphonenumber-js` — French number parsing/normalization
- `zustand` — state management
- `@react-navigation/native` + `@react-navigation/stack` — navigation
- `react-native-permissions` — runtime permission checks

### 0.2 Android CallScreeningService spike
Create a minimal `NoRingCallScreeningService.kt` that:
1. Declares `<service android:permission="android.permission.BIND_SCREENING_SERVICE">` in `AndroidManifest.xml`
2. Logs the incoming number and responds with `disallowCall(false)` (allow all, no side effects yet)
3. Requests the call-screening role via `RoleManager` from a test Activity

**Exit criterion:** App appears in Android "Default apps → Phone app" or can be set as call screener; incoming test call triggers the service log.

### 0.3 iOS Call Directory spike
Create a minimal `CallDirectoryExtension` target with `CallDirectoryHandler.swift` that:
1. Uses `addBlockingEntry(withNextSequentialPhoneNumber:)` with one hardcoded test number
2. Uses an App Group container (`group.com.noring.shared`) so the host app can write to it
3. Adds `CXCallDirectoryManager.sharedInstance.openSettings` deep link in the host app

**Exit criterion:** After enabling in iOS Settings, the hardcoded test number is blocked on a real device.

### 0.4 French number normalization validation
Test cases to pass before Phase 1:
- `03 12 34 56 78` → `+33312345678`
- `0033312345678` → `+33312345678`
- `+33312345678` → `+33312345678`
- prefix `03` → normalized prefix `+333`
- prefix `+333` → normalized prefix `+333`

---

## Phase 1 — Shared Rule Engine

**Goal:** Deterministic rule matching with unit tests, no UI yet.

### 1.1 Number normalization (`src/services/phoneNumber.ts`)
- Wrap `libphonenumber-js` `parsePhoneNumber` with country hint `'FR'`
- Handle national (`03...`), international with `00` prefix, and E.164 input
- Return E.164 string or `null` for unparseable input
- Expose `normalizePrefixPattern(raw, country)` → E.164 prefix string

### 1.2 Rule matcher (`src/services/ruleEngine.ts`)
Evaluation order (mirrors spec §4.2):
1. Return `allow` for emergency numbers (112, 15, 17, 18 in France)
2. Check user contacts allowlist (stub for MVP)
3. Sort enabled rules by `priority` DESC, then by specificity (`exact` > `prefix`)
4. First match wins; return `{ matchedRule, action }` or `{ action: 'allow' }` (default)

### 1.3 Conflict detection
- Warn (non-blocking) when two rules with equal priority and overlapping patterns have different actions
- Surface warning in rule editor and diagnostics

### 1.4 Storage (`src/services/storage.ts`)
- CRUD for rules using `react-native-mmkv` (JSON-serialized `Rule[]`)
- Separate key for `platformStatus` (last iOS reload time, Android role granted flag)
- On every write, call `triggerPlatformSync()` — no-op in JS, overridden by native bridge

### 1.5 Kotlin rule engine mirror (`android/.../RuleEngine.kt`)
Duplicate the evaluation logic in Kotlin so `NoRingCallScreeningService` can run it in-process (the service runs in the app process but without a JS runtime):
- Read rules from MMKV native API (same file, same keys as the RN side)
- Normalize via `com.googlecode.libphonenumber` (add to `build.gradle`)
- Return `RuleMatch(action, ruleId)` or `null` (allow)

### 1.6 Unit tests
`__tests__/ruleEngine.test.ts` must cover:
- French formats (national, international `00`, E.164, with spaces/dashes)
- Exact match wins over prefix when both match the same number
- Disabled rule is ignored
- Priority tie: first rule in sorted order wins (deterministic)
- Emergency numbers always allowed
- Unknown/private number (no caller ID) → allow by default

---

## Phase 2 — Android MVP

**Goal:** Real calls are screened by user rules on Android.

### 2.1 `NoRingCallScreeningService.kt`
```kotlin
override fun onScreenCall(callDetails: Call.Details) {
  val handle = callDetails.handle?.schemeSpecificPart ?: return respondAllow()
  val match = RuleEngine.evaluate(handle, RuleStorage.loadRules(applicationContext))
  val response = match?.toCallResponse() ?: CallResponse.Builder()
      .setDisallowCall(false).setRejectCall(false).setSilenceCall(false).build()
  respondToCall(response)
}
```

Action → `CallResponse` mapping:

| Action | `disallowCall` | `rejectCall` | `silenceCall` | `skipNotification` |
|---|---|---|---|---|
| `block_voicemail` | true | false | false | true |
| `reject` | true | true | false | true |
| `silent` | false | false | true | false |
| `allow` | false | false | false | false |

### 2.2 `CallScreeningModule.kt` (RN bridge)
Exposes to JS:
- `getRoleStatus(): Promise<'granted' | 'denied' | 'unavailable'>` — checks `RoleManager.isRoleHeld(ROLE_CALL_SCREENING)`
- `requestRole(): Promise<boolean>` — launches `RoleManager` intent
- `getLastBlockedCallTimestamp(): Promise<number | null>` — reads from MMKV (service writes on each block)

Register module in `MainApplication.kt`.

### 2.3 `AndroidManifest.xml` additions
```xml
<service android:name=".NoRingCallScreeningService"
         android:permission="android.permission.BIND_SCREENING_SERVICE"
         android:exported="true">
  <intent-filter>
    <action android:name="android.telecom.CallScreeningService"/>
  </intent-filter>
</service>
<uses-permission android:name="android.permission.READ_PHONE_STATE"/>
```
Do **not** request `READ_CALL_LOG` — modern screening API does not require it.

### 2.4 Android onboarding flow (`OnboardingScreen.tsx`)
1. Check role status on mount
2. If not granted: explain why, show "Enable" button → call `requestRole()`
3. On grant: show success state, navigate to HomeScreen
4. Persistent status banner on HomeScreen if role is later revoked

---

## Phase 3 — iOS MVP

**Goal:** Exact-number blocking works; iOS limitation clearly communicated.

### 3.1 App Group setup
- Add App Group `group.com.noring.shared` to both the main app target and the `CallDirectoryExtension` target in Xcode entitlements
- `AppGroupStorage.swift`: writes/reads a JSON-encoded `[String]` (E.164 blocked numbers) to the shared UserDefaults suite

### 3.2 `CallDirectoryHandler.swift`
```swift
override func beginRequest(with context: CXCallDirectoryExtensionContext) {
  let numbers = AppGroupStorage.loadBlockedNumbers()  // must be sorted ascending
  for number in numbers {
    if let n = Int64(number.replacingOccurrences(of: "+", with: "")) {
      context.addBlockingEntry(withNextSequentialPhoneNumber: n)
    }
  }
  context.completeRequest()
}
```

### 3.3 `CallDirectoryManager.swift` + bridge
- `reloadExtension()` → `CXCallDirectoryManager.sharedInstance.reloadExtension(withIdentifier:)`
- `getExtensionEnabledStatus()` → `CXCallDirectoryManager.sharedInstance.getEnabledStatusForExtension`
- `openSettings()` → `CXCallDirectoryManager.sharedInstance.openSettings`
- Expose all three to RN via `CallDirectoryBridge.m`

### 3.4 iOS rule sync trigger
When rules change in the RN store, call `triggerPlatformSync()`:
- Collect all `enabled` rules → extract only `exact` match rules (prefix rules get a warning badge) → write E.164 numbers to App Group → call `reloadExtension()`
- Prefix rules on iOS display: "iOS supports exact numbers only. This rule is active on Android only."

### 3.5 iOS onboarding additions
Show "Enable call blocking in iOS Settings" card with "Open Settings" button → `openSettings()`. Poll `getExtensionEnabledStatus()` on app foreground to update the status banner.

---

## Phase 4 — UI & Polish

### 4.1 HomeScreen
- Rule list with `RuleCard` (pattern, action badge, enabled toggle, Android-only warning for prefix rules on iOS)
- Status banner: Android role / iOS extension enabled state
- FAB → RuleEditorScreen

### 4.2 RuleEditorScreen
- Country selector (France only, single locked option for MVP)
- Pattern input with live `NumberPreview` showing normalized E.164 output
- Match type toggle: Exact / Prefix
- Action picker with inline iOS caveat when prefix is selected
- Save → writes to store → triggers platform sync

### 4.3 SimulatorScreen
- Free-text number input → normalize → run through rule engine → show matched rule, action, and iOS equivalent outcome

### 4.4 DiagnosticsScreen
- Android: role status, last call screened timestamp
- iOS: extension enabled, App Group write success, last reload time, reload error, number of entries in extension
- "Force reload" button for iOS

### 4.5 Accessibility & localization
- All strings in `i18n/en.json` and `i18n/fr.json`
- VoiceOver / TalkBack labels on all interactive elements

---

## Phase 5 — Store Submission

### Google Play
- Permission declarations for `READ_PHONE_STATE`
- Core functionality statement for call-screening role (Play default-handler policy)
- No `READ_CALL_LOG` requested → simplifies review
- Include test account + test number in review notes

### Apple App Store
- App Privacy nutrition label: no data collected (local-only by default)
- Review notes: explain Call Directory extension and step-by-step enablement in Settings
- Privacy policy hosted URL (required)

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `react-native-mmkv` | Fast cross-process local storage (readable from Kotlin/Swift natively) |
| `react-native-nitro-modules` | Peer dependency required by react-native-mmkv v4 (Nitro architecture) |
| `libphonenumber-js` | French number parsing and normalization |
| `zustand` | Lightweight state management |
| `@react-navigation/native` + `@react-navigation/stack` | Screen navigation |
| `react-native-permissions` | Runtime permission checks |
| `react-native-gesture-handler` | Required by React Navigation stack |
| `react-native-screens` | Native screen containers for React Navigation |
| `react-native-safe-area-context` | Safe area insets |
| `uuid` | UUID v4 generation for rule IDs |
| `com.googlecode.libphonenumber` (Gradle) | Kotlin-side normalization inside the screening service |

---

## Verification Plan

### Unit tests
```bash
yarn test   # ruleEngine.test.ts, phoneNumber.test.ts, storage.test.ts
```
Covers: all French number formats, rule priority, conflict detection, disabled rules, emergency passthrough.

### Android device tests (Pixel + Samsung, Android 10+)
1. Set NoRing as call screener in Default Apps
2. Call from a French 03... number → verify blocked
3. Call from a non-matching number → verify passes through
4. Disable the rule → verify call passes through
5. Revoke role mid-session → verify HomeScreen shows warning banner
6. Confirm no `READ_CALL_LOG` permission is requested at runtime

### iOS device tests (real device mandatory — simulator cannot test cellular)
1. Enable Call Directory extension in Settings
2. Add an exact French number rule → verify it blocks on a real incoming call
3. Add a prefix rule → verify yellow "iOS only partial" warning appears
4. Force-reload extension → verify `getExtensionEnabledStatus` remains `enabled`
5. Kill and relaunch app → verify extension persists without user action
6. Extension reload failure → verify DiagnosticsScreen shows error and "Force reload" CTA

### Privacy test
Verify via network proxy that no phone numbers or call events leave the device during normal operation.

---

## Risk Callouts

1. **Android role not granted**: Onboarding must be extremely clear; graceful inactive state (banner, no crash).
2. **Carrier/OEM CallResponse behavior varies**: Phrase copy as "may be sent to voicemail" not "will"; build an OEM test matrix post-spike.
3. **iOS extension reload failure**: Surface errors prominently in Diagnostics; add retry logic with exponential backoff.
4. **iOS prefix rules requested by users**: Clear in-app messaging that iOS cannot do prefix matching; never silently ignore those rules.
