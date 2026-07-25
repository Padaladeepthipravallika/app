package com.example.hydrogelsimulator;

import com.google.firebase.firestore.FirebaseFirestore;

import java.util.HashMap;
import java.util.Map;

/** Persists every simulation record to Firestore (collection: "simulations"). */
public class FirebaseHelper {

    private final FirebaseFirestore db = FirebaseFirestore.getInstance();

    public void saveSimulation(HydrogelPredictor p, String aiNotes) {
        Map<String, Object> data = new HashMap<>();
        data.put("gelatin",        p.gelatin);
        data.put("genipin",        p.genipin);
        data.put("pH",             p.pH);
        data.put("temperature",    p.temp);
        data.put("tensileStrength",p.tensileStrength());
        data.put("elasticity",     p.elasticity());
        data.put("degradationDays",p.degradationDays());
        data.put("swellingRatio",  p.swellingRatio());
        data.put("stability",      p.stabilityScore());
        data.put("recommendation", p.recommendation());
        data.put("aiNotes",        aiNotes == null ? "" : aiNotes);
        data.put("timestamp",      System.currentTimeMillis());

        db.collection("simulations").add(data);
    }
}
