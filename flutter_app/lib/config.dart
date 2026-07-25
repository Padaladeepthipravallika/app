import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Centralised access to environment variables loaded from `.env`.
///
/// SECURITY NOTES
/// --------------
/// • Never commit the real `.env` file (it is git-ignored).
/// • A Firebase Admin SDK service-account JSON must NEVER be put in this
///   Flutter app or in `.env` — it would be shipped inside the APK and grant
///   admin access to your whole Firebase project. Mobile clients use only
///   `google-services.json` / `firebase_options.dart`, which are safe.
class AppConfig {
  static String get groqApiKey =>
      dotenv.maybeGet('GROQ_API_KEY') ?? 'YOUR_GROQ_API_KEY_HERE';

  static String get firebaseProjectId =>
      dotenv.maybeGet('FIREBASE_PROJECT_ID') ?? '';
}
