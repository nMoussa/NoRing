import Foundation

/// React Native bridge for CallDirectoryManager operations.
@objc(CallDirectoryBridge)
class CallDirectoryBridge: NSObject {

    @objc static func requiresMainQueueSetup() -> Bool { false }

    @objc func syncAndReload(
        _ blockedNumbers: [String],
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        CallDirectoryManager.syncAndReload(blockedNumbers: blockedNumbers) { error in
            if let error = error {
                // Save reload error to App Group for Diagnostics screen
                if let defaults = UserDefaults(suiteName: "group.com.noring.shared") {
                    defaults.set(error.localizedDescription, forKey: "lastReloadError")
                }
                reject("RELOAD_FAILED", error.localizedDescription, error)
            } else {
                if let defaults = UserDefaults(suiteName: "group.com.noring.shared") {
                    defaults.set(nil, forKey: "lastReloadError")
                    defaults.set(Date().timeIntervalSince1970, forKey: "lastReloadTime")
                }
                resolve(true)
            }
        }
    }

    @objc func getEnabledStatus(
        _ resolve: @escaping RCTPromiseResolveBlock,
        reject _: RCTPromiseRejectBlock
    ) {
        CallDirectoryManager.getEnabledStatus { status in
            resolve(status)
        }
    }

    @objc func openSettings(
        _ resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        CallDirectoryManager.openSettings { error in
            if let error = error {
                reject("OPEN_SETTINGS_FAILED", error.localizedDescription, error)
            } else {
                resolve(true)
            }
        }
    }
}
