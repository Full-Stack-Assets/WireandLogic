import Foundation

/// Hero image metadata — mirrors `PostFrontmatter.hero` in src/lib/posts.ts.
struct Hero: Codable, Hashable {
    let url: String
    let alt: String
    let credit: String
    let creditUrl: String
}

/// A linked primary source — mirrors `PostFrontmatter.sources[]`.
struct Source: Codable, Hashable {
    let title: String
    let url: String
}

/// A single dispatch. Mirrors the `Post` shape from the Next.js site, flattened
/// for the app by scripts/export-ios-content.ts.
struct Post: Codable, Identifiable, Hashable {
    let slug: String
    let title: String
    let description: String
    let date: String
    let category: String
    let tags: [String]
    let hero: Hero?
    let sources: [Source]
    let body: String
    let readingTimeMin: Int

    var id: String { slug }

    /// Parsed publish date (ISO‑8601, fractional seconds tolerated).
    var publishedDate: Date? {
        Post.isoFractional.date(from: date) ?? Post.isoPlain.date(from: date)
    }

    /// "Jun 6" — used on cards and the masthead.
    var shortDate: String {
        guard let d = publishedDate else { return "" }
        return Post.shortFormatter.string(from: d)
    }

    /// "Saturday, June 6, 2026" — used in the article header.
    var longDate: String {
        guard let d = publishedDate else { return "" }
        return Post.longFormatter.string(from: d)
    }

    // MARK: - Formatters (shared, allocation is cheap to avoid)

    private static let isoFractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static let isoPlain: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    private static let shortFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US")
        f.dateFormat = "MMM d"
        return f
    }()

    private static let longFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US")
        f.dateFormat = "EEEE, MMMM d, yyyy"
        return f
    }()
}
