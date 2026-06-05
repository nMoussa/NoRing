# Add project specific ProGuard rules here.

# ── React Native ──────────────────────────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.**

# ── MMKV (io.github.zhongwuzw:mmkv) ──────────────────────────────────────────
-keep class com.tencent.mmkv.** { *; }
-dontwarn com.tencent.mmkv.**

# ── libphonenumber ─────────────────────────────────────────────────────────────
-keep class com.google.i18n.phonenumbers.** { *; }
-dontwarn com.google.i18n.phonenumbers.**

# ── NoRing native modules ──────────────────────────────────────────────────────
-keep class com.noring.** { *; }

# ── Kotlin ────────────────────────────────────────────────────────────────────
# Only keep what Kotlin reflection and coroutines need; do not blanket-keep
# all Kotlin/kotlinx classes as that defeats obfuscation.
-keep class kotlin.Metadata { *; }
-keep class kotlin.jvm.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**
