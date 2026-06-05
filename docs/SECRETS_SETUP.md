# GitHub Secrets Setup for CI Signing

The Android release signing keystore and its credentials must **never** be committed to the repository. They are stored as GitHub repository secrets and decoded at build time.

---

## Required secrets

| Secret name | Value |
|---|---|
| `KEYSTORE_BASE64` | Base64-encoded content of `noring-release.keystore` |
| `KEYSTORE_STORE_PASSWORD` | The store password you chose when running `keytool` |
| `KEYSTORE_KEY_ALIAS` | The key alias (e.g. `noring`) |
| `KEYSTORE_KEY_PASSWORD` | The key password you chose when running `keytool` |

---

## One-time setup

### Step 1 — Generate the keystore (do this once, keep it safe)

```bash
keytool -genkeypair -v \
  -keystore android/app/noring-release.keystore \
  -alias noring \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=NoRing, OU=Mobile, O=LoopEarplugs, L=Paris, ST=IDF, C=FR"
```

You will be prompted to set a store password and key password. Store both passwords in a password manager.

> **Important:** Back up `noring-release.keystore` to a secure location outside the repo (e.g. 1Password, a secure S3 bucket). If you lose this file, you can never push an update to existing installs.

### Step 2 — Base64-encode the keystore

```bash
base64 -i android/app/noring-release.keystore | pbcopy   # macOS — copies to clipboard
# or
base64 android/app/noring-release.keystore               # Linux — prints to stdout
```

### Step 3 — Add secrets to GitHub

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add each of the four secrets listed above

### Step 4 — Delete the local keystore file after uploading

```bash
rm android/app/noring-release.keystore
```

`android/app/noring-release.keystore` is in `.gitignore` (matched by `*.keystore`) so it will not be committed even if you forget to delete it, but removing it reduces the attack surface.

---

## How CI uses the secrets

The `android.yml` workflow:
1. Decodes `KEYSTORE_BASE64` → `android/app/noring-release.keystore`
2. Writes `android/keystore.properties` with the passwords
3. Runs `./gradlew assembleRelease`
4. **Always** deletes the keystore file and properties after the build (`if: always()` cleanup step)

If the secrets are not configured (e.g. on a forked PR), the workflow automatically falls back to `assembleDebug` — no secrets are required for CI to pass.

---

## Security properties

- The keystore file never touches the git history
- Passwords are only in GitHub's encrypted secrets store, never in workflow logs
- The `GITHUB_RUN_NUMBER` env var auto-increments `versionCode` on each CI run, making each build traceable
- The cleanup step runs even if the build fails, ensuring the decoded keystore is always removed
