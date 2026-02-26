// ─── Timetable models ─────────────────────────────────────────────────────

class TimeSlot {
  final String startTime;
  final String endTime;

  const TimeSlot({required this.startTime, required this.endTime});

  factory TimeSlot.fromJson(Map<String, dynamic> j) =>
      TimeSlot(startTime: j['start_time'] as String, endTime: j['end_time'] as String);
}

class ClassSlot {
  final String subjectCode;
  final String subjectName;
  final TimeSlot timeSlot;
  final String? room;
  final String? instructor;
  final bool isNonAcademic;

  const ClassSlot({
    required this.subjectCode,
    required this.subjectName,
    required this.timeSlot,
    this.room,
    this.instructor,
    this.isNonAcademic = false,
  });

  factory ClassSlot.fromJson(Map<String, dynamic> j) => ClassSlot(
        subjectCode: j['subject_code'] as String,
        subjectName: j['subject_name'] as String,
        timeSlot: TimeSlot.fromJson(j['time_slot'] as Map<String, dynamic>),
        room: j['room'] as String?,
        instructor: j['instructor'] as String?,
        isNonAcademic: (j['is_non_academic'] as bool?) ?? false,
      );
}

class DaySchedule {
  final String day;
  final List<ClassSlot> classes;

  const DaySchedule({required this.day, required this.classes});

