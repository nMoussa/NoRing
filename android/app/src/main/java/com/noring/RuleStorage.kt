package com.noring

import android.content.Context
import com.facebook.react.modules.storage.AsyncStorageModule
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

    fun loadRules(context: Context): List<StoredRule> {
        return try {
            val mmkv = com.tencent.mmkv.MMKV.mmkvWithID(MMKV_ID)
            val json = mmkv.decodeString(RULES_KEY) ?: return emptyList()
            val arr = JSONArray(json)
            val rules = mutableListOf<StoredRule>()
            for (i in 0 until arr.length()) {
                val obj: JSONObject = arr.getJSONObject(i)
                if (!obj.optBoolean("enabled", false)) continue
                rules.add(
                    StoredRule(
                        id = obj.getString("id"),
                        enabled = obj.getBoolean("enabled"),
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
            val mmkv = com.tencent.mmkv.MMKV.mmkvWithID(MMKV_ID)
            mmkv.encode("lastBlockedCallTimestamp", System.currentTimeMillis())
        } catch (_: Exception) {}
    }
}
