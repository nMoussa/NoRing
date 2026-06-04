package com.noring

import android.content.Context
import com.tencent.mmkv.MMKV
import org.json.JSONArray
import org.json.JSONObject

data class StoredRule(
    val id: String,
    val enabled: Boolean,
    val matchType: String,      // "exact" | "prefix"
    val patternNormalized: String,
    val action: String,         // "block_voicemail" | "reject" | "silent" | "allow"
    val priority: Int,
)

object RuleStorage {
    private const val MMKV_ID = "noring-storage"
    private const val RULES_KEY = "rules"

    private fun mmkv(context: Context): MMKV {
        // initialize() is idempotent; react-native-mmkv v4 uses the same default path
        MMKV.initialize(context)
        return MMKV.mmkvWithID(MMKV_ID)
    }

    fun loadRules(context: Context): List<StoredRule> {
        return try {
            val json = mmkv(context).decodeString(RULES_KEY) ?: return emptyList()
            val arr = JSONArray(json)
            val rules = mutableListOf<StoredRule>()
            for (i in 0 until arr.length()) {
                val obj: JSONObject = arr.getJSONObject(i)
                // Load all rules regardless of enabled state; RuleEngine filters
                rules.add(
                    StoredRule(
                        id = obj.getString("id"),
                        enabled = obj.optBoolean("enabled", false),
                        matchType = obj.getString("matchType"),
                        patternNormalized = obj.getString("patternNormalized"),
                        action = obj.getString("action"),
                        priority = obj.optInt("priority", 100),
                    )
                )
            }
            rules
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun writeLastBlockedTimestamp(context: Context) {
        try {
            mmkv(context).encode("lastBlockedCallTimestamp", System.currentTimeMillis())
        } catch (_: Exception) {}
    }
}
