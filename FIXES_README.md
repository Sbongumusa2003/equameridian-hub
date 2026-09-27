# EquaMeridian Angular (Hub) – Fixed build

This package is your deployed Angular app with the following fixes applied:

## Included fixes
1. **Restricted-session route guard** – Disabled users limited to /account/documents and /account/profile
2. **Auth** – isRestricted getter, restricted post-login redirect, LoginResponse.restrictedAccess
3. **Admin Users** – booking-summary support (getBookingSummary + users component logic)
4. **Routing** – RestrictedSessionGuard on main authenticated layout

## After extract
```bash
npm install
ng build
# or npm run build
# deploy as usual
```

New file: `src/app/core/guards/restricted-session.guard.ts`
