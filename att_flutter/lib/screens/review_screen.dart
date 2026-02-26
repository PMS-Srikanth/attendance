import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/app_models.dart';
import '../providers/app_providers.dart';
import '../services/app_service.dart';
import '../theme/app_theme.dart';
import '../widgets/common_widgets.dart';
import 'app_shell.dart';

// Provider for all class instances
final classesProvider = FutureProvider<List<ClassInstance>>((ref) async {
  return AppService.instance.getClasses();
});

class ReviewScreen extends ConsumerStatefulWidget {
  const ReviewScreen({super.key});

  @override
  ConsumerState<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends ConsumerState<ReviewScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final classesAsync = ref.watch(classesProvider);

    return Scaffold(
      appBar: ShellAppBar(
        title: 'Review',
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined),
            tooltip: 'Refresh',
            onPressed: () => ref.invalidate(classesProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // tab bar
          Container(
            color: Theme.of(context).colorScheme.surface,
            child: TabBar(
              controller: _tabController,
              tabs: const [
                Tab(text: 'All'),
                Tab(text: 'Today'),
                Tab(text: 'Upcoming'),
              ],
            ),
          ),
          Expanded(
            child: classesAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => _EmptyOrError(
                message: e.toString().replaceFirst('ApiException: ', ''),
                onRetry: () => ref.invalidate(classesProvider),
                isError: true,
              ),
              data: (classes) {
                if (classes.isEmpty) {
                  return _EmptyOrError(
                    message:
                        'No classes found.\nUpload your data and generate classes first.',
                    onRetry: () => ref.invalidate(classesProvider),
                  );
                }
                final today = _todayStr();
                final todayClasses =
                    classes.where((c) => c.date == today).toList();
                final upcoming = classes
                    .where((c) => c.date.compareTo(today) > 0)
                    .toList();
                return TabBarView(
                  controller: _tabController,
                  children: [
                    _ClassList(
                      classes: classes,
                      onRefresh: () => ref.invalidate(classesProvider),
                    ),
                    _ClassList(
                      classes: todayClasses,
                      emptyMessage: "No classes scheduled for today.",
                      onRefresh: () => ref.invalidate(classesProvider),
                    ),
                    _ClassList(
                      classes: upcoming,
                      emptyMessage: "No upcoming classes.",
                      onRefresh: () => ref.invalidate(classesProvider),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String _todayStr() {
    final now = DateTime.now();
    return '${now.year.toString().padLeft(4, '0')}-'
        '${now.month.toString().padLeft(2, '0')}-'
        '${now.day.toString().padLeft(2, '0')}';
  }
}

// ─── Class list ───────────────────────────────────────────────────────────

class _ClassList extends ConsumerWidget {
  const _ClassList({
    required this.classes,
    required this.onRefresh,
    this.emptyMessage = 'No classes.',
  });

  final List<ClassInstance> classes;
  final VoidCallback onRefresh;
  final String emptyMessage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (classes.isEmpty) {
      return EmptyStateCard(
        icon: Icons.event_available_outlined,
        message: emptyMessage,
      );
    }
    // Group by date
    final grouped = <String, List<ClassInstance>>{};
    for (final c in classes) {
      grouped.putIfAbsent(c.date, () => []).add(c);
    }
    final sortedDates = grouped.keys.toList()..sort();

    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: sortedDates.length,
        itemBuilder: (context, i) {
          final date = sortedDates[i];
          final dayClasses = grouped[date]!;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: Text(
                  _formatDate(date),
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Theme.of(context)
                            .colorScheme
                            .primary,
                      ),
                ),
              ),
              ...dayClasses.map((cls) => _ClassTile(
                    cls: cls,
                    onStatusChange: (newStatus) async {
                      try {
                        await AppService.instance
                            .updateClass(cls.id, newStatus);
                        ref.invalidate(classesProvider);
                        // Reload attendance summary too
                        ref
                            .read(attendanceProvider.notifier)
                            .load();
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                                content: Text(e
                                    .toString()
                                    .replaceFirst('ApiException: ', ''))),
                          );
                        }
                      }
                    },
                  )),
              const Divider(height: 1),
            ],
          );
        },
      ),
    );
  }

  String _formatDate(String iso) {
    final parts = iso.split('-');
    if (parts.length != 3) return iso;
    final months = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final m = int.tryParse(parts[1]) ?? 0;
    return '${parts[2]} ${months[m]} ${parts[0]}';
  }
}

// ─── Single class tile ────────────────────────────────────────────────────

class _ClassTile extends StatelessWidget {
  const _ClassTile({required this.cls, required this.onStatusChange});

  final ClassInstance cls;
  final Future<void> Function(String) onStatusChange;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final statusColor = _colorFor(cls.status);

    return ListTile(
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 4,
        height: 44,
        decoration: BoxDecoration(
          color: statusColor,
          borderRadius: BorderRadius.circular(2),
        ),
      ),
      title: Text(cls.subjectName,
          style: Theme.of(context).textTheme.bodyMedium
              ?.copyWith(fontWeight: FontWeight.w600)),
      subtitle: Text(
        '${cls.startTime} – ${cls.endTime}'
        '${cls.room != null ? '  ·  ${cls.room}' : ''}',
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: scheme.onSurface.withValues(alpha: 0.55),
            ),
      ),
      trailing: cls.status == 'scheduled'
          ? Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _ActionButton(
                  label: 'Present',
                  color: AppColors.safe,
                  onTap: () => onStatusChange('present'),
                ),
                const SizedBox(width: 6),
                _ActionButton(
                  label: 'Absent',
                  color: AppColors.critical,
                  onTap: () => onStatusChange('absent'),
                ),
              ],
            )
          : StatusBadge(status: cls.status),
    );
  }

  Color _colorFor(String s) {
    switch (s) {
      case 'present':
        return AppColors.safe;
      case 'absent':
        return AppColors.critical;
      case 'cancelled':
        return AppColors.warning;
      default:
        return AppColors.info;
    }
  }
}

// ─── Action button ────────────────────────────────────────────────────────

class _ActionButton extends StatelessWidget {
  const _ActionButton(
      {required this.label, required this.color, required this.onTap});

  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          border: Border.all(color: color.withValues(alpha: 0.4)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(label,
            style: TextStyle(
                color: color,
                fontSize: 11,
                fontWeight: FontWeight.w600)),
      ),
    );
  }
}

// ─── Empty / Error state ──────────────────────────────────────────────────

class _EmptyOrError extends StatelessWidget {
  const _EmptyOrError({
    required this.message,
    required this.onRetry,
    this.isError = false,
  });

  final String message;
  final VoidCallback onRetry;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isError ? Icons.error_outline : Icons.inbox_outlined,
              size: 48,
              color: Theme.of(context)
                  .colorScheme
                  .onSurface
                  .withValues(alpha: 0.3),
            ),
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.6),
                    )),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
