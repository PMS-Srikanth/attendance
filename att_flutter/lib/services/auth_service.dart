import 'api_client.dart';

class AuthService {
  AuthService({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;

  Future<String> login({
    required String email,
    required String password,
  }) async {
    if (email.trim().isEmpty || password.isEmpty) {
      throw Exception('Email and password are required');
    }

    // Backend doesn't currently expose an auth endpoint.
    // For now, we treat "login" as "verify backend is reachable".
    final health = await _apiClient.getJson('/health');
    final status = (health is Map) ? health['status']?.toString() : null;
    if (status != 'healthy') {
      throw Exception('Backend not healthy');
    }

    // Return a placeholder token; replace later if you add auth.
    return 'backend-ok';
  }
}
