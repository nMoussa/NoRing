import Foundation
import CallKit

/// Manages the Call Directory extension: reload triggering and status checks.
@objc class CallDirectoryManager: NSObject {

    private static let extensionIdentifier = "com.noring.CallDirectoryExtension"

    /// Writes the current blocked-numbers list to the App Group, then reloads the extension.
    @objc static func syncAndReload(blockedNumbers: [String], completion: @escaping (Error?) -> Void) {
        AppGroupStorage.saveBlockedNumbers(blockedNumbers)
        CXCallDirectoryManager.sharedInstance.reloadExtension(withIdentifier: extensionIdentifier) { error in
            completion(error)
        }
    }

    /// Returns the enabled status of the Call Directory extension.
    @objc static func getEnabledStatus(completion: @escaping (String) -> Void) {
        CXCallDirectoryManager.sharedInstance.getEnabledStatusForExtension(
            withIdentifier: extensionIdentifier
        ) { status, _ in
            switch status {
            case .enabled:  completion("enabled")
            case .disabled: completion("disabled")
            case .unknown:  completion("unknown")
            @unknown default: completion("unknown")
            }
        }
    }

    /// Opens the iOS Settings screen for Call Blocking & Identification.
    @objc static func openSettings(completion: @escaping (Error?) -> Void) {
        CXCallDirectoryManager.sharedInstance.openSettings { error in
            completion(error)
        }
    }
}
