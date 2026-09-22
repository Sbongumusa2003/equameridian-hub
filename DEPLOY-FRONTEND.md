# EquaMeridian Hub — frontend deploy notes

## Build

```bash
npm ci
npx ng build --configuration production
```

Output: `dist/equameridian-hub/browser` (or `dist/equameridian-hub` depending on Angular version).

## API URL

Edit `src/environments/environment.prod.ts` before building:

```ts
apiUrl: 'https://YOUR-API.azurewebsites.net/api'
```

## Azure App Service

1. Deploy the **contents** of the browser build folder.
2. `web.config` is included for SPA route fallback (deep links).
3. Enable HTTPS only.

## Checklist

- [ ] Login / OTP
- [ ] Supplier create listing + images
- [ ] Contractor browse + book
- [ ] Chatbot model info
- [ ] Admin dashboard charts
