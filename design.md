---
version: 1
name: CampusMart Monochrome
description: Uber-inspired black-and-white design language adapted for a Chiang Mai University student marketplace.
---

# CampusMart Design System

CampusMart adapts the restraint of the supplied Uber design reference to a student marketplace. The interface uses a black-and-white foundation, a single pill shape for actions, clear typography, and restrained surfaces. Product photos provide the visual variety; gradients and decorative color do not.

## Colors

| Token | Value | Use |
|---|---|---|
| `ink` | `#000000` | Headings, primary actions, dark feature bands |
| `on-ink` | `#ffffff` | Text and icons on dark surfaces |
| `canvas` | `#ffffff` | Page and card background |
| `body` | `#5e5e5e` | Supporting copy and secondary labels |
| `mute` | `#777777` | Captions, metadata and disabled copy |
| `canvas-soft` | `#efefef` | Inputs, category controls and subtle status surfaces |
| `canvas-softer` | `#f3f3f3` | Large soft panels and skeleton placeholders |
| `hairline` | `#e2e2e2` | Dividers and quiet card outlines |
| `hairline-strong` | `#afafaf` | Hover borders and secondary emphasis |
| `ink-elevated` | `#282828` | Hover state for black controls |

Use status labels, icons and copy to distinguish states. Keep status colors inside the monochrome palette.

## Typography

- **Display and body:** Google Sans, weight 400–700 for body, controls and headlines.
- **Hero wordmark:** Ribeye for the “Campus Mart” title on the marketplace hero.
- **Thai fallback:** Kanit, with the same weight hierarchy.
- **Display scale:** 52px / 36px / 32px / 24px / 20px, with line-height around 1.22–1.4.
- **Body scale:** 18px / 16px / 14px / 12px.
- Keep headlines sentence-case with neutral letter spacing. Do not use a mono font or all-caps treatment for Thai labels.
- Kanit remains the fallback for Thai glyphs not covered by Google Sans.

## Shape and spacing

- Interactive controls and category selectors: `999px` pill radius.
- Cards and content panels: `16px` radius.
- Inputs: square corners, soft gray fill and a black focus outline.
- Use a 4px spacing base, with common steps of 4, 8, 12, 16, 20, 24 and 32px.
- Keep elevation flat by default. Use only a light neutral shadow for floating menus where needed.

## Components

- **Primary action:** black pill, white text, sentence-case label.
- **Secondary action:** white pill with a black border.
- **Subtle action:** soft gray pill with black text.
- **Navigation:** white, sticky, thin bottom divider; compact wordmark and clear account actions.
- **Product card:** white 16px card, 4:3 image, price and title first, pickup location and seller as metadata.
- **Category control:** horizontally scrollable pills; selected pill is black with white text.
- **Promotional band:** full black or black rounded panel with white text; use sparingly to create a polarity shift.
- **Inputs:** gray rectangular surface with black text and a clear high-contrast focus state.
- **Footer:** black background with white and muted-white copy.

## Do and avoid

- Preserve generous whitespace and readable contrast.
- Use real product photography as the primary visual element.
- Use black, white and neutral grays only for interface decoration.
- Avoid gradients, purple accents, colored glows, oversized shadows and mixed card radii.
- Keep decorative elements subordinate to product titles, prices and pickup details.

## Responsive behavior

- Collapse the navigation search into a full-width mobile search field.
- Let category pills scroll horizontally rather than wrapping into dense grids.
- Stack the marketplace hero columns and feature list on narrow screens.
- Keep product cards in a single column on phones and increase columns as space allows.
