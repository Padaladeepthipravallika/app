package com.example.hydrogelsimulator;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.pdf.PdfDocument;
import android.os.Environment;

import java.io.File;
import java.io.FileOutputStream;

public class PdfReportGenerator {

    public static File generate(Context ctx, HydrogelPredictor p,
                                String aiNotes) throws Exception {
        PdfDocument doc = new PdfDocument();
        PdfDocument.PageInfo info =
                new PdfDocument.PageInfo.Builder(595, 842, 1).create();
        PdfDocument.Page page = doc.startPage(info);
        Canvas c = page.getCanvas();

        Paint title = new Paint(); title.setTextSize(20); title.setFakeBoldText(true);
        Paint h     = new Paint(); h.setTextSize(14); h.setFakeBoldText(true);
        Paint t     = new Paint(); t.setTextSize(12);

        int y = 40;
        c.drawText("Hydrogel Simulation Report", 40, y, title); y += 30;

        c.drawText("Inputs", 40, y, h); y += 20;
        y = line(c, t, y, "Gelatin: " + p.gelatin + " %");
        y = line(c, t, y, "Genipin: " + p.genipin + " %");
        y = line(c, t, y, "pH: " + p.pH);
        y = line(c, t, y, "Temperature: " + p.temp + " °C");

        y += 15; c.drawText("Predicted Properties", 40, y, h); y += 20;
        y = line(c, t, y, String.format("Tensile strength : %.2f kPa", p.tensileStrength()));
        y = line(c, t, y, String.format("Elasticity       : %.2f kPa", p.elasticity()));
        y = line(c, t, y, String.format("Degradation time : %.1f days", p.degradationDays()));
        y = line(c, t, y, String.format("Swelling ratio   : %.2f g/g",  p.swellingRatio()));
        y = line(c, t, y, String.format("Stability score  : %.1f / 100", p.stabilityScore()));

        y += 15; c.drawText("Recommendation", 40, y, h); y += 20;
        for (String ln : p.recommendation().split("\n")) y = line(c, t, y, ln);

        if (aiNotes != null && !aiNotes.isEmpty()) {
            y += 15; c.drawText("AI Analysis", 40, y, h); y += 20;
            for (String ln : wrap(aiNotes, 85)) y = line(c, t, y, ln);
        }

        doc.finishPage(page);

        File dir = ctx.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS);
        if (dir != null && !dir.exists()) dir.mkdirs();
        File out = new File(dir, "hydrogel_report_" + System.currentTimeMillis() + ".pdf");
        try (FileOutputStream fos = new FileOutputStream(out)) {
            doc.writeTo(fos);
        }
        doc.close();
        return out;
    }

    private static int line(Canvas c, Paint p, int y, String s) {
        c.drawText(s, 50, y, p); return y + 18;
    }

    private static String[] wrap(String s, int w) {
        java.util.List<String> out = new java.util.ArrayList<>();
        for (String para : s.split("\n")) {
            StringBuilder cur = new StringBuilder();
            for (String word : para.split(" ")) {
                if (cur.length() + word.length() + 1 > w) {
                    out.add(cur.toString()); cur.setLength(0);
                }
                if (cur.length() > 0) cur.append(' ');
                cur.append(word);
            }
            if (cur.length() > 0) out.add(cur.toString());
        }
        return out.toArray(new String[0]);
    }
}
