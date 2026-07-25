package com.example.hydrogelsimulator;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;

import com.example.hydrogelsimulator.databinding.ActivityResultBinding;

import java.io.File;

public class ResultActivity extends AppCompatActivity {

    private ActivityResultBinding b;
    private HydrogelPredictor p;
    private String aiNotes;

    @Override
    protected void onCreate(Bundle s) {
        super.onCreate(s);
        b = ActivityResultBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());

        Intent i = getIntent();
        p = new HydrogelPredictor(
                i.getDoubleExtra(MainActivity.EX_GEL, 0),
                i.getDoubleExtra(MainActivity.EX_GEN, 0),
                i.getDoubleExtra(MainActivity.EX_PH, 7),
                i.getDoubleExtra(MainActivity.EX_TEMP, 25));
        aiNotes = i.getStringExtra("ai");

        StringBuilder sb = new StringBuilder();
        sb.append(p.recommendation()).append("\n\n");
        sb.append("Best formulation guideline:\n")
          .append("  Gelatin 8–12 %, Genipin 0.5–1.5 %, pH 7.4, 37 °C\n")
          .append("  → balanced strength, swelling and biodegradation suitable for both\n")
          .append("    wound dressing and soft-tissue scaffolding.");
        b.tvRecommendation.setText(sb.toString());

        b.btnExportPdf.setOnClickListener(v -> exportPdf());
    }

    private void exportPdf() {
        try {
            File f = PdfReportGenerator.generate(this, p, aiNotes);
            Uri uri = FileProvider.getUriForFile(
                    this, getPackageName() + ".fileprovider", f);
            Intent share = new Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, "application/pdf")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(share, "Open report"));
        } catch (Exception e) {
            Toast.makeText(this, "PDF error: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
}
