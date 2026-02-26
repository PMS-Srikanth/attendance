import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiClient {
  ApiClient({required this.baseUrl, http.Client? httpClient})
    : _httpClient = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _httpClient;

  Uri _uri(String path) {
    final normalizedBase = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$normalizedBase$normalizedPath');
  }

  String _stringifyJson(dynamic value) {
    if (value == null) return 'null';
    if (value is String) return value;
    return jsonEncode(value);
  }

  String _extractErrorMessage(dynamic decoded) {
    if (decoded == null) return 'Request failed';
    if (decoded is String) return decoded;

    if (decoded is Map) {
      final detail = decoded['detail'];
      if (detail != null) {
        if (detail is String) return detail;
        if (detail is Map && detail['message'] != null) {
          final issues = detail['issues'];
          if (issues != null) {
            return '${detail['message']}\n${_stringifyJson(issues)}';
          }
          return detail['message'].toString();
        }
        return _stringifyJson(detail);
      }
      if (decoded['message'] != null) return decoded['message'].toString();
    }

    return 'Request failed';
  }

  dynamic _decodeBody(String body, int statusCode) {
    if (body.trim().isEmpty) return null;
    try {
      return jsonDecode(body);
    } catch (_) {
      throw ApiException('Invalid JSON response', statusCode: statusCode);
    }
  }

  Future<dynamic> getJson(String path, {Map<String, String>? headers}) async {
    final response = await _httpClient.get(
      _uri(path),
      headers: {'Accept': 'application/json', ...?headers},
    );

    final decoded = _decodeBody(response.body, response.statusCode);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        _extractErrorMessage(decoded),
        statusCode: response.statusCode,
      );
    }

    return decoded;
  }

  Future<dynamic> postJson(
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    final mergedHeaders = <String, String>{
      'Accept': 'application/json',
      ...?headers,
    };
    if (body != null) {
      mergedHeaders['Content-Type'] = 'application/json';
    }

    final response = await _httpClient.post(
      _uri(path),
      headers: mergedHeaders,
      body: body == null ? null : jsonEncode(body),
    );

    final decoded = _decodeBody(response.body, response.statusCode);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        _extractErrorMessage(decoded),
        statusCode: response.statusCode,
      );
    }

    return decoded;
  }
}

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() =>
      'ApiException(statusCode: $statusCode, message: $message)';
}
