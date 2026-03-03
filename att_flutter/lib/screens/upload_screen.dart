import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/app_providers.dart';
import '../theme/app_theme.dart';
import '../widgets/common_widgets.dart';
import 'app_shell.dart';

class UploadScreen extends ConsumerStatefulWidget {
  const UploadScreen({super.key});

  @override
  ConsumerState<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends ConsumerState<UploadScreen> {
  // 0 = file, 1 = paste JSON
  int _timetableMode = 0;
  int _calendarMode = 0;
  String _timetableFileName = '';
  String _calendarFileName = '';
  final _timetableJsonCtrl = TextEditingController();
  final _calendarJsonCtrl = TextEditingController();
  Map<String, dynamic>? _timetableJson;
  Map<String, dynamic>? _calendarJson;

  @override
  void dispose() {
    _timetableJsonCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final status = ref.watch(uploadProvider);
    final notifier = ref.read(uploadProvider.notifier);
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: const ShellAppBar(title: 'Upload'),
      backgroundColor: scheme.surface,
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
        children: [
          // ── Hero header ──────────────────────────────────────────────
          _HeroHeader(),
          const SizedBox(height: 20),

          // ── Upload card ──────────────────────────────────────────────
          _card(
            context,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ─ Timetable section ─
                _SectionIcon(
                  icon: Icons.calendar_today_outlined,
                  gradient: [const Color(0xFF10B981), const Color(0xFF0D9488)],
                  title: 'Your Timetable',
                  subtitle: 'Weekly schedule for the semester',
                  actionLabel: 'Template ↓',
                  onAction: () => _showTemplate(context, _timetableTemplate),
                ),
                const SizedBox(height: 12),
                _ModeToggle(
                  selected: _timetableMode,
                  onChanged: (v) => setState(() => _timetableMode = v),
                ),
                const SizedBox(height: 12),
                if (_timetableMode == 0) ...[
                  _DropZone(
                    fileName: _timetableFileName,
                    isDone: status.timetable == UploadStep.done,
                    onPick: () => _pickFile(
                      label: 'timetable',
                      onParsed: (name, json) {
                        setState(() {
                          _timetableFileName = name;
                          _timetableJson = json;
                        });
                      },
                    ),
                  ),
                ] else ...[
                  _JsonHint(
                    hint: 'Paste your timetable JSON here — download the template '
                        'above to see the required format.',
                  ),
                  const SizedBox(height: 8),
                  _JsonTextArea(
                    controller: _timetableJsonCtrl,
                    placeholder: '{\n  "schedule": [\n    {\n      "day": "Monday",\n'
                        '      "classes": [...]\n    }\n  ]\n}',
                    onChanged: (v) {
                      setState(() {
                        try {
                          _timetableJson =
                              jsonDecode(v) as Map<String, dynamic>;
                        } catch (_) {
                          _timetableJson = null;
                        }
                      });
                    },
                  ),
                  if (_timetableJsonCtrl.text.trim().isNotEmpty) ...[
                    const SizedBox(height: 6),
                    _JsonValid(valid: _timetableJson != null,
                        length: _timetableJsonCtrl.text.length),
                  ],
                ],
                if (status.timetableError != null) ...[
                  const SizedBox(height: 8),
                  AlertBanner(severity: 'critical', message: status.timetableError!),
                ],
                if (status.timetable == UploadStep.done &&
                    status.timetableData != null) ...[
                  const SizedBox(height: 8),
                  _SuccessBadge(
                    '${status.timetableData!.totalClassesPerWeek} classes/week · '
                    '${status.timetableData!.uniqueSubjects.length} subjects',
                  ),
                ],

                const SizedBox(height: 24),

                // ─ Generate / error ─
                if (status.generateError != null) ...[
                  AlertBanner(severity: 'critical', message: status.generateError!),
                  const SizedBox(height: 12),
                ],
                if (status.generateDone) ...[
                  AlertBanner(
                    severity: 'info',
                    message:
                        '${status.generatedCount ?? 0} class instances generated. '
                        'Head to the Review tab to mark attendance.',
                  ),
                  const SizedBox(height: 12),
                ],

                // ─ Submit button ─
                _GradientButton(
                  label: status.generate == UploadStep.loading
                      ? 'Processing…'
                      : status.generateDone
                          ? 'Regenerate Classes'
                          : 'Continue to Review  →',
                  isLoading: status.generate == UploadStep.loading,
                  enabled: _canSubmit(status),
                  onTap: _canSubmit(status)
                      ? () => _submit(notifier, status)
                      : null,
                ),
                if (!_hasTimetable) ...[
                  const SizedBox(height: 8),
                  Center(
                    child: Text(
                      'Upload your timetable to continue.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: scheme.onSurface.withValues(alpha: 0.45),
                          ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),

          // ── Info cards ───────────────────────────────────────────────
          Row(
            children: [
              Expanded(
                  child: _InfoCard(
                gradient: [const Color(0xFF10B981), const Color(0xFF0D9488)],
                icon: Icons.bolt_outlined,
                title: 'Upload Once',
                body: 'Set up your timetable once per semester and reuse it.',
              )),
              const SizedBox(width: 10),
              Expanded(
                  child: _InfoCard(
                gradient: [const Color(0xFF06B6D4), const Color(0xFF3B82F6)],
                icon: Icons.bar_chart_outlined,
                title: 'Live Tracking',
                body: 'Monitor attendance % and get instant alerts.',
              )),
              const SizedBox(width: 10),
              Expanded(
                  child: _InfoCard(
                gradient: [const Color(0xFF0D9488), const Color(0xFF06B6D4)],
                icon: Icons.tune_outlined,
                title: 'Smart Plan',
                body: 'Plan leaves while staying above 75%.',
              )),
            ],
          ),
          const SizedBox(height: 24),

          // ── How it works ─────────────────────────────────────────────
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
                      gradient: const LinearGradient(colors: [
                        Color(0xFF0D9488),
                        Color(0xFF10B981),
                      ]),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    alignment: Alignment.center,
                    child: const Text('!',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14)),
                  ),
                  const SizedBox(width: 10),
                  Text('How it works',
                      style: Theme.of(context).textTheme.titleMedium),
                ]),
                const SizedBox(height: 16),
                _HowStep(n: 1, title: 'Download Templates',
                    body: 'Get JSON templates for timetable and holidays (30 seconds)',
                    gradient: [const Color(0xFF10B981), const Color(0xFF0D9488)]),
                _HowStep(n: 2, title: 'Fill Your Data',
                    body: 'Add your subjects and time slots (one-time setup, 5 min)',
                    gradient: [const Color(0xFF06B6D4), const Color(0xFF3B82F6)]),
                _HowStep(n: 3, title: 'Upload & Track',
                    body: 'Upload files and start tracking attendance instantly',
                    gradient: [const Color(0xFF0D9488), const Color(0xFF06B6D4)]),
                _HowStep(n: 4, title: 'Stay Above 75%',
                    body: 'Get alerts and plan leaves smartly',
                    gradient: [const Color(0xFFEF4444), const Color(0xFFF97316)]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── helpers ─────────────────────────────────────────────────────────

  bool get _hasTimetable =>
      _timetableJson != null ||
      (_timetableMode == 1 && _timetableJsonCtrl.text.trim().isNotEmpty);

  bool _canSubmit(UploadStatus status) =>
      _hasTimetable &&
      status.generate != UploadStep.loading;

  /// Convert comprehensive timetable format (weeklySchedule + timeSlots + courses)
  /// into the backend's expected { "schedule": [...] } format.
  /// If already in schedule format, return as-is.
  Map<String, dynamic> _normalizeToSchedule(Map<String, dynamic> json) {
    // Already in backend format
    if (json.containsKey('schedule')) return json;

    // ── Comprehensive format: weeklySchedule + timeSlots ──
    final weeklySchedule = json['weeklySchedule'] as Map<String, dynamic>?;
    final timeSlots = json['timeSlots'] as Map<String, dynamic>?;

    if (weeklySchedule == null || timeSlots == null) {
      // Also accept the web-app's { days: { monday: [...] } } shape
      final days = json['days'] as Map<String, dynamic>?;
      if (days != null) return _normalizeDaysFormat(days);
      throw const FormatException(
        'Unrecognised timetable format. Expected "schedule", '
        '"weeklySchedule + timeSlots", or "days" key.',
      );
    }

    final courses =
        (json['courses'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
    final classroom = json['classroom']?.toString() ?? '';

    String _capitalize(String s) =>
        s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1).toLowerCase()}';

    /// Parse "08:55 AM - 09:45 AM" → { start_time: "08:55", end_time: "09:45" }
    Map<String, String> _parseTimeSlot(String raw) {
      final parts = raw.split(' - ');
      if (parts.length != 2) throw FormatException('Bad time slot: $raw');

      String to24(String t12) {
        final chunks = t12.trim().split(' ');
        if (chunks.length != 2) throw FormatException('Bad time: $t12');
        final hm = chunks[0].split(':');
        var h = int.parse(hm[0]);
        final m = int.parse(hm[1]);
        final pm = chunks[1].toUpperCase() == 'PM';
        if (pm && h != 12) h += 12;
        if (!pm && h == 12) h = 0;
        return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
      }

      return {'start_time': to24(parts[0]), 'end_time': to24(parts[1])};
    }

    final schedule = <Map<String, dynamic>>[];

    for (final dayEntry in weeklySchedule.entries) {
      final dayName = _capitalize(dayEntry.key); // monday → Monday
      final daySlots = dayEntry.value as Map<String, dynamic>;
      final classes = <Map<String, dynamic>>[];

      for (final slotEntry in daySlots.entries) {
        final slotKey = slotEntry.key; // slot1, slot2, …
        final classInfo = slotEntry.value?.toString() ?? '';
        if (classInfo.isEmpty) continue;
        final timeRaw = timeSlots[slotKey]?.toString();
        if (timeRaw == null) continue;

        // Parse "CODE - Name" pattern
        final dashIdx = classInfo.indexOf(' - ');
        final subjectCode =
            dashIdx > 0 ? classInfo.substring(0, dashIdx).trim() : classInfo;
        final subjectName =
            dashIdx > 0 ? classInfo.substring(dashIdx + 3).trim() : classInfo;

        // Detect non-academic slots
        final lower = classInfo.toLowerCase();
        final isNonAcademic = lower.contains('library') ||
            lower.contains('sports') ||
            lower.contains('class advisor') ||
            lower == 'ca' ||
            lower.contains('free elective');

        // Look up faculty from courses list
        final courseMatch = courses.cast<Map<String, dynamic>>().where((c) {
          final code = c['code']?.toString() ?? '';
          return subjectCode.contains(code) || code.contains(subjectCode);
        }).toList();
        final instructor =
            courseMatch.isNotEmpty ? (courseMatch.first['faculty'] ?? '') : '';

        final ts = _parseTimeSlot(timeRaw);

        classes.add({
          'subject_code': isNonAcademic ? classInfo : subjectCode,
          'subject_name': isNonAcademic ? classInfo : subjectName,
          'time_slot': ts,
          'room': classroom,
          'instructor': instructor.toString(),
          'is_non_academic': isNonAcademic,
        });
      }

      if (classes.isNotEmpty) {
        schedule.add({'day': dayName, 'classes': classes});
      }
    }

    return {'schedule': schedule};
  }

  /// Handle the { days: { monday: [ {time_slot, subject_code, …} ] } } shape
  /// used by the web app's alternate old format.
  Map<String, dynamic> _normalizeDaysFormat(Map<String, dynamic> days) {
    String _capitalize(String s) =>
        s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1).toLowerCase()}';

    String _to24(String t12) {
      final chunks = t12.trim().split(' ');
      if (chunks.length == 2) {
        final hm = chunks[0].split(':');
        var h = int.parse(hm[0]);
        final m = int.parse(hm[1]);
        final pm = chunks[1].toUpperCase() == 'PM';
        if (pm && h != 12) h += 12;
        if (!pm && h == 12) h = 0;
        return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
      }
      return t12.trim(); // already 24 h or "HH:MM-HH:MM"
    }

    final schedule = <Map<String, dynamic>>[];
    for (final entry in days.entries) {
      final dayName = _capitalize(entry.key);
      final raw = entry.value;
      if (raw is! List) continue;
      final classes = <Map<String, dynamic>>[];
      for (final c in raw) {
        if (c is! Map) continue;
        final m = Map<String, dynamic>.from(c);
        // Normalise time_slot from "HH:MM AM/PM - HH:MM AM/PM" or "HH:MM-HH:MM"
        final ts = m['time_slot'];
        if (ts is String && !ts.contains('{')) {
          final parts = ts.split(' - ');
          if (parts.length == 2) {
            m['time_slot'] = {
              'start_time': _to24(parts[0]),
              'end_time': _to24(parts[1]),
            };
          } else {
            // "HH:MM-HH:MM"
            final p2 = ts.split('-');
            if (p2.length == 2) {
              m['time_slot'] = {
                'start_time': p2[0].trim(),
                'end_time': p2[1].trim(),
              };
            }
          }
        }
        classes.add(m);
      }
      if (classes.isNotEmpty) {
        schedule.add({'day': dayName, 'classes': classes});
      }
    }
    return {'schedule': schedule};
  }

  Future<void> _submit(UploadNotifier notifier, UploadStatus status) async {
    // parse text fields if needed
    if (_timetableMode == 1 && _timetableJson == null) {
      try {
        _timetableJson = jsonDecode(_timetableJsonCtrl.text) as Map<String, dynamic>;
      } catch (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid timetable JSON')),
        );
        return;
      }
    }
    // ── Normalise timetable into backend schedule format ──
    try {
      _timetableJson = _normalizeToSchedule(_timetableJson!);
    } on FormatException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
      return;
    }

