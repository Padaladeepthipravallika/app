# Hydrogel Simulator (Android · Java · Firebase · Groq AI)

A research/educational Android app that **predicts the behaviour of
genipin-crosslinked gelatin hydrogels** for wound healing and tissue
engineering.

## Features

| # | Module | What it does |
|---|--------|--------------|
| 1 | **Material Input** | Gelatin %, Genipin %, pH, Temperature |
| 2 | **Simulation** | Tensile strength, Elasticity, Degradation time, Swelling ratio, Stability score |
| 3 | **Graphs** | Strength vs Genipin · Degradation vs Time · Swelling vs pH (MPAndroidChart) |
| 4 | **3D Hydrogel Model** | three.js WebView showing crosslinked polymer network |
| 5 | **Result** | Best-formulation recommendation + suggested use (wound dressing / scaffold) |
| 6 | **PDF Report** | Generates and shares a full PDF (`PdfDocument` API) |
| – | **Cloud sync** | Every simulation is logged to **Firebase Firestore** |
| – | **AI Analysis** | A second-opinion narrative is requested from **Groq** (`llama-3.1-8b-instant`) |

## Project layout

```
HydrogelSimulator/
├── build.gradle, settings.gradle, gradle.properties
└── app/
    ├── build.gradle
    ├── google-services.json         <-- replace with yours from Firebase console
    └── src/main/
        ├── AndroidManifest.xml
        ├── assets/hydrogel3d.html   <-- three.js 3D crosslink model
        ├── java/com/example/hydrogelsimulator/
        │   ├── MainActivity.java
        │   ├── SimulationActivity.java
        │   ├── GraphActivity.java
        │   ├── ModelActivity.java
        │   ├── ResultActivity.java
        │   ├── HydrogelPredictor.java   (empirical formulas)
        │   ├── GroqApiClient.java       (Groq REST + OkHttp)
        │   ├── FirebaseHelper.java      (Firestore writer)
        │   └── PdfReportGenerator.java  (PDF export)
        └── res/  (layouts, themes, strings, file_paths.xml)
```

## Setup

1. **Open in Android Studio** (Hedgehog or newer, JDK 17).
2. **Firebase**
   - Create a project at <https://console.firebase.google.com/>.
   - Add an Android app with package id `com.example.hydrogelsimulator`.
   - Download the real **`google-services.json`** and replace the
     placeholder in `app/`.
   - Enable **Cloud Firestore** (test mode is fine for development).
3. **Groq API key**
   - Get one at <https://console.groq.com/keys>.
   - Open `app/src/main/res/values/strings.xml` and replace
     `YOUR_GROQ_API_KEY_HERE`.
   - For production, proxy this call through your own backend instead of
     shipping the key inside the APK.
4. **Build & run** on a device / emulator with API 24+.

## Prediction model (educational)

Equations in `HydrogelPredictor.java` are simplified empirical fits
inspired by published trends (Bigi 2002, Sung 1999, Yoo 2011).
They are intended for **simulation/teaching**, not clinical use.

| Property | Trend captured |
|----------|----------------|
| Tensile strength | ↑ with gelatin & log(genipin); peaks near pH 7; drops above 45 °C |
| Elasticity | ↑ with gelatin & √genipin |
| Degradation time | ↑ with crosslinking; ↓ with temperature & deviation from pH 7 |
| Swelling ratio | ↓ with crosslinking; ↑ away from isoelectric point (~pH 5) |
| Stability score | composite 0–100 |

## License

MIT — for academic / educational use.
