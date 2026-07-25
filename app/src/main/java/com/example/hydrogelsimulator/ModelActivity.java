package com.example.hydrogelsimulator;

import android.annotation.SuppressLint;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.example.hydrogelsimulator.databinding.ActivityModelBinding;

public class ModelActivity extends AppCompatActivity {

    private ActivityModelBinding b;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle s) {
        super.onCreate(s);
        b = ActivityModelBinding.inflate(getLayoutInflater());
        setContentView(b.getRoot());

        b.webView.getSettings().setJavaScriptEnabled(true);
        b.webView.loadUrl("file:///android_asset/hydrogel3d.html");
    }
}