    // upload timetable if not already done
    if (status.timetable != UploadStep.done) {
      await notifier.uploadTimetable(_timetableJson!);
    }
    if (!mounted) return;
    final s2 = ref.read(uploadProvider);
    if (s2.timetable == UploadStep.error) return;

    // upload calendar — always auto-generate
    if (s2.calendar != UploadStep.done) {
      final calJson = _defaultCalendar();
      await notifier.uploadCalendar(calJson);
      if (!mounted) return;
      final s3 = ref.read(uploadProvider);
      if (s3.calendar == UploadStep.error) return;
    }

    await notifier.generateClasses();

    // Auto-switch to Review tab when generate succeeds
    if (!mounted) return;
    final s4 = ref.read(uploadProvider);
    if (s4.generateDone) {
      // Small delay so user sees the success banner briefly
      await Future.delayed(const Duration(milliseconds: 800));
      if (mounted) AppShell.switchTab.value = 1; // Review tab
    }
  }

  /// Auto-generate a default calendar when the user skips that section.
  /// Uses today → today + 5 months as semester range with no holidays.
  Map<String, dynamic> _defaultCalendar() {
    final now = DateTime.now();
    final end = DateTime(now.year, now.month + 5, now.day);
    String fmt(DateTime d) =>
        '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    return {
      'semester_start': fmt(now),
      'semester_end': fmt(end),
      'holidays': <dynamic>[],
      'working_saturdays': <dynamic>[],
    };
  }

  Future<void> _pickFile({
    required String label,
    required void Function(String name, Map<String, dynamic> json) onParsed,
  }) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['json'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    final bytes = file.bytes;
    if (bytes == null) return;
    try {
      final decoded = jsonDecode(utf8.decode(bytes)) as Map<String, dynamic>;
      onParsed(file.name, decoded);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Invalid JSON in $label file')),
        );
      }
    }
  }

  void _showTemplate(BuildContext context, String content) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.65,
        maxChildSize: 0.93,
        minChildSize: 0.4,
        expand: false,
        builder: (_, ctrl) => Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(children: [
                Expanded(
                  child: Text('Template JSON',
                      style: Theme.of(context).textTheme.titleMedium),
                ),
                TextButton.icon(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: content));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Copied to clipboard')),
                    );
                  },
                  icon: const Icon(Icons.copy, size: 16),
                  label: const Text('Copy'),
                ),
              ]),
              const SizedBox(height: 8),
              Expanded(
                child: SingleChildScrollView(
                  controller: ctrl,
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(content,
                        style: const TextStyle(
                            fontFamily: 'monospace', fontSize: 12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _card(BuildContext context, {required Widget child}) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
            color: scheme.outline.withValues(alpha: 0.15), width: 1),
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
}

// ── Hero header ─────────────────────────────────────────────────────────────

class _HeroHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0D9488), Color(0xFF06B6D4)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0D9488).withValues(alpha: 0.4),
                blurRadius: 16,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: const Icon(Icons.upload_rounded, color: Colors.white, size: 32),
        ),
        const SizedBox(height: 12),
        Text('Smart Attendance Tracker',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text(
          'Smart attendance tracking that helps you stay above 75% 🎯',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.55),
              ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _PulseDot(color: const Color(0xFF10B981), label: 'Real-time'),
            const SizedBox(width: 16),
            _PulseDot(color: const Color(0xFF3B82F6), label: 'Predictions'),
            const SizedBox(width: 16),
            _PulseDot(color: const Color(0xFFA855F7), label: 'Planning'),
          ],
        ),
      ],
    );
  }
}

