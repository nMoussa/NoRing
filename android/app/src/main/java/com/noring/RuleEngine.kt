package com.noring

import com.google.i18n.phonenumbers.PhoneNumberUtil
import com.google.i18n.phonenumbers.NumberParseException

object RuleEngine {
    private val phoneUtil = PhoneNumberUtil.getInstance()

    data class RuleMatch(val action: String, val ruleId: String)

    // French emergency numbers (E.164 prefixes)
    private val EMERGENCY_PREFIXES = listOf("+33112", "+3315", "+3317", "+3318")

    fun evaluate(rawNumber: String?, rules: List<StoredRule>): RuleMatch? {
        if (rawNumber.isNullOrBlank()) return null

        val e164 = toE164(rawNumber) ?: return null

        if (isEmergency(e164)) return null

        val sorted = rules
            .filter { it.enabled }
            .sortedWith(compareByDescending<StoredRule> { it.priority }
                .thenByDescending { specificity(it.matchType) })

        for (rule in sorted) {
            if (matches(rule, e164)) {
                return RuleMatch(rule.action, rule.id)
            }
        }
        return null
    }

    private fun toE164(raw: String): String? {
        return try {
            val cleaned = raw.trim()
            val parsed = phoneUtil.parse(cleaned, "FR")
            if (!phoneUtil.isValidNumber(parsed)) return null
            phoneUtil.format(parsed, PhoneNumberUtil.PhoneNumberFormat.E164)
        } catch (_: NumberParseException) {
            null
        }
    }

    private fun isEmergency(e164: String): Boolean {
        return EMERGENCY_PREFIXES.any { e164.startsWith(it) }
    }

    private fun specificity(matchType: String): Int = when (matchType) {
        "exact" -> 2
        "prefix" -> 1
        else -> 0
    }

    private fun matches(rule: StoredRule, e164: String): Boolean = when (rule.matchType) {
        "exact" -> e164 == rule.patternNormalized
        "prefix" -> e164.startsWith(rule.patternNormalized)
        else -> false
    }
}
