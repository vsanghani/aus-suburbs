# Design

The interface is sea glass: a cool light ground, Inter for the UI, Inter Tight for headings, and a few translucent panels. Colour marks direction. It is not a wash behind every block. The product name is set in `src/config/site.ts`. This document does not depend on that name.

The rationale, the sites it was taken from, and the font licence are in `docs/design-direction.md`.

## Palette

Tokens live in `src/styles/tokens.css` as custom properties. Components do not hard-code hex values except the map paint, which MapLibre cannot read from CSS. Place fill mirrors `--data-teal` (`#0e9aa7` light, `#3ec8d4` dark). Place line mirrors `--accent` (`#0a6470` light, `#7ddfea` dark). The radius fill mirrors `--data-blue` (`#2b6cb0` light, `#7eb0e8` dark).

Light is the default. Dark replaces the same tokens under `[data-theme="dark"]`. The choice is stored in `localStorage` under `theme` and is applied before paint by the small script in `index.html`.

The ground is a cool off-white with a faint blue-green tint. Ink is a teal-navy, not a warm black. The accent is sea-glass teal, deepened where it carries text. Coral is the only warm note, and it is limited to the tier word, the “Subtracts” label, and one chart series. Shadows, rules, selection, and the map frame stay in the same cool family.

`#0e9aa7` is a large mark and a chart stroke. White on it is about 3.4:1, so it is not a button fill and not small text. Button text uses `--on-accent` on `--accent-deep`.

### Light

| Token             | Hex or value                | Role                                                    |
| ----------------- | --------------------------- | ------------------------------------------------------- |
| `--paper`         | `#f3f8f8`                   | Page background                                         |
| `--sheet`         | `#f7fcfc`                   | Opaque chart ground, same as the glass solid            |
| `--ink`           | `#0f2a3a`                   | Text. 13.9:1 on paper, 10.6:1 on the busiest sky wash   |
| `--ink-soft`      | `#1a3e52`                   | Secondary text                                          |
| `--faint`         | `#3a5566`                   | Kickers and captions. 7.3:1 on paper, 5.6:1 on raw sky  |
| `--rule`          | `rgba(15, 42, 58, 0.12)`    | Hairlines                                               |
| `--rule-strong`   | `#c5d4dc`                   | Stronger dividers, slider tracks                        |
| `--accent`        | `#0a6470`                   | Links. 6.4:1 on paper, 6.1:1 on glass over the sky wash |
| `--accent-deep`   | `#0b6e78`                   | Primary button. `--on-accent` on it is 5.7:1            |
| `--accent-deeper` | `#085c68`                   | Primary hover                                           |
| `--accent-mark`   | `#0e9aa7`                   | Large marks only. Not for small text                    |
| `--on-accent`     | `#f4fbfc`                   | Text on primary buttons                                 |
| `--coral`         | `#9c3e36`                   | Tier word and “Subtracts”. 6.2:1 on paper               |
| `--sea`           | `#14684a`                   | “Adds”. 6.3:1 on paper                                  |
| `--selection`     | `#d7f3f0`                   | Text selection                                          |
| `--frame`         | `#d5e6ec`                   | Map frame before tiles                                  |
| `--focus`         | `#0a6470`                   | Focus ring. 6.4:1 on paper                              |
| `--data-teal`     | `#0e9aa7`                   | Chart stroke. 3.3:1 on `--sheet`                        |
| `--data-blue`     | `#2b6cb0`                   | Chart stroke. 5.2:1 on `--sheet`                        |
| `--data-green`    | `#1f8a6e`                   | Chart stroke and aside rule. 4.1:1 on `--sheet`         |
| `--data-coral`    | `#d4654f`                   | Chart stroke. 3.5:1 on `--sheet`                        |
| `--data-amber`    | `#c47e0a`                   | Alternate bar segment. 3.2:1 on `--sheet`               |
| `--wash-sky`      | `rgba(126, 186, 224, 0.42)` | Background wash                                         |
| `--wash-teal`     | `rgba(64, 184, 184, 0.36)`  | Background wash                                         |
| `--wash-mint`     | `rgba(150, 214, 196, 0.4)`  | Background wash                                         |
| `--wash-blue`     | `rgba(170, 198, 230, 0.34)` | Background wash                                         |

### Dark