  factory DaySchedule.fromJson(Map<String, dynamic> j) => DaySchedule(
        day: j['day'] as String,
        classes: (j['classes'] as List<dynamic>)
            .map((e) => ClassSlot.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class TimetableResponse {
  final List<DaySchedule> schedule;
  final int totalClassesPerWeek;
  final List<String> uniqueSubjects;
  final Map<String, int> classesPerSubject;

  const TimetableResponse({
    required this.schedule,
    required this.totalClassesPerWeek,
    required this.uniqueSubjects,
    required this.classesPerSubject,
  });

  factory TimetableResponse.fromJson(Map<String, dynamic> j) => TimetableResponse(
        schedule: (j['schedule'] as List<dynamic>)
            .map((e) => DaySchedule.fromJson(e as Map<String, dynamic>))
            .toList(),
        totalClassesPerWeek: (j['total_classes_per_week'] as num).toInt(),
        uniqueSubjects: List<String>.from(j['unique_subjects'] as List),
        classesPerSubject:
            Map<String, int>.from(j['classes_per_subject'] as Map),
      );
}

// ─── Attendance models ────────────────────────────────────────────────────

class SubjectAttendance {
  final String subjectCode;
  final String subjectName;
  final int totalClasses;
  final int attended;
  final int absent;
  final int cancelled;
  final int scheduled;
  final double percentage;
  final String status;
  final int classesNeededFor75;
  final int classesCanMiss;

  const SubjectAttendance({
    required this.subjectCode,
    required this.subjectName,
    required this.totalClasses,
    required this.attended,
    required this.absent,
    required this.cancelled,
    required this.scheduled,
    required this.percentage,
    required this.status,
    required this.classesNeededFor75,
    required this.classesCanMiss,
  });

  factory SubjectAttendance.fromJson(Map<String, dynamic> j) => SubjectAttendance(
        subjectCode: j['subject_code'] as String,
        subjectName: j['subject_name'] as String,
        totalClasses: (j['total_classes'] as num).toInt(),
        attended: (j['attended'] as num).toInt(),
        absent: (j['absent'] as num).toInt(),
        cancelled: (j['cancelled'] as num).toInt(),
        scheduled: (j['scheduled'] as num).toInt(),
        percentage: (j['percentage'] as num).toDouble(),
        status: j['status'] as String,
        classesNeededFor75: (j['classes_needed_for_75'] as num).toInt(),
        classesCanMiss: (j['classes_can_miss'] as num).toInt(),
      );
}

class OverallAttendance {
  final int totalClasses;
  final int attended;
  final int absent;
  final int cancelled;
  final int scheduled;
  final double overallPercentage;
  final String status;
  final List<SubjectAttendance> subjects;

  const OverallAttendance({
    required this.totalClasses,
    required this.attended,
    required this.absent,
    required this.cancelled,
    required this.scheduled,
    required this.overallPercentage,
    required this.status,
    required this.subjects,
  });

  factory OverallAttendance.fromJson(Map<String, dynamic> j) => OverallAttendance(
        totalClasses: (j['total_classes'] as num).toInt(),
        attended: (j['attended'] as num).toInt(),
        absent: (j['absent'] as num).toInt(),
        cancelled: (j['cancelled'] as num).toInt(),
        scheduled: (j['scheduled'] as num).toInt(),
        overallPercentage: (j['overall_percentage'] as num).toDouble(),
        status: j['status'] as String,
        subjects: (j['subjects'] as List<dynamic>)
            .map((e) => SubjectAttendance.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class AttendanceWarning {
  final String subjectCode;
  final String subjectName;
  final double currentPercentage;
  final String message;
  final String severity;
  final String recommendation;

  const AttendanceWarning({
    required this.subjectCode,
    required this.subjectName,
    required this.currentPercentage,
    required this.message,
    required this.severity,
    required this.recommendation,
  });

  factory AttendanceWarning.fromJson(Map<String, dynamic> j) => AttendanceWarning(
        subjectCode: j['subject_code'] as String,
        subjectName: j['subject_name'] as String,
        currentPercentage: (j['current_percentage'] as num).toDouble(),
        message: j['message'] as String,
        severity: j['severity'] as String,
        recommendation: j['recommendation'] as String,
      );
}

class ClassInstance {
  final String id;
  final String subjectCode;
  final String subjectName;
  final String date;
  final String startTime;
  final String endTime;
  final String status; // present / absent / cancelled / scheduled
  final String? room;
  final String? instructor;

  const ClassInstance({
    required this.id,
    required this.subjectCode,
    required this.subjectName,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.room,
    this.instructor,
  });

  factory ClassInstance.fromJson(Map<String, dynamic> j) => ClassInstance(
        id: j['id'] as String,
        subjectCode: j['subject_code'] as String,
        subjectName: j['subject_name'] as String,
        date: j['date'] as String,
        startTime: j['start_time'] as String,
        endTime: j['end_time'] as String,
        status: j['status'] as String,
        room: j['room'] as String?,
        instructor: j['instructor'] as String?,
      );
}

class ClassGenerationResponse {
  final int totalGenerated;
  final String message;

  const ClassGenerationResponse({
    required this.totalGenerated,
    required this.message,
  });

  factory ClassGenerationResponse.fromJson(Map<String, dynamic> j) =>
      ClassGenerationResponse(
        totalGenerated: (j['total_generated'] as num?)?.toInt() ??
            (j['classes'] as List?)?.length ??
            0,
        message: j['message'] as String? ?? 'Classes generated successfully',
      );
}

// ─── Planner models ───────────────────────────────────────────────────────

class PlannerSummary {
  final double overallPercentage;
  final String overallStatus;
  final List<SubjectAttendance> subjects;
  final List<AttendanceWarning> warnings;
  final List<String> recommendations;

  const PlannerSummary({
    required this.overallPercentage,
    required this.overallStatus,
    required this.subjects,
    required this.warnings,
    required this.recommendations,
  });

  factory PlannerSummary.fromJson(Map<String, dynamic> j) => PlannerSummary(
        overallPercentage: (j['overall_percentage'] as num).toDouble(),
        overallStatus: j['overall_status'] as String,
        subjects: (j['subjects'] as List<dynamic>)
            .map((e) => SubjectAttendance.fromJson(e as Map<String, dynamic>))
            .toList(),
        warnings: (j['warnings'] as List<dynamic>? ?? [])
            .map((e) => AttendanceWarning.fromJson(e as Map<String, dynamic>))
            .toList(),
        recommendations:
            List<String>.from(j['recommendations'] as List? ?? []),
      );
}

class WhatIfResponse {
  final double currentOverall;
  final double projectedOverall;
  final double change;
  final List<Map<String, dynamic>> projections;

  const WhatIfResponse({
    required this.currentOverall,
    required this.projectedOverall,
    required this.change,
    required this.projections,
  });

  factory WhatIfResponse.fromJson(Map<String, dynamic> j) => WhatIfResponse(
        currentOverall: (j['current_overall'] as num).toDouble(),
        projectedOverall: (j['projected_overall'] as num).toDouble(),
        change: (j['change'] as num).toDouble(),
        projections: List<Map<String, dynamic>>.from(
          (j['projections'] as List? ?? [])
              .map((e) => Map<String, dynamic>.from(e as Map)),
        ),
      );
}
