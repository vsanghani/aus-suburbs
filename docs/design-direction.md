# Design direction

Navy glass. A light, cool reading surface with a deep navy brand and a few translucent panels, set in Inter. The layout pass replaced a printed record (square corners, a serif, hairline rules, almost no depth) with this glass system. The colour passes moved from warm linen to sea glass, then to navy. Sentences, routes, and empty states stay the same.

## References

Looked at for this pass:

- [getdroppy.app](https://getdroppy.app/) marketing pages. Light ground, large grotesque headlines, sentence case, long quiet sections, and almost no chrome around the type. The visible face is Apple SF Pro.
- [DroppyKit design guidelines](https://getdroppy.app/docs/droppykit/design). Useful as a counter-example for the marketing site: the app chrome is dark, flat, and borderless. That language stays in the app. It is not the marketing page the owner pointed at.
- [Domain suburb profiles](https://www.domain.com.au/suburb-profile/manly-nsw-2095), including Sydney and Caulfield. Place name first, a short editorial welcome, then market figures in tables rather than a grid of equal cards. Demographics are a handful of facts.
- [realestate.com.au on suburb profiles](https://www.realestate.com.au/advice/suburb-profile/). Practical splits (buy or rent, house or unit) and links onward to neighbours. The tabs on a housing section follow that split.
- [Linear](https://linear.app/). Left-aligned headlines, figure-style section labels, and a page that changes rhythm instead of repeating one card. The dark product UI was ignored.
- [Apple’s Mac pages](https://www.apple.com/mac/). Tight display type, lots of air, short lines, and a lineup that is a sequence rather than a dashboard.
- Walk Score, Zillow, and Redfin. One large figure with a plain-language label, then the supporting rows. Sticky facts, not a badge.
- Niche and Airbnb neighbourhood guides. Place-first pages. Niche’s grade tiles and Airbnb’s photo mosaics were the patterns to avoid: identical rounded cards, and imagery this record does not have.
- Arc and Raycast. The glass recipe (translucent fill, blur, a hairline highlight) on a coloured field so the blur is visible. Both products are darker than this site. Only the material moved across.

## What was borrowed

- From Droppy and Apple: a grotesque with tight tracking at display sizes, sentence case, and a light page. SF Pro is the face on getdroppy.app. It is not licensed for the web, so it is not served here.
- From Domain: a suburb mast with a fact row (postcode, council, population, traditional owners), then open sections. One section, the composite, is a panel. The rest stay in the page flow.
- From Walk Score: the composite is a number and a tier word on one line, with a measure under it.
- From Linear: an asymmetric home. Search and the state list sit side by side. Rankings are a numbered ledger, not cards.
- From Arc: soft sky, periwinkle, and pale-blue washes behind the glass, so blur has something to blur. They are radial washes, not a centred gradient blob.

## What was refused

Purple or blue gradient heroes, emoji, a grid of identical rounded cards, a centred hero, heavy drop shadows, and stock lines about finding your dream suburb. The copy is unchanged.

## Type

Inter (variable, Latin, `opsz` and `wght`) for body and UI. Inter Tight (variable, Latin, `wght`) for headings, the wordmark, the search field, and large figures. Both are self-hosted from `public/fonts` with `font-display: swap`. Only those two files are preloaded.

Licence: [SIL Open Font License 1.1](https://openfontlicense.org). Copyright for Inter is the Inter Project Authors. The licence texts ship beside the files (`OFL-Inter.txt`, `OFL-Inter-Tight.txt`). The fonts are not sold on their own. SF Pro is not embedded.

Apple devices do not get `-apple-system` first. SF Pro and Inter are close, but mixing them would make the same page track differently on a Mac and on Windows. Inter is the face everywhere. `ui-sans-serif, system-ui` is only the fallback while the file swaps in, and for a glyph outside the Latin set.

Optical size is set on body text (`opsz` 16). Inter Tight has no optical axis; display sizes use weight 500–560 and negative tracking instead (about `-0.045em` on a page title, `-0.052em` on the home title). Figures that are data use tabular lining numerals.

## Palette

This pass makes deep navy the brand. The field stays light and airy: an off-white with a faint blue tint (`--paper` `#f4f6fb`), and pale sky, periwinkle, and ice washes so the glass blur still has a coloured field. Headings, body, the wordmark, links, and focus rings sit in the navy range `#0b1f4b` to `#12285e`. Both ends clear the light ground by a wide margin (`#0b1f4b` is 14.8:1 on the paper, `#12285e` is 13.0:1). Primary buttons use `#0b1f4b` because cool white `#f7f9fe` on it is 15.2:1. The fill is translucent navy (`rgba(11, 31, 75, 0.88)`) with blur, an inset highlight, and a short top light. Even blended over the glass, that label stays about 10:1. The opaque `#0b1f4b` is the fallback when blur is unavailable.

One warm accent remains. Coral (`#9c3e36`, 6.2:1 on paper, 5.7:1 on glass) is the tier word and “Subtracts”. Sea green (`#14684a`, 6.3:1 on paper) is “Adds”, and it is a supporting chart hue, not the brand. Charts lead with navy, then mid blue, sky, sea green, coral, and amber. The four compare series are navy, mid blue, sea green, and coral: navy and blue differ in lightness, and sea green is a different hue, so the set does not rely on red against green. Strokes clear 3:1 on `--sheet` `#f8fafe` (sky `#3e86d4` is 3.6:1, amber `#c47e0a` is 3.2:1).

Shadows, hairlines, selection, and the map frame are cool slate. The busiest wash, periwinkle at 42% over the paper, lands near `#d4d9f0`. Where it overlaps sky the ground is near `#b7caec`. `--faint` `#3e5278` is 7.2:1 on paper, 5.6:1 on periwinkle, and 4.7:1 on that overlap. Glass over the overlap is near `#e6edf9`, where faint text is 6.7:1.

Dark is a deep navy base, not a teal one. Paper is `#081226`. Ink `#e7eef9` is 16.0:1. Links and the focus ring are a light blue `#c5d4ff` (12.7:1). Faint `#a9b8d6` is 9.4:1 on paper and 8.4:1 on the solid glass `#141e38`. Buttons lighten to `#4568b8` so they separate from the navy page (3.1:1 against the solid) while `#f7f9fe` on the button stays 5.1:1. Chart series lighten with the theme. Filled controls draw the focus ring in `--ink`, offset onto the surface around the control.

Tokens live in `src/styles/tokens.css`. `docs/design.md` is the spec. The table below is the palette this pass locks in.

| Token               | Light                       | Dark                        | Role                             |
| ------------------- | --------------------------- | --------------------------- | -------------------------------- |
| `--paper`           | `#f4f6fb`                   | `#081226`                   | Page background                  |
| `--sheet`           | `#f8fafe`                   | `#101c34`                   | Opaque chart ground              |
| `--ink`             | `#0b1f4b`                   | `#e7eef9`                   | Text, headings, wordmark         |
| `--ink-soft`        | `#243866`                   | `#c5d2ea`                   | Secondary text                   |
| `--faint`           | `#3e5278`                   | `#a9b8d6`                   | Kickers and captions             |
| `--rule`            | `rgba(11, 31, 75, 0.12)`    | `rgba(198, 214, 245, 0.14)` | Hairlines                        |
| `--rule-strong`     | `#c5d0e4`                   | `rgba(198, 214, 245, 0.24)` | Dividers and tracks              |
| `--accent`          | `#12285e`                   | `#c5d4ff`                   | Links and the default focus ring |
| `--accent-deep`     | `#0b1f4b`                   | `#4568b8`                   | Opaque primary button            |
| `--accent-deeper`   | `#071633`                   | `#3a589e`                   | Opaque primary hover             |
| `--accent-mark`     | `#12285e`                   | `#8eb0f0`                   | Large marks                      |
| `--on-accent`       | `#f7f9fe`                   | `#f7f9fe`                   | Text on primary buttons          |
| `--coral`           | `#9c3e36`                   | `#f3b0a4`                   | Tier word and “Subtracts”        |
| `--sea`             | `#14684a`                   | `#9edcc4`                   | “Adds”                           |
| `--selection`       | `#d9e3f8`                   | `#1a2748`                   | Text selection                   |
| `--frame`           | `#d6e1f2`                   | `#15243f`                   | Map frame before tiles           |
| `--focus`           | `#12285e`                   | `#c5d4ff`                   | Focus ring                       |
| `--data-navy`       | `#12285e`                   | `#8eb0f0`                   | Lead chart series                |
| `--data-blue`       | `#2f62c2`                   | `#6b93e8`                   | Second series, map radius        |
| `--data-sky`        | `#3e86d4`                   | `#d5e4ff`                   | Sky series                       |
| `--data-sea`        | `#0f766e`                   | `#6dcfb4`                   | Supporting sea green             |
| `--data-coral`      | `#d4654f`                   | `#f0a090`                   | Coral series                     |
| `--data-amber`      | `#c47e0a`                   | `#f0c14a`                   | Weight-bar alternate             |
| `--wash-sky`        | `rgba(140, 180, 230, 0.4)`  | `rgba(70, 100, 180, 0.36)`  | Background wash                  |
| `--wash-periwinkle` | `rgba(168, 176, 224, 0.42)` | `rgba(90, 80, 170, 0.28)`   | Background wash                  |
| `--wash-blue`       | `rgba(186, 208, 240, 0.48)` | `rgba(50, 90, 170, 0.32)`   | Background wash                  |
| `--wash-ice`        | `rgba(200, 214, 242, 0.38)` | `rgba(80, 120, 190, 0.24)`  | Background wash                  |
| `--glass-fill`      | `rgba(248, 250, 254, 0.72)` | `rgba(16, 26, 52, 0.76)`    | Large glass                      |
| `--glass-solid`     | `#f8fafe`                   | `#141e38`                   | Opaque fallback                  |
| `--accent-glass`    | `rgba(11, 31, 75, 0.88)`    | `rgba(69, 104, 184, 0.9)`   | Translucent primary button       |
| `--glass-shadow`    | cool slate, short           | deep navy, short            | Panel shadow                     |

## Space, corners, motion

The 4px space scale is unchanged. The measure is 76rem. Panels use 22px corners, controls 14px, pills a full pill. That is a deliberate break from the square record.

Motion is a 1px lift on hover and a slight press, 160ms, only when `prefers-reduced-motion: no-preference`. Reduced motion strips transitions and animations. The map still eases through MapLibre.

## Glass rules

Three levels, all driven by tokens:

| Level   | Where                                                                                                           | Blur                   |
| ------- | --------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Large   | Header, suburb mast, explore dock, composite panel, compare tray, match deck, footer, table sheet, result sheet | 8px, 6px under 800px   |
| Control | Buttons, pills, search field, section nav, filter bar, pull quote, empty and error panels, tabs                 | 14px, 10px under 800px |
| Overlay | Suggestion menu, map failure note                                                                               | 16px, 10px under 800px |

Each level uses a translucent cool-white fill, a 1px hairline, an inset top highlight, a short top-light gradient, and a soft two-layer slate shadow. Primary buttons use a translucent navy fill with the same blur, highlight, and top light, so they still read as glass. `--accent-deep` is the opaque fallback.

Other controls inside a large surface do not get their own `backdrop-filter`. A second blur nested in the header, the explore dock, or the suburb mast is the expensive case on a phone. Those controls use the inset fill only. Primary buttons are the exception, because a flat navy block would hide the glass.

`prefers-reduced-transparency: reduce` drops blur and the washes and paints `--glass-solid`. If `backdrop-filter` is unsupported, the same solid fill is already the background colour underneath the `@supports` block.

Sticky table headers use the opaque solid, not a second blur, so rows do not show through the labels. Chart grounds are opaque too: SVG text and the “No series” label stay crisp. Map attribution uses the same solid.

Text contrast is checked against the busiest light wash, not only against the paper. Periwinkle at 42% over `#f4f6fb` lands near `#d4d9f0`. `--ink` on the overlap with sky (`#b7caec`) is 9.7:1, and `--faint` (`#3e5278`) is 4.7:1. Glass over that overlap is near `#e6edf9`, where faint text is 6.7:1. Cool white `#f7f9fe` on the navy button `#0b1f4b` is 15.2:1, and on the dark-theme button `#4568b8` it is 5.1:1. Dark glass uses `#e7eef9` on `#141e38`, with `--faint` `#a9b8d6` at 8.4:1 on that solid.

## Iconography

One stroke set in `src/components/Icon.tsx`: search, menu, close, sun, moon, arrow. 1.75px round caps, `currentColor`, `aria-hidden`. No emoji. Labels stay real text. Theme names stay in the accessible name when the visible word is clipped on a narrow header.
