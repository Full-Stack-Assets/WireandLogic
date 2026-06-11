import SwiftUI

struct PostDetailView: View {
    let post: Post

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header

                if let hero = post.hero {
                    VStack(alignment: .leading, spacing: 6) {
                        HeroImage(hero: hero, aspect: 16.0 / 9.0)
                        if !hero.credit.isEmpty {
                            credit(hero)
                        }
                    }
                    .padding(.top, 20)
                    .padding(.bottom, 8)
                }

                MarkdownView(markdown: post.body)
                    .padding(.top, 12)

                if !post.sources.isEmpty {
                    sources.padding(.top, 36)
                }

                if !post.tags.isEmpty {
                    tags.padding(.top, 24)
                }
            }
            .padding(.horizontal, 22)
            .padding(.vertical, 24)
        }
        .background(Theme.paper.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Theme.paper, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbar {
            if let url = post.url {
                ToolbarItem(placement: .topBarTrailing) {
                    ShareLink(
                        item: url,
                        subject: Text(post.title),
                        message: Text(post.description)
                    ) {
                        Image(systemName: "square.and.arrow.up")
                    }
                    .tint(Theme.accent)
                }
            }
        }
        .tint(Theme.accent)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                CategoryBadge(category: post.category)
                Text(post.longDate.uppercased())
                    .font(Theme.body(10, weight: .medium))
                    .tracking(1.5)
                    .foregroundStyle(Theme.muted)
            }
            Text(post.title)
                .font(Theme.display(34, weight: .black))
                .foregroundStyle(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(post.description)
                .font(Theme.display(19, weight: .regular))
                .foregroundStyle(Theme.ink.opacity(0.7))
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
            Text("\(post.readingTimeMin) MIN READ")
                .font(Theme.body(10, weight: .semibold))
                .tracking(2)
                .foregroundStyle(Theme.muted)
        }
    }

    private func credit(_ hero: Hero) -> some View {
        HStack(spacing: 4) {
            Text("Photo:").foregroundStyle(Theme.muted)
            if let url = URL(string: hero.creditUrl) {
                Link(hero.credit, destination: url).foregroundStyle(Theme.accent)
            } else {
                Text(hero.credit).foregroundStyle(Theme.muted)
            }
        }
        .font(Theme.body(12))
    }

    private var sources: some View {
        VStack(alignment: .leading, spacing: 0) {
            Rectangle().fill(Theme.ink).frame(height: 2).padding(.bottom, 16)
            Text("SOURCES")
                .font(Theme.display(13, weight: .bold))
                .tracking(3)
                .foregroundStyle(Theme.muted)
                .padding(.bottom, 14)
            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(post.sources.enumerated()), id: \.offset) { i, source in
                    HStack(alignment: .top, spacing: 12) {
                        Text(String(format: "%02d", i + 1))
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.accent)
                        if let url = URL(string: source.url) {
                            Link(source.title.isEmpty ? source.url : source.title, destination: url)
                                .font(Theme.body(14))
                                .foregroundStyle(Theme.ink)
                                .underline()
                        } else {
                            Text(source.title).font(Theme.body(14)).foregroundStyle(Theme.ink)
                        }
                    }
                }
            }
        }
        .tint(Theme.accent)
    }

    private var tags: some View {
        FlowLayout(spacing: 8) {
            ForEach(post.tags, id: \.self) { tag in
                Text("#\(tag)".uppercased())
                    .font(Theme.body(11, weight: .medium))
                    .tracking(1.5)
                    .foregroundStyle(Theme.ink.opacity(0.7))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .overlay(Rectangle().stroke(Theme.ink.opacity(0.3), lineWidth: 1))
            }
        }
    }
}

/// Minimal wrapping layout for the tag chips.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var rows: [[CGSize]] = [[]]
        var x: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, !rows[rows.count - 1].isEmpty {
                rows.append([])
                x = 0
            }
            rows[rows.count - 1].append(size)
            x += size.width + spacing
        }
        let height = rows.reduce(0) { acc, row in
            acc + (row.map(\.height).max() ?? 0) + spacing
        }
        return CGSize(width: maxWidth == .infinity ? x : maxWidth, height: max(0, height - spacing))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
