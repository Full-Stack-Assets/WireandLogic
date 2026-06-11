import SwiftUI

@main
struct DispatchApp: App {
    @StateObject private var store = PostStore()

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(store)
                .preferredColorScheme(.light)
        }
    }
}
