package com.example.hydrogelsimulator;

import androidx.annotation.NonNull;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/** Minimal Groq Chat-Completions client. */
public class GroqApiClient {

    private static final String ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL    = "llama-3.1-8b-instant";
    private static final MediaType JSON  = MediaType.parse("application/json; charset=utf-8");

    private final OkHttpClient client;
    private final String apiKey;

    public interface Callback2 {
        void onSuccess(String text);
        void onError(String err);
    }

    public GroqApiClient(String apiKey) {
        this.apiKey = apiKey;
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .build();
    }

    public void analyze(String prompt, Callback2 cb) {
        if (apiKey == null || apiKey.isEmpty() || apiKey.contains("YOUR_GROQ_API_KEY")) {
            cb.onError("Groq API key not set in res/values/strings.xml");
            return;
        }

        JsonObject sys = new JsonObject();
        sys.addProperty("role", "system");
        sys.addProperty("content",
                "You are a biomaterials expert specialising in genipin-crosslinked gelatin hydrogels. " +
                "Answer concisely (max 180 words) with practical wound-healing / tissue-engineering insight.");
        JsonObject user = new JsonObject();
        user.addProperty("role", "user");
        user.addProperty("content", prompt);

        JsonArray msgs = new JsonArray();
        msgs.add(sys); msgs.add(user);

        JsonObject body = new JsonObject();
        body.addProperty("model", MODEL);
        body.addProperty("temperature", 0.4);
        body.add("messages", msgs);

        Request req = new Request.Builder()
                .url(ENDPOINT)
                .addHeader("Authorization", "Bearer " + apiKey)
                .post(RequestBody.create(new Gson().toJson(body), JSON))
                .build();

        client.newCall(req).enqueue(new Callback() {
            @Override public void onFailure(@NonNull Call call, @NonNull IOException e) {
                cb.onError(e.getMessage());
            }
            @Override public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                try (Response r = response) {
                    if (!r.isSuccessful() || r.body() == null) {
                        cb.onError("HTTP " + r.code());
                        return;
                    }
                    String s = r.body().string();
                    JsonObject root = JsonParser.parseString(s).getAsJsonObject();
                    String text = root.getAsJsonArray("choices")
                            .get(0).getAsJsonObject()
                            .getAsJsonObject("message")
                            .get("content").getAsString();
                    cb.onSuccess(text.trim());
                } catch (Exception ex) {
                    cb.onError("Parse error: " + ex.getMessage());
                }
            }
        });
    }
}