class _PulseDot extends StatelessWidget {
  const _PulseDot({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Container(
        width: 8, height: 8,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
      const SizedBox(width: 5),
      Text(label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.6),
              )),
    ]);
  }
}

// ── Section header with icon ─────────────────────────────────────────────────

class _SectionIcon extends StatelessWidget {
  const _SectionIcon({
    required this.icon,
    required this.gradient,
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onAction,
  });
  final IconData icon;
  final List<Color> gradient;
  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: gradient),
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                  color: gradient.first.withValues(alpha: 0.35),
                  blurRadius: 8,
                  offset: const Offset(0, 3))
            ],
          ),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: Theme.of(context).textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              Text(subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.5),
                      )),
            ],
          ),
        ),
        TextButton(
          onPressed: onAction,
          style: TextButton.styleFrom(
            foregroundColor: gradient.first,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          ),
          child: Text(actionLabel,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }
}

// ── Mode toggle (File / Paste JSON) ─────────────────────────────────────────

class _ModeToggle extends StatelessWidget {
  const _ModeToggle({required this.selected, required this.onChanged});
  final int selected;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _Tab(label: '📁  Upload File', active: selected == 0,
              onTap: () => onChanged(0)),
          _Tab(label: '📝  Paste JSON', active: selected == 1,
              onTap: () => onChanged(1)),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  const _Tab({required this.label, required this.active, required this.onTap});
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            gradient: active
                ? const LinearGradient(
                    colors: [Color(0xFF3B82F6), Color(0xFF06B6D4)])
                : null,
            borderRadius: BorderRadius.circular(9),
            boxShadow: active
                ? [
                    BoxShadow(
                        color: const Color(0xFF3B82F6).withValues(alpha: 0.3),
                        blurRadius: 6,
                        offset: const Offset(0, 2))
                  ]
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: active
                  ? Colors.white
                  : Theme.of(context)
                      .colorScheme
                      .onSurface
                      .withValues(alpha: 0.5),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Drop zone ────────────────────────────────────────────────────────────────

class _DropZone extends StatelessWidget {
  const _DropZone(
      {required this.fileName, required this.isDone, required this.onPick});
  final String fileName;
  final bool isDone;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) {
    final hasFile = fileName.isNotEmpty;
    return GestureDetector(
      onTap: onPick,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: isDone
              ? AppColors.safe.withValues(alpha: 0.06)
              : hasFile
                  ? const Color(0xFF3B82F6).withValues(alpha: 0.06)
                  : const Color(0xFF10B981).withValues(alpha: 0.05),
          border: Border.all(
            color: isDone
                ? AppColors.safe.withValues(alpha: 0.5)
                : hasFile
                    ? const Color(0xFF3B82F6).withValues(alpha: 0.5)
                    : const Color(0xFF10B981).withValues(alpha: 0.4),
            width: 2,
            style: BorderStyle.solid,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 8)
                ],
              ),
              child: Icon(
                isDone ? Icons.check_circle_outline : Icons.upload_file_outlined,
                size: 28,
                color: isDone
                    ? AppColors.safe
                    : const Color(0xFF3B82F6),
              ),
            ),
            const SizedBox(height: 10),
            if (!hasFile && !isDone) ...[
              Text('Click to upload',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF3B82F6))),
              const SizedBox(height: 2),
              Text('or drag and drop',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.45),
                      )),
              const SizedBox(height: 4),
              Text('JSON file up to 10 MB',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontSize: 11,
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.35),
                      )),
            ] else ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 6)
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle,
                        size: 15,
                        color: isDone ? AppColors.safe : const Color(0xFF3B82F6)),
                    const SizedBox(width: 6),
                    Text(
                      isDone && fileName.isEmpty ? 'File uploaded' : fileName,
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: isDone
                              ? AppColors.safe
                              : const Color(0xFF3B82F6)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              Text('Tap to replace',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontSize: 11,
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.4),
                      )),
            ],
          ],
        ),
      ),
    );
  }
}

