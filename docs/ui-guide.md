# UI Guide — EquaMeridian Hub

## Brand
- Primary: `#c84b11` → `var(--color-primary)`
- Hover: `#a83d0e` → `var(--color-primary-hover)`
- Text on light for links: `var(--color-orange-700)`

## Type
- Body 15px, captions ≥13px (`--font-size-xs`)
- Font: DM Sans

## Layout
- Page max width 1280px
- Header: title → one-line help → primary action
- Touch targets ≥44px

## Confirm / Toast
Use `ConfirmService` and `ToastService` — never native `confirm`/`alert`.

## Icons
`<app-icon name="...">` only — no emoji icons, no icon libraries.
