import 'package:flutter/foundation.dart';

class AppConfig {
  /// Backend base URL.
  ///
  /// Using `adb reverse tcp:8000 tcp:8000` so 127.0.0.1:8000 works
  /// on both emulator and physical device.
  static String get backendBaseUrl {
    if (kIsWeb) return 'http://127.0.0.1:8000';
    return 'http://127.0.0.1:8000';
  }
}
