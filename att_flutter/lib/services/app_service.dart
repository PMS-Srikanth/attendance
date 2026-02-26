import 'api_client.dart';
import '../config.dart';
import '../models/app_models.dart';

/// Singleton service that owns the ApiClient and exposes typed calls.
class AppService {
  AppService._() : _client = ApiClient(baseUrl: AppConfig.backendBaseUrl);

  static final AppService instance = AppService._();

  final ApiClient _client;

  // ─── Timetable ────────────────────────────────────────────────────────────

  Future<TimetableResponse> uploadTimetable(Map<String, dynamic> json) async {
    final data = await _client.postJson('/timetable', body: json);
    return TimetableResponse.fromJson(data as Map<String, dynamic>);
  }

  Future<TimetableResponse?> getTimetable() async {
    try {
      final data = await _client.getJson('/timetable');
      if (data == null) return null;
      return TimetableResponse.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  // ─── Calendar ─────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> uploadCalendar(Map<String, dynamic> json) async {
    final data = await _client.postJson('/calendar', body: json);
    return data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>?> getCalendar() async {
    try {
      final data = await _client.getJson('/calendar');
      if (data == null) return null;
      return data as Map<String, dynamic>;
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  // ─── Attendance ───────────────────────────────────────────────────────────

  Future<ClassGenerationResponse> generateClasses() async {
    final data = await _client.postJson('/attendance/generate');
    return ClassGenerationResponse.fromJson(data as Map<String, dynamic>);
  }

  Future<OverallAttendance> getAttendanceSummary() async {
    final data = await _client.getJson('/attendance/summary');
    return OverallAttendance.fromJson(data as Map<String, dynamic>);
  }

  Future<List<AttendanceWarning>> getWarnings() async {
    final data = await _client.getJson('/attendance/warnings');
    final list = data as List<dynamic>;
    return list
        .map((e) => AttendanceWarning.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<ClassInstance>> getClasses({String? status, String? date}) async {
    var path = '/attendance/classes';
    final params = <String>[];
    if (status != null) params.add('status=$status');
    if (date != null) params.add('date=$date');
    if (params.isNotEmpty) path = '$path?${params.join('&')}';
    final data = await _client.getJson(path);
    final list = data as List<dynamic>;
    return list
        .map((e) => ClassInstance.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ClassInstance> updateClass(String id, String newStatus) async {
    final data = await _client.postJson(
      '/attendance/classes/$id',
      body: {'status': newStatus},
    );
    return ClassInstance.fromJson(data as Map<String, dynamic>);
  }

  // ─── Planner ──────────────────────────────────────────────────────────────

  Future<PlannerSummary> getPlannerSummary({String? currentDate}) async {
    final path = currentDate != null
        ? '/planner/summary?current_date=$currentDate'
        : '/planner/summary';
    final data = await _client.getJson(path);
    return PlannerSummary.fromJson(data as Map<String, dynamic>);
  }

  Future<WhatIfResponse> simulateWhatIf(
      int attend, int skip, String? subjectCode) async {
    final body = <String, dynamic>{
      'classes_to_attend': attend,
      'classes_to_skip': skip,
    };
    if (subjectCode != null) body['subject_code'] = subjectCode;
    final data = await _client.postJson('/planner/what-if', body: body);
    return WhatIfResponse.fromJson(data as Map<String, dynamic>);
  }
}
