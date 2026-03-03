import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';

class AuthService {
  AuthService({required ApiClient apiClient}) : _apiClient = apiClient;

  final ApiClient _apiClient;
  static const _tokenKey = 'auth_token';

  Future<String> login({
    required String email,
    required String password,
  }) async {
    if (email.trim().isEmpty || password.isEmpty) {
      throw Exception('Email and password are required');
    }

    // Health endpoint lives at root (not under /api), so derive it from baseUrl.
    final rootUrl = _apiClient.baseUrl
        .replaceAll(RegExp(r'/api/?$'), '');
    try {
      final response = await http
          .get(Uri.parse('$rootUrl/health'),
              headers: {'Accept': 'application/json'})
          .timeout(const Duration(seconds: 60));
      if (response.statusCode != 200) {
        throw Exception(
            'Backend returned ${response.statusCode}. Check your connection.');
      }
      final body = jsonDecode(response.body);
      final status = (body is Map) ? body['status']?.toString() : null;
      if (status != 'healthy') {
        throw Exception('Backend not healthy — check your connection');
      }
    } on TimeoutException {
      throw Exception(
          'Server is waking up (cold start). Please wait and try again.');
    } on SocketException catch (e) {
      throw Exception('Network error: ${e.message}');
    } on http.ClientException catch (e) {
      throw Exception('Connection error: ${e.message}');
    } on FormatException {
      throw Exception('Invalid response from server');
    } on Exception {
      rethrow;
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }

    const token = 'backend-ok';
    await _saveToken(token);
    return token;
  }

  static Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  /// Returns the persisted token, or null if not logged in.
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// Clears the persisted token (logout).
  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }
}
