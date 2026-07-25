import 'dart:math' as math;

/// Empirical prediction engine for Genipin-crosslinked Gelatin hydrogels.
/// Direct Dart port of HydrogelPredictor.java.
class HydrogelPredictor {
  final double gelatin;
  final double genipin;
  final double pH;
  final double temp;

  const HydrogelPredictor({
    required this.gelatin,
    required this.genipin,
    required this.pH,
    required this.temp,
  });

  double tensileStrength() {
    final base = 8.0 * gelatin;
    final xlink = 35.0 * math.log(1 + genipin);
    final pHFactor = 1.0 - math.pow((pH - 7.0) / 6.0, 2).toDouble();
    final tFactor =
        temp <= 37 ? 1.0 : math.max(0.4, 1.0 - (temp - 37) * 0.02);
    return _clamp(base + xlink * pHFactor * tFactor, 5, 800);
  }

  double elasticity() {
    final e = 6.0 * gelatin + 50.0 * math.sqrt(genipin);
    final pHFactor = 1.0 - 0.05 * (pH - 7).abs();
    return _clamp(e * pHFactor, 3, 1500);
  }

  double degradationDays() {
    final base = 3.0 + 4.0 * gelatin + 25.0 * genipin;
    final tempPenalty = math.pow(1.05, math.max(0, temp - 25)).toDouble();
    final pHPenalty = 1.0 + 0.15 * (pH - 7).abs();
    return _clamp(base / (tempPenalty * pHPenalty), 1, 365);
  }

  double swellingRatio() {
    final base = 25.0 / (1.0 + 0.6 * genipin) * (1.0 + 0.05 * gelatin);
    final pHFactor = 1.0 + 0.25 * (pH - 5.0).abs();
    final tempFactor = 1.0 + 0.01 * (temp - 25);
    return _clamp(base * pHFactor * tempFactor, 1, 60);
  }

  double stabilityScore() {
    final s = 40 +
        4.0 * math.min(genipin, 3.0) +
        2.0 * math.min(gelatin, 12.0) -
        6.0 * (pH - 7.4).abs() -
        0.5 * (temp - 37).abs();
    return _clamp(s, 0, 100);
  }

  String recommendation() {
    final t = tensileStrength();
    final sw = swellingRatio();
    final deg = degradationDays();
    final st = stabilityScore();

    final sb = StringBuffer();
    sb.writeln('Stability score: ${st.toStringAsFixed(1)} / 100\n');

    if (t < 60 && sw > 15 && deg < 30) {
      sb.writeln('➤ Best suited for WOUND DRESSING:');
      sb.write('  high water uptake, soft texture, moderate biodegradation.');
    } else if (t >= 100 && st >= 60 && deg >= 30) {
      sb.writeln('➤ Best suited for TISSUE-ENGINEERING SCAFFOLD:');
      sb.write(
          '  good mechanical strength, controlled degradation, stable at 37 °C.');
    } else if (t >= 60 && sw <= 15) {
      sb.write('➤ Suitable for DRUG-DELIVERY MATRIX or soft cartilage filler.');
    } else {
      sb.write(
          '➤ Formulation is sub-optimal. Try gelatin 8–12 %, genipin 0.5–1.5 %, pH 7.4, 37 °C.');
    }
    return sb.toString();
  }

  static double _clamp(double v, double lo, double hi) =>
      math.max(lo, math.min(hi, v));
}
