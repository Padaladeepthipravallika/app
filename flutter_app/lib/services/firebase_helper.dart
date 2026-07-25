import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

import '../models/hydrogel_predictor.dart';

class FirebaseHelper {
  Future<void> saveSimulation(HydrogelPredictor p, String aiNotes) async {
    try {
      await FirebaseFirestore.instance.collection('simulations').add({
        'gelatin': p.gelatin,
        'genipin': p.genipin,
        'pH': p.pH,
        'temperature': p.temp,
        'tensileStrength': p.tensileStrength(),
        'elasticity': p.elasticity(),
        'degradationDays': p.degradationDays(),
        'swellingRatio': p.swellingRatio(),
        'stability': p.stabilityScore(),
        'recommendation': p.recommendation(),
        'aiNotes': aiNotes,
        'timestamp': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('Firestore save failed: $e');
    }
  }
}