| Token             | Hex or value                | Role                                    |
| ----------------- | --------------------------- | --------------------------------------- |
| `--paper`         | `#071821`                   | Page background                         |
| `--sheet`         | `#0e2430`                   | Chart ground                            |
| `--ink`           | `#e7f4f7`                   | Text. 16.1:1 on paper                   |
| `--ink-soft`      | `#c5dce4`                   | Secondary text                          |
| `--faint`         | `#a4c0cc`                   | Kickers. 9.5:1 on paper, 7.8:1 on solid |
| `--rule`          | `rgba(196, 228, 236, 0.14)` | Hairlines                               |
| `--rule-strong`   | `rgba(196, 228, 236, 0.24)` | Stronger dividers                       |
| `--accent`        | `#7ddfea`                   | Links. 11.7:1 on paper                  |
| `--accent-deep`   | `#0b6e78`                   | Buttons stay teal, with `--on-accent`   |
| `--accent-deeper` | `#085c68`                   | Primary hover                           |
| `--accent-mark`   | `#3ec8d4`                   | Large marks                             |
| `--coral`         | `#f3b0a4`                   | Tier word and “Subtracts”               |
| `--sea`           | `#9edcc4`                   | “Adds”                                  |
| `--selection`     | `#163a44`                   | Text selection                          |
| `--frame`         | `#12303c`                   | Map frame                               |
| `--focus`         | `#7ddfea`                   | Focus ring                              |
| `--data-teal`     | `#3ec8d4`                   | Chart stroke. 7.9:1 on `--sheet`        |
| `--data-blue`     | `#7eb0e8`                   | Chart stroke. 7.1:1 on `--sheet`        |
| `--data-green`    | `#5dca9a`                   | Chart stroke. 7.9:1 on `--sheet`        |
| `--data-coral`    | `#f0a090`                   | Chart stroke. 7.7:1 on `--sheet`        |
| `--data-amber`    | `#f0c14a`                   | Bar segment. 9.5:1 on `--sheet`         |
| `--wash-sky`      | `rgba(40, 110, 160, 0.38)`  | Background wash                         |
| `--wash-teal`     | `rgba(20, 140, 150, 0.36)`  | Background wash                         |
| `--wash-mint`     | `rgba(40, 140, 120, 0.28)`  | Background wash                         |
| `--wash-blue`     | `rgba(30, 80, 140, 0.32)`   | Background wash                         |

Direction is never colour alone. “Adds” is sea green and the word Adds. “Subtracts” is coral and the word Subtracts. Tiers are words (Clear, Steady, Mixed, Thin, Sparse) beside the number. Chart series run teal, ocean blue, sea green, then coral, so teal is not distinguished from green by hue alone. The weight bar uses teal, amber, and green, which also differ in lightness.

The busiest light wash is sky at 42% over `#f3f8f8`, near `#c2deee`. Glass at 72% over that wash lands near `#e8f4f8`. `--faint` on that glass is 7.0:1. `--ink` on it is 13.3:1. Focus rings use `--focus` (above 3:1 on paper). Filled teal controls switch the ring to `--ink`, offset onto the surface around the control, so the ring is not the same colour as the fill.

### Glass

| Token                    | Light                                 | Dark                               | Role                                                   |
| ------------------------ | ------------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| `--glass-fill`           | `rgba(247, 252, 252, 0.72)`           | `rgba(14, 36, 48, 0.74)`           | Large surfaces, when blur is supported                 |
| `--glass-fill-raised`    | `rgba(255, 255, 255, 0.84)`           | `rgba(16, 42, 56, 0.88)`           | Controls and overlays                                  |
| `--glass-solid`          | `#f7fcfc`                             | `#102a38`                          | Fallback, reduced transparency, charts, sticky headers |
| `--glass-line`           | `rgba(15, 50, 68, 0.12)`              | `rgba(200, 230, 238, 0.16)`        | 1px outer hairline                                     |
| `--glass-sheen`          | `rgba(255, 255, 255, 0.85)`           | `rgba(220, 245, 250, 0.16)`        | Inset top highlight                                    |
| `--glass-inset`          | `rgba(255, 255, 255, 0.55)`           | `rgba(220, 245, 250, 0.06)`        | Controls inside an already-blurred surface             |
| `--glass-sheen-gradient` | white, fading by 42%                  | cool white at 0.14, fading by 46%  | Top light                                              |
| `--glass-shadow`         | slate, `0 1px 1px` plus `0 12px 32px` | deeper navy, still short           | Soft lift                                              |
| `--shadow-lift`          | `0 8px 22px rgba(15, 42, 58, 0.08)`   | `0 8px 22px rgba(0, 12, 24, 0.32)` | Control shadow                                         |
| `--shadow-accent`        | `0 8px 18px rgba(8, 48, 64, 0.16)`    | `0 8px 18px rgba(0, 20, 32, 0.36)` | Primary button shadow                                  |
| `--accent-glass`         | `rgba(11, 110, 120, 0.92)`            | `rgba(11, 110, 120, 0.94)`         | Primary button fill when blur works                    |
| `--blur-large`           | `8px` (`6px` under 800px)             | same                               | Header, mast, dock, sheets                             |
| `--blur-control`         | `14px` (`10px` under 800px)           | same                               | Buttons, pills, fields, tabs                           |
| `--blur-overlay`         | `16px` (`10px` under 800px)           | same                               | Menus and the map note                                 |
| `--glass-saturate`       | `1.35`                                | same                               | Saturation on the backdrop                             |

`--glass-solid` is painted first. The translucent fill and `backdrop-filter` apply only inside `@supports`. `prefers-reduced-transparency: reduce` forces the solid and removes the washes. Controls inside a large glass surface do not add a second blur.

Sticky headers in tables use `--glass-solid` so scrolling rows do not show through the labels. Chart SVG grounds use `--sheet` for the same reason.

## Type

