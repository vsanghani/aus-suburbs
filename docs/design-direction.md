# Design direction

Sea glass. A light, cool reading surface with a few translucent panels, set in Inter. The layout pass replaced a printed record (square corners, a serif, hairline rules, almost no depth) with this glass system. The colour pass replaces the warm linen ground with a cool off-white, ocean teal, and a small coral accent. Sentences, routes, and empty states stay the same.

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
- From Arc: soft sky, teal, and mint washes behind the glass, so blur has something to blur. They are radial washes, not a centred gradient blob.

## What was refused

Purple or blue gradient heroes, emoji, a grid of identical rounded cards, a centred hero, heavy drop shadows, and stock lines about finding your dream suburb. The copy is unchanged.

## Type

Inter (variable, Latin, `opsz` and `wght`) for body and UI. Inter Tight (variable, Latin, `wght`) for headings, the wordmark, the search field, and large figures. Both are self-hosted from `public/fonts` with `font-display: swap`. Only those two files are preloaded.

Licence: [SIL Open Font License 1.1](https://openfontlicense.org). Copyright for Inter is the Inter Project Authors. The licence texts ship beside the files (`OFL-Inter.txt`, `OFL-Inter-Tight.txt`). The fonts are not sold on their own. SF Pro is not embedded.

Apple devices do not get `-apple-system` first. SF Pro and Inter are close, but mixing them would make the same page track differently on a Mac and on Windows. Inter is the face everywhere. `ui-sans-serif, system-ui` is only the fallback while the file swaps in, and for a glyph outside the Latin set.

Optical size is set on body text (`opsz` 16). Inter Tight has no optical axis; display sizes use weight 500–560 and negative tracking instead (about `-0.045em` on a page title, `-0.052em` on the home title). Figures that are data use tabular lining numerals.

## Palette

The brief for this pass was a fresh, airy ground: property and neighbourhood sites that feel light (Domain’s suburb profiles, Walk Score’s single figure, Apple’s airy marketing pages) without a warm linen or brown-black ink. The field is a very light cool off-white (`--paper` `#f3f8f8`). Headings and body use a teal-navy (`--ink` `#0f2a3a`) so the page stays cool even in the type. The accent sits in the sea-glass range: `#0e9aa7` for large marks and chart strokes, deepened to `#0a6470` for links and `#0b6e78` for buttons. White on `#0e9aa7` is about 3.4:1, under the 4.5:1 bar for small text, so that bright teal never carries a label. `--on-accent` `#f4fbfc` on the button is 5.7:1.

One warm accent is enough. Coral (`#9c3e36`, 6.2:1 on paper) is the tier word and the “Subtracts” label. Sea green (`#14684a`, 6.3:1) is “Adds”. Both still ship with the words. Charts use five hues that stay apart under deuteranopia: teal, ocean blue, sea green, coral, and amber. Series order is teal, blue, green, coral, so teal is not the only distinction from green. Strokes are checked at 3:1 against `--sheet`. The light blue `#2b6cb0` falls under that on the dark sheet, so dark `--data-blue` is `#7eb0e8`. Amber `#c47e0a` just clears 3.2:1 on the light sheet; the brighter coral `#e07a5f` did not, so the stroke is `#d4654f`.

Shadows, hairlines, selection, and the map frame are cool slate and mint, not brown. Behind the glass, four soft radials (sky, teal, mint, blue) give the blur a coloured field. They stay pale. The busiest, sky at 42% over the paper, lands near `#c2deee`. Glass at 72% over that is near `#e8f4f8`, and `--faint` `#3a5566` is still 7.0:1 there. `--ink` is 13.9:1 on paper and 13.3:1 on that glass.

Dark is the same hues sunk into navy: paper `#071821`, ink `#e7f4f7` (16.1:1), links `#7ddfea` (11.7:1), faint `#a4c0cc` at 9.5:1 on paper and 7.8:1 on the solid glass `#102a38`. Buttons keep the same teal fill, so the label contrast does not change. Focus rings use `--focus`, which is 6.4:1 on light paper and 11.7:1 on dark paper. Filled teal controls draw the ring in `--ink` instead, so the ring is not the same colour as the button.

Tokens live in `src/styles/tokens.css`. `docs/design.md` is the spec. The table below is the palette this pass locks in.

| Token             | Light                       | Dark                        | Role                             |
| ----------------- | --------------------------- | --------------------------- | -------------------------------- |
| `--paper`         | `#f3f8f8`                   | `#071821`                   | Page background                  |
| `--sheet`         | `#f7fcfc`                   | `#0e2430`                   | Opaque chart ground              |
| `--ink`           | `#0f2a3a`                   | `#e7f4f7`                   | Text and headings                |
| `--ink-soft`      | `#1a3e52`                   | `#c5dce4`                   | Secondary text                   |
| `--faint`         | `#3a5566`                   | `#a4c0cc`                   | Kickers and captions             |
| `--rule`          | `rgba(15, 42, 58, 0.12)`    | `rgba(196, 228, 236, 0.14)` | Hairlines                        |
| `--rule-strong`   | `#c5d4dc`                   | `rgba(196, 228, 236, 0.24)` | Dividers and tracks              |
| `--accent`        | `#0a6470`                   | `#7ddfea`                   | Links and the default focus ring |
| `--accent-deep`   | `#0b6e78`                   | `#0b6e78`                   | Primary button fill              |
| `--accent-deeper` | `#085c68`                   | `#085c68`                   | Primary hover                    |
| `--accent-mark`   | `#0e9aa7`                   | `#3ec8d4`                   | Large marks only                 |
| `--on-accent`     | `#f4fbfc`                   | `#f4fbfc`                   | Text on primary buttons          |
| `--coral`         | `#9c3e36`                   | `#f3b0a4`                   | Tier word and “Subtracts”        |
| `--sea`           | `#14684a`                   | `#9edcc4`                   | “Adds”                           |
| `--selection`     | `#d7f3f0`                   | `#163a44`                   | Text selection                   |
| `--frame`         | `#d5e6ec`                   | `#12303c`                   | Map frame before tiles           |
| `--focus`         | `#0a6470`                   | `#7ddfea`                   | Focus ring                       |
| `--data-teal`     | `#0e9aa7`                   | `#3ec8d4`                   | First chart series               |
| `--data-blue`     | `#2b6cb0`                   | `#7eb0e8`                   | Second chart series, map radius  |
| `--data-green`    | `#1f8a6e`                   | `#5dca9a`                   | Third chart series               |
| `--data-coral`    | `#d4654f`                   | `#f0a090`                   | Fourth chart series              |
| `--data-amber`    | `#c47e0a`                   | `#f0c14a`                   | Weight-bar alternate             |
| `--wash-sky`      | `rgba(126, 186, 224, 0.42)` | `rgba(40, 110, 160, 0.38)`  | Background wash                  |
| `--wash-teal`     | `rgba(64, 184, 184, 0.36)`  | `rgba(20, 140, 150, 0.36)`  | Background wash                  |
| `--wash-mint`     | `rgba(150, 214, 196, 0.4)`  | `rgba(40, 140, 120, 0.28)`  | Background wash                  |
| `--wash-blue`     | `rgba(170, 198, 230, 0.34)` | `rgba(30, 80, 140, 0.32)`   | Background wash                  |
| `--glass-fill`    | `rgba(247, 252, 252, 0.72)` | `rgba(14, 36, 48, 0.74)`    | Large glass                      |
| `--glass-solid`   | `#f7fcfc`                   | `#102a38`                   | Opaque fallback                  |
| `--glass-line`    | `rgba(15, 50, 68, 0.12)`    | `rgba(200, 230, 238, 0.16)` | Hairline                         |
| `--glass-shadow`  | cool slate, short           | deep navy, short            | Panel shadow                     |

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

Each level uses a translucent cool-white fill, a 1px hairline, an inset top highlight, a short top-light gradient, and a soft two-layer slate shadow. Primary buttons use the teal fill at 92% with cool-white type, plus the same highlight, so they still read as glass.

Controls inside a large surface do not get their own `backdrop-filter`. A second blur nested in the header, the explore dock, or the suburb mast is the expensive case on a phone. Those controls use the inset fill only.

`prefers-reduced-transparency: reduce` drops blur and the washes and paints `--glass-solid`. If `backdrop-filter` is unsupported, the same solid fill is already the background colour underneath the `@supports` block.

Sticky table headers use the opaque solid, not a second blur, so rows do not show through the labels. Chart grounds are opaque too: SVG text and the “No series” label stay crisp. Map attribution uses the same solid.

Text contrast is checked against the busiest light wash, not only against the paper. Sky at 42% over `#f3f8f8` lands near `#c2deee`. `--ink` on that is 10.6:1, and `--faint` (`#3a5566`) is 5.6:1. Glass over the same wash is near `#e8f4f8`, where faint text is 7.0:1. Cool white `#f4fbfc` on the teal button `#0b6e78` is 5.7:1. Dark glass uses `#e7f4f7` on `#102a38`, with `--faint` `#a4c0cc` at 7.8:1 on that solid.

## Iconography

One stroke set in `src/components/Icon.tsx`: search, menu, close, sun, moon, arrow. 1.75px round caps, `currentColor`, `aria-hidden`. No emoji. Labels stay real text. Theme names stay in the accessible name when the visible word is clipped on a narrow header.
