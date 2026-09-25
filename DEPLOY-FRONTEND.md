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


## Android APK download

1. Build a **signed release APK** from the Ionic/Capacitor project (`android/app/build/outputs/apk/release/app-release.apk` or equivalent).
2. Copy it into the Angular hub before building:

   ```bash
   mkdir -p public/downloads
   cp /path/to/app-release.apk public/downloads/EquaMeridian-Hub.apk
   ```

3. Build and deploy the frontend as usual. The landing page links to:

   ```
   /downloads/EquaMeridian-Hub.apk
   ```

Users on Android can download and install the APK (may need to allow install from browser).
