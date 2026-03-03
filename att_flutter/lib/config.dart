import 'package:flutter/foundation.dart';

class AppConfig {
  /// Backend base URL.
  ///
  /// Render deployment: https://attendance-w299.onrender.com/api
  /// Local dev (adb reverse tcp:8000 tcp:8000): http://127.0.0.1:8000/api
  static String get backendBaseUrl {
    if (kIsWeb) return 'https://attendance-w299.onrender.com/api';
    return 'https://attendance-w299.onrender.com/api';
  }
}
