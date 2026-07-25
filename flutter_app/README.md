# Hydrogel Simulator — Flutter

A Flutter port of the original Android-Java app. Same features:

- Material input form (gelatin, genipin, pH, temperature)
- Empirical predictions (tensile strength, elasticity, degradation, swelling, stability)
- Charts via **fl_chart**
- 3D crosslink network in a **WebView** (reuses the same three.js HTML asset)
- AI analysis via **Groq** (`llama-3.1-8b-instant`)
- **Cloud Firestore** logging of every simulation
- PDF export via the **pdf** + **share_plus** packages

---

## 1. One-time Flutter scaffold

The `lib/`, `pubspec.yaml` and `assets/` files in this folder are ready, **but the
native Android/iOS folders are not generated**. Generate them once:

```powershell
cd c:\Users\nanim\Projects\HydrogelSimulator\flutter_app
flutter create . --project-name hydrogel_simulator --org com.example --platforms=android,ios
flutter pub get
```

`flutter create .` keeps the existing `lib/` and `pubspec.yaml` and only adds the
missing `android/`, `ios/`, `test/`, etc.

---

## 2. Firebase setup (the easy way: FlutterFire CLI)

### 2.1 Prerequisites (run once on your machine)

```powershell
# Install the Firebase CLI (needs Node.js)
npm install -g firebase-tools

# Sign in
firebase login

# Install the FlutterFire CLI
dart pub global activate flutterfire_cli
```

Make sure `%USERPROFILE%\AppData\Local\Pub\Cache\bin` is on your PATH so
`flutterfire` is callable.

### 2.2 Create / pick a Firebase project

1. Go to <https://console.firebase.google.com/> and create a project
   (or reuse the one your Android app already uses).
2. Enable **Cloud Firestore** → *Start in test mode* (for development).

### 2.3 Wire Firebase into the Flutter app

From `flutter_app/`:

```powershell
flutterfire configure
```

Pick:

- your Firebase project
- platforms: **android** (and **ios** if you want)
- Android application id: **com.example.hydrogel_simulator**
  (or whatever you used with `flutter create --org`)

This command will:

- create `lib/firebase_options.dart`
- download `android/app/google-services.json` automatically
- download `ios/Runner/GoogleService-Info.plist` (if iOS chosen)
- patch the Gradle files to apply the `com.google.gms.google-services` plugin

After it finishes, change `lib/main.dart` to use the generated options:

```dart
import 'firebase_options.dart';
// ...
await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
```

### 2.4 Manual fallback (no FlutterFire CLI)

If you cannot run the CLI:

1. In the Firebase console → *Project settings* → *Your apps* → **Add app → Android**.
2. Use package name **com.example.hydrogel_simulator**.
3. Download `google-services.json` and put it in
   `flutter_app/android/app/google-services.json`.
4. Edit `flutter_app/android/build.gradle` — add the classpath:
   ```gradle
   buildscript {
     dependencies {
       classpath 'com.google.gms:google-services:4.4.2'
     }
   }
   ```
5. Edit `flutter_app/android/app/build.gradle` — at the **bottom** add:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```
6. Make sure `minSdkVersion` is `>= 23` in `android/app/build.gradle`.

### 2.5 Firestore security rules (development)

In the Firebase console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /simulations/{doc} {
      allow read, write: if true;   // tighten before production!
    }
  }
}
```

---

## 3. Groq API key

Open [`lib/config.dart`](lib/config.dart) and replace `YOUR_GROQ_API_KEY_HERE`
with the key from <https://console.groq.com/keys>.

> For production: do **not** ship the key in the app. Proxy the call through
> your own backend (Cloud Functions, etc.).

---

## 4. Run

```powershell
flutter pub get
flutter run
```

If WebView fails on Android, ensure `minSdkVersion >= 21` in
`android/app/build.gradle` (the `webview_flutter` requirement).

---

## 5. Project layout

```
flutter_app/
├── pubspec.yaml
├── assets/
│   └── hydrogel3d.html               # three.js 3D model (same as Android)
└── lib/
    ├── main.dart
    ├── config.dart                   # Groq API key
    ├── models/
    │   └── hydrogel_predictor.dart   # empirical formulas (port of Java)
    ├── services/
    │   ├── groq_api_client.dart      # Groq REST via http
    │   ├── firebase_helper.dart      # Firestore writer
    │   └── pdf_report_generator.dart # PDF via `pdf` package
    └── screens/
        ├── home_screen.dart          # input form
        ├── simulation_screen.dart    # predictions + AI
        ├── graph_screen.dart         # fl_chart graphs
        ├── model_screen.dart         # WebView 3D model
        └── result_screen.dart        # recommendation + PDF export
```
