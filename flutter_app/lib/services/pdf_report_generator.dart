import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

import '../models/hydrogel_predictor.dart';

class PdfReportGenerator {
  static Future<File> generate(HydrogelPredictor p, String aiNotes) async {
    final doc = pw.Document();

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (ctx) => pw.Padding(
          padding: const pw.EdgeInsets.all(24),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text('Hydrogel Simulation Report',
                  style: pw.TextStyle(
                      fontSize: 20, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 16),
              _section('Inputs', [
                'Gelatin: ${p.gelatin} %',
                'Genipin: ${p.genipin} %',
                'pH: ${p.pH}',
                'Temperature: ${p.temp} °C',
              ]),
              _section('Predicted Properties', [
                'Tensile strength : ${p.tensileStrength().toStringAsFixed(2)} kPa',
                'Elasticity       : ${p.elasticity().toStringAsFixed(2)} kPa',
                'Degradation time : ${p.degradationDays().toStringAsFixed(1)} days',
                'Swelling ratio   : ${p.swellingRatio().toStringAsFixed(2)} g/g',
                'Stability score  : ${p.stabilityScore().toStringAsFixed(1)} / 100',
              ]),
              _section('Recommendation', p.recommendation().split('\n')),
              if (aiNotes.isNotEmpty)
                _section('AI Analysis', aiNotes.split('\n')),
            ],
          ),
        ),
      ),
    );

    final dir = await getApplicationDocumentsDirectory();
    final file = File(
        '${dir.path}/hydrogel_report_${DateTime.now().millisecondsSinceEpoch}.pdf');
    await file.writeAsBytes(await doc.save());
    return file;
  }

  static pw.Widget _section(String title, List<String> lines) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 14),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(title,
              style: pw.TextStyle(
                  fontSize: 14, fontWeight: pw.FontWeight.bold)),
          pw.SizedBox(height: 6),
          for (final l in lines) pw.Text(l, style: const pw.TextStyle(fontSize: 11)),
        ],
      ),
    );
  }
}
