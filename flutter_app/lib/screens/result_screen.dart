import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../models/hydrogel_predictor.dart';
import '../services/pdf_report_generator.dart';

class ResultScreen extends StatelessWidget {
  final HydrogelPredictor predictor;
  final String aiNotes;
  const ResultScreen({super.key, required this.predictor, required this.aiNotes});

  Future<void> _exportPdf(BuildContext context) async {
    try {
      final file = await PdfReportGenerator.generate(predictor, aiNotes);
      await Share.shareXFiles(
        [XFile(file.path, mimeType: 'application/pdf')],
        text: 'Hydrogel Simulation Report',
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('PDF error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = '''${predictor.recommendation()}

Best formulation guideline:
  Gelatin 8–12 %, Genipin 0.5–1.5 %, pH 7.4, 37 °C
  → balanced strength, swelling and biodegradation suitable for both
    wound dressing and soft-tissue scaffolding.''';

    return Scaffold(
      appBar: AppBar(title: const Text('Result')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Text(body, style: const TextStyle(fontSize: 15)),
              ),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              icon: const Icon(Icons.picture_as_pdf),
              label: const Text('Export PDF'),
              onPressed: () => _exportPdf(context),
            ),
          ],
        ),
      ),
    );
  }
}
