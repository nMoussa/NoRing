package com.noring

import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.tencent.mmkv.MMKV

class CallScreeningModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var roleRequestPromise: Promise? = null
    private val REQUEST_ROLE_CODE = 1001

    private val activityEventListener: ActivityEventListener =
        object : BaseActivityEventListener() {
            // RN 0.73+ signature: Activity is non-nullable
            override fun onActivityResult(
                activity: Activity,
                requestCode: Int,
                resultCode: Int,
                data: Intent?,
            ) {
                if (requestCode == REQUEST_ROLE_CODE) {
                    val granted = resultCode == Activity.RESULT_OK
                    roleRequestPromise?.resolve(granted)
                    roleRequestPromise = null
                }
            }
        }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName() = "CallScreeningModule"

    @ReactMethod
    fun getRoleStatus(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            promise.resolve("unavailable")
            return
        }
        val roleManager =
            reactContext.getSystemService(Context.ROLE_SERVICE) as RoleManager
        val held = roleManager.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)
        promise.resolve(if (held) "granted" else "denied")
    }

    @ReactMethod
    @RequiresApi(Build.VERSION_CODES.Q)
    fun requestRole(promise: Promise) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.resolve(false)
            return
        }
        val roleManager =
            activity.getSystemService(Context.ROLE_SERVICE) as RoleManager
        if (roleManager.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) {
            promise.resolve(true)
            return
        }
        roleRequestPromise = promise
        val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)
        activity.startActivityForResult(intent, REQUEST_ROLE_CODE)
    }

    @ReactMethod
    fun getLastBlockedCallTimestamp(promise: Promise) {
        MMKV.initialize(reactContext)
        val mmkv = MMKV.mmkvWithID("noring-storage")
        val ts = mmkv.decodeLong("lastBlockedCallTimestamp", -1L)
        if (ts == -1L) {
            promise.resolve(null)
        } else {
            promise.resolve(ts.toDouble())
        }
    }
}
