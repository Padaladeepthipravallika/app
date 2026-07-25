import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'screens/home_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load secrets from .env (git-ignored). Safe to fail silently in case the
  // file is missing in some build configurations.
  try {
    await dotenv.load(fileName: '.env');
  } catch (e) {
    debugPrint('.env not loaded: $e');
  }

  // Uses google-services.json (Android) / GoogleService-Info.plist (iOS) /
  // firebase_options.dart if you ran `flutterfire configure`.
  try {
    await Firebase.initializeApp();
  } catch (e) {
    // App still runs without Firebase (cloud sync just disabled).
    debugPrint('Firebase init failed: $e');
  }
  runApp(const HydrogelApp());
}

class HydrogelApp extends StatelessWidget {
  const HydrogelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hydrogel Simulator',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF1565C0),
        useMaterial3: true,
        brightness: Brightness.light,
      ),
      home: const HomeScreen(),
    );
  }
}
