import SwiftUI

/// Bordered category label — mirrors the web's category chip.
struct CategoryBadge: View {
    let category: String
    var body: some View {
        Text(category.uppercased())
            .font(Theme.body(10, weight: .bold))
            .tracking(2)
            .foregroundStyle(Theme.accent)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .overlay(Rectangle().stroke(Theme.accent, lineWidth: 1))
    }
}

/// Centered label flanked by rules — the "More dispatches" divider.
struct SectionRule: View {
    let label: String
    var body: some View {
        HStack(spacing: 14) {
            Rectangle().fill(Theme.ink.opacity(0.2)).frame(height: 1)
            Text(label.uppercased())
                .font(Theme.display(12, weight: .bold))
                .tracking(3)
                .foregroundStyle(Theme.muted)
                .fixedSize()
            Rectangle().fill(Theme.ink.opacity(0.2)).frame(height: 1)
        }
    }
}

/// Hero image with a graceful placeholder, matching the site's framed art.
struct HeroImage: View {
    let hero: Hero
    var aspect: CGFloat = 16.0 / 10.0

    var body: some View {
        AsyncImage(url: URL(string: hero.url)) { phase in
            switch phase {
            case .success(let image):
                image.resizable().scaledToFill()
            case .failure:
                placeholder
            case .empty:
                placeholder.overlay(ProgressView().tint(Theme.muted))
            @unknown default:
                placeholder
            }
        }
        .aspectRatio(aspect, contentMode: .fill)
        .frame(maxWidth: .infinity)
        .clipped()
        .background(Theme.ink.opacity(0.05))
    }

    private var placeholder: some View {
        Theme.ink.opacity(0.06)
    }
}

/// Uppercase meta line: "Jun 6 · 4 min read".
struct MetaLine: View {
    let post: Post
    var showReadVerb = false
    var body: some View {
        Text("\(post.shortDate)  ·  \(post.readingTimeMin) min\(showReadVerb ? " read" : "")")
            .font(Theme.body(11, weight: .medium))
            .tracking(1.5)
            .foregroundStyle(Theme.muted)
            .textCase(.uppercase)
    }
}
