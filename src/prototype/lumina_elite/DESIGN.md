---
name: Lumina Elite
colors:
  surface: '#fcf8f8'
  surface-dim: '#ddd9d9'
  surface-bright: '#fcf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c8'
  surface-tint: '#5d5f5f'
  primary: '#5d5f5f'
  on-primary: '#ffffff'
  primary-container: '#ffffff'
  on-primary-container: '#747676'
  inverse-primary: '#c6c6c7'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2e1'
  on-secondary-container: '#656464'
  tertiary: '#bb152c'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffffff'
  on-tertiary-container: '#dd3240'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b1'
  on-tertiary-fixed: '#410007'
  on-tertiary-fixed-variant: '#92001c'
  background: '#fcf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style
The design system is rooted in the "New Editorial" movement—a fusion of high-end print journalism and modern digital minimalism. It targets an affluent, discerning audience that values clarity, intentionality, and prestige. The emotional response should be one of calm authority; the UI does not beg for attention but commands it through expert use of negative space.

Whitespace is treated as a primary layout element rather than a void, functioning as a luxury "canvas" that allows content to breathe. The aesthetic is architectural and structured, avoiding decorative trends in favor of timeless typographic hierarchy and precise alignments.

## Colors
The palette is intentionally restrained to evoke an "expensive" feel.
- **Base:** The primary background is a stark, clean #FFFFFF. Use it generously to create a sense of scale.
- **Ink:** Charcoal Black (#121212) is used for all primary typography and structural strokes. It provides the necessary weight to anchor the airy layout.
- **Premium Accents:** Ember Red (#E63946) is reserved for high-priority calls to action and critical status indicators. Use it sparingly to maintain its impact.
- **Warmth:** Burnt Orange (#F4A261) acts as a secondary accent for subtle highlights, hover states on interactive elements, or premium category tagging.

## Typography
Typography is the cornerstone of this design system. We pair the high-contrast, graceful serifs of **Playfair Display** with the utilitarian precision of **Inter**.

- **Headlines:** Must utilize high contrast and tight letter-spacing. For display sizes, use optical kerning to ensure a "magazine cover" quality.
- **Body:** Inter is set with generous line-height (1.6) and a slight positive letter-spacing to enhance readability on white backgrounds.
- **Labels:** Use `label-caps` for eyebrows, navigation items, and small metadata to provide a structured, architectural contrast to the fluid serifs of the headings.

## Layout & Spacing
This design system utilizes a rigid 12-column grid for desktop with wide gutters to prevent content crowding. 

- **Vertical Rhythm:** Use a base 8px increment, but prefer large "step" jumps (e.g., 64px, 120px) between major sections to maintain the editorial feel.
- **Margins:** Desktop layouts should feature wide margins (64px+) to box the content, mimicking the look of a printed page.
- **Responsive Behavior:** On mobile, columns collapse to a single stack, and the side margins tighten to 20px. The `section-gap` should scale down to 64px on mobile to maintain momentum.

## Elevation & Depth
In keeping with the minimalist and architectural style, this design system eschews heavy drop shadows. 

- **Flat Depth:** Hierarchy is established through size, typography, and color blocking rather than Z-axis elevation.
- **Ghost Outlines:** Use 1px solid #121212 borders at low opacity (10-15%) for subtle containment if necessary.
- **Interaction Depth:** Only use shadows for "active" floating elements (like dropdowns or modals). These should be ultra-diffused: `0 20px 40px rgba(0,0,0,0.05)`.
- **Tonal Layers:** Use a very light grey (#F9F9F9) instead of shadows to differentiate background sections from the main white surface.

## Shapes
The shape language is "Softened Architectural." We utilize a consistent 4px (`0.25rem`) corner radius for all components, including buttons, input fields, and cards. This provides a modern, precise feel that is less aggressive than a true 0px sharp corner but more sophisticated than bubbly, fully rounded elements. 

Images should follow this rule strictly to maintain a unified visual language across content and UI.

## Components
- **Buttons:** Primary buttons are solid Charcoal Black with white text, 4px radius, and no shadow. Secondary buttons are "Ghost" style with a 1px Charcoal border. Accents use Ember Red strictly for "Buy" or "Subscribe" actions.
- **Input Fields:** Use "Underline" style or a very thin 1px border. Focus states transition the border color to Charcoal Black. Labels should always use the `label-caps` typography style.
- **Cards:** Cards should not have shadows. Use a 1px light grey border or simply allow the content's layout and whitespace to define the card's boundaries.
- **Navigation:** Use a "Sticky" header with a blur effect (`backdrop-filter: blur(10px)`) over a semi-transparent white background to maintain the airy feel while scrolling.
- **Chips/Tags:** Small, rectangular with 4px corners. Use a light Burnt Orange background with dark text for premium features or "New" labels.
- **Dividers:** Use 1px hair-lines in a very light grey to separate content without breaking the flow.