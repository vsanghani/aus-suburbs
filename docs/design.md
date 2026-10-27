# Design

The interface is navy glass: a cool light ground, a deep navy brand, Inter for the UI, Inter Tight for headings, and a few translucent panels. Colour marks direction. It is not a wash behind every block. The product name is set in `src/config/site.ts`. This document does not depend on that name.

The rationale, the sites it was taken from, and the font licence are in `docs/design-direction.md`.

## Palette

Tokens live in `src/styles/tokens.css` as custom properties. Components do not hard-code hex values except the map paint, which MapLibre cannot read from CSS. Place fill mirrors `--data-navy` (`#12285e` light, `#8eb0f0` dark). Place line mirrors `--accent` (`#12285e` light, `#c5d4ff` dark). The radius fill mirrors `--data-blue` (`#2f62c2` light, `#6b93e8` dark).

Light is the default. Dark replaces the same tokens under `[data-theme="dark"]`. The choice is stored in `localStorage` under `theme` and is applied before paint by the small script in `index.html`.

The ground is a cool off-white with a faint blue tint. Ink, links, the wordmark, focus rings, and primary buttons are deep navy in the `#0b1f4b` to `#12285e` range. Coral is the only warm note, limited to the tier word, the “Subtracts” label, and one chart series. Sea green is a supporting chart hue. Shadows, rules, selection, and the map frame stay cool slate.

`--on-accent` `#f7f9fe` on the light button `#0b1f4b` is 15.2:1. On the dark button `#4568b8` it is 5.1:1. The dark button is lighter than the page so the control still reads, at 3.1:1 against `--glass-solid`.

### Light

| Token               | Hex or value                | Role                                                        |
| ------------------- | --------------------------- | ----------------------------------------------------------- |
| `--paper`           | `#f4f6fb`                   | Page background                                             |
| `--sheet`           | `#f8fafe`                   | Opaque chart ground, same as the glass solid                |
| `--ink`             | `#0b1f4b`                   | Text and the wordmark. 14.8:1 on paper                      |
| `--ink-soft`        | `#243866`                   | Secondary text. 10.6:1 on paper                             |
| `--faint`           | `#3e5278`                   | Kickers and captions. 7.2:1 on paper, 4.7:1 on wash overlap |
| `--rule`            | `rgba(11, 31, 75, 0.12)`    | Hairlines                                                   |
| `--rule-strong`     | `#c5d0e4`                   | Stronger dividers, slider tracks                            |
| `--accent`          | `#12285e`                   | Links and the focus ring. 13.0:1 on paper                   |
| `--accent-deep`     | `#0b1f4b`                   | Primary button. `--on-accent` on it is 15.2:1               |
| `--accent-deeper`   | `#071633`                   | Primary hover when the fill is opaque                       |
| `--accent-mark`     | `#12285e`                   | Large marks                                                 |
| `--on-accent`       | `#f7f9fe`                   | Text on primary buttons                                     |
| `--coral`           | `#9c3e36`                   | Tier word and “Subtracts”. 6.2:1 on paper, 5.7:1 on glass   |
| `--sea`             | `#14684a`                   | “Adds”. 6.3:1 on paper, 5.7:1 on glass                      |
| `--selection`       | `#d9e3f8`                   | Text selection                                              |
| `--frame`           | `#d6e1f2`                   | Map frame before tiles                                      |
| `--focus`           | `#12285e`                   | Focus ring. 13.0:1 on paper                                 |
| `--data-navy`       | `#12285e`                   | Lead chart stroke. 13.5:1 on `--sheet`                      |
| `--data-blue`       | `#2f62c2`                   | Chart stroke. 5.5:1 on `--sheet`                            |
| `--data-sky`        | `#3e86d4`                   | Chart stroke. 3.6:1 on `--sheet`                            |
| `--data-sea`        | `#0f766e`                   | Supporting chart stroke and aside rule. 5.2:1 on `--sheet`  |
| `--data-coral`      | `#d4654f`                   | Chart stroke. 3.5:1 on `--sheet`                            |
| `--data-amber`      | `#c47e0a`                   | Alternate bar segment. 3.2:1 on `--sheet`                   |
| `--wash-sky`        | `rgba(140, 180, 230, 0.4)`  | Background wash                                             |
| `--wash-periwinkle` | `rgba(168, 176, 224, 0.42)` | Background wash                                             |
| `--wash-blue`       | `rgba(186, 208, 240, 0.48)` | Background wash                                             |
| `--wash-ice`        | `rgba(200, 214, 242, 0.38)` | Background wash                                             |

