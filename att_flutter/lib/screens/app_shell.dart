import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/theme_notifier.dart';
import 'login_screen.dart';
import 'upload_screen.dart';
import 'review_screen.dart';
import 'planner_screen.dart';
import 'summary_screen.dart';

/// Main shell shown after login. Holds bottom navigation + all primary screens.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  static const route = '/shell';

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;

  static const _tabs = [
    _TabItem(icon: Icons.upload_file_outlined, activeIcon: Icons.upload_file, label: 'Upload'),
    _TabItem(icon: Icons.grid_view_outlined, activeIcon: Icons.grid_view, label: 'Review'),
    _TabItem(icon: Icons.calendar_today_outlined, activeIcon: Icons.calendar_today, label: 'Planner'),
    _TabItem(icon: Icons.bar_chart_outlined, activeIcon: Icons.bar_chart, label: 'Summary'),
  ];

  // Screens are kept alive via IndexedStack so state/scroll is preserved
  final _screens = const [
    UploadScreen(),
    ReviewScreen(),
    PlannerScreen(),
    SummaryScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: _buildNavBar(),
    );
  }

  Widget _buildNavBar() {
    return NavigationBar(
      selectedIndex: _currentIndex,
      onDestinationSelected: (i) => setState(() => _currentIndex = i),
      destinations: _tabs
          .map(
            (t) => NavigationDestination(
              icon: Icon(t.icon),
              selectedIcon: Icon(t.activeIcon),
              label: t.label,
            ),
          )
          .toList(),
    );
  }
}

class _TabItem {
  const _TabItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
  final IconData icon;
  final IconData activeIcon;
  final String label;
}

/// Shared AppBar used by screens inside the shell
class ShellAppBar extends StatelessWidget implements PreferredSizeWidget {
  const ShellAppBar({super.key, required this.title, this.actions});

  final String title;
  final List<Widget>? actions;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title),
      actions: [
        ...?actions,
        ValueListenableBuilder<ThemeMode>(
          valueListenable: themeNotifier,
          builder: (context, mode, child) => IconButton(
            tooltip: mode == ThemeMode.light ? 'Dark mode' : 'Light mode',
            icon: Icon(mode == ThemeMode.light ? Icons.dark_mode_outlined : Icons.light_mode_outlined),
            onPressed: () => themeNotifier.toggle(),
          ),
        ),
        IconButton(
          tooltip: 'Logout',
          icon: const Icon(Icons.logout_outlined),
          onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(
            LoginScreen.route,
            (_) => false,
          ),
        ),
      ],
    );
  }
}

/// Gradient app bar decoration (used on hero screens)
class GradientAppBar extends StatelessWidget implements PreferredSizeWidget {
  const GradientAppBar({super.key, required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Size get preferredSize => Size.fromHeight(subtitle != null ? 80 : kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.secondary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (subtitle != null)
                      Text(
                        subtitle!,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
              ValueListenableBuilder<ThemeMode>(
                valueListenable: themeNotifier,
                builder: (context, mode, child) => IconButton(
                  icon: Icon(
                    mode == ThemeMode.light ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
                    color: Colors.white,
                  ),
                  onPressed: () => themeNotifier.toggle(),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.logout_outlined, color: Colors.white),
                onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(
                  LoginScreen.route,
                  (_) => false,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
