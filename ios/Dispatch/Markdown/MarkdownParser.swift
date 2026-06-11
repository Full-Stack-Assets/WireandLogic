import Foundation

/// A parsed block of Markdown body content.
enum MarkdownBlock {
    case heading(level: Int, text: String)
    case paragraph(String)
    case bullet([String])
    case ordered([String])
    case quote(String)
    case code(String)
}

/// Splits a Markdown string into block-level elements. Deliberately small —
/// it covers exactly what scripts/export-ios-content.ts emits.
enum MarkdownParser {
    static func parse(_ markdown: String) -> [MarkdownBlock] {
        var blocks: [MarkdownBlock] = []
        let lines = markdown.replacingOccurrences(of: "\r\n", with: "\n").components(separatedBy: "\n")

        var i = 0
        while i < lines.count {
            let line = lines[i]
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            // Blank line — skip.
            if trimmed.isEmpty {
                i += 1
                continue
            }

            // Fenced code block.
            if trimmed.hasPrefix("```") {
                var code: [String] = []
                i += 1
                while i < lines.count && !lines[i].trimmingCharacters(in: .whitespaces).hasPrefix("```") {
                    code.append(lines[i])
                    i += 1
                }
                i += 1 // consume closing fence
                blocks.append(.code(code.joined(separator: "\n")))
                continue
            }

            // Headings.
            if trimmed.hasPrefix("### ") {
                blocks.append(.heading(level: 3, text: String(trimmed.dropFirst(4))))
                i += 1
                continue
            }
            if trimmed.hasPrefix("## ") {
                blocks.append(.heading(level: 2, text: String(trimmed.dropFirst(3))))
                i += 1
                continue
            }
            if trimmed.hasPrefix("# ") {
                blocks.append(.heading(level: 2, text: String(trimmed.dropFirst(2))))
                i += 1
                continue
            }

            // Blockquote (one or more consecutive `>` lines).
            if trimmed.hasPrefix(">") {
                var quote: [String] = []
                while i < lines.count {
                    let t = lines[i].trimmingCharacters(in: .whitespaces)
                    guard t.hasPrefix(">") else { break }
                    quote.append(t.dropFirst().trimmingCharacters(in: .whitespaces))
                    i += 1
                }
                blocks.append(.quote(quote.joined(separator: " ")))
                continue
            }

            // Unordered list.
            if isBullet(trimmed) {
                var items: [String] = []
                while i < lines.count, isBullet(lines[i].trimmingCharacters(in: .whitespaces)) {
                    let t = lines[i].trimmingCharacters(in: .whitespaces)
                    items.append(String(t.dropFirst(2)))
                    i += 1
                }
                blocks.append(.bullet(items))
                continue
            }

            // Ordered list.
            if isOrdered(trimmed) {
                var items: [String] = []
                while i < lines.count, isOrdered(lines[i].trimmingCharacters(in: .whitespaces)) {
                    let t = lines[i].trimmingCharacters(in: .whitespaces)
                    if let range = t.range(of: #"^\d+\.\s+"#, options: .regularExpression) {
                        items.append(String(t[range.upperBound...]))
                    } else {
                        items.append(t)
                    }
                    i += 1
                }
                blocks.append(.ordered(items))
                continue
            }

            // Paragraph — gather consecutive non-blank, non-special lines.
            var para: [String] = []
            while i < lines.count {
                let t = lines[i].trimmingCharacters(in: .whitespaces)
                if t.isEmpty || t.hasPrefix("#") || t.hasPrefix(">") || t.hasPrefix("```")
                    || isBullet(t) || isOrdered(t) {
                    break
                }
                para.append(t)
                i += 1
            }
            blocks.append(.paragraph(para.joined(separator: " ")))
        }

        return blocks
    }

    private static func isBullet(_ t: String) -> Bool {
        t.hasPrefix("- ") || t.hasPrefix("* ")
    }

    private static func isOrdered(_ t: String) -> Bool {
        t.range(of: #"^\d+\.\s+"#, options: .regularExpression) != nil
    }
}
