import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/app_models.dart';
import '../services/api_client.dart';
import '../services/app_service.dart';
import '../theme/app_theme.dart';
import '../widgets/common_widgets.dart';
import 'app_shell.dart';

//  Providers 

final _plannerSummaryProvider =
    FutureProvider.autoDispose<PlannerSummary>((_) {
  final today = DateTime.now();
  final dateStr =
      '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
  return AppService.instance.getPlannerSummary(currentDate: dateStr);
});

// Subject selection + what-if state
class _WhatIfState {
  final String? subjectCode;
  final int attend;
  final int skip;
  final WhatIfResponse? result;
  final bool loading;
  final String? error;

  const _WhatIfState({
    this.subjectCode,
    this.attend = 0,
    this.skip = 0,
    this.result,
    this.loading = false,
    this.error,
  });

  _WhatIfState copyWith({
    String? subjectCode,
    bool clearSubject = false,
    int? attend,
    int? skip,
    WhatIfResponse? result,
    bool clearResult = false,
    bool? loading,
    String? error,
    bool clearError = false,
  }) =>
      _WhatIfState(
        subjectCode: clearSubject ? null : subjectCode ?? this.subjectCode,
        attend: attend ?? this.attend,
        skip: skip ?? this.skip,
        result: clearResult ? null : result ?? this.result,
        loading: loading ?? this.loading,
        error: clearError ? null : error ?? this.error,
      );
}

class _WhatIfNotifier extends StateNotifier<_WhatIfState> {
  _WhatIfNotifier() : super(const _WhatIfState());

  void setSubjectCode(String? code) {
    state = state.copyWith(
        subjectCode: code, clearSubject: code == null, clearResult: true);
  }

  void setAttend(int n) {
    state = state.copyWith(attend: n, clearResult: true);
  }

  void setSkip(int n) {
    state = state.copyWith(skip: n, clearResult: true);
  }

  Future<void> simulate() async {
    state = state.copyWith(loading: true, clearResult: true, clearError: true);
    try {
      final res = await AppService.instance.simulateWhatIf(
        state.attend,
        state.skip,
        state.subjectCode,
      );
      state = state.copyWith(loading: false, result: res);
    } catch (e) {
      state = state.copyWith(
        loading: false,
        error: e.toString().replaceFirst('ApiException: ', ''),
      );
    }
  }
}

final _whatIfProvider =
    StateNotifierProvider.autoDispose<_WhatIfNotifier, _WhatIfState>(
        (_) => _WhatIfNotifier());

//  Screen 

class PlannerScreen extends ConsumerWidget {
  const PlannerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final plannerAsync = ref.watch(_plannerSummaryProvider);