### Dark

| Token               | Hex or value                | Role                                    |
| ------------------- | --------------------------- | --------------------------------------- |
| `--paper`           | `#081226`                   | Page background                         |
| `--sheet`           | `#101c34`                   | Chart ground                            |
| `--ink`             | `#e7eef9`                   | Text. 16.0:1 on paper                   |
| `--ink-soft`        | `#c5d2ea`                   | Secondary text                          |
| `--faint`           | `#a9b8d6`                   | Kickers. 9.4:1 on paper, 8.4:1 on solid |
| `--rule`            | `rgba(198, 214, 245, 0.14)` | Hairlines                               |
| `--rule-strong`     | `rgba(198, 214, 245, 0.24)` | Stronger dividers                       |
| `--accent`          | `#c5d4ff`                   | Links. 12.7:1 on paper                  |
| `--accent-deep`     | `#4568b8`                   | Buttons. `--on-accent` on it is 5.1:1   |
| `--accent-deeper`   | `#3a589e`                   | Primary hover. White text is 6.8:1      |
| `--accent-mark`     | `#8eb0f0`                   | Large marks                             |
| `--coral`           | `#f3b0a4`                   | Tier word and “Subtracts”               |
| `--sea`             | `#9edcc4`                   | “Adds”                                  |
| `--selection`       | `#1a2748`                   | Text selection                          |
| `--frame`           | `#15243f`                   | Map frame                               |
| `--focus`           | `#c5d4ff`                   | Focus ring                              |
| `--data-navy`       | `#8eb0f0`                   | Chart stroke. 7.8:1 on `--sheet`        |
| `--data-blue`       | `#6b93e8`                   | Chart stroke. 5.6:1 on `--sheet`        |
| `--data-sky`        | `#d5e4ff`                   | Chart stroke. 13.2:1 on `--sheet`       |
| `--data-sea`        | `#6dcfb4`                   | Chart stroke. 9.1:1 on `--sheet`        |
| `--data-coral`      | `#f0a090`                   | Chart stroke. 8.2:1 on `--sheet`        |
| `--data-amber`      | `#f0c14a`                   | Bar segment. 10.0:1 on `--sheet`        |
| `--wash-sky`        | `rgba(70, 100, 180, 0.36)`  | Background wash                         |
| `--wash-periwinkle` | `rgba(90, 80, 170, 0.28)`   | Background wash                         |
| `--wash-blue`       | `rgba(50, 90, 170, 0.32)`   | Background wash                         |
| `--wash-ice`        | `rgba(80, 120, 190, 0.24)`  | Background wash                         |

Direction is never colour alone. “Adds” is sea green and the word Adds. “Subtracts” is coral and the word Subtracts. Tiers are words (Clear, Steady, Mixed, Thin, Sparse) beside the number. Chart series run navy, mid blue, sea green, then coral. Navy and blue differ in lightness, and sea green is a different hue, so the set stays apart under deuteranopia. The weight bar uses navy, amber, and sea green.

The busiest light wash is periwinkle at 42% over `#f4f6fb`, near `#d4d9f0`. Where that wash overlaps sky, the ground is near `#b7caec`. `--ink` there is 9.7:1 and `--faint` is 4.7:1. Glass at 72% over that overlap lands near `#e6edf9`, where faint text is 6.7:1. Focus rings use `--focus`, well above 3:1 on the page. Filled navy controls switch the ring to `--ink`, offset onto the surface around the control.

### Glass

