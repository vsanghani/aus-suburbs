# Design

The interface is linen glass: a warm light ground, Inter for the UI, Inter Tight for headings, and a few translucent panels. Colour marks direction. It is not a wash behind every block. The product name is set in `src/config/site.ts`. This document does not depend on that name.

The rationale, the sites it was taken from, and the font licence are in `docs/design-direction.md`.

## Palette

Tokens live in `src/styles/tokens.css` as custom properties. Components do not hard-code hex values except the map fill, which MapLibre paint cannot read from CSS. Those paints mirror `--terracotta` (`#8d3c2b`), `--terracotta-deep` (`#6f2e22`), and `--ochre` (`#6b4b1d`).

Light is the default. Dark replaces the same tokens under `[data-theme="dark"]`. The choice is stored in `localStorage` under `theme` and is applied before paint by the small script in `index.html`.

### Light

| Token                 | Hex or value                | Role                                                |
| --------------------- | --------------------------- | --------------------------------------------------- |
| `--paper`             | `#f6f1e8`                   | Page background                                     |
| `--sheet`             | `#fffaf4`                   | Opaque chart ground, same as the glass solid        |
| `--ink`               | `#1c1916`                   | Text. About 12:1 on the busiest apricot wash        |
| `--ink-soft`          | `#3a332c`                   | Secondary text                                      |
| `--faint`             | `#4e463f`                   | Kickers and captions. About 6:1 on the busiest wash |
| `--rule`              | `rgba(72, 48, 28, 0.12)`    | Hairlines                                           |
| `--rule-strong`       | `#d4c4b0`                   | Stronger dividers, slider tracks                    |
| `--terracotta`        | `#8d3c2b`                   | Links and emphasis text                             |
| `--terracotta-deep`   | `#6f2e22`                   | Primary button solid. Cream text is above 7:1       |
| `--terracotta-deeper` | `#542318`                   | Primary hover                                       |
| `--terracotta-mark`   | `#b85a3e`                   | Large marks only. Not for small text                |
| `--on-accent`         | `#fffaf4`                   | Text on primary buttons                             |
| `--ochre`             | `#6b4b1d`                   | Ochre text                                          |
| `--ochre-mark`        | `#a07d3a`                   | Alternate bar segments                              |
| `--ochre-wash`        | `#f3e6d0`                   | Selection                                           |
| `--sage`              | `#3e5346`                   | “Adds” label                                        |
| `--sage-mark`         | `#6e7f6a`                   | Positive bar segment, aside rule                    |
| `--sage-wash`         | `#e4eee6`                   | Reserved wash                                       |
| `--clay`              | `#eadfce`                   | Map frame before tiles                              |
| `--focus`             | `#8d3c2b`                   | Focus ring                                          |
| `--wash-apricot`      | `rgba(232, 176, 128, 0.55)` | Background wash                                     |
| `--wash-sage`         | `rgba(176, 198, 174, 0.5)`  | Background wash                                     |
| `--wash-clay`         | `rgba(214, 164, 142, 0.4)`  | Background wash                                     |
| `--wash-sand`         | `rgba(242, 214, 184, 0.38)` | Background wash                                     |

### Dark

| Token               | Hex or value                | Role                                  |
| ------------------- | --------------------------- | ------------------------------------- |
| `--paper`           | `#14110f`                   | Page background                       |
| `--sheet`           | `#241f1b`                   | Chart ground                          |
| `--ink`             | `#f6f1ea`                   | Text                                  |
| `--ink-soft`        | `#e7ddd2`                   | Secondary text                        |
| `--faint`           | `#c4b8aa`                   | Kickers. Above 7:1 on `--glass-solid` |
| `--rule`            | `rgba(246, 236, 224, 0.12)` | Hairlines                             |
| `--rule-strong`     | `rgba(246, 236, 224, 0.22)` | Stronger dividers                     |
| `--terracotta`      | `#f0c2b4`                   | Links                                 |
| `--terracotta-deep` | `#6f2e22`                   | Buttons stay clay, with `--on-accent` |
| `--terracotta-mark` | `#d4785c`                   | Large marks                           |
| `--ochre`           | `#e4d2b0`                   | Ochre text                            |
| `--ochre-wash`      | `#3a3126`                   | Selection                             |
| `--sage`            | `#d5e3d2`                   | “Adds” label                          |
| `--sage-wash`       | `#24302a`                   | Reserved wash                         |
| `--clay`            | `#2c261f`                   | Map frame                             |
| `--focus`           | `#f0c2b4`                   | Focus ring                            |

