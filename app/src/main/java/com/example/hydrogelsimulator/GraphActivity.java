package com.example.hydrogelsimulator;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.example.hydrogelsimulator.databinding.ActivityGraphBinding;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;

import java.util.ArrayList;
import java.util.List;

public class GraphActivity extends AppCompatActivity {

    private ActivityGraphBinding b;

    @Override
    protected void onCreate(Bundle s) {
        super.onCreate(s);
        b = ActivityGraphBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());

        Intent i = getIntent();
        double gel  = i.getDoubleExtra(MainActivity.EX_GEL, 10);
        double gen  = i.getDoubleExtra(MainActivity.EX_GEN, 1);
        double pH   = i.getDoubleExtra(MainActivity.EX_PH, 7);
        double temp = i.getDoubleExtra(MainActivity.EX_TEMP, 37);

        // Strength vs genipin (sweep 0.1–5 %)
        List<Entry> e1 = new ArrayList<>();
        for (double x = 0.1; x <= 5.0; x += 0.2) {
            e1.add(new Entry((float) x,
                    (float) new HydrogelPredictor(gel, x, pH, temp).tensileStrength()));
        }
        plot(b.chartStrength, e1, "Tensile strength (kPa)", Color.rgb(21, 101, 192));

        // Degradation vs time (sweep 0–60 days, fraction remaining)
        double deg0 = new HydrogelPredictor(gel, gen, pH, temp).degradationDays();
        List<Entry> e2 = new ArrayList<>();
        for (int d = 0; d <= 60; d++) {
            double remaining = 100.0 * Math.exp(-d / Math.max(1, deg0));
            e2.add(new Entry(d, (float) remaining));
        }
        plot(b.chartDegradation, e2, "Mass remaining (%)", Color.rgb(216, 67, 21));

        // Swelling vs pH (sweep 3–10)
        List<Entry> e3 = new ArrayList<>();
        for (double x = 3.0; x <= 10.0; x += 0.25) {
            e3.add(new Entry((float) x,
                    (float) new HydrogelPredictor(gel, gen, x, temp).swellingRatio()));
        }
        plot(b.chartSwelling, e3, "Swelling ratio (g/g)", Color.rgb(0, 121, 107));
    }

    private void plot(LineChart chart, List<Entry> entries, String label, int color) {
        LineDataSet ds = new LineDataSet(entries, label);
        ds.setColor(color);
        ds.setCircleColor(color);
        ds.setLineWidth(2f);
        ds.setCircleRadius(2f);
        ds.setDrawValues(false);
        chart.setData(new LineData(ds));
        chart.getDescription().setEnabled(false);
        chart.invalidate();
    }
}
