import 'package:flutter/material.dart';

import '../config.dart';
import '../models/hydrogel_predictor.dart';
import '../services/firebase_helper.dart';
import '../services/groq_api_client.dart';
import 'result_screen.dart';

// Pulls the key from .env via AppConfig.

class SimulationScreen extends StatefulWidget {
  final HydrogelPredictor predictor;
  const SimulationScreen({super.key, required this.predictor});

  @override
  State<SimulationScreen> createState() => _SimulationScreenState();
}

class _SimulationScreenState extends State<SimulationScreen> {
  String _ai = 'Requesting AI analysis…';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _runAi();
  }

  Future<void> _runAi() async {
    final p = widget.predictor;
    final prompt =
        'Analyse a genipin-crosslinked gelatin hydrogel with ${p.gelatin}% gelatin, '
        '${p.genipin}% genipin, pH ${p.pH}, ${p.temp} °C. Comment on mechanical '
        'strength, swelling, biodegradation and best biomedical use '
        '(wound dressing vs scaffold).';
    try {
      final txt = await GroqApiClient(AppConfig.groqApiKey).analyze(prompt);
      if (!mounted) return;
      setState(() {
        _ai = txt;
        _loading = false;
      });
      await FirebaseHelper().saveSimulation(p, txt);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _ai = 'AI unavailable: $e';
        _loading = false;
      });
      await FirebaseHelper().saveSimulation(p, '');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.predictor;
    final results = '''
Inputs:
  Gelatin ${p.gelatin.toStringAsFixed(2)} %
  Genipin ${p.genipin.toStringAsFixed(2)} %
  pH ${p.pH.toStringAsFixed(2)}
  Temp ${p.temp.toStringAsFixed(1)} °C

Predicted properties:
  • Tensile strength : ${p.tensileStrength().toStringAsFixed(2)} kPa
  • Elasticity       : ${p.elasticity().toStringAsFixed(2)} kPa
  • Degradation time : ${p.degradationDays().toStringAsFixed(1)} days
  • Swelling ratio   : ${p.swellingRatio().toStringAsFixed(2)} g/g
  • Stability score  : ${p.stabilityScore().toStringAsFixed(1)} / 100''';

    return Scaffold(
      appBar: AppBar(title: const Text('Simulation')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Text(results,
                    style: const TextStyle(fontFamily: 'monospace')),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      const Icon(Icons.smart_toy_outlined),
                      const SizedBox(width: 6),
                      const Text('AI Analysis (Groq)',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                      const Spacer(),
                      if (_loading)
                        const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2)),
                    ]),
                    const SizedBox(height: 8),
                    Text(_ai),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              icon: const Icon(Icons.arrow_forward),
              label: const Text('See recommendation'),
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ResultScreen(predictor: p, aiNotes: _ai),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