Direction is never colour alone. “Adds” is sage and the word Adds. “Subtracts” is terracotta and the word Subtracts. Tiers are words (Clear, Steady, Mixed, Thin, Sparse) beside the number.

### Glass

| Token                    | Light                                       | Dark                              | Role                                                   |
| ------------------------ | ------------------------------------------- | --------------------------------- | ------------------------------------------------------ |
| `--glass-fill`           | `rgba(255, 250, 244, 0.72)`                 | `rgba(36, 30, 26, 0.74)`          | Large surfaces, when blur is supported                 |
| `--glass-fill-raised`    | `rgba(255, 250, 244, 0.84)`                 | `rgba(40, 34, 30, 0.88)`          | Controls and overlays                                  |
| `--glass-solid`          | `#fffaf4`                                   | `#2a241f`                         | Fallback, reduced transparency, charts, sticky headers |
| `--glass-line`           | `rgba(72, 48, 28, 0.1)`                     | `rgba(255, 244, 232, 0.14)`       | 1px outer hairline                                     |
| `--glass-sheen`          | `rgba(255, 255, 255, 0.72)`                 | `rgba(255, 244, 232, 0.18)`       | Inset top highlight                                    |
| `--glass-inset`          | `rgba(255, 250, 244, 0.58)`                 | `rgba(255, 244, 232, 0.06)`       | Controls inside an already-blurred surface             |
| `--glass-sheen-gradient` | white, fading by 42%                        | warm white at 0.14, fading by 46% | Top light                                              |
| `--glass-shadow`         | `0 1px 1px` plus `0 12px 32px` at low alpha | heavier, still short              | Soft lift                                              |
| `--accent-glass`         | `rgba(111, 46, 34, 0.92)`                   | `rgba(111, 46, 34, 0.94)`         | Primary button fill when blur works                    |
| `--blur-large`           | `8px` (`6px` under 800px)                   | same                              | Header, mast, dock, sheets                             |
| `--blur-control`         | `14px` (`10px` under 800px)                 | same                              | Buttons, pills, fields, tabs                           |
| `--blur-overlay`         | `16px` (`10px` under 800px)                 | same                              | Menus and the map note                                 |
| `--glass-saturate`       | `1.35`                                      | same                              | Saturation on the backdrop                             |

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
- **Search.** A glass field with a clay button. Suggestions are a glass menu of links.
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
- **Charts.** A terracotta line and a quiet fill on an opaque sheet, with the first and last year labelled. A dashed reference line when the payload includes one. Empty charts say “No series”. The compare chart is a stroked polygon per place.
- **Tables.** A glass sheet, an opaque sticky header, sentence-case column labels, a caption that states the count or the reason there is no count.
- **Pills.** Pill toggles in a radiogroup. Selected is cream on clay.
- **Buttons.** Primary is clay glass. Secondary and ghost are warm-white glass. The menu control is the icon button, and it keeps a text label.
- **Source footer.** Always visible. If nothing is attached, it says so.
- **Map.** OpenFreeMap Positron in light, OpenFreeMap Dark in dark. Attribution stays on an opaque chip. The frame is clay until tiles arrive. The failure note is a small glass overlay.

## Maps

Light style: `https://tiles.openfreemap.org/styles/positron`  
Dark style: `https://tiles.openfreemap.org/styles/dark`

The dark base map is cooler than the linen palette. It is a neutral reference map, not a second theme. Data layers, when they exist, use terracotta and ochre at low opacity.

## Writing

Sentences are short and specific. A missing number is described as not loaded. A zero is only shown when a query ran and returned zero. The composite is called a draft. The site does not tell someone where to live.
