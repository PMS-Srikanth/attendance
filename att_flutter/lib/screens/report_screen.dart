import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/app_models.dart';
import '../services/app_service.dart';
import '../theme/app_theme.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  static const route = '/report';

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  OverallAttendance? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await AppService.instance.getAttendanceSummary();
      setState(() {
        _data = data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('ApiException: ', '');
        _loading = false;
      });
    }
  }

  String _buildReportText(OverallAttendance data) {
    final buf = StringBuffer();
    final now = DateTime.now();
    buf.writeln('━━━ AttendEase Attendance Report ━━━');
    buf.writeln(
        'Generated: ${now.day.toString().padLeft(2, '0')}-${now.month.toString().padLeft(2, '0')}-${now.year}');
    buf.writeln();
    buf.writeln('OVERALL: ${data.overallPercentage.toStringAsFixed(1)}%');
    buf.writeln('  Attended  : ${data.attended}');
    buf.writeln('  Total     : ${data.totalClasses}');
    buf.writeln('  Absent    : ${data.absent}');
    buf.writeln('  Cancelled : ${data.cancelled}');
    buf.writeln('  Scheduled : ${data.scheduled}');
    buf.writeln();
    buf.writeln('── SUBJECT BREAKDOWN ──');
    for (final s in data.subjects) {
      final icon = s.status == 'safe'
          ? '✓'
          : (s.status == 'critical' ? '✗' : '⚠');
      buf.writeln(
          '$icon ${s.subjectCode} | ${s.subjectName}: ${s.percentage.toStringAsFixed(1)}% (${s.attended}/${s.totalClasses})');
      if (s.classesNeededFor75 > 0) {
        buf.writeln('   → Need ${s.classesNeededFor75} more to reach 75%');
      } else if (s.classesCanMiss > 0) {
        buf.writeln('   → Can miss ${s.classesCanMiss} more classes');
      }
    }
    buf.writeln();
    buf.writeln('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return buf.toString();
  }

  void _copyToClipboard() {
    if (_data == null) return;
    Clipboard.setData(ClipboardData(text: _buildReportText(_data!)));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Report copied to clipboard!'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Report'),
        actions: [
          if (_data != null)
            IconButton(
              icon: const Icon(Icons.copy_outlined),
              tooltip: 'Copy report',
              onPressed: _copyToClipboard,
            ),
          IconButton(
            icon: const Icon(Icons.refresh_outlined),
            tooltip: 'Refresh',
            onPressed: _load,
          ),
        ],
      ),
      body: _buildBody(scheme),
    );
  }

  Widget _buildBody(ColorScheme scheme) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline,
                  size: 48, color: AppColors.critical.withValues(alpha: 0.7)),
              const SizedBox(height: 12),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: scheme.onSurface.withValues(alpha: 0.7)),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    if (_data == null) {
      return const Center(
        child: Text('No data available.\nGenerate classes first.'),
      );
    }

    final data = _data!;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
        children: [
          // Hero
          _HeroCard(data: data),
          const SizedBox(height: 16),

          // Stat row
          Row(
            children: [
              _MiniStatCard(
                label: 'Attended',
                value: '${data.attended}',
                color: AppColors.safe,
                icon: Icons.check_circle_outline,
              ),
              const SizedBox(width: 8),
              _MiniStatCard(
                label: 'Absent',
                value: '${data.absent}',
                color: AppColors.critical,
                icon: Icons.cancel_outlined,
              ),
              const SizedBox(width: 8),
              _MiniStatCard(
                label: 'Scheduled',
                value: '${data.scheduled}',
                color: AppColors.info,
                icon: Icons.schedule_outlined,
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Section header
          _SectionHeader(title: 'Subject Breakdown', icon: Icons.menu_book_outlined),
          const SizedBox(height: 10),

          // Subject rows
          ...data.subjects.map((s) => _SubjectReportRow(subject: s)),

          const SizedBox(height: 20),

          // Copy button
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              icon: const Icon(Icons.copy_outlined, size: 18),
              label: const Text('Copy Report to Clipboard'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: _copyToClipboard,
            ),
          ),

          const SizedBox(height: 12),

          // Raw text preview
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: scheme.onSurface.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: scheme.onSurface.withValues(alpha: 0.1)),
            ),
            child: SelectableText(
              _buildReportText(data),
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 11,
                color: scheme.onSurface.withValues(alpha: 0.7),
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Hero Card ──────────────────────────────────────────────────────────────

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.data});

  final OverallAttendance data;

  @override
  Widget build(BuildContext context) {
    final pct = data.overallPercentage;
    final Color pctColor = pct >= 75
        ? AppColors.safe
        : (pct >= 65 ? AppColors.warning : AppColors.critical);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0D9488), Color(0xFF06B6D4)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0D9488).withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(14),
            ),
            alignment: Alignment.center,
            child: const Icon(Icons.bar_chart_rounded,
                color: Colors.white, size: 30),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Attendance Report',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${pct.toStringAsFixed(1)}%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    height: 1.1,
                  ),
                ),
                Text(
                  '${data.attended} of ${data.totalClasses} classes attended',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: pctColor.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              pct >= 75 ? 'On Track' : (pct >= 65 ? 'At Risk' : 'Critical'),
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Mini stat card ──────────────────────────────────────────────────────────

class _MiniStatCard extends StatelessWidget {
  const _MiniStatCard({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  final String label;
  final String value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(14),
          border:
              Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 18),
            ),
            Text(
              label,
              style: TextStyle(
                  fontSize: 10,
                  color: scheme.onSurface.withValues(alpha: 0.55)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Section header ──────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
                colors: [Color(0xFF10B981), Color(0xFF0D9488)]),
            borderRadius: BorderRadius.circular(6),
          ),
          alignment: Alignment.center,
          child: Icon(icon, color: Colors.white, size: 14),
        ),
        const SizedBox(width: 10),
        Text(title,
            style: Theme.of(context).textTheme.titleMedium),
      ],
    );
  }
}

