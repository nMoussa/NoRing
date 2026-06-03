package com.noring

import android.telecom.Call
import android.telecom.CallScreeningService
import android.util.Log

class NoRingCallScreeningService : CallScreeningService() {

    override fun onScreenCall(callDetails: Call.Details) {
        val handle = callDetails.handle?.schemeSpecificPart
        Log.d(TAG, "Screening call from: $handle")

        val rules = RuleStorage.loadRules(applicationContext)
        val match = RuleEngine.evaluate(handle, rules)

        val response = if (match != null) {
            Log.d(TAG, "Rule matched: ${match.ruleId}, action: ${match.action}")
            RuleStorage.writeLastBlockedTimestamp(applicationContext)
            buildResponse(match.action)
        } else {
            Log.d(TAG, "No rule matched — allowing call")
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
        .build()

    companion object {
        private const val TAG = "NoRingScreening"
    }
}
