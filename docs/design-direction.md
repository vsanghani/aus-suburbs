# Design direction

Linen glass. A light, warm reading surface with a few translucent panels, set in Inter. The previous interface was a printed record: square corners, a serif, hairline rules, and almost no depth. This pass changes the material and the page patterns, and keeps the same sentences, routes, and empty states.

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
- From Arc: soft apricot, sage, and clay washes behind the glass, so blur has something to blur. They are radial washes, not a centred gradient blob.

## What was refused

Purple or blue gradient heroes, emoji, a grid of identical rounded cards, a centred hero, heavy drop shadows, and stock lines about finding your dream suburb. The copy is unchanged.

## Type

Inter (variable, Latin, `opsz` and `wght`) for body and UI. Inter Tight (variable, Latin, `wght`) for headings, the wordmark, the search field, and large figures. Both are self-hosted from `public/fonts` with `font-display: swap`. Only those two files are preloaded.

Licence: [SIL Open Font License 1.1](https://openfontlicense.org). Copyright for Inter is the Inter Project Authors. The licence texts ship beside the files (`OFL-Inter.txt`, `OFL-Inter-Tight.txt`). The fonts are not sold on their own. SF Pro is not embedded.

Apple devices do not get `-apple-system` first. SF Pro and Inter are close, but mixing them would make the same page track differently on a Mac and on Windows. Inter is the face everywhere. `ui-sans-serif, system-ui` is only the fallback while the file swaps in, and for a glyph outside the Latin set.

Optical size is set on body text (`opsz` 16). Inter Tight has no optical axis; display sizes use weight 500–560 and negative tracking instead (about `-0.045em` on a page title, `-0.052em` on the home title). Figures that are data use tabular lining numerals.

## Palette

Tokens live in `src/styles/tokens.css` and are the source of truth. `docs/design.md` lists them. The ground is linen (`--paper` `#f6f1e8`). Ink is warm near-black (`#1c1916`). The accent stays the existing clay (`#8d3c2b` / `#6f2e22`) so “adds” sage and “subtracts” terracotta still read, and so map paint can keep the same hex values. Washes are apricot, sage, clay, and sand at low opacity.

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

Each level uses a translucent warm-white fill, a 1px hairline, an inset top highlight, a short top-light gradient, and a soft two-layer shadow. Primary buttons use the clay fill at 92% with cream type, plus the same highlight, so they still read as glass.

Controls inside a large surface do not get their own `backdrop-filter`. A second blur nested in the header, the explore dock, or the suburb mast is the expensive case on a phone. Those controls use the inset fill only.

`prefers-reduced-transparency: reduce` drops blur and the washes and paints `--glass-solid`. If `backdrop-filter` is unsupported, the same solid fill is already the background colour underneath the `@supports` block.

Sticky table headers use the opaque solid, not a second blur, so rows do not show through the labels. Chart grounds are opaque too: SVG text and the “No series” label stay crisp. Map attribution uses the same solid.

Text contrast is checked against the busiest light wash, not only against white. Apricot at 55% over `#f6f1e8` lands near `#eed0b5`. `--ink` on that is about 12:1. `--faint` (`#4e463f`) is about 6:1. Cream `#fffaf4` on the clay button `#6f2e22` stays above 7:1. Dark glass uses `#f6f1ea` on `#2a241f`, with `--faint` `#c4b8aa` still above 7:1 on the solid fallback.

## Iconography

One stroke set in `src/components/Icon.tsx`: search, menu, close, sun, moon, arrow. 1.75px round caps, `currentColor`, `aria-hidden`. No emoji. Labels stay real text. Theme names stay in the accessible name when the visible word is clipped on a narrow header.