// ─── Subject report row ──────────────────────────────────────────────────────

class _SubjectReportRow extends StatelessWidget {
  const _SubjectReportRow({required this.subject});

  final SubjectAttendance subject;

  static Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'safe':
        return AppColors.safe;
      case 'warning':
      case 'at_risk':
        return AppColors.warning;
      case 'critical':
        return AppColors.critical;
      default:
        return AppColors.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = _statusColor(subject.status);
    final pct = (subject.percentage / 100.0).clamp(0.0, 1.0);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.25)),
        boxShadow: [
          BoxShadow(
            color: scheme.shadow.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 3,
                height: 36,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subject.subjectCode,
                      style: Theme.of(context)
                          .textTheme
                          .labelLarge
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      subject.subjectName,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: scheme.onSurface.withValues(alpha: 0.55),
                          ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Text(
                '${subject.percentage.toStringAsFixed(1)}%',
                style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 15),
              ),
              const SizedBox(width: 8),
              Text(
                '${subject.attended}/${subject.totalClasses}',
                style: TextStyle(
                    color: scheme.onSurface.withValues(alpha: 0.5),
                    fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct,
              backgroundColor: color.withValues(alpha: 0.1),
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 4,
            ),
          ),
          if (subject.classesNeededFor75 > 0) ...[
            const SizedBox(height: 6),
            Text(
              '→ Attend ${subject.classesNeededFor75} more to reach 75%',
              style: TextStyle(
                  color: AppColors.critical,
                  fontSize: 10,
                  fontWeight: FontWeight.w600),
            ),
          ] else if (subject.classesCanMiss > 0) ...[
            const SizedBox(height: 6),
            Text(
              '→ Can miss ${subject.classesCanMiss} more classes',
              style: TextStyle(
                  color: AppColors.safe,
                  fontSize: 10,
                  fontWeight: FontWeight.w600),
            ),
          ],
        ],
      ),
    );
  }
}
