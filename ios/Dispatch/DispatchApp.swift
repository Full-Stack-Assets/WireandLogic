import SwiftUI

@main
struct DispatchApp: App {
    @StateObject private var store = PostStore()

    init() {
        Fonts.registerBundled()
    }

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(store)
                .preferredColorScheme(.light)
        }
    }
}
