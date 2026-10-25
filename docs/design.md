# Design

The interface should read like a printed record: a warm paper ground, a serif for titles, a plain sans for the figures, and colour used as a mark rather than a wash. The product name is set in `src/config/site.ts`. This document does not depend on that name.

## Palette

Tokens live in `src/styles/tokens.css` as custom properties. Components do not hard-code hex values except the map fill, which MapLibre paint cannot read from CSS.

Light is the default. Dark replaces the same tokens under `[data-theme="dark"]`. The choice is stored in `localStorage` under `theme` and is applied before paint by the small script in `index.html`.

### Light

| Token                 | Hex       | Role                                               |
| --------------------- | --------- | -------------------------------------------------- |
| `--paper`             | `#f4efe6` | Page background                                    |
| `--sheet`             | `#faf6f0` | Header, chart ground                               |
| `--ink`               | `#231c16` | Text, 14.7:1 on paper                              |
| `--ink-soft`          | `#3c332b` | Secondary text, 10.8:1                             |
| `--faint`             | `#5e554c` | Kickers and captions, 6.4:1                        |
| `--rule`              | `#ddd2c3` | Hairlines                                          |
| `--rule-strong`       | `#cbbba6` | Stronger dividers, slider tracks                   |
| `--terracotta`        | `#8d3c2b` | Links and emphasis text, 6.5:1                     |
| `--terracotta-deep`   | `#6f2e22` | Solid buttons, 9.3:1 with `--on-accent`            |
| `--terracotta-deeper` | `#542318` | Button hover                                       |
| `--terracotta-mark`   | `#b85a3e` | Large marks only. About 4:1, so not for small text |
| `--on-accent`         | `#faf6f0` | Text on solid buttons                              |
| `--ochre`             | `#6b4b1d` | Ochre text, 6.9:1                                  |
| `--ochre-mark`        | `#a07d3a` | The quote rule and alternate bar segments          |
| `--ochre-wash`        | `#f0e4cc` | One pull-quote ground                              |
| `--sage`              | `#3e5346` | “Adds” label, 7.3:1                                |
| `--sage-mark`         | `#6e7f6a` | Positive bar segment, aside rule                   |
| `--sage-wash`         | `#e3ebe4` | Reserved wash                                      |
| `--clay`              | `#e8dccb` | Map frame before tiles                             |
| `--focus`             | `#8d3c2b` | Focus ring                                         |

### Dark

| Token               | Hex       | Role                                  |
| ------------------- | --------- | ------------------------------------- |
| `--paper`           | `#1a1613` | Page background                       |
| `--sheet`           | `#241f1b` | Header                                |
| `--ink`             | `#f3ece3` | Text, 15.3:1 on paper                 |
| `--ink-soft`        | `#e4d9cc` | Secondary text                        |
| `--faint`           | `#b3a69a` | Kickers, 7.6:1                        |
| `--rule`            | `#3c342c` | Hairlines                             |
| `--rule-strong`     | `#5c4e42` | Stronger dividers                     |
| `--terracotta`      | `#e7b2a4` | Links, 9.7:1                          |
| `--terracotta-deep` | `#6f2e22` | Buttons stay dark, with `--on-accent` |
| `--terracotta-mark` | `#d4785c` | Large marks                           |
| `--ochre`           | `#d7c4a1` | Ochre text, 10.5:1                    |
| `--ochre-wash`      | `#3a3123` | Quote ground, 10.9:1 with ink         |
| `--sage`            | `#c5d2c2` | “Adds” label                          |
| `--sage-wash`       | `#24302a` | Reserved wash                         |
| `--clay`            | `#2a241e` | Map frame                             |

Direction is never colour alone. “Adds” is sage and the word Adds. “Subtracts” is terracotta and the word Subtracts. Tiers are words (Clear, Steady, Mixed, Thin, Sparse) beside the number.

## Type

Fraunces (variable, optical size) for titles, ledes, and the search field. Public Sans (variable) for UI, tables, and captions. Both are self-hosted from Fontsource.

| Token        | Size                         | Use                       |
| ------------ | ---------------------------- | ------------------------- |
| `--text-xs`  | 0.75rem                      | Kickers, uppercase labels |
| `--text-sm`  | 0.875rem                     | Meta, captions, nav       |
| `--text-md`  | 1.0625rem                    | Body                      |
| `--text-lg`  | 1.25rem                      | Subheads inside sections  |
| `--text-xl`  | 1.6rem                       | Reserved                  |
| `--text-2xl` | 2.4rem                       | Section titles            |
| `--text-3xl` | `clamp(2.6rem, 6vw, 4.2rem)` | Page titles               |
| `--text-4xl` | `clamp(3.4rem, 9vw, 6.5rem)` | Home title                |

Titles use a slight negative tracking and the Fraunces soft axis at 30. Body line-height is 1.55. Numbers use tabular lining figures.

Kickers are uppercase, tracked 0.14em, in the faint colour. They carry the section number (`01 — Reading`) so the suburb page has a contents, not a pile of cards.

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

The reading measure is `--measure` (74rem) inside `--gutter`. Sections on a suburb page are separated by a hairline and `var(--space-6)` of padding, not by a repeated card.

Corners are square. Shadows are not used. The only filled ground besides the page is the ochre quote, the solid button, the selected pill, and the chart sheet.

## Motion

Underlines and the search rule change colour. Sliders and the weight bar update immediately. The map eases only through MapLibre’s own camera.

`prefers-reduced-motion: reduce` removes transitions and smooth scrolling.

## Components

- **Search.** An underline field, serif type, square button. Suggestions are a list of links, not a floating panel.
- **Section nav.** Sticky text links. The current section gets a terracotta underline via `aria-current`.
- **Composite.** A number, a tier word, and a ruled measure. Drivers are rows: direction word, label, points or “Not scored”.
- **Metric rows.** Label left, value right, em dash when empty. The sentence above them says the section has no figures.
- **Charts.** A single terracotta line on a sheet. A dashed reference line when the payload includes one. Empty charts say “no series”.
- **Tables.** Hairline rows, uppercase column labels, a caption that states the count or the reason there is no count.
- **Pills.** Square toggles in a radiogroup. Selected is ink on paper, reversed.
- **Source footer.** Always visible. If nothing is attached, it says so.
- **Map.** OpenFreeMap Positron in light, OpenFreeMap Dark in dark. Attribution stays visible. The frame is clay until tiles arrive.

## Maps

Light style: `https://tiles.openfreemap.org/styles/positron`  
Dark style: `https://tiles.openfreemap.org/styles/dark`

The dark base map is cooler than the paper palette. It is a neutral reference map, not a second theme. Data layers, when they exist, use terracotta and ochre at low opacity.

## Writing

Sentences are short and specific. A missing number is described as not loaded. A zero is only shown when a query ran and returned zero. The composite is called a draft. The site does not tell someone where to live.
