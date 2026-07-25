import 'package:flutter/material.dart';

import '../models/hydrogel_predictor.dart';
import 'graph_screen.dart';
import 'model_screen.dart';
import 'simulation_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _form = GlobalKey<FormState>();
  final _gel = TextEditingController(text: '10');
  final _gen = TextEditingController(text: '1');
  final _ph = TextEditingController(text: '7.4');
  final _temp = TextEditingController(text: '37');

  HydrogelPredictor? _build() {
    if (!(_form.currentState?.validate() ?? false)) return null;
    return HydrogelPredictor(
      gelatin: double.parse(_gel.text),
      genipin: double.parse(_gen.text),
      pH: double.parse(_ph.text),
      temp: double.parse(_temp.text),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Hydrogel Simulator')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _field(_gel, 'Gelatin (%)', '1 – 20'),
              _field(_gen, 'Genipin (%)', '0.1 – 5'),
              _field(_ph, 'pH', '3 – 10'),
              _field(_temp, 'Temperature (°C)', '4 – 60'),
              const SizedBox(height: 16),
              FilledButton.icon(
                icon: const Icon(Icons.play_arrow),
                label: const Text('Simulate'),
                onPressed: () {
                  final p = _build();
                  if (p != null) {
                    Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => SimulationScreen(predictor: p)));
                  }
                },
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                icon: const Icon(Icons.show_chart),
                label: const Text('Graphs'),
                onPressed: () {
                  final p = _build();
                  if (p != null) {
                    Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => GraphScreen(predictor: p)));
                  }
                },
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                icon: const Icon(Icons.view_in_ar),
                label: const Text('3D Model'),
                onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ModelScreen())),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController c, String label, String hint) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextFormField(
          controller: c,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: label,
            hintText: hint,
            border: const OutlineInputBorder(),
          ),
          validator: (v) {
            if (v == null || v.trim().isEmpty) return 'Required';
            if (double.tryParse(v) == null) return 'Invalid number';
            return null;
          },
        ),
      );
}
