import SwiftUI

/// A small block-level Markdown renderer tuned for the editorial body style
/// (`.prose-editorial` on the web). It handles the subset the export script
/// produces: H2/H3, paragraphs, bullet & numbered lists, blockquotes (used for
/// Callouts), and fenced code. Inline emphasis/links are rendered via
/// AttributedString's Markdown parser.
struct MarkdownView: View {
    let markdown: String

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(MarkdownParser.parse(markdown).enumerated()), id: \.offset) { _, block in
                view(for: block)
            }
        }
        .tint(Theme.accent)
    }

    @ViewBuilder
    private func view(for block: MarkdownBlock) -> some View {
        switch block {
        case .heading(let level, let text):
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                if level == 2 {
                    Text("§").font(Theme.display(level == 2 ? 26 : 20, weight: .black))
                        .foregroundStyle(Theme.accent)
                }
                inline(text)
                    .font(Theme.display(level == 2 ? 26 : 21, weight: .semibold))
                    .foregroundStyle(Theme.ink)
            }
            .padding(.top, level == 2 ? 28 : 20)
            .padding(.bottom, 6)

        case .paragraph(let text):
            inline(text)
                .font(Theme.body(18))
                .foregroundStyle(Theme.ink.opacity(0.92))
                .lineSpacing(6)
                .padding(.vertical, 8)

        case .bullet(let items):
            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Rectangle().fill(Theme.accent)
                            .frame(width: 8, height: 1)
                            .offset(y: -5)
                        inline(item).font(Theme.body(18)).lineSpacing(5)
                    }
                }
            }
            .padding(.vertical, 8)

        case .ordered(let items):
            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text("\(i + 1).")
                            .font(Theme.mono(15, weight: .medium))
                            .foregroundStyle(Theme.accent)
                        inline(item).font(Theme.body(18)).lineSpacing(5)
                    }
                }
            }
            .padding(.vertical, 8)

        case .quote(let text):
            HStack(spacing: 0) {
                Rectangle().fill(Theme.accent).frame(width: 3)
                inline(text)
                    .font(Theme.display(18, weight: .regular))
                    .italic()
                    .foregroundStyle(Theme.ink.opacity(0.8))
                    .lineSpacing(5)
                    .padding(.leading, 14)
                    .padding(.vertical, 4)
            }
            .padding(.vertical, 10)

        case .code(let text):
            ScrollView(.horizontal, showsIndicators: false) {
                Text(text)
                    .font(Theme.mono(14))
                    .foregroundStyle(Theme.paper)
                    .padding(16)
            }
            .background(Theme.ink)
            .clipShape(RoundedRectangle(cornerRadius: 2))
            .padding(.vertical, 10)
        }
    }

    /// Inline Markdown (bold/italic/links/code) via AttributedString.
    private func inline(_ text: String) -> Text {
        var options = AttributedString.MarkdownParsingOptions()
        options.interpretedSyntax = .inlineOnlyPreservingWhitespace
        if let attributed = try? AttributedString(markdown: text, options: options) {
            return Text(attributed)
        }
        return Text(text)
    }
}