    return Scaffold(
      appBar: ShellAppBar(
        title: 'Planner',
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(_plannerSummaryProvider),
          ),
        ],
      ),
      backgroundColor: scheme.surface,
      body: plannerAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) {
          final isNoData = (e is ApiException && e.statusCode == 404)
              || e.toString().contains('No classes found')
              || e.toString().contains('Generate classes first');
          if (isNoData) {
            return const Center(
              child: EmptyStateCard(
                icon: Icons.calendar_today_outlined,
                message:
                    'No classes yet.\nUpload your timetable on the Upload tab and generate classes first.',
              ),
            );
          }
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AlertBanner(
                    severity: 'critical',
                    message: e is ApiException
                        ? e.message
                        : e.toString().replaceFirst('ApiException: ', ''),
                  ),
                  const SizedBox(height: 16),
                  AppButton(
                    label: 'Retry',
                    icon: Icons.refresh,
                    onPressed: () => ref.invalidate(_plannerSummaryProvider),
                  ),
                ],
              ),
            ),
          );
        },
        data: (summary) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(_plannerSummaryProvider),
          child: _buildContent(context, ref, summary),
        ),
      ),
    );
  }

  Widget _buildContent(
      BuildContext context, WidgetRef ref, PlannerSummary summary) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
      children: [
        // Hero
        const _HeroHeader(),
        const SizedBox(height: 20),

        //  Warning banners 
        if (summary.warnings.isNotEmpty) ...[
          ...summary.warnings.map(
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

        //  Overview card 
        _card(
          context,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                        colors: [Color(0xFF10B981), Color(0xFF0D9488)]),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(Icons.insights_rounded,
                      color: Colors.white, size: 14),
                ),
                const SizedBox(width: 10),
                Text('Current Standing',
                    style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                StatusBadge(status: summary.overallStatus),
              ]),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${summary.overallPercentage.toStringAsFixed(1)}%',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: summary.overallPercentage >= 75
                              ? AppColors.safe
                              : AppColors.critical,
                        ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${summary.subjects.length} subjects',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Text(
                        '${summary.subjects.where((s) => s.percentage >= 75).length} above 75%',
                        style: Theme.of(context)
                            .textTheme
                            .bodySmall
                            ?.copyWith(color: AppColors.safe),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: (summary.overallPercentage / 100).clamp(0.0, 1.0),
                  backgroundColor:
                      AppColors.safe.withValues(alpha: 0.12),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    summary.overallPercentage >= 75
                        ? AppColors.safe
                        : AppColors.critical,
                  ),
                  minHeight: 8,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        //  Subject rows 
        ...summary.subjects.map((s) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _SubjectRow(subject: s),
            )),

        const SizedBox(height: 16),

        //  What-if simulator 
        _WhatIfCard(subjects: summary.subjects),

        //  Recommendations 
        if (summary.recommendations.isNotEmpty) ...[
          const SizedBox(height: 16),
          _card(
            context,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                          colors: [Color(0xFF3B82F6), Color(0xFF06B6D4)]),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(Icons.lightbulb_outline,
                        color: Colors.white, size: 14),
                  ),
                  const SizedBox(width: 10),
                  Text('Recommendations',
                      style: Theme.of(context).textTheme.titleMedium),
                ]),
                const SizedBox(height: 12),
                ...summary.recommendations.map(
                  (r) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.arrow_right_rounded, size: 18,
                            color: AppColors.info),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(r,
                              style:
                                  Theme.of(context).textTheme.bodySmall),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
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
              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: const [
              BoxShadow(
                color: Color.fromRGBO(99, 102, 241, 0.4),
                blurRadius: 14,
                offset: Offset(0, 6),
              ),
            ],
          ),
          alignment: Alignment.center,
          child: const Icon(Icons.calendar_today_rounded,
              color: Colors.white, size: 28),
        ),
        const SizedBox(height: 12),
        ShaderMask(
          shaderCallback: (r) => const LinearGradient(
            colors: [Color(0xFF6366F1), Color(0xFF8B5CF6), Color(0xFFEC4899)],
          ).createShader(r),
          child: Text(
            'Plan Your Attendance',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Simulate absences and see your projected %',
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

//  Subject summary row 

class _SubjectRow extends StatelessWidget {
  const _SubjectRow({required this.subject});

  final SubjectAttendance subject;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final pct = (subject.percentage / 100).clamp(0.0, 1.0);
    final isBad = subject.percentage < 75;
    final barColor = isBad ? AppColors.critical : AppColors.safe;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: barColor.withValues(alpha: 0.2),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: scheme.shadow.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      subject.subjectCode,
                      style: Theme.of(context)
                          .textTheme
                          .labelMedium
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 6),
                    StatusBadge(status: subject.status),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  subject.subjectName,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: scheme.onSurface.withValues(alpha: 0.5),
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: pct,
                    backgroundColor: barColor.withValues(alpha: 0.1),
                    valueColor: AlwaysStoppedAnimation<Color>(barColor),
                    minHeight: 5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${subject.percentage.toStringAsFixed(1)}%',
                style: TextStyle(
                  color: barColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
              Text(
                '${subject.attended}/${subject.totalClasses}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: scheme.onSurface.withValues(alpha: 0.5),
                    ),
              ),
              if (isBad && subject.classesNeededFor75 > 0)
                Text(
                  'Need +${subject.classesNeededFor75}',
                  style: const TextStyle(
                      color: AppColors.critical,
                      fontSize: 10,
                      fontWeight: FontWeight.w600),
                )
              else if (!isBad && subject.classesCanMiss > 0)
                Text(
                  'Can skip ${subject.classesCanMiss}',
                  style: const TextStyle(
                      color: AppColors.safe,
                      fontSize: 10,
                      fontWeight: FontWeight.w600),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

//  What-if simulator card 

class _WhatIfCard extends ConsumerStatefulWidget {
  const _WhatIfCard({required this.subjects});

  final List<SubjectAttendance> subjects;

  @override
  ConsumerState<_WhatIfCard> createState() => _WhatIfCardState();
}

class _WhatIfCardState extends ConsumerState<_WhatIfCard> {
  final _attendCtrl = TextEditingController(text: '0');
  final _skipCtrl = TextEditingController(text: '0');
  String? _selectedCode;

  @override
  void dispose() {
    _attendCtrl.dispose();
    _skipCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final ws = ref.watch(_whatIfProvider);
    final notifier = ref.read(_whatIfProvider.notifier);

    return _card(
      context,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
                borderRadius: BorderRadius.circular(6),
              ),
              alignment: Alignment.center,
              child: const Icon(Icons.science_outlined,
                  color: Colors.white, size: 14),
            ),
            const SizedBox(width: 10),
            Text('What-If Simulator',
                style: Theme.of(context).textTheme.titleMedium),
          ]),
          const SizedBox(height: 6),
          Text(
            'Simulate future classes to see projected attendance',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: scheme.onSurface.withValues(alpha: 0.5),
                ),
          ),
          const SizedBox(height: 16),

          // Subject picker
          DropdownButtonFormField<String?>(
            initialValue: _selectedCode,
            decoration: InputDecoration(
              labelText: 'Filter by subject (optional)',
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10)),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              isDense: true,
            ),
            items: [
              const DropdownMenuItem(value: null, child: Text('All subjects')),
              ...widget.subjects.map(
                (s) => DropdownMenuItem(
                  value: s.subjectCode,
                  child: Text('${s.subjectCode} – ${s.subjectName}',
                      overflow: TextOverflow.ellipsis),
                ),
              ),
            ],
            onChanged: (v) {
              setState(() => _selectedCode = v);
              ref.read(_whatIfProvider.notifier).setSubjectCode(v);
            },
          ),
          const SizedBox(height: 12),

          // Attend / Skip row
          Row(
            children: [
              Expanded(
                child: _NumField(
                  controller: _attendCtrl,
                  label: 'Classes to attend',
                  icon: Icons.check_circle_outline,
                  color: AppColors.safe,
                  onChanged: (v) {
                    final n = int.tryParse(v) ?? 0;
                    ref.read(_whatIfProvider.notifier).setAttend(n);
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _NumField(
                  controller: _skipCtrl,
                  label: 'Classes to skip',
                  icon: Icons.cancel_outlined,
                  color: AppColors.critical,
                  onChanged: (v) {
                    final n = int.tryParse(v) ?? 0;
                    ref.read(_whatIfProvider.notifier).setSkip(n);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Simulate button
          GestureDetector(
            onTap: ws.loading ? null : notifier.simulate,
            child: Container(
              width: double.infinity,
              height: 46,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6), Color(0xFFEC4899)],
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withValues(alpha: 0.35),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: ws.loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2.5, color: Colors.white),
                    )
                  : const Text(
                      'Simulate  ',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
            ),
          ),

          // Error
          if (ws.error != null) ...[
            const SizedBox(height: 10),
            AlertBanner(severity: 'critical', message: ws.error!),
          ],

          // Result
          if (ws.result != null) ...[
            const SizedBox(height: 16),
            _WhatIfResult(res: ws.result!),
          ],
        ],
      ),
    );
  }
}

