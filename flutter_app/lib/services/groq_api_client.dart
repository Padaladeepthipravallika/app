import 'dart:convert';
import 'package:http/http.dart' as http;

class GroqApiClient {
  static const _endpoint =
      'https://api.groq.com/openai/v1/chat/completions';
  static const _model = 'llama-3.1-8b-instant';

  final String apiKey;
  GroqApiClient(this.apiKey);

  Future<String> analyze(String prompt) async {
    if (apiKey.isEmpty || apiKey.contains('YOUR_GROQ_API_KEY')) {
      throw Exception('Groq API key not set (see lib/config.dart).');
    }

    final body = jsonEncode({
      'model': _model,
      'temperature': 0.4,
      'messages': [
        {
          'role': 'system',
          'content':
              'You are a biomaterials expert specialising in genipin-crosslinked gelatin hydrogels. '
                  'Answer concisely (max 180 words) with practical wound-healing / tissue-engineering insight.',
        },
        {'role': 'user', 'content': prompt},
      ],
    });

    final res = await http
        .post(
          Uri.parse(_endpoint),
          headers: {
            'Authorization': 'Bearer $apiKey',
            'Content-Type': 'application/json',
          },
          body: body,
        )
        .timeout(const Duration(seconds: 60));

    if (res.statusCode != 200) {
      throw Exception('HTTP ${res.statusCode}: ${res.body}');
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    final text = json['choices'][0]['message']['content'] as String;
    return text.trim();
  }
}