Inter (variable, Latin, optical size and weight) for UI and body. Inter Tight (variable, Latin, weight) for headings, the wordmark, large figures, and the search field. Both are self-hosted from `public/fonts` with `font-display: swap`. The document preloads only those two files. The SIL Open Font License texts sit beside them. SF Pro is not served. See `docs/design-direction.md`.

| Token        | Size                            | Use                      |
| ------------ | ------------------------------- | ------------------------ |
| `--text-xs`  | 0.75rem                         | Small labels             |
| `--text-sm`  | 0.875rem                        | Meta, captions, nav      |
| `--text-md`  | 1.0625rem                       | Body                     |
| `--text-lg`  | 1.25rem                         | Subheads inside sections |
| `--text-xl`  | 1.6rem                          | Reserved                 |
| `--text-2xl` | 2.15rem                         | Section titles           |
| `--text-3xl` | `clamp(2.5rem, 5.4vw, 3.8rem)`  | Page titles              |
| `--text-4xl` | `clamp(3.1rem, 6.6vw, 5.15rem)` | Home title               |

Body sets `opsz` 16, weight 440, tracking `-0.011em`, line-height 1.5. Page titles use Inter Tight at weight 520 and tracking about `-0.045em`. The home title is weight 500 and about `-0.052em`. Numbers use tabular lining figures.

Kickers are sentence case, in the faint colour, at the small UI size. They still carry the section number (`01 — Reading`).

## Space

A 4px base, named as rem:

| Token       | Size    |
| ----------- | ------- |
| `--space-1` | 0.25rem |
| `--space-2` | 0.5rem  |
| `--space-3` | 0.75rem |
| `--space-4` | 1rem    |
| `--space-5` | 1.5rem  |
| `--space-6` | 2.5rem  |
| `--space-7` | 4rem    |
| `--space-8` | 6.5rem  |

The reading measure is `--measure` (76rem) inside `--gutter`. Suburb sections other than the composite are separated by a hairline and padding, not by a repeated card. The composite is the one featured panel.

Corners are 22px on panels, 14px on controls, and full pills on filters and the section nav. Shadows are the short glass shadow above, not a heavy drop.

## Motion

Hover lifts a control by 1px. Press scales it to 0.98. Both are 160ms and only when the user has not asked for reduced motion. Sliders and the weight bar update immediately. The map eases only through MapLibre’s own camera.

`prefers-reduced-motion: reduce` removes transitions, animations, and smooth scrolling.

## Components

- **Header.** A floating glass bar. Wordmark, text links, a Light/Dark switch, and a menu button on narrow screens. The menu is the drawer. It does not add a second blur.
- **Search.** A glass field with a teal button. Suggestions are a glass menu of links.
- **Home.** An asymmetric hero: the title and search on the left, states in a rail on the right. A pull quote, then an open contents list, then the formula beside a numbered ledger of rankings.
- **Suburb.** A glass mast: one `h1`, a fact row, and the keep/copy actions. The description sits in a reading column. The composite is a glass panel. Later sections are open.
- **Section nav.** A sticky glass pill row. The current section is marked with `aria-current`.
- **Explore.** The map is the ground. The controls are one glass dock over the left side, and stack above the map on a narrow screen.
- **Compare.** Four seats in one tray, then a table sheet with a sticky header, then the chart.
- **Rankings.** The index is a numbered ledger. A list page keeps its filters in one glass bar.
- **Search results.** One sheet of rows, not a card grid.
- **Missing page.** A large “404” kicker, one `h1`, two glass links.
- **Composite.** A number, a tier word, and a ruled measure. Drivers are rows: direction word, label, points or “Not scored”.
- **Metric rows.** Label left, value right, em dash when empty. The sentence above them says the section has no figures.
- **Charts.** A teal line and a quiet fill on an opaque sheet, with the first and last year labelled. A dashed reference line when the payload includes one. Empty charts say “No series”. The compare chart is a stroked polygon per place, in teal, ocean blue, sea green, then coral.
- **Tables.** A glass sheet, an opaque sticky header, sentence-case column labels, a caption that states the count or the reason there is no count.
- **Pills.** Pill toggles in a radiogroup. Selected is cool white on teal.
- **Buttons.** Primary is teal glass. Secondary and ghost are cool-white glass. The menu control is the icon button, and it keeps a text label.
- **Source footer.** Always visible. If nothing is attached, it says so.
- **Map.** OpenFreeMap Positron in light, OpenFreeMap Dark in dark. Attribution stays on an opaque chip. The frame is a cool tint until tiles arrive. The failure note is a small glass overlay.

## Maps

Light style: `https://tiles.openfreemap.org/styles/positron`  
Dark style: `https://tiles.openfreemap.org/styles/dark`

The dark base map is OpenFreeMap Dark. It is a neutral reference map, not a second theme. Data layers, when they exist, use teal and ocean blue at low opacity, with the lighter hex values from the dark theme.

## Writing

Sentences are short and specific. A missing number is described as not loaded. A zero is only shown when a query ran and returned zero. The composite is called a draft. The site does not tell someone where to live.
