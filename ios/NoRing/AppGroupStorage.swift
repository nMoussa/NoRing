import Foundation

/// Shared storage between the main app target and the CallDirectoryExtension.
/// Both targets must have the App Group "group.com.noring.shared" in their entitlements.
enum AppGroupStorage {
    private static let suite = "group.com.noring.shared"
    private static let blockedNumbersKey = "blockedNumbers"

    /// Writes an ascending-sorted list of E.164 phone numbers.
    /// The Call Directory API requires entries in ascending numeric order.
    static func saveBlockedNumbers(_ numbers: [String]) {
        guard let defaults = UserDefaults(suiteName: suite) else { return }
        let sorted = numbers
            .compactMap { Int64($0.replacingOccurrences(of: "+", with: "")) }
            .sorted()
            .map { "+\($0)" }
        if let data = try? JSONEncoder().encode(sorted) {
            defaults.set(data, forKey: blockedNumbersKey)
        }
    }

    /// Reads the blocked number list (used by CallDirectoryHandler).
    static func loadBlockedNumbers() -> [String] {
        guard let defaults = UserDefaults(suiteName: suite),
              let data = defaults.data(forKey: blockedNumbersKey),
              let numbers = try? JSONDecoder().decode([String].self, from: data)
        else { return [] }
        return numbers
    }
}
