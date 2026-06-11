import CoreText
import Foundation

/// Registers bundled fonts (Fraunces) with the system at launch, so we don't
/// need a UIAppFonts entry in a hand-maintained Info.plist. Safe to call once.
enum Fonts {
    static func registerBundled() {
        let urls = Bundle.main.urls(forResourcesWithExtension: "ttf", subdirectory: nil) ?? []
        for url in urls {
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
}
