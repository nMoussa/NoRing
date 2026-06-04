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
                // Store only error domain+code (not localizedDescription) to avoid
                // persisting system paths or call data in the shared App Group.
                let sanitized = "[\((error as NSError).domain)] code \((error as NSError).code)"
                if let defaults = UserDefaults(suiteName: "group.com.noring.shared") {
                    defaults.set(sanitized, forKey: "lastReloadError")
                }
                reject("RELOAD_FAILED", sanitized, error)
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
