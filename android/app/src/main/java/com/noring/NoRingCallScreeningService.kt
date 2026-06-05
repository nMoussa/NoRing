package com.noring

import android.telecom.Call
import android.telecom.CallScreeningService
import android.util.Log

class NoRingCallScreeningService : CallScreeningService() {

    override fun onScreenCall(callDetails: Call.Details) {
        val handle = callDetails.handle?.schemeSpecificPart

        // Guard: reject handles that don't look like phone numbers to prevent
        // any downstream processing of unexpected input from the telecom layer.
        if (handle != null && !handle.matches(Regex("[0-9+#*]{1,20}"))) {
            Log.w(TAG, "Unexpected handle format — allowing call")
            respondToCall(callDetails, allowResponse())
            return
        }

        // Never log the actual phone number — it is PII. Debug builds may log
        // a redacted marker so developers can trace the screening flow.
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "onScreenCall invoked (handle redacted)")
        }

        val rules = RuleStorage.loadRules(applicationContext)
        val match = RuleEngine.evaluate(handle, rules)

        val response = if (match != null) {
            if (BuildConfig.DEBUG) {
                Log.d(TAG, "Rule matched: ruleId=${match.ruleId}, action=${match.action}")
            }
            if (match.action == "block_voicemail" || match.action == "reject") {
                RuleStorage.writeLastBlockedTimestamp(applicationContext)
            }
            buildResponse(match.action)
        } else {
            if (BuildConfig.DEBUG) {
                Log.d(TAG, "No rule matched — allowing call")
            }
            allowResponse()
        }

        respondToCall(callDetails, response)
    }

    private fun buildResponse(action: String): CallResponse {
        return when (action) {
            "block_voicemail" -> CallResponse.Builder()
                .setDisallowCall(true)
                .setRejectCall(false)
                .setSkipNotification(true)
                .setSilenceCall(false)
                .build()
            "reject" -> CallResponse.Builder()
                .setDisallowCall(true)
                .setRejectCall(true)
                .setSkipNotification(true)
                .setSilenceCall(false)
                .build()
            "silent" -> CallResponse.Builder()
                .setDisallowCall(false)
                .setRejectCall(false)
                .setSkipNotification(false)
                .setSilenceCall(true)
                .build()
            else -> allowResponse()
        }
    }

    private fun allowResponse(): CallResponse = CallResponse.Builder()
        .setDisallowCall(false)
        .setRejectCall(false)
        .setSilenceCall(false)
        .setSkipNotification(false)
        .build()

    companion object {
        private const val TAG = "NoRingScreening"
    }
}