| Token                    | Light                                 | Dark                              | Role                                                   |
| ------------------------ | ------------------------------------- | --------------------------------- | ------------------------------------------------------ |
| `--glass-fill`           | `rgba(248, 250, 254, 0.72)`           | `rgba(16, 26, 52, 0.76)`          | Large surfaces, when blur is supported                 |
| `--glass-fill-raised`    | `rgba(255, 255, 255, 0.84)`           | `rgba(22, 34, 66, 0.88)`          | Controls and overlays                                  |
| `--glass-solid`          | `#f8fafe`                             | `#141e38`                         | Fallback, reduced transparency, charts, sticky headers |
| `--glass-line`           | `rgba(11, 31, 75, 0.12)`              | `rgba(190, 206, 240, 0.16)`       | 1px outer hairline                                     |
| `--glass-sheen`          | `rgba(255, 255, 255, 0.85)`           | `rgba(210, 220, 250, 0.16)`       | Inset top highlight                                    |
| `--glass-inset`          | `rgba(255, 255, 255, 0.55)`           | `rgba(210, 220, 250, 0.07)`       | Controls inside an already-blurred surface             |
| `--glass-sheen-gradient` | white, fading by 42%                  | cool white at 0.16, fading by 46% | Top light                                              |
| `--glass-shadow`         | slate, `0 1px 1px` plus `0 12px 32px` | deeper navy, still short          | Soft lift                                              |
| `--shadow-lift`          | `0 8px 22px rgba(11, 24, 56, 0.08)`   | `0 8px 22px rgba(2, 6, 18, 0.36)` | Control shadow                                         |
| `--shadow-accent`        | `0 8px 18px rgba(8, 20, 56, 0.18)`    | `0 8px 18px rgba(4, 10, 28, 0.4)` | Primary button shadow                                  |
| `--accent-glass`         | `rgba(11, 31, 75, 0.88)`              | `rgba(69, 104, 184, 0.9)`         | Primary button fill when blur works                    |
| `--accent-glass-hover`   | `rgba(7, 22, 51, 0.92)`               | `rgba(58, 88, 158, 0.94)`         | Primary hover when blur works                          |
| `--accent-edge`          | `rgba(255, 255, 255, 0.32)`           | `rgba(197, 212, 255, 0.55)`       | Button hairline                                        |
| `--blur-large`           | `8px` (`6px` under 800px)             | same                              | Header, mast, dock, sheets                             |
| `--blur-control`         | `14px` (`10px` under 800px)           | same                              | Buttons, pills, fields, tabs                           |
| `--blur-overlay`         | `16px` (`10px` under 800px)           | same                              | Menus and the map note                                 |
| `--glass-saturate`       | `1.35`                                | same                              | Saturation on the backdrop                             |

`--glass-solid` is painted first. The translucent fill and `backdrop-filter` apply only inside `@supports`. `prefers-reduced-transparency: reduce` forces the opaque button fill and removes the washes. Primary buttons keep their own blur, a translucent navy fill, an inset highlight, and a short top light, so they read as glass. The opaque `--accent-deep` fill is the fallback. Other controls inside a large glass surface do not add a second blur.

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
- **Search.** A glass field with a navy glass button. Suggestions are a glass menu of links.
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
- **Charts.** A navy line and a quiet fill on an opaque sheet, with the first and last year labelled. A dashed reference line when the payload includes one. Empty charts say “No series”. The compare chart is a stroked polygon per place, in navy, mid blue, sea green, then coral.
- **Tables.** A glass sheet, an opaque sticky header, sentence-case column labels, a caption that states the count or the reason there is no count.
- **Pills.** Pill toggles in a radiogroup. Selected is cool white on translucent navy.
- **Buttons.** Primary is navy glass. Secondary and ghost are cool-white glass. The menu control is the icon button, and it keeps a text label.
- **Source footer.** Always visible. If nothing is attached, it says so.
- **Map.** OpenFreeMap Positron in light, OpenFreeMap Dark in dark. Attribution stays on an opaque chip. The frame is a cool tint until tiles arrive. The failure note is a small glass overlay.

## Maps

Light style: `https://tiles.openfreemap.org/styles/positron`  
Dark style: `https://tiles.openfreemap.org/styles/dark`

The dark base map is OpenFreeMap Dark. It is a neutral reference map, not a second theme. Data layers, when they exist, use navy and mid blue at low opacity, with the lighter hex values from the dark theme.

## Writing

Sentences are short and specific. A missing number is described as not loaded. A zero is only shown when a query ran and returned zero. The composite is called a draft. The site does not tell someone where to live.