// ── JSON hint box ────────────────────────────────────────────────────────────

class _JsonHint extends StatelessWidget {
  const _JsonHint({required this.hint});
  final String hint;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF3B82F6).withValues(alpha: 0.08),
        border: Border.all(
            color: const Color(0xFF3B82F6).withValues(alpha: 0.25)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('📋 ', style: TextStyle(fontSize: 14)),
          Expanded(
            child: Text(hint,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF1D4ED8),
                    )),
          ),
        ],
      ),
    );
  }
}

// ── JSON textarea ────────────────────────────────────────────────────────────

class _JsonTextArea extends StatelessWidget {
  const _JsonTextArea(
      {required this.controller,
      required this.placeholder,
      required this.onChanged});
  final TextEditingController controller;
  final String placeholder;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return TextField(
      controller: controller,
      onChanged: onChanged,
      maxLines: 12,
      keyboardType: TextInputType.multiline,
      style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
      decoration: InputDecoration(
        hintText: placeholder,
        hintStyle: TextStyle(
            fontFamily: 'monospace',
            fontSize: 11,
            color: scheme.onSurface.withValues(alpha: 0.3)),
        filled: true,
        fillColor: scheme.surfaceContainerHighest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: const Color(0xFF3B82F6).withValues(alpha: 0.4)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
              color: const Color(0xFF3B82F6).withValues(alpha: 0.35)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 2),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }
}

