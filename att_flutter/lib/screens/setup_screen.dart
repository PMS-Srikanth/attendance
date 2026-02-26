import 'dart:convert';

import 'package:flutter/material.dart';

import '../config.dart';
import '../services/api_client.dart';
import 'app_shell.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key});

  static const route = '/setup';

  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  late final ApiClient _apiClient;

  final _calendarController = TextEditingController();
  final _timetableController = TextEditingController();

  bool _isLoading = false;
  String? _status;
  String? _error;

  @override
  void initState() {
    super.initState();
    _apiClient = ApiClient(baseUrl: AppConfig.backendBaseUrl);
    _calendarController.text = const JsonEncoder.withIndent(
      '  ',
    ).convert(_sampleCalendar());
    _timetableController.text = const JsonEncoder.withIndent(
      '  ',
    ).convert(_sampleTimetable());
  }

  @override
  void dispose() {
    _calendarController.dispose();
    _timetableController.dispose();
    super.dispose();
  }

  Map<String, dynamic> _decodeJsonMap(String raw) {
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('JSON must be an object at the root');
    }
    return decoded;
  }

  static Map<String, dynamic> _sampleCalendar() {
    return {
      'semester_start': '2025-01-01',
      'semester_end': '2025-05-31',
      'holidays': [
        {
          'date': '2025-01-26',
          'name': 'Republic Day',
          'description': 'National Holiday',
        },
      ],
      'working_saturdays': [],
    };
  }

  static Map<String, dynamic> _sampleTimetable() {
    Map<String, dynamic> classSlot({
      required String code,
      required String name,
      required String start,
      required String end,
      String? room,
      String? instructor,
      bool isNonAcademic = false,
    }) {
      return {
        'subject_code': code,
        'subject_name': name,
        'time_slot': {'start_time': start, 'end_time': end},
        ...?((room == null) ? null : {'room': room}),
        ...?((instructor == null) ? null : {'instructor': instructor}),
        'is_non_academic': isNonAcademic,
      };
    }

    Map<String, dynamic> day(
      String dayName,
      List<Map<String, dynamic>> classes,
    ) {
      return {'day': dayName, 'classes': classes};
    }

    return {
      'schedule': [
        day('Monday', [
          classSlot(
            code: 'CS101',
            name: 'Algorithms',
            start: '09:00',
            end: '10:00',
            room: 'A-101',
            instructor: 'Dr. Rao',
          ),
          classSlot(
            code: 'MA101',
            name: 'Probability',
            start: '10:00',
            end: '11:00',
            room: 'A-101',
            instructor: 'Dr. Iyer',
          ),
        ]),
        day('Tuesday', [
          classSlot(
            code: 'CS101',
            name: 'Algorithms',
            start: '09:00',
            end: '10:00',
            room: 'A-101',
            instructor: 'Dr. Rao',
          ),
        ]),
        day('Wednesday', [
          classSlot(
            code: 'CS102',
            name: 'Operating Systems',
            start: '09:00',
            end: '10:00',
            room: 'B-201',
            instructor: 'Ms. Lakshmi',
          ),
        ]),
        day('Thursday', [
          classSlot(
            code: 'CS102',
            name: 'Operating Systems',
            start: '09:00',
            end: '10:00',
            room: 'B-201',
            instructor: 'Ms. Lakshmi',
          ),
        ]),
        day('Friday', [
          classSlot(
            code: 'CS101',
            name: 'Algorithms',
            start: '09:00',
            end: '10:00',
            room: 'A-101',
            instructor: 'Dr. Rao',
          ),
        ]),
      ],
    };
  }

  Future<void> _run(
    Future<dynamic> Function() action,
    String successMessage,
  ) async {
    setState(() {
      _isLoading = true;
      _error = null;
      _status = null;
    });

    try {
      final result = await action();
      setState(() {
        _status =
            '$successMessage\n${const JsonEncoder.withIndent('  ').convert(result)}';
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _uploadCalendar() async {
    final body = _decodeJsonMap(_calendarController.text);
    await _run(
      () => _apiClient.postJson('/calendar', body: body),
      'Calendar uploaded',
    );
  }

  Future<void> _uploadTimetable() async {
    final body = _decodeJsonMap(_timetableController.text);
    await _run(
      () => _apiClient.postJson('/timetable', body: body),
      'Timetable uploaded',
    );
  }

  Future<void> _generateClasses() async {
    await _run(
      () => _apiClient.postJson('/attendance/generate'),
      'Classes generated',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Setup')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Backend: ${AppConfig.backendBaseUrl}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 12),
            const Text(
              '1) Upload Calendar',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _calendarController,
              maxLines: 10,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'CalendarInput JSON',
              ),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _isLoading ? null : _uploadCalendar,
              child: const Text('Upload Calendar'),
            ),
            const SizedBox(height: 20),
            const Text(
              '2) Upload Timetable',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _timetableController,
              maxLines: 12,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'TimetableInput JSON',
              ),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _isLoading ? null : _uploadTimetable,
              child: const Text('Upload Timetable'),
            ),
            const SizedBox(height: 20),
            const Text(
              '3) Generate Classes',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _isLoading ? null : _generateClasses,
              child: _isLoading
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Generate'),
            ),
            const SizedBox(height: 20),
            FilledButton.tonal(
              onPressed: _isLoading
                  ? null
                  : () => Navigator.of(context).pushNamed(AppShell.route),
              child: const Text('Open Summary'),
            ),
            const SizedBox(height: 16),
            if (_error != null) ...[
              Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
              const SizedBox(height: 12),
            ],
            if (_status != null) ...[
              const Text(
                'Latest result:',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              SelectableText(
                _status!,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
