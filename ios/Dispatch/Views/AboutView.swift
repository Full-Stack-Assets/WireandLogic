import SwiftUI

/// Mirrors the website's /about page — how the daily pipeline works.
struct AboutView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("ABOUT")
                            .font(Theme.body(11, weight: .semibold))
                            .tracking(4)
                            .foregroundStyle(Theme.muted)
                        Text("How this works")
                            .font(Theme.display(40, weight: .black))
                            .foregroundStyle(Theme.ink)
                    }
                    .padding(.bottom, 18)
                    .overlay(alignment: .bottom) {
                        Rectangle().fill(Theme.ink).frame(height: 2)
                    }

                    MarkdownView(markdown: Self.body)
                        .padding(.top, 16)
                }
                .padding(.horizontal, 22)
                .padding(.vertical, 24)
            }
            .background(Theme.paper.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Theme.paper, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 4) {
                        Text("The").font(Theme.display(18, weight: .black)).foregroundStyle(Theme.ink)
                        Text("Dispatch").font(Theme.display(18, weight: .black)).foregroundStyle(Theme.accent)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(Theme.body(16, weight: .semibold))
                        .tint(Theme.accent)
                }
            }
        }
        .tint(Theme.accent)
    }

    private static let body = """
    **The Dispatch** is an experiment in what happens when you point a small, opinionated pipeline at the firehose of tech news and let it write one post a day.

    ## The pipeline
    Every morning at 7am, a scheduled function does five things:

    1. **Gather.** Pulls headlines from Reddit, Hacker News, DEV.to, a handful of RSS feeds, YouTube, and Brave News.
    2. **Score.** Each candidate gets a composite score — popularity, engagement, recency — and anything that's already been covered is filtered out.
    3. **Research.** The winner gets Brave-searched, the top three articles scraped, and any relevant YouTube transcripts pulled.
    4. **Write.** All of it is handed to a Groq-hosted LLM with an explicit MDX contract: an opening, a takeaway, what-happened and why-it-matters sections, a pros/cons block, a how-to-think-about-it section, and a three-question FAQ.
    5. **Publish.** The MDX file, with a banner and frontmatter, is committed to GitHub and deployed automatically.

    ## The caveats
    Automated writing has a quality floor, not a ceiling. The pipeline will occasionally pick a boring topic, miss nuance, or get a detail subtly wrong. Every post links every source at the bottom — if something doesn't add up, go read the primaries.

    ## The stack
    Next.js, TinaCMS, Groq's free tier, and a lot of free public APIs. Total running cost: $0/month.
    """
}
