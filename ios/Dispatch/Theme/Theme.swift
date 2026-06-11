import SwiftUI
import UIKit

/// The Dispatch visual identity, mirrored from the website's Tailwind theme
/// (tailwind.config.ts + globals.css).
enum Theme {
    // Palette — identical hex values to the web build.
    static let paper = Color(hex: 0xF6F3EC)   // background
    static let ink = Color(hex: 0x0A0A0A)      // primary text
    static let accent = Color(hex: 0xFF5B1F)   // editorial orange
    static let muted = Color(hex: 0x6B6558)    // secondary text

    /// Serif display face. Uses Fraunces if the font is added to the bundle,
    /// otherwise falls back to the system serif — same role as `.font-display`.
    static func display(_ size: CGFloat, weight: Font.Weight = .heavy) -> Font {
        if UIFont.familyNames.contains(where: { $0.contains("Fraunces") }) {
            return Font.custom("Fraunces", size: size).weight(weight)
        }
        return Font.system(size: size, weight: weight, design: .serif)
    }

    static func body(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        Font.system(size: size, weight: weight, design: .default)
    }

    static func mono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        Font.system(size: size, weight: weight, design: .monospaced)
    }
}

extension Color {
    init(hex: UInt32) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: 1)
    }
}
