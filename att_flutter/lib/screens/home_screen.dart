import 'package:flutter/material.dart';

import 'app_shell.dart';
import 'login_screen.dart';
import 'setup_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static const route = '/home';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(
              context,
            ).pushNamedAndRemoveUntil(LoginScreen.route, (_) => false),
            child: const Text('Logout'),
          ),
        ],
      ),
      body: const SafeArea(child: _HomeBody()),
    );
  }
}

class _HomeBody extends StatelessWidget {
  const _HomeBody();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'You are logged in.',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          const Text('Start here:'),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () => Navigator.of(context).pushNamed(SetupScreen.route),
            child: const Text('Setup data (Calendar + Timetable)'),
          ),
          const SizedBox(height: 12),
          FilledButton.tonal(
            onPressed: () =>
                Navigator.of(context).pushNamed(AppShell.route),
            child: const Text('View Summary'),
          ),
          const SizedBox(height: 12),
          const Text(
            'Tip: If Summary says “Generate classes first”, open Setup and run the three steps.',
          ),
        ],
      ),
    );
  }
}
