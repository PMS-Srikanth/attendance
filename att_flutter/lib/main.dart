import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'screens/app_shell.dart';
import 'screens/login_screen.dart';
import 'screens/report_screen.dart';
import 'services/auth_service.dart';
import 'theme/app_theme.dart';
import 'theme/theme_notifier.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final token = await AuthService.getToken();
  final initialRoute =
      token != null ? AppShell.route : LoginScreen.route;
  runApp(ProviderScope(child: AttendEaseApp(initialRoute: initialRoute)));
}

class AttendEaseApp extends StatelessWidget {
  const AttendEaseApp({super.key, required this.initialRoute});

  final String initialRoute;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeNotifier,
      builder: (context, mode, child) => MaterialApp(
        title: 'AttendEase',
        debugShowCheckedModeBanner: false,
        theme: buildLightTheme(),
        darkTheme: buildDarkTheme(),
        themeMode: mode,
        initialRoute: initialRoute,
        routes: {
          LoginScreen.route: (_) => const LoginScreen(),
          AppShell.route: (_) => const AppShell(),
          ReportScreen.route: (_) => const ReportScreen(),
        },
      ),
    );
  }
}