//  What-if result display 

class _WhatIfResult extends StatelessWidget {
  const _WhatIfResult({required this.res});

  final WhatIfResponse res;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final improved = res.change >= 0;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: (improved ? AppColors.safe : AppColors.critical)
            .withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: (improved ? AppColors.safe : AppColors.critical)
              .withValues(alpha: 0.25),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _ResultStat(
                label: 'Current',
                value: '${res.currentOverall.toStringAsFixed(1)}%',
                color: scheme.onSurface,
              ),
              Icon(
                improved
                    ? Icons.trending_up_rounded
                    : Icons.trending_down_rounded,
                color: improved ? AppColors.safe : AppColors.critical,
                size: 28,
              ),
              _ResultStat(
                label: 'Projected',
                value: '${res.projectedOverall.toStringAsFixed(1)}%',
                color: improved ? AppColors.safe : AppColors.critical,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            '${improved ? '+' : ''}${res.change.toStringAsFixed(1)}% change',
            style: TextStyle(
              color: improved ? AppColors.safe : AppColors.critical,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
          if (res.projections.isNotEmpty) ...[
            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 8),
            ...res.projections.take(6).map(
              (p) {
                final code = p['subject_code']?.toString() ?? '';
                final cur = (p['current_percentage'] as num?)?.toDouble() ?? 0;
                final proj =
                    (p['projected_percentage'] as num?)?.toDouble() ?? 0;
                final delta = proj - cur;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(code,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(fontWeight: FontWeight.w600)),
                      ),
                      Text(
                        '${cur.toStringAsFixed(1)}%  ${proj.toStringAsFixed(1)}%',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${delta >= 0 ? '+' : ''}${delta.toStringAsFixed(1)}%',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: delta >= 0 ? AppColors.safe : AppColors.critical,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _ResultStat extends StatelessWidget {
  const _ResultStat(
      {required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
      ],
    );
  }
}

//  Numeric input field 

class _NumField extends StatelessWidget {
  const _NumField({
    required this.controller,
    required this.label,
    required this.icon,
    required this.color,
    required this.onChanged,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final Color color;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: color, size: 18),
        border:
            OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        isDense: true,
      ),
      onChanged: onChanged,
    );
  }
}

//  Card helper 

Widget _card(BuildContext context, {required Widget child}) {
  final scheme = Theme.of(context).colorScheme;
  return Container(
    decoration: BoxDecoration(
      color: scheme.surface,
      borderRadius: BorderRadius.circular(20),
      border:
          Border.all(color: scheme.outline.withValues(alpha: 0.15), width: 1),
      boxShadow: [
        BoxShadow(
          color: scheme.shadow.withValues(alpha: 0.07),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ],
    ),
    padding: const EdgeInsets.all(20),
    child: child,
  );
}
