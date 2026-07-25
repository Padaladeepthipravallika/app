import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../models/hydrogel_predictor.dart';

class GraphScreen extends StatelessWidget {
  final HydrogelPredictor predictor;
  const GraphScreen({super.key, required this.predictor});

  @override
  Widget build(BuildContext context) {
    final p = predictor;

    // Strength vs genipin (0.1–5 %)
    final strengthSpots = <FlSpot>[];
    for (double x = 0.1; x <= 5.0; x += 0.2) {
      strengthSpots.add(FlSpot(
          x,
          HydrogelPredictor(gelatin: p.gelatin, genipin: x, pH: p.pH, temp: p.temp)
              .tensileStrength()));
    }

    // Degradation vs time (0–60 days, % remaining)
    final deg0 = p.degradationDays();
    final degSpots = <FlSpot>[];
    for (int d = 0; d <= 60; d++) {
      degSpots.add(FlSpot(d.toDouble(), 100.0 * math.exp(-d / math.max(1, deg0))));
    }

    // Swelling vs pH (3–10)
    final swSpots = <FlSpot>[];
    for (double x = 3.0; x <= 10.0; x += 0.25) {
      swSpots.add(FlSpot(
          x,
          HydrogelPredictor(gelatin: p.gelatin, genipin: p.genipin, pH: x, temp: p.temp)
              .swellingRatio()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Graphs')),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          _ChartCard(
            title: 'Tensile strength vs Genipin (kPa)',
            spots: strengthSpots,
            color: const Color(0xFF1565C0),
            xLabel: 'Genipin %',
          ),
          _ChartCard(
            title: 'Mass remaining vs Time (%)',
            spots: degSpots,
            color: const Color(0xFFD84315),
            xLabel: 'Days',
          ),
          _ChartCard(
            title: 'Swelling ratio vs pH (g/g)',
            spots: swSpots,
            color: const Color(0xFF00796B),
            xLabel: 'pH',
          ),
        ],
      ),
    );
  }
}

class _ChartCard extends StatelessWidget {
  final String title, xLabel;
  final List<FlSpot> spots;
  final Color color;
  const _ChartCard(
      {required this.title,
      required this.spots,
      required this.color,
      required this.xLabel});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            SizedBox(
              height: 220,
              child: LineChart(
                LineChartData(
                  titlesData: FlTitlesData(
                    rightTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      axisNameWidget: Text(xLabel),
                      sideTitles: const SideTitles(showTitles: true, reservedSize: 28),
                    ),
                    leftTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: true, reservedSize: 40),
                    ),
                  ),
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: true,
                      color: color,
                      barWidth: 2,
                      dotData: const FlDotData(show: false),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
