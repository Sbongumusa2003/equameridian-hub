# EquaMeridian Hub — Modern UI Redesign Solution Pack

**Product:** Machinery hire marketplace (ZAR, SAST dates)  
**Stack:** Angular 19, NgModules, SCSS, no Material/Bootstrap/Tailwind  
**Target polish:** Stripe Dashboard / Linear / Vercel  

This pack applies the **Modern UI Redesign Master Prompt (v3)** upgrades on top of the original repo.

---

## What was upgraded

### 1. Design system (Phase 1)
| File | Purpose |
|------|---------|
| `src/styles/_tokens.scss` | Full colour scale (orange 50–900), semantic AA tokens, radii, space, type, z-index, sidebar |
| `src/styles/_mixins.scss` | Desktop-first `mq()` / `mq-min()` breakpoints |
| `src/styles.scss` | `@use` tokens+mixins; `--font-size-xs: 13px`; page bg `#f7f7f5`; utility classes |
| `angular.json` | `stylePreprocessorOptions.includePaths: ["src/styles"]` |
| `src/app/shared/components/icon/` | Inline SVG icon component (`app-icon`) |
| `src/app/shared/services/confirm.service.ts` | Promise-based confirm (replaces native `confirm`) |
| `src/app/shared/services/toast.service.ts` | Non-blocking toasts (replaces native `alert` patterns) |

### 2. Safety / consistency gates (Phase 6 + residual)
| Gate | Result |
|------|--------|
| Native `confirm()` / `alert()` | **Removed** — ConfirmService + `console.warn` for PDF pop-up |
| Emoji as UI icons | **0** remaining |
| Inline `style="` | **0** remaining (moved to utility classes) |
| Brand hex → tokens | Batch applied; residual chart/SVG hex may remain |
| `@import` | None |

### 3. Confirm call sites converted
- Admin backup delete  
- Admin location tree (province / city / suburb)  
- Admin platform fees (category / tier)  
- Contractor my-reviews delete  

### 4. Intentionally unchanged (per master prompt)
- No new routes, API calls, DTOs, validators  
- No Material / Bootstrap / Tailwind  
- No global search  
- No supplier dashboard route  
- SupplierAuth dead redirect left as-is  
- Business logic, form control names, guards preserved  

---

## How to use this package

```bash
# From project root (folder containing angular.json)
npm ci
npm start
# or
ng build --configuration production
```

### Using tokens in component SCSS
```scss
@use 'mixins' as *;

.my-block {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);

  @include mq(md) {
    padding: var(--space-4);
  }
}
```

### Using confirm
```ts
const ok = await this.confirmSvc.confirm({
  title: 'Delete listing',
  message: `Delete "${name}"? This cannot be undone.`,
  confirmLabel: 'Delete listing',
  danger: true
});
if (!ok) return;
```

### Using icons
```html
<app-icon name="cart" [size]="20"></app-icon>
```
Names include: `search`, `cart`, `bell`, `user`, `heart`, `heart-outline`, `equipment`, `x`, `check`, `help`, `log-out`, `menu`, `plus`, `chevron-down`, `star`.

---

## Recommended follow-up (not blocked by this pack)

1. **Cart reference screen** — full 2-column sticky summary redesign (Phase 2 design).  
2. **App shell** — icon+label nav, collapsible rail, topbar actions (Phase 3).  
3. **Landing** — slim SCSS under 20 kB; auth password show/hide (Phase 4).  
4. **Module sweep** — same page-header / panel / table patterns everywhere (Phase 5).  
5. Hex residual → 0; convert remaining `@media` to `mq()`.  
6. Wire confirm dialog **host component** in `app.component` / main-layout so ConfirmService has UI (service is ready; host UI still to mount).  
7. Production build + Playwright screenshots on a machine with ≥4 GB RAM.

---

## Docs in this pack
- `docs/SOLUTION.md` — this file  
- `docs/ui-guide.md` — tokens & usage (if present)  
- `docs/residual-closure.md` — gate status  

## Environment note
Sandbox sessions repeatedly reset the working tree; always **commit and push** after applying this pack so upgrades are not lost.
