import 'package:flutter/material.dart';

// ─── Brand palette ───────────────────────────────────────────────────────────
class AppColors {
  AppColors._();

  // Primary teal/cyan gradient anchor
  static const primary = Color(0xFF0D9488); // teal-600
  static const primaryLight = Color(0xFF14B8A6); // teal-500
  static const primaryDark = Color(0xFF0F766E); // teal-700

  // Secondary cyan
  static const secondary = Color(0xFF06B6D4); // cyan-500

  // Accent purple (kept from seed)
  static const accent = Color(0xFF7C3AED); // violet-600

  // Status colours
  static const safe = Color(0xFF16A34A); // green-600
  static const warning = Color(0xFFD97706); // amber-600
  static const critical = Color(0xFFDC2626); // red-600
  static const info = Color(0xFF2563EB); // blue-600

  // Surface
  static const surfaceLight = Color(0xFFF0FDFA); // teal-50
  static const surfaceDark = Color(0xFF134E4A); // teal-900

  // Neutral
  static const grey50 = Color(0xFFF9FAFB);
  static const grey100 = Color(0xFFF3F4F6);
  static const grey200 = Color(0xFFE5E7EB);
  static const grey400 = Color(0xFF9CA3AF);
  static const grey600 = Color(0xFF4B5563);
  static const grey800 = Color(0xFF1F2937);
  static const grey900 = Color(0xFF111827);
}

// ─── Light theme ─────────────────────────────────────────────────────────────
ThemeData buildLightTheme() {
  const scheme = ColorScheme(
    brightness: Brightness.light,
    primary: AppColors.primary,
    onPrimary: Colors.white,
    primaryContainer: Color(0xFFCCFBF1), // teal-100
    onPrimaryContainer: AppColors.primaryDark,
    secondary: AppColors.secondary,
    onSecondary: Colors.white,
    secondaryContainer: Color(0xFFCFFAFE), // cyan-100
    onSecondaryContainer: Color(0xFF164E63),
    tertiary: AppColors.accent,
    onTertiary: Colors.white,
    tertiaryContainer: Color(0xFFEDE9FE),
    onTertiaryContainer: Color(0xFF4C1D95),
    error: AppColors.critical,
    onError: Colors.white,
    errorContainer: Color(0xFFFEE2E2),
    onErrorContainer: Color(0xFF7F1D1D),
    surface: Colors.white,
    onSurface: AppColors.grey900,
    surfaceContainerHighest: AppColors.grey100,
    outline: AppColors.grey200,
    outlineVariant: AppColors.grey100,
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: AppColors.grey900,
    onInverseSurface: Colors.white,
    inversePrimary: AppColors.primaryLight,
  );

  return _buildTheme(scheme);
}

// ─── Dark theme ──────────────────────────────────────────────────────────────
ThemeData buildDarkTheme() {
  const scheme = ColorScheme(
    brightness: Brightness.dark,
    primary: AppColors.primaryLight,
    onPrimary: Color(0xFF003731),
    primaryContainer: AppColors.primaryDark,
    onPrimaryContainer: Color(0xFFCCFBF1),
    secondary: AppColors.secondary,
    onSecondary: Color(0xFF003544),
    secondaryContainer: Color(0xFF164E63),
    onSecondaryContainer: Color(0xFFCFFAFE),
    tertiary: Color(0xFFA78BFA),
    onTertiary: Color(0xFF2E1065),
    tertiaryContainer: Color(0xFF4C1D95),
    onTertiaryContainer: Color(0xFFEDE9FE),
    error: Color(0xFFF87171),
    onError: Color(0xFF7F1D1D),
    errorContainer: Color(0xFF991B1B),
    onErrorContainer: Color(0xFFFEE2E2),
    surface: Color(0xFF0F172A),
    onSurface: Color(0xFFF1F5F9),
    surfaceContainerHighest: Color(0xFF1E293B),
    outline: Color(0xFF334155),
    outlineVariant: Color(0xFF1E293B),
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: Color(0xFFF1F5F9),
    onInverseSurface: AppColors.grey900,
    inversePrimary: AppColors.primary,
  );

  return _buildTheme(scheme);
}

