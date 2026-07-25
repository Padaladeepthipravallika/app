package com.example.hydrogelsimulator;

/**
 * Empirical prediction engine for Genipin-crosslinked Gelatin hydrogels.
 *
 * Equations are simplified empirical fits derived from published trends
 * (Bigi et al., Sung et al., Yoo et al.) — meant for educational simulation,
 * not clinical decision-making.
 *
 *  Inputs:
 *   gelatin %  (1–20 w/v)
 *   genipin %  (0.1–5  w/w of gelatin)
 *   pH         (3–10)
 *   temp °C    (4–60)
 */
public class HydrogelPredictor {

    public final double gelatin, genipin, pH, temp;

    public HydrogelPredictor(double gelatin, double genipin, double pH, double temp) {
        this.gelatin = gelatin;
        this.genipin = genipin;
        this.pH      = pH;
        this.temp    = temp;
    }

    /** Tensile strength in kPa. */
    public double tensileStrength() {
        // Strength rises with gelatin and crosslink density, peaks near pH 7,
        // and declines above ~45 °C (gelation/denaturation).
        double base = 8.0 * gelatin;                              // gelatin contribution
        double xlink = 35.0 * Math.log1p(genipin);                // diminishing returns
        double pHFactor = 1.0 - Math.pow((pH - 7.0) / 6.0, 2);    // bell ~ pH 7
        double tFactor  = temp <= 37 ? 1.0 : Math.max(0.4, 1.0 - (temp - 37) * 0.02);
        return clamp(base + xlink * pHFactor * tFactor, 5, 800);
    }

    /** Young's modulus / elasticity in kPa. */
    public double elasticity() {
        double e = 6.0 * gelatin + 50.0 * Math.sqrt(genipin);
        double pHFactor = 1.0 - 0.05 * Math.abs(pH - 7);
        return clamp(e * pHFactor, 3, 1500);
    }

    /** Degradation time in days (in PBS / collagenase-like environment). */
    public double degradationDays() {
        // Higher genipin & gelatin -> slower degradation. Higher temp speeds it up.
        double base = 3.0 + 4.0 * gelatin + 25.0 * genipin;
        double tempPenalty = Math.pow(1.05, Math.max(0, temp - 25));
        double pHPenalty   = 1.0 + 0.15 * Math.abs(pH - 7);
        return clamp(base / (tempPenalty * pHPenalty), 1, 365);
    }

    /** Equilibrium swelling ratio (g water / g dry gel). */
    public double swellingRatio() {
        // Swelling decreases with crosslinking, increases away from pI (~pH 5).
        double base = 25.0 / (1.0 + 0.6 * genipin) * (1.0 + 0.05 * gelatin);
        double pHFactor = 1.0 + 0.25 * Math.abs(pH - 5.0);
        double tempFactor = 1.0 + 0.01 * (temp - 25);
        return clamp(base * pHFactor * tempFactor, 1, 60);
    }

    /** Stability score 0–100 (higher = more stable for biomedical use). */
    public double stabilityScore() {
        double s = 40
                + 4.0 * Math.min(genipin, 3.0)        // crosslinking up to ~3 %
                + 2.0 * Math.min(gelatin, 12.0)
                - 6.0 * Math.abs(pH - 7.4)
                - 0.5 * Math.abs(temp - 37);
        return clamp(s, 0, 100);
    }

    /** Use-case recommendation. */
    public String recommendation() {
        double t = tensileStrength();
        double sw = swellingRatio();
        double deg = degradationDays();
        double st = stabilityScore();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Stability score: %.1f / 100\n\n", st));

        if (t < 60 && sw > 15 && deg < 30) {
            sb.append("➤ Best suited for WOUND DRESSING:\n")
              .append("  high water uptake, soft texture, moderate biodegradation.");
        } else if (t >= 100 && st >= 60 && deg >= 30) {
            sb.append("➤ Best suited for TISSUE-ENGINEERING SCAFFOLD:\n")
              .append("  good mechanical strength, controlled degradation, stable at 37 °C.");
        } else if (t >= 60 && sw <= 15) {
            sb.append("➤ Suitable for DRUG-DELIVERY MATRIX or soft cartilage filler.");
        } else {
            sb.append("➤ Formulation is sub-optimal. Try gelatin 8–12 %, genipin 0.5–1.5 %, pH 7.4, 37 °C.");
        }
        return sb.toString();
    }

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }
}
