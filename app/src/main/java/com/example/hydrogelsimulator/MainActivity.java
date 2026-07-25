package com.example.hydrogelsimulator;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.hydrogelsimulator.databinding.ActivityMainBinding;

public class MainActivity extends AppCompatActivity {

    public static final String EX_GEL  = "gel";
    public static final String EX_GEN  = "gen";
    public static final String EX_PH   = "ph";
    public static final String EX_TEMP = "temp";

    private ActivityMainBinding b;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        b = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());

        b.btnSimulate.setOnClickListener(this::go);
        b.btnGraphs.setOnClickListener(v -> launch(GraphActivity.class, true));
        b.btnModel.setOnClickListener(v -> startActivity(new Intent(this, ModelActivity.class)));
    }

    private void go(View v) { launch(SimulationActivity.class, true); }

    private void launch(Class<?> target, boolean requireInputs) {
        if (requireInputs && !validate()) return;
        Intent i = new Intent(this, target);
        i.putExtra(EX_GEL,  parse(b.etGelatin.getText().toString()));
        i.putExtra(EX_GEN,  parse(b.etGenipin.getText().toString()));
        i.putExtra(EX_PH,   parse(b.etPh.getText().toString()));
        i.putExtra(EX_TEMP, parse(b.etTemp.getText().toString()));
        startActivity(i);
    }

    private boolean validate() {
        if (TextUtils.isEmpty(b.etGelatin.getText()) ||
            TextUtils.isEmpty(b.etGenipin.getText()) ||
            TextUtils.isEmpty(b.etPh.getText()) ||
            TextUtils.isEmpty(b.etTemp.getText())) {
            Toast.makeText(this, "Please fill all fields.", Toast.LENGTH_SHORT).show();
            return false;
        }
        return true;
    }

    private double parse(String s) {
        try { return Double.parseDouble(s); } catch (Exception e) { return 0; }
    }
}
