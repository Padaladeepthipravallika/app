package com.example.hydrogelsimulator;

import android.content.Intent;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.example.hydrogelsimulator.databinding.ActivitySimulationBinding;

public class SimulationActivity extends AppCompatActivity {

    private ActivitySimulationBinding b;
    private HydrogelPredictor p;
    private String aiNotes = "";

    @Override
    protected void onCreate(Bundle s) {
        super.onCreate(s);
        b = ActivitySimulationBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());

        Intent i = getIntent();
        p = new HydrogelPredictor(
                i.getDoubleExtra(MainActivity.EX_GEL, 0),
                i.getDoubleExtra(MainActivity.EX_GEN, 0),
                i.getDoubleExtra(MainActivity.EX_PH, 7),
                i.getDoubleExtra(MainActivity.EX_TEMP, 25));

        String results = String.format(
                "Inputs:\n  Gelatin %.2f %%\n  Genipin %.2f %%\n  pH %.2f\n  Temp %.1f °C\n\n" +
                "Predicted properties:\n" +
                "  • Tensile strength : %.2f kPa\n" +
                "  • Elasticity       : %.2f kPa\n" +
                "  • Degradation time : %.1f days\n" +
                "  • Swelling ratio   : %.2f g/g\n" +
                "  • Stability score  : %.1f / 100",
                p.gelatin, p.genipin, p.pH, p.temp,
                p.tensileStrength(), p.elasticity(),
                p.degradationDays(), p.swellingRatio(), p.stabilityScore());
        b.tvResults.setText(results);

        b.btnGoResult.setOnClickListener(v -> {
            Intent r = new Intent(this, ResultActivity.class);
            r.putExtra(MainActivity.EX_GEL,  p.gelatin);
            r.putExtra(MainActivity.EX_GEN,  p.genipin);
            r.putExtra(MainActivity.EX_PH,   p.pH);
            r.putExtra(MainActivity.EX_TEMP, p.temp);
            r.putExtra("ai", aiNotes);
            startActivity(r);
        });

        // Groq AI analysis
        String prompt = String.format(
                "Analyse a genipin-crosslinked gelatin hydrogel with %.2f%% gelatin, " +
                "%.2f%% genipin, pH %.2f, %.1f °C. Comment on mechanical strength, " +
                "swelling, biodegradation and best biomedical use (wound dressing vs scaffold).",
                p.gelatin, p.genipin, p.pH, p.temp);

        new GroqApiClient(getString(R.string.groq_api_key))
                .analyze(prompt, new GroqApiClient.Callback2() {
                    @Override public void onSuccess(String text) {
                        aiNotes = text;
                        runOnUiThread(() -> b.tvAi.setText(text));
                        new FirebaseHelper().saveSimulation(p, text);
                    }
                    @Override public void onError(String err) {
                        runOnUiThread(() -> b.tvAi.setText("AI unavailable: " + err));
                        new FirebaseHelper().saveSimulation(p, "");
                    }
                });
    }
}
