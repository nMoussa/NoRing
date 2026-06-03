import Foundation
import CallKit

/// iOS Call Directory App Extension.
/// This handler runs when the system needs to refresh the blocking/identification list.
/// It reads blocked numbers from the shared App Group and registers them with iOS.
///
/// Prerequisites before this works:
/// 1. Add a "Call Directory Extension" target in Xcode (File > New > Target > Call Directory Extension)
/// 2. Enable the App Group "group.com.noring.shared" in both the main app and this extension target
/// 3. The user must enable the extension in iOS Settings > Phone > Call Blocking & Identification
class CallDirectoryHandler: CXCallDirectoryProvider {

    override func beginRequest(with context: CXCallDirectoryExtensionContext) {
        context.delegate = self
        addBlockingEntries(context: context)
        context.completeRequest()
    }

    private func addBlockingEntries(context: CXCallDirectoryExtensionContext) {
        // AppGroupStorage is shared via a framework or duplicated source file.
        // Numbers must be added in ascending numeric order — AppGroupStorage.loadBlockedNumbers()
        // returns them pre-sorted.
        let numbers = AppGroupStorage.loadBlockedNumbers()

        for numberString in numbers {
            guard let numericValue = Int64(numberString.replacingOccurrences(of: "+", with: "")) else {
                continue
            }
            context.addBlockingEntry(withNextSequentialPhoneNumber: numericValue)
        }
    }
}

extension CallDirectoryHandler: CXCallDirectoryExtensionContextDelegate {
    func requestFailed(for extensionContext: CXCallDirectoryExtensionContext, withError error: Error) {
        // Surface failure in diagnostics via App Group flag so the main app can show a warning.
        if let defaults = UserDefaults(suiteName: "group.com.noring.shared") {
            defaults.set(error.localizedDescription, forKey: "lastExtensionError")
            defaults.set(Date().timeIntervalSince1970, forKey: "lastExtensionErrorTime")
        }
    }
}
