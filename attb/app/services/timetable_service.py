from typing import List, Dict
from app.models.timetable import (
    TimetableInput, TimetableResponse, DaySchedule,
    ClassSlot, SubjectInfo
)
from collections import defaultdict


class TimetableService:
    """Service for processing and normalizing timetable."""
    
    def process_timetable(self, timetable_input: TimetableInput) -> TimetableResponse:
        """
        Process and normalize timetable.
        
        Args:
            timetable_input: Raw timetable input
            
        Returns:
            Normalized timetable response with metadata
        """
        # Extract unique subjects
        subjects = set()
        classes_per_subject = defaultdict(int)
        
        for day_schedule in timetable_input.schedule:
            for class_slot in day_schedule.classes:
                subjects.add(class_slot.subject_code)
                classes_per_subject[class_slot.subject_code] += 1
        
        # Calculate total weekly classes
        total_classes = sum(
            len(day.classes) for day in timetable_input.schedule
        )
        
        return TimetableResponse(
            schedule=timetable_input.schedule,
            subjects=sorted(list(subjects)),
            total_classes_per_week=total_classes,
            classes_per_subject=dict(classes_per_subject)
        )
    
    def get_subject_info(self, timetable_response: TimetableResponse) -> List[SubjectInfo]:
        """
        Get detailed information about each subject.
        
        Args:
            timetable_response: Processed timetable
            
        Returns:
            List of subject information
        """
        subject_data = defaultdict(lambda: {
            'name': '',
            'weekly_classes': 0,
            'days': set()
        })
        
        for day_schedule in timetable_response.schedule:
            for class_slot in day_schedule.classes:
                code = class_slot.subject_code
                subject_data[code]['name'] = class_slot.subject_name
                subject_data[code]['weekly_classes'] += 1
                subject_data[code]['days'].add(day_schedule.day)
        
        return [
            SubjectInfo(
                subject_code=code,
                subject_name=data['name'],
                weekly_classes=data['weekly_classes'],
                days=sorted(list(data['days']))
            )
            for code, data in subject_data.items()
        ]
    
    def get_classes_for_day(self, timetable_response: TimetableResponse, day_name: str) -> List[ClassSlot]:
        """
        Get all classes scheduled for a specific day.
        
        Args:
            timetable_response: Processed timetable
            day_name: Name of the day (e.g., "Monday")
            
        Returns:
            List of class slots for that day
        """
        for day_schedule in timetable_response.schedule:
            if day_schedule.day == day_name:
                return day_schedule.classes
        return []
    
    def validate_timetable(self, timetable_input: TimetableInput) -> Dict[str, any]:
        """
        Validate timetable for conflicts and issues.
        
        Args:
            timetable_input: Timetable to validate
            
        Returns:
            Validation result with issues if any
        """
        issues = []
        
        for day_schedule in timetable_input.schedule:
            # Check for time slot overlaps
            time_slots = []
            for class_slot in day_schedule.classes:
                start = class_slot.time_slot.start_time
                end = class_slot.time_slot.end_time
                
                # Check overlap with existing slots
                for existing_start, existing_end in time_slots:
                    if not (end <= existing_start or start >= existing_end):
                        issues.append(
                            f"Time conflict on {day_schedule.day}: "
                            f"{start}-{end} overlaps with {existing_start}-{existing_end}"
                        )
                
                time_slots.append((start, end))
        
        return {
            "is_valid": len(issues) == 0,
            "issues": issues
        }
