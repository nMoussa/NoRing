# Troubleshooting

Common issues encountered during development and CI setup, each with symptom, root cause, and fix.

---

## iOS / Ruby / CocoaPods

### `String#untaint` crash during `bundle install`

**Symptom:**
```
undefined method `untaint' for "...":String (NoMethodError)
```

**Cause:** `Gemfile.lock` records `BUNDLED WITH 1.17.2`. Bundler 1.17.x calls `String#untaint`, which was removed in Ruby 3.2.

**Fix:** The lock file now says `BUNDLED WITH 2.6.9`. If you see this error, ensure you are running Ruby 3.1 and run:
```bash
bundle install
```

---

### `CFPropertyList-3.0.9 requires ruby version < 3.2`

**Symptom:**
```
CFPropertyList-3.0.9 requires ruby version < 3.2, which is incompatible
with the current version, 3.2.x
```

**Cause:** `xcodeproj` depends on `CFPropertyList`. Version 3.0.9 (pinned in `Gemfile`) supports Ruby `< 3.2` only.

**Fix:** Use Ruby **3.1**. Bundler 2.7+ requires Ruby ≥ 3.2, so use Bundler **2.6.9** (already in `Gemfile.lock`). See `docs/SETUP_GUIDE.md §4b`.

---

### `Unexpected XCode version string ''`

**Symptom:** `xcode-select` returns an empty string; CocoaPods or `xcodebuild` fail.

**Cause:** `xcode-select` is pointing at Command Line Tools instead of the full Xcode.app.

**Fix:**
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcode-select -p   # verify output
```

---

### `objectVersion 70 not in compatibility table`

**Symptom:**
```
ArgumentError - [Xcodeproj] Unable to find compatibility version string
for object version `70`.
```

**Cause:** `xcodeproj` 1.27.0 knows versions up to 77, but has a gap at 70 (Xcode 16.x generated this). The Pods project creation fails.

**Fix:** `objectVersion` in `ios/NoRing.xcodeproj/project.pbxproj` is set to `63` (Xcode 15.3 compat). This is already applied; only re-check if you regenerate the project file.

---

## Android / Kotlin

### `Unresolved reference 'MMKV'` in Kotlin

**Symptom:** `compileDebugKotlin` fails with `Unresolved reference 'MMKV'` in `CallScreeningModule.kt` or `RuleStorage.kt`.

**Cause:** `react-native-mmkv` v4 (NitroMmkv) declares `io.github.zhongwuzw:mmkv` as `implementation` in its own build file. That scope is not exposed to the consuming app's compile classpath.

**Fix:** `android/app/build.gradle` explicitly re-declares the same dependency:
```groovy
implementation 'io.github.zhongwuzw:mmkv:2.4.0'
```
Do **not** also add `com.tencent:mmkv` — it contains the same classes and causes a duplicate-class error at dex-merge time.

---

### `import com.facebook.react.modules.storage.AsyncStorageModule` fails

**Symptom:** Kotlin compilation error on the import line.

**Cause:** `AsyncStorageModule` was removed from React Native core in RN 0.71. It no longer exists in the classpath.

**Fix:** Remove the import. It was unused.

---

### `'onActivityResult' overrides nothing`

**Symptom:** Kotlin compilation error in `BaseActivityEventListener` subclass.

**Cause:** In RN 0.73+, `onActivityResult`'s `Activity` parameter is non-nullable. Using `Activity?` (nullable) does not match the signature.

**Fix:** Use `Activity` (non-nullable) in the override.

---

## CI / GitHub Actions

### safe-chain blocks `npm ci`

**Symptom:**
```
npm error 403 403 Forbidden - blocked by safe-chain direct download
minimum package age (libphonenumber-js@x.x.x)
```

**Cause:** safe-chain enforces a 48-hour minimum age policy on newly-published packages. Lock-file installs are affected even for old packages if the CI runner's clock differs.

**Fix:** Pass `--safe-chain-skip-minimum-package-age` to `npm ci`:
```yaml
- name: Install dependencies
  run: npm ci --safe-chain-skip-minimum-package-age
```
This is already configured in all three workflows.

---

### `Bundler 2.7.x requires Ruby >= 3.2` in CI

**Symptom:** CI fails installing Bundler.

**Cause:** `bundler: 'latest'` resolved to Bundler 2.7.x, which requires Ruby ≥ 3.2. But `CFPropertyList 3.0.9` requires Ruby `< 3.2`. There is no single Ruby version satisfying both.

**Fix:** `ios.yml` pins `ruby-version: '3.1'` and `bundler: '2.6.9'`. Both constraints are satisfied by Ruby 3.1 + Bundler 2.6.9.
