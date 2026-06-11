# The Dispatch — iOS

A simple, native **SwiftUI** reader that mirrors [The Dispatch](../README.md)
website: the same editorial identity (paper `#F6F3EC`, ink `#0A0A0A`, accent
orange `#FF5B1F`, serif display), the same content model, and the same reading
experience — a masthead, a lead story, a feed of cards, and an article view
with hero, body, sources, and tags.

It is **read-only** and ships with a bundled snapshot of the posts, so it runs
in the Simulator with no backend or API keys.

### Features

- **Editorial feed** — masthead, lead story, and a scrolling card list.
- **Article reader** — hero image, formatted body, numbered sources, tags.
- **Search** — pull-down search bar filters by title, description, category,
  or tag, with a live result count and empty state.
- **Fraunces** — the site's display serif is bundled (OFL) and registered at
  launch, so the app's headings match the web typography exactly. It falls back
  to the system serif if the font is ever unavailable.
- **App icon** — an on-brand editorial mark.

## Run it

```bash
open ios/Dispatch.xcodeproj
```

Select an iPhone simulator and press **⌘R**. Requires **Xcode 16+**
(iOS 17 deployment target).

> Prefer to regenerate the project from scratch? A
> [`project.yml`](project.yml) is included for
> [XcodeGen](https://github.com/yonsm/XcodeGen): `cd ios && xcodegen generate`.

## How it mirrors the website

| Website (Next.js)                         | iOS (SwiftUI)                            |
| ----------------------------------------- | ---------------------------------------- |
| `content/posts/*.mdx` + frontmatter       | `Dispatch/Models/Post.swift`             |
| `src/lib/posts.ts` (load, sort, RT)       | `scripts/export-ios-content.ts` → `posts.json` + `PostStore` |
| Home masthead + lead + cards (`page.tsx`) | `Views/HomeView.swift`                   |
| Article page (`blog/[slug]/page.tsx`)     | `Views/PostDetailView.swift`             |
| `.prose-editorial` MDX styling            | `Markdown/MarkdownView.swift`            |
| `<Callout>` etc. MDX components           | flattened to Markdown by the export step |
| Tailwind theme (`tailwind.config.ts`)     | `Theme/Theme.swift`                      |

## Updating content

The bundled `Dispatch/Resources/posts.json` is generated from the **same MDX
posts** the website uses:

```bash
npm run export:ios   # reads content/posts/*.mdx → ios/Dispatch/Resources/posts.json
```

Re-run it after the daily pipeline adds a post, then rebuild the app.

### Live feed (optional)

To read from a deployed endpoint instead of the bundled snapshot, host the
exported JSON (e.g. at `https://your-site/posts.json`) and set the store's
feed URL in `DispatchApp.swift`:

```swift
@StateObject private var store: PostStore = {
    let s = PostStore()
    s.remoteURL = URL(string: "https://your-site/posts.json")
    return s
}()
```

The store prefers the remote feed and falls back to the bundle on any failure,
so the app always has something to show. Pull-to-refresh re-fetches.

## Project layout

```
ios/
├── Dispatch.xcodeproj
└── Dispatch/
    ├── DispatchApp.swift          # @main entry, navigation root
    ├── Models/Post.swift          # mirrors PostFrontmatter
    ├── Services/PostStore.swift   # bundled + optional remote loading
    ├── Theme/Theme.swift          # palette + typography
    ├── Support/Fonts.swift        # registers bundled Fraunces at launch
    ├── Markdown/                  # tiny block-level Markdown renderer
    ├── Views/                     # HomeView (+ search), PostDetailView, components
    ├── Assets.xcassets/           # AccentColor, AppIcon
    └── Resources/
        ├── posts.json             # exported content snapshot
        └── Fonts/                 # Fraunces.ttf (OFL) + license
```

> **Fonts:** `Fraunces.ttf` is the variable font from
> [Google Fonts](https://github.com/google/fonts/tree/main/ofl/fraunces),
> licensed under the SIL Open Font License (see `Resources/Fonts/OFL.txt`).
> It's registered at runtime via `CTFontManagerRegisterFontsForURL`, so no
> `UIAppFonts` Info.plist entry is required.
