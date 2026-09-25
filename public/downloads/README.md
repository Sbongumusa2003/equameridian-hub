# Android APK downloads

Place the release APK built from the Ionic/Capacitor project here:

```
public/downloads/EquaMeridian-Hub.apk
```

## How to produce the APK (Ionic project)

From the Ionic project root:

```bash
# 1. Build the web assets
npm run build

# 2. Sync to native Android project
npx cap sync android

# 3. Build a signed release APK (Android Studio or CLI)
cd android
./gradlew assembleRelease
```

The signed APK is typically at:

```
android/app/build/outputs/apk/release/app-release.apk
```

or, if you already produced it via Android Studio / Ionic Appflow:

```
android/app/release/app-release.apk
```

Copy that file here and rename it:

```bash
cp path/to/app-release.apk public/downloads/EquaMeridian-Hub.apk
```

After deploying the Angular hub, users can download it from the landing page at:

```
https://<your-hub-domain>/downloads/EquaMeridian-Hub.apk
```

**Note:** Browsers on Android will download the file; users may need to enable "Install from unknown sources" / allow the browser to install APKs.
