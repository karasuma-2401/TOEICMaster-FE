# Notes on TOEICMaster Signature Colors

Recorded from the current UI code, primarily in `src/app/globals.css`, `src/features/auth/components/auth-layout.tsx`, auth/profile components, `src/features/user/components/brand-mark.tsx`, and `src/app/page.tsx`.

## Brand Color Palette

The authentication and profile interfaces use a **warm orange-red** tone as the primary brand color, paired with yellow accents and a light neutral background.

| Role             | Representative Colors           | Usage                                                          |
| ---------------- | ------------------------------- | -------------------------------------------------------------- |
| Brand Red        | `#ED361C`, `#EC251B`, `#C70E1A` | Links, focus states, subheadings, and accent strips            |
| Brand Orange     | `#FF6C0D`, `#FF681A`, `#F17939` | Action buttons, hero gradients, and avatars                    |
| Accent Yellow    | `#FFD361`, `#FFBD44`, `#FF9F25` | Logo, highlighted text, avatars, and decorative details        |
| Light Background | `#FFFDFC`, `#FAF8F7`, `#F5F1EF` | Forms, cards, page backgrounds, and control areas              |
| Warm Dark Text   | `#342D2A`, `#3D3532`, `#4E4542` | Headings, body text, and form labels                           |
| Secondary Text   | `#A89F9B`, `#938B87`, `#736A66` | Descriptions, secondary placeholders, and low-emphasis content |

## Visual Characteristics in the UI

- Primary buttons typically use a horizontal gradient from red `#EC251B` to orange `#FF6C0D`, white text, and a subtle warm red-orange shadow.
- The login/register hero uses a gradient from orange `#FF681A` through red `#ED261A` to deep red `#C70E1A`; yellow is used for highlights.
- The logo consists of two yellow-orange shapes (`#FF9F25`, `#FFBD44`) and one deep red shape (`#B31322`), matching the overall warm tone.
- Form and profile backgrounds are warm ivory white; borders and secondary surfaces use warm beige/gray such as `#E7DEDA`, `#EEE8E5`, `#F5F1EF`.
  Primary text is charcoal brown rather than pure black.
- Form errors use red; pending/confirmation notices usually use a light amber background; success toasts use green `#18A558`.

## Consistency Notes

The current home page (`src/app/page.tsx`) still uses Tailwind blue (`blue-700`, `blue-50`) and slate (`slate-200` to `slate-600`), while the auth and profile screens use the orange-red palette.
Therefore, **orange-red is the brand palette most clearly expressed in the completed UI flows**, though the application as a whole is not yet color-consistent.
The global background CSS variables in `src/app/globals.css` (`#F8FAFC`, `#0F172A`) and the home page's blue tones also do not yet reflect this warm palette.

If brand identity work continues, the home page and shared background/text color variables should be unified with the orange-red and warm neutral tones; keep green for success states and red/amber for semantic warning/error states.
