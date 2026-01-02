from typing import List, Dict
from datetime import date
import uuid
from app.models.calendar import CalendarResponse
from app.models.timetable import TimetableResponse
from app.models.class_instance import (
    ClassInstance, ClassGenerationResponse
)
from app.core.constants import ClassStatus
from collections import defaultdict


class ClassGenerator:
    """Service for generating class instances from calendar and timetable."""
    
    def generate_classes(
        self,
        calendar: CalendarResponse,
        timetable: TimetableResponse
    ) -> ClassGenerationResponse:
        """
        Generate all class instances for the semester.
        
        Combines calendar (working days) with timetable to create
        individual class instances that can be tracked.
        
        Args:
            calendar: Processed calendar
            timetable: Processed timetable
            
        Returns:
            Generated class instances
        """
        classes: List[ClassInstance] = []
        classes_by_subject = defaultdict(int)
        
        # Get working days from calendar
        working_days = [day for day in calendar.calendar if day.is_working]
        
        # For each working day, generate classes based on timetable
        for calendar_day in working_days:
            day_name = calendar_day.day_name
            
            # Find classes scheduled for this day
            day_schedule = None
            for schedule in timetable.schedule:
                if schedule.day == day_name:
                    day_schedule = schedule
                    break
            
            if not day_schedule:
                continue
            
            # Generate class instance for each slot
            for class_slot in day_schedule.classes:
                # Skip non-academic classes - check both flag and patterns
                if getattr(class_slot, 'is_non_academic', False):
                    continue
                
                # Additional pattern-based check for universal exclusion
                subject_lower = class_slot.subject_code.lower()
                if any(pattern in subject_lower for pattern in 
                       ['library', 'class advisor', 'sports']):
                    continue
                if subject_lower == 'ca':
                    continue
                    
                class_instance = ClassInstance(
                    id=self._generate_class_id(
                        class_slot.subject_code,
                        calendar_day.date,
                        class_slot.time_slot.start_time
                    ),
                    subject_code=class_slot.subject_code,
                    subject_name=class_slot.subject_name,
                    date=calendar_day.date,
                    day_name=day_name,
                    start_time=class_slot.time_slot.start_time,
                    end_time=class_slot.time_slot.end_time,
                    status=ClassStatus.SCHEDULED,
                    room=class_slot.room,
                    instructor=class_slot.instructor,
                    is_makeup=False
                )
                
                classes.append(class_instance)
                classes_by_subject[class_slot.subject_code] += 1
        
        return ClassGenerationResponse(
            total_classes=len(classes),
            classes_by_subject=dict(classes_by_subject),
            classes=classes,
            semester_start=calendar.semester_start,
            semester_end=calendar.semester_end
        )
    
    def _generate_class_id(self, subject_code: str, class_date: date, start_time: str) -> str:
        """
        Generate unique ID for a class instance.
        
        Format: {subject}_{date}_{time}_{uuid}
        """
        date_str = class_date.strftime("%Y%m%d")
        time_str = start_time.replace(":", "")
        unique_id = str(uuid.uuid4())[:8]
        return f"{subject_code}_{date_str}_{time_str}_{unique_id}"
    
    def get_classes_by_subject(
        self,
        classes: List[ClassInstance],
        subject_code: str
    ) -> List[ClassInstance]:
        """Get all classes for a specific subject."""
        return [c for c in classes if c.subject_code == subject_code]
    
    def get_classes_by_date_range(
        self,
        classes: List[ClassInstance],
        start_date: date,
        end_date: date
    ) -> List[ClassInstance]:
        """Get classes within a date range."""
        return [
            c for c in classes
            if start_date <= c.date <= end_date
        ]
    
    def get_future_classes(
        self,
        classes: List[ClassInstance],
        current_date: date
    ) -> List[ClassInstance]:
        """Get all future/scheduled classes."""
        return [
            c for c in classes
            if c.date >= current_date and c.status == ClassStatus.SCHEDULED
        ]
    
    def get_past_classes(
        self,
        classes: List[ClassInstance],
        current_date: date
    ) -> List[ClassInstance]:
        """Get all past classes."""
        return [
            c for c in classes
            if c.date < current_date
        ]