// ── JSON valid indicator ─────────────────────────────────────────────────────

class _JsonValid extends StatelessWidget {
  const _JsonValid({required this.valid, required this.length});
  final bool valid;
  final int length;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(
        valid ? Icons.check_circle : Icons.error_outline,
        size: 16,
        color: valid ? AppColors.safe : AppColors.critical,
      ),
      const SizedBox(width: 6),
      Text(
        valid
            ? 'Valid JSON ($length characters)'
            : 'Invalid JSON — check syntax',
        style: TextStyle(
            fontSize: 12,
            color: valid ? AppColors.safe : AppColors.critical,
            fontWeight: FontWeight.w500),
      ),
    ]);
  }
}

// ── Success badge ────────────────────────────────────────────────────────────

class _SuccessBadge extends StatelessWidget {
  const _SuccessBadge(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(Icons.check_circle, size: 16, color: AppColors.safe),
      const SizedBox(width: 6),
      Text(text,
          style: TextStyle(
              fontSize: 12,
              color: AppColors.safe,
              fontWeight: FontWeight.w500)),
    ]);
  }
}

// ── Gradient submit button ────────────────────────────────────────────────────

class _GradientButton extends StatelessWidget {
  const _GradientButton(
      {required this.label,
      required this.isLoading,
      required this.enabled,
      required this.onTap});
  final String label;
  final bool isLoading;
  final bool enabled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 52,
        decoration: BoxDecoration(
          gradient: enabled
              ? const LinearGradient(
                  colors: [
                    Color(0xFF4F46E5),
                    Color(0xFF7C3AED),
                    Color(0xFFDB2777),
                  ],
                )
              : null,
          color: enabled ? null : Colors.grey.shade300,
          borderRadius: BorderRadius.circular(16),
          boxShadow: enabled
              ? [
                  BoxShadow(
                      color: const Color(0xFF4F46E5).withValues(alpha: 0.4),
                      blurRadius: 12,
                      offset: const Offset(0, 4))
                ]
              : null,
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(
                  width: 22, height: 22,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white))
              : Text(
                  label,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: enabled ? Colors.white : Colors.grey.shade500,
                    letterSpacing: 0.2,
                  ),
                ),
        ),
      ),
    );
  }
}

