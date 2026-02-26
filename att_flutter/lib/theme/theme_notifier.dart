import 'package:flutter/material.dart';

/// Simple ValueNotifier that persists theme mode across the widget tree.
/// Replace with SharedPreferences persistence later (task #13).
class ThemeNotifier extends ValueNotifier<ThemeMode> {
  ThemeNotifier() : super(ThemeMode.light);

  void toggle() {
    value = value == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
  }

  bool get isDark => value == ThemeMode.dark;
}

// Singleton — swapped out when Firebase auth lands.
final themeNotifier = ThemeNotifier();
