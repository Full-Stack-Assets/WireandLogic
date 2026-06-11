import Foundation

/// Loads dispatches. By default it reads the bundled `posts.json` (exported
/// from the same content/posts/*.mdx that powers the website). If you deploy a
/// JSON endpoint, set `remoteURL` and the store will prefer it, falling back to
/// the bundle on any failure — so the app always has something to show.
@MainActor
final class PostStore: ObservableObject {
    @Published private(set) var posts: [Post] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    /// Optional live feed. Point this at e.g. https://your-site/posts.json to
    /// mirror the deployed site instead of the bundled snapshot.
    var remoteURL: URL? = nil

    func load() async {
        guard posts.isEmpty else { return }
        await refresh()
    }

    func refresh() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        if let remoteURL, let remote = await fetchRemote(remoteURL) {
            posts = remote
            return
        }

        do {
            posts = try loadBundled()
        } catch {
            errorMessage = "Couldn't load dispatches: \(error.localizedDescription)"
        }
    }

    // MARK: - Sources

    private func loadBundled() throws -> [Post] {
        guard let url = Bundle.main.url(forResource: "posts", withExtension: "json") else {
            throw LoadError.missingBundle
        }
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode([Post].self, from: data)
    }

    private func fetchRemote(_ url: URL) async -> [Post]? {
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                return nil
            }
            return try JSONDecoder().decode([Post].self, from: data)
        } catch {
            return nil
        }
    }

    enum LoadError: LocalizedError {
        case missingBundle
        var errorDescription: String? {
            switch self {
            case .missingBundle: return "posts.json was not found in the app bundle."
            }
        }
    }
}
