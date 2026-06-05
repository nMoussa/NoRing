import Foundation
import CallKit

class CallDirectoryHandler: CXCallDirectoryProvider {

    // iOS Call Directory has an undocumented upper limit around 10 000 entries.
    // Enforcing a hard cap prevents the extension from being killed for using
    // too much memory and guards against corrupted App Group data.
    private static let maxEntries = 10_000

    override func beginRequest(with context: CXCallDirectoryExtensionContext) {
        context.delegate = self
        addBlockingEntries(context: context)
        context.completeRequest()
    }

    private func addBlockingEntries(context: CXCallDirectoryExtensionContext) {
        let numbers = AppGroupStorage.loadBlockedNumbers()

        // Validate list size before registering anything
        guard numbers.count <= Self.maxEntries else {
            if let defaults = UserDefaults(suiteName: "group.com.noring.shared") {
                defaults.set("Entry count \(numbers.count) exceeds limit \(Self.maxEntries)", forKey: "lastExtensionError")
            }
            context.completeRequest()
            return
        }

        for numberString in numbers {
            // Only register strings that look like E.164 phone numbers
            guard numberString.hasPrefix("+"),
                  numberString.count >= 2,
                  numberString.count <= 16,
                  let numericValue = Int64(numberString.replacingOccurrences(of: "+", with: ""))
            else {
                continue
            }
            context.addBlockingEntry(withNextSequentialPhoneNumber: numericValue)
        }
    }
}

extension CallDirectoryHandler: CXCallDirectoryExtensionContextDelegate {
    func requestFailed(for extensionContext: CXCallDirectoryExtensionContext, withError error: Error) {
        // Store only the error domain + code, not localizedDescription, to avoid
        // persisting any potentially sensitive system path or call data in the App Group.
        if let defaults = UserDefaults(suiteName: "group.com.noring.shared") {
            defaults.set("[\((error as NSError).domain)] code \((error as NSError).code)", forKey: "lastExtensionError")
            defaults.set(Date().timeIntervalSince1970, forKey: "lastExtensionErrorTime")
        }
    }
}