// ─── Shared builder ──────────────────────────────────────────────────────────
ThemeData _buildTheme(ColorScheme scheme) {
  final isLight = scheme.brightness == Brightness.light;

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: isLight ? AppColors.grey50 : const Color(0xFF0F172A),

    // ── AppBar ──
    appBarTheme: AppBarTheme(
      backgroundColor: isLight ? Colors.white : const Color(0xFF1E293B),
      foregroundColor: scheme.onSurface,
      elevation: 0,
      scrolledUnderElevation: 1,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: scheme.onSurface,
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
    ),

    // ── BottomNavigationBar ──
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: isLight ? Colors.white : const Color(0xFF1E293B),
      selectedItemColor: scheme.primary,
      unselectedItemColor: isLight ? AppColors.grey400 : const Color(0xFF64748B),
      selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
      unselectedLabelStyle: const TextStyle(fontSize: 11),
      showSelectedLabels: true,
      showUnselectedLabels: true,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),

    // ── NavigationBar ──
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: isLight ? Colors.white : const Color(0xFF1E293B),
      indicatorColor: scheme.primaryContainer,
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return IconThemeData(color: scheme.primary);
        }
        return IconThemeData(color: isLight ? AppColors.grey400 : const Color(0xFF64748B));
      }),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 11,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected ? scheme.primary : (isLight ? AppColors.grey600 : const Color(0xFF94A3B8)),
        );
      }),
    ),

    // ── Cards ──
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isLight ? AppColors.grey200 : const Color(0xFF1E293B),
        ),
      ),
      color: isLight ? Colors.white : const Color(0xFF1E293B),
      margin: const EdgeInsets.symmetric(vertical: 6),
    ),

    // ── Input fields ──
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: isLight ? AppColors.grey50 : const Color(0xFF1E293B),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: isLight ? AppColors.grey200 : const Color(0xFF334155)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: isLight ? AppColors.grey200 : const Color(0xFF334155)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: scheme.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: scheme.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: scheme.error, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      labelStyle: TextStyle(color: isLight ? AppColors.grey600 : const Color(0xFF94A3B8)),
      hintStyle: TextStyle(color: isLight ? AppColors.grey400 : const Color(0xFF475569)),
    ),

    // ── Filled buttons ──
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),

    // ── Outlined buttons ──
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),

    // ── Text buttons ──
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    ),

    // ── Chips ──
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      side: BorderSide.none,
    ),

    // ── Divider ──
    dividerTheme: DividerThemeData(
      color: isLight ? AppColors.grey200 : const Color(0xFF1E293B),
      space: 1,
      thickness: 1,
    ),

    // ── Typography ──
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -1),
      displayMedium: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5),
      headlineLarge: TextStyle(fontWeight: FontWeight.w700, letterSpacing: -0.5),
      headlineMedium: TextStyle(fontWeight: FontWeight.w700, letterSpacing: -0.3),
      headlineSmall: TextStyle(fontWeight: FontWeight.w600),
      titleLarge: TextStyle(fontWeight: FontWeight.w700, letterSpacing: -0.2),
      titleMedium: TextStyle(fontWeight: FontWeight.w600),
      titleSmall: TextStyle(fontWeight: FontWeight.w600),
      bodyLarge: TextStyle(fontWeight: FontWeight.w400, letterSpacing: 0.1),
      bodyMedium: TextStyle(fontWeight: FontWeight.w400),
      bodySmall: TextStyle(fontWeight: FontWeight.w400),
      labelLarge: TextStyle(fontWeight: FontWeight.w600),
      labelMedium: TextStyle(fontWeight: FontWeight.w500),
      labelSmall: TextStyle(fontWeight: FontWeight.w500, letterSpacing: 0.5),
    ),
  );
}
