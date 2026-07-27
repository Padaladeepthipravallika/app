// Empirical prediction engine for Genipin-crosslinked Gelatin hydrogels.
// JS port of HydrogelPredictor.java.

export class HydrogelPredictor {
  constructor(gelatin, genipin, pH, temp) {
    this.gelatin = gelatin;
    this.genipin = genipin;
    this.pH = pH;
    this.temp = temp;
  }

  tensileStrength() {
    const base = 8.0 * this.gelatin;
    const xlink = 35.0 * Math.log1p(this.genipin);
    const pHFactor = 1.0 - Math.pow((this.pH - 7.0) / 6.0, 2);
    const tFactor =
      this.temp <= 37 ? 1.0 : Math.max(0.4, 1.0 - (this.temp - 37) * 0.02);
    return clamp(base + xlink * pHFactor * tFactor, 5, 800);
  }

  elasticity() {
    const e = 6.0 * this.gelatin + 50.0 * Math.sqrt(this.genipin);
    const pHFactor = 1.0 - 0.05 * Math.abs(this.pH - 7);
    return clamp(e * pHFactor, 3, 1500);
  }

  degradationDays() {
    const base = 3.0 + 4.0 * this.gelatin + 25.0 * this.genipin;
    const tempPenalty = Math.pow(1.05, Math.max(0, this.temp - 25));
    const pHPenalty = 1.0 + 0.15 * Math.abs(this.pH - 7);
    return clamp(base / (tempPenalty * pHPenalty), 1, 365);
  }

  swellingRatio() {
    const base = (25.0 / (1.0 + 0.6 * this.genipin)) * (1.0 + 0.05 * this.gelatin);
    const pHFactor = 1.0 + 0.25 * Math.abs(this.pH - 5.0);
    const tempFactor = 1.0 + 0.01 * (this.temp - 25);
    return clamp(base * pHFactor * tempFactor, 1, 60);
  }

  stabilityScore() {
    const s =
      40 +
      4.0 * Math.min(this.genipin, 3.0) +
      2.0 * Math.min(this.gelatin, 12.0) -
      6.0 * Math.abs(this.pH - 7.4) -
      0.5 * Math.abs(this.temp - 37);
    return clamp(s, 0, 100);
  }

  recommendation() {
    const t = this.tensileStrength();
    const sw = this.swellingRatio();
    const deg = this.degradationDays();
    const st = this.stabilityScore();

    let out = `Stability score: ${st.toFixed(1)} / 100\n\n`;

    if (t < 60 && sw > 15 && deg < 30) {
      out += "➤ Best suited for WOUND DRESSING:\n" +
             "  high water uptake, soft texture, moderate biodegradation.";
    } else if (t >= 100 && st >= 60 && deg >= 30) {
      out += "➤ Best suited for TISSUE-ENGINEERING SCAFFOLD:\n" +
             "  good mechanical strength, controlled degradation, stable at 37 °C.";
    } else if (t >= 60 && sw <= 15) {
      out += "➤ Suitable for DRUG-DELIVERY MATRIX or soft cartilage filler.";
    } else {
      out += "➤ Formulation is sub-optimal. Try gelatin 8–12 %, genipin 0.5–1.5 %, pH 7.4, 37 °C.";
    }
    return out;
  }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