// ── Info card ────────────────────────────────────────────────────────────────

class _InfoCard extends StatelessWidget {
  const _InfoCard(
      {required this.gradient,
      required this.icon,
      required this.title,
      required this.body});
  final List<Color> gradient;
  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
            colors: gradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: gradient.first.withValues(alpha: 0.35),
              blurRadius: 10,
              offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
          const SizedBox(height: 10),
          Text(title,
              style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 13)),
          const SizedBox(height: 4),
          Text(body,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.85),
                  fontSize: 11)),
        ],
      ),
    );
  }
}

// ── How it works step ────────────────────────────────────────────────────────

class _HowStep extends StatelessWidget {
  const _HowStep(
      {required this.n,
      required this.title,
      required this.body,
      required this.gradient});
  final int n;
  final String title;
  final String body;
  final List<Color> gradient;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30, height: 30,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: gradient),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                    color: gradient.first.withValues(alpha: 0.4),
                    blurRadius: 6,
                    offset: const Offset(0, 2))
              ],
            ),
            alignment: Alignment.center,
            child: Text('$n',
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
                Text(body,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withValues(alpha: 0.55),
                        )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

const _timetableTemplate = '''
{
  "timeSlots": {
    "slot1": "08:55 AM - 09:45 AM",
    "slot2": "09:45 AM - 10:35 AM",
    "slot3": "10:45 AM - 11:35 AM",
    "slot4": "11:35 AM - 12:25 PM",
    "slot5": "01:20 PM - 02:10 PM",
    "slot6": "02:10 PM - 03:00 PM"
  },
  "weeklySchedule": {
    "monday": {
      "slot1": "CS401 - Operating Systems",
      "slot2": "MA201 - Mathematics",
      "slot3": "CS402 - DBMS",
      "slot4": "Library/Sports"
    },
    "tuesday": {
      "slot1": "CS402 - DBMS",
      "slot2": "CS401 - Operating Systems",
      "slot3": "MA201 - Mathematics",
      "slot5": "CS401 - OS Lab",
      "slot6": "CS401 - OS Lab"
    }
  },
  "courses": [
    {
      "code": "CS401",
      "name": "Operating Systems",
      "credits": 4,
      "faculty": "Dr. Smith"
    },
    {
      "code": "MA201",
      "name": "Mathematics",
      "credits": 3,
      "faculty": "Dr. Brown"
    },
    {
      "code": "CS402",
      "name": "DBMS",
      "credits": 4,
      "faculty": "Prof. Johnson"
    }
  ],
  "classroom": "A312"
}''';
