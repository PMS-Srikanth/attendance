import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/app_models.dart';
import '../services/api_client.dart';
import '../services/app_service.dart';

// ─── Upload state ─────────────────────────────────────────────────────────

enum UploadStep { idle, loading, done, error }

class UploadStatus {
  final UploadStep timetable;
  final UploadStep calendar;
  final UploadStep generate;
  final String? timetableError;
  final String? calendarError;
  final String? generateError;
  final TimetableResponse? timetableData;
  final int? generatedCount;

  const UploadStatus({
    this.timetable = UploadStep.idle,
    this.calendar = UploadStep.idle,
    this.generate = UploadStep.idle,
    this.timetableError,
    this.calendarError,
    this.generateError,
    this.timetableData,
    this.generatedCount,
  });

  UploadStatus copyWith({
    UploadStep? timetable,
    UploadStep? calendar,
    UploadStep? generate,
    String? timetableError,
    String? calendarError,
    String? generateError,
    TimetableResponse? timetableData,
    int? generatedCount,
    bool clearTimetableError = false,
    bool clearCalendarError = false,
    bool clearGenerateError = false,
  }) =>
      UploadStatus(
        timetable: timetable ?? this.timetable,
        calendar: calendar ?? this.calendar,
        generate: generate ?? this.generate,
        timetableError:
            clearTimetableError ? null : timetableError ?? this.timetableError,
        calendarError:
            clearCalendarError ? null : calendarError ?? this.calendarError,
        generateError:
            clearGenerateError ? null : generateError ?? this.generateError,
        timetableData: timetableData ?? this.timetableData,
        generatedCount: generatedCount ?? this.generatedCount,
      );

  bool get timetableDone => timetable == UploadStep.done;
  bool get calendarDone => calendar == UploadStep.done;
  bool get canGenerate => timetableDone; // calendar is optional
  bool get generateDone => generate == UploadStep.done;
}

class UploadNotifier extends StateNotifier<UploadStatus> {
  UploadNotifier() : super(const UploadStatus());

  final _svc = AppService.instance;

  Future<void> uploadTimetable(Map<String, dynamic> json) async {
    state = state.copyWith(
      timetable: UploadStep.loading,
      clearTimetableError: true,
    );
    try {
      final result = await _svc.uploadTimetable(json);
      state = state.copyWith(
        timetable: UploadStep.done,
        timetableData: result,
        // reset generate when timetable changes
        generate: UploadStep.idle,
        clearGenerateError: true,
      );
    } catch (e) {
      state = state.copyWith(
        timetable: UploadStep.error,
        timetableError: e.toString().replaceFirst('ApiException: ', ''),
      );
    }
  }

  Future<void> uploadCalendar(Map<String, dynamic> json) async {
    state = state.copyWith(
      calendar: UploadStep.loading,
      clearCalendarError: true,
    );
    try {
      await _svc.uploadCalendar(json);
      state = state.copyWith(
        calendar: UploadStep.done,
        generate: UploadStep.idle,
        clearGenerateError: true,
      );
    } catch (e) {
      state = state.copyWith(
        calendar: UploadStep.error,
        calendarError: e.toString().replaceFirst('ApiException: ', ''),
      );
    }
  }

  Future<void> generateClasses() async {
    state = state.copyWith(
      generate: UploadStep.loading,
      clearGenerateError: true,
    );
    try {
      final result = await _svc.generateClasses();
      state = state.copyWith(
        generate: UploadStep.done,
        generatedCount: result.totalGenerated,
      );
    } catch (e) {
      state = state.copyWith(
        generate: UploadStep.error,
        generateError: e.toString().replaceFirst('ApiException: ', ''),
      );
    }
  }
}

// ─── Attendance provider ──────────────────────────────────────────────────

class AttendanceState {
  final bool loading;
  final OverallAttendance? data;
  final String? error;

  const AttendanceState({this.loading = false, this.data, this.error});

  AttendanceState copyWith({bool? loading, OverallAttendance? data, String? error}) =>
      AttendanceState(
        loading: loading ?? this.loading,
        data: data ?? this.data,
        error: error,
      );
}

class AttendanceNotifier extends StateNotifier<AttendanceState> {
  AttendanceNotifier() : super(const AttendanceState());

  final _svc = AppService.instance;

  Future<void> load() async {
    state = state.copyWith(loading: true, error: null);
    try {
      final data = await _svc.getAttendanceSummary();
      state = AttendanceState(data: data);
    } on ApiException catch (e) {
      if (e.statusCode == 404) {
        // No classes generated yet — show empty state, not error
        state = const AttendanceState();
      } else {
        state = AttendanceState(error: e.message);
      }
    } catch (e) {
      state = AttendanceState(
        error: e.toString().replaceFirst('ApiException: ', ''),
      );
    }
  }
}

// ─── Timetable provider ───────────────────────────────────────────────────

class TimetableState {
  final bool loading;
  final TimetableResponse? data;
  final String? error;

  const TimetableState({this.loading = false, this.data, this.error});
}

class TimetableNotifier extends StateNotifier<TimetableState> {
  TimetableNotifier() : super(const TimetableState());

  final _svc = AppService.instance;

  Future<void> load() async {
    state = const TimetableState(loading: true);
    try {
      final data = await _svc.getTimetable();
      state = TimetableState(data: data);
    } catch (e) {
      state = TimetableState(
        error: e.toString().replaceFirst('ApiException: ', ''),
      );
    }
  }
}

// ─── Provider declarations ────────────────────────────────────────────────

final uploadProvider =
    StateNotifierProvider<UploadNotifier, UploadStatus>((ref) => UploadNotifier());

final attendanceProvider =
    StateNotifierProvider<AttendanceNotifier, AttendanceState>(
        (ref) => AttendanceNotifier());

final timetableProvider =
    StateNotifierProvider<TimetableNotifier, TimetableState>(
        (ref) => TimetableNotifier());
