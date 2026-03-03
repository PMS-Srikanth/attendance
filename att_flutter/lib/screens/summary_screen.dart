import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/app_models.dart';
import '../providers/app_providers.dart';
import '../services/app_service.dart';
import '../theme/app_theme.dart';
import '../widgets/common_widgets.dart';
import 'app_shell.dart';
import 'report_screen.dart';

//  Warnings provider 

final _warningsProvider = FutureProvider.autoDispose<List<AttendanceWarning>>(
  (_) => AppService.instance.getWarnings(),
);

//  Screen 

class SummaryScreen extends ConsumerStatefulWidget {
  const SummaryScreen({super.key});

  @override
  ConsumerState<SummaryScreen> createState() => _SummaryScreenState();
}

class _SummaryScreenState extends ConsumerState<SummaryScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(attendanceProvider.notifier).load());
  }

  void _refresh() {
    ref.read(attendanceProvider.notifier).load();
    ref.invalidate(_warningsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(attendanceProvider);
    final warnings = ref.watch(_warningsProvider);
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: ShellAppBar(
        title: 'Summary',
        actions: [
          IconButton(
            icon: const Icon(Icons.assessment_outlined),
            tooltip: 'View Report',
            onPressed: () =>
                Navigator.of(context).pushNamed(ReportScreen.route),
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refresh,
          ),
        ],
      ),
      backgroundColor: scheme.surface,
      body: () {
        if (state.loading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.error != null) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AlertBanner(severity: 'critical', message: state.error!),
                  const SizedBox(height: 16),
                  AppButton(
                    label: 'Retry',
                    icon: Icons.refresh,
                    onPressed: _refresh,
                  ),
                ],
              ),
            ),
          );
        }
        if (state.data == null) {
          return const Center(
            child: EmptyStateCard(
              icon: Icons.bar_chart_outlined,
              message: 'No attendance data yet.\nUpload your timetable and generate classes first.',
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: () async => _refresh(),
          child: _buildContent(context, state.data!, warnings.valueOrNull ?? []),
        );
      }(),
    );
  }

  Widget _buildContent(
    BuildContext context,
    OverallAttendance data,
    List<AttendanceWarning> warnings,
  ) {
    final aboveCount = data.subjects.where((s) => s.percentage >= 75).length;
    final atRiskCount = data.subjects
        .where((s) => s.status == 'critical' || s.status == 'at_risk')
        .length;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
      children: [
        const _HeroHeader(),
        const SizedBox(height: 20),

        //  Stat cards 
        Row(
          children: [
            Expanded(
              child: _StatCard(
                gradient: const [Color(0xFF0D9488), Color(0xFF10B981)],
                icon: Icons.check_circle_outline_rounded,
                label: 'Overall',
                value: '${data.overallPercentage.toStringAsFixed(1)}%',
                sub: '${data.attended}/${data.totalClasses} classes',
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatCard(
                gradient: const [Color(0xFF10B981), Color(0xFF22C55E)],
                icon: Icons.thumb_up_outlined,
                label: 'Above 75%',
                value: '$aboveCount',
                sub: 'of ${data.subjects.length} subjects',
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatCard(
                gradient: const [Color(0xFFEF4444), Color(0xFFF97316)],
                icon: Icons.warning_amber_rounded,
                label: 'At Risk',
                value: '$atRiskCount',
                sub: 'need attention',
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        //  Warning banners 
        if (warnings.isNotEmpty) ...[
          ...warnings.map(
            (w) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: AlertBanner(
                severity: w.severity,
                message: '${w.subjectCode}: ${w.message}    ${w.recommendation}',
              ),
            ),
          ),
          const SizedBox(height: 4),
        ],

        //  Section header 
        Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF10B981), Color(0xFF0D9488)],
                ),
                borderRadius: BorderRadius.circular(6),
              ),
              alignment: Alignment.center,
              child: const Icon(Icons.menu_book_outlined,
                  color: Colors.white, size: 14),
            ),
            const SizedBox(width: 10),
            Text('Subject Breakdown',
                style: Theme.of(context).textTheme.titleMedium),
          ],
        ),
        const SizedBox(height: 12),

        //  Subject cards 
        ...data.subjects.map(
          (s) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _SubjectCard(subject: s),
          ),
        ),

        const SizedBox(height: 8),
        _DetailRow(
          label: 'Cancelled classes',
          value: '${data.cancelled}',
          icon: Icons.cancel_outlined,
        ),
        const SizedBox(height: 4),
        _DetailRow(
          label: 'Scheduled (upcoming)',
          value: '${data.scheduled}',
          icon: Icons.schedule_outlined,
        ),
      ],
    );
  }
}

//  Hero header 

class _HeroHeader extends StatelessWidget {
  const _HeroHeader();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF0D9488), Color(0xFF06B6D4)],
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Color.fromRGBO(13, 148, 136, 0.4),
                blurRadius: 14,
                offset: Offset(0, 6),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: const Icon(Icons.bar_chart_rounded, color: Colors.white, size: 32),
        ),
        const SizedBox(height: 12),
        ShaderMask(
          shaderCallback: (r) => const LinearGradient(
            colors: [Color(0xFF0D9488), Color(0xFF06B6D4), Color(0xFF3B82F6)],
          ).createShader(r),
          child: Text(
            'Attendance Summary',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Overview of your current attendance',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.55),
              ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

//  Stat card 

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.gradient,
    required this.icon,
    required this.label,
    required this.value,
    required this.sub,
  });

  final List<Color> gradient;
  final IconData icon;
  final String label;
  final String value;
  final String sub;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradient,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: gradient.first.withValues(alpha: 0.35),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: Icon(icon, color: Colors.white, size: 16),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 10,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.4,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
              height: 1.1,
            ),
          ),
          Text(
            sub,
            style: const TextStyle(color: Colors.white70, fontSize: 9),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

//  Subject card 

class _SubjectCard extends StatelessWidget {
  const _SubjectCard({required this.subject});

  final SubjectAttendance subject;

  static Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'safe':
        return AppColors.safe;
      case 'warning':
        return AppColors.warning;
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 1),
        boxShadow: [
          BoxShadow(
            color: scheme.shadow.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
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
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              StatusBadge(status: subject.status),
              const SizedBox(width: 8),
              Text(
                '${subject.percentage.toStringAsFixed(1)}%',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: pct,
              backgroundColor: color.withValues(alpha: 0.12),
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _Chip(label: '${subject.attended}/${subject.totalClasses} attended'),
              if (subject.classesNeededFor75 > 0)
                _Chip(
                  label: 'Need ${subject.classesNeededFor75} more for 75%',
                  color: AppColors.critical,
                )
              else if (subject.classesCanMiss > 0)
                _Chip(
                  label: 'Can skip ${subject.classesCanMiss} more',
                  color: AppColors.safe,
                )
              else
                _Chip(label: 'Exactly at limit', color: AppColors.warning),
              if (subject.absent > 0)
                _Chip(
                  label: '${subject.absent} absent',
                  color: scheme.onSurface.withValues(alpha: 0.45),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

//  Helper widgets 

class _Chip extends StatelessWidget {
  const _Chip({required this.label, this.color});

  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.onSurface;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: c.withValues(alpha: 0.85),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Icon(icon, size: 14, color: scheme.onSurface.withValues(alpha: 0.4)),
        const SizedBox(width: 6),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: scheme.onSurface.withValues(alpha: 0.5),
              ),
        ),
        const Spacer(),
        Text(
          value,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: scheme.onSurface.withValues(alpha: 0.7),
              ),
        ),
      ],
    );
  }
}
