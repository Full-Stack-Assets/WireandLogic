import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var store: PostStore
    @State private var searchText = ""

    private var isSearching: Bool {
        !searchText.trimmingCharacters(in: .whitespaces).isEmpty
    }

    /// Filter by title, description, category, or any tag (case-insensitive).
    private var filteredPosts: [Post] {
        let query = searchText.trimmingCharacters(in: .whitespaces).lowercased()
        guard !query.isEmpty else { return store.posts }
        return store.posts.filter { post in
            post.title.lowercased().contains(query)
                || post.description.lowercased().contains(query)
                || post.category.lowercased().contains(query)
                || post.tags.contains { $0.lowercased().contains(query) }
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.paper.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        if isSearching {
                            searchResults
                        } else {
                            Masthead().padding(.bottom, 28)
                            if store.posts.isEmpty {
                                EmptyState(isLoading: store.isLoading, message: store.errorMessage)
                                    .padding(.top, 60)
                            } else {
                                feed
                            }
                        }
                    }
                    .padding(.horizontal, 22)
                    .padding(.top, 8)
                    .padding(.bottom, 48)
                }
                .refreshable { await store.refresh() }
            }
            .navigationDestination(for: Post.self) { post in
                PostDetailView(post: post)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 4) {
                        Text("The").font(Theme.display(18, weight: .black)).foregroundStyle(Theme.ink)
                        Text("Dispatch").font(Theme.display(18, weight: .black)).foregroundStyle(Theme.accent)
                    }
                }
            }
            .toolbarBackground(Theme.paper, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search dispatches")
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
        }
        .tint(Theme.accent)
        .task { await store.load() }
    }

    // MARK: - Normal feed (lead story + cards)

    @ViewBuilder
    private var feed: some View {
        let posts = store.posts
        if let lead = posts.first {
            NavigationLink(value: lead) { LeadStory(post: lead) }
                .buttonStyle(.plain)
        }

        if posts.count > 1 {
            SectionRule(label: "More dispatches")
                .padding(.top, 40)
                .padding(.bottom, 24)

            cardList(Array(posts.dropFirst()))
        }
    }

    // MARK: - Search results

    @ViewBuilder
    private var searchResults: some View {
        let results = filteredPosts
        HStack {
            Text("\(results.count) RESULT\(results.count == 1 ? "" : "S")")
                .font(Theme.body(11, weight: .semibold))
                .tracking(2)
                .foregroundStyle(Theme.muted)
            Spacer()
        }
        .padding(.top, 12)
        .padding(.bottom, 20)

        if results.isEmpty {
            VStack(spacing: 8) {
                Text("No dispatches found")
                    .font(Theme.display(22, weight: .bold))
                    .foregroundStyle(Theme.ink)
                Text("Nothing matches “\(searchText)”.")
                    .font(Theme.body(14))
                    .foregroundStyle(Theme.muted)
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 60)
        } else {
            cardList(results)
        }
    }

    private func cardList(_ posts: [Post]) -> some View {
        VStack(spacing: 32) {
            ForEach(posts) { post in
                NavigationLink(value: post) { PostCard(post: post) }
                    .buttonStyle(.plain)
            }
        }
    }
}

private struct Masthead: View {
    private var issue: Int {
        let start = DateComponents(calendar: .current, year: 2025, month: 1, day: 1).date ?? Date()
        return Int(Date().timeIntervalSince(start) / 86_400) + 1
    }
    private var today: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US")
        f.dateFormat = "EEEE, MMMM d, yyyy"
        return f.string(from: Date())
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("VOL. 1 · ISSUE \(issue)")
                .font(Theme.body(11, weight: .semibold))
                .tracking(4)
                .foregroundStyle(Theme.muted)

            VStack(alignment: .leading, spacing: -2) {
                Text("What shipped.")
                    .foregroundStyle(Theme.ink)
                Text("What matters.")
                    .foregroundStyle(Theme.accent)
            }
            .font(Theme.display(46, weight: .black))
            .lineSpacing(-6)

            Text(today.uppercased())
                .font(Theme.body(11, weight: .medium))
                .tracking(2)
                .foregroundStyle(Theme.muted)
                .padding(.top, 4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 20)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Theme.ink).frame(height: 2)
        }
    }
}

private struct LeadStory: View {
    let post: Post
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let hero = post.hero {
                HeroImage(hero: hero, aspect: 3.0 / 2.0)
            }
            CategoryBadge(category: post.category)
            Text(post.title)
                .font(Theme.display(30, weight: .black))
                .foregroundStyle(Theme.ink)
                .lineSpacing(1)
                .fixedSize(horizontal: false, vertical: true)
            Text(post.description)
                .font(Theme.body(17))
                .foregroundStyle(Theme.ink.opacity(0.72))
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
            MetaLine(post: post, showReadVerb: true)
        }
    }
}

private struct PostCard: View {
    let post: Post
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let hero = post.hero {
                HeroImage(hero: hero, aspect: 16.0 / 10.0)
            }
            Text(post.category.uppercased())
                .font(Theme.body(10, weight: .bold))
                .tracking(2)
                .foregroundStyle(Theme.accent)
            Text(post.title)
                .font(Theme.display(20, weight: .semibold))
                .foregroundStyle(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(post.description)
                .font(Theme.body(14))
                .foregroundStyle(Theme.ink.opacity(0.7))
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
            MetaLine(post: post)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct EmptyState: View {
    let isLoading: Bool
    let message: String?
    var body: some View {
        VStack(spacing: 12) {
            if isLoading {
                ProgressView().tint(Theme.accent)
            } else {
                Text("Nothing published yet.")
                    .font(Theme.display(24, weight: .bold))
                    .foregroundStyle(Theme.ink)
                if let message {
                    Text(message).font(Theme.body(14)).foregroundStyle(Theme.muted)
                        .multilineTextAlignment(.center)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
        .overlay(
            Rectangle().stroke(style: StrokeStyle(lineWidth: 2, dash: [6]))
                .foregroundStyle(Theme.ink.opacity(0.25))
        )
    }
}
