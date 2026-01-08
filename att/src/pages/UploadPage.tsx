import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { timetableService } from '@/services/timetableService';
import { calendarService } from '@/services/calendarService';
import { attendanceService } from '@/services/attendanceService';
import { useTimetableStore } from '@/store/useTimetableStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { parseAttendanceFile } from '@/utils/attendanceParser';
import { userLocalStorage } from '@/utils/userStorage';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { setTimetable, setLoading, setError } = useTimetableStore();
  const { setCalendar } = useCalendarStore();
  const isDev = import.meta.env.DEV;
  const [timetableFile, setTimetableFile] = useState<File | null>(null);
  const [calendarFile, setCalendarFile] = useState<File | null>(null);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [timetableJson, setTimetableJson] = useState<string>('');

  // Auto-clear old localStorage with breaks
  useEffect(() => {
    const originalTimeSlots = userLocalStorage.getItem('originalTimeSlots');
    if (originalTimeSlots && (originalTimeSlots.includes('Break') || originalTimeSlots.includes('break'))) {
      if (isDev) {
        console.log('[Upload] Clearing legacy timetable cache with breaks');
      }
      userLocalStorage.removeItem('originalTimeSlots');
      userLocalStorage.removeItem('originalTimetable');
      userLocalStorage.removeItem('timetableMetadata');
      if (isDev) {
        console.log('[Upload] Legacy cache cleared');
      }
    }
  }, [isDev]);

  const handleTimetableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTimetableFile(e.target.files[0]);
    }
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCalendarFile(e.target.files[0]);
    }
  };

  const handleAttendanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttendanceFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (isDev) {
      console.log('=== Starting Upload Process ===');
    }
    
    // Check if we have timetable data (either file or JSON text)
    if (!timetableFile && !timetableJson.trim()) {
      setUploadError('Please provide timetable data (upload file or paste JSON)');
      return;
    }
    
    setIsUploading(true);
    setLoading(true);
    setUploadError('');

    try {
      // CLEAR ALL CACHED DATA FIRST
      if (isDev) {
        console.log('=== Clearing all cached timetable data ===');
      }
      userLocalStorage.removeItem('timetableMetadata');
      userLocalStorage.removeItem('originalTimeSlots');
      userLocalStorage.removeItem('originalTimetable');
      // Note: Zustand stores now use user-specific storage automatically

      // Do not clear the persisted stores here.
      // If an upload fails mid-way, clearing would permanently overwrite the user's saved data.
      
      // Clear backend timetable cache
      if (isDev) {
        console.log('=== Clearing backend timetable ===');
      }
      try {
        await timetableService.deleteTimetable();
      } catch (err) {
        if (isDev) {
          console.log('Backend timetable clear (may not exist yet)');
        }
      }
      
      if (isDev) {
        console.log('=== Cache cleared, starting fresh upload ===');
      }
      
      // Step 1: Parse and upload calendar
      let calendarData;
      
      if (calendarFile) {
        const calendarText = await calendarFile.text();
        calendarData = JSON.parse(calendarText);
      } else {
        // Default calendar if not provided
        calendarData = {
          semester_start: '2026-01-01',
          semester_end: '2026-05-31',
          holidays: [],
          working_saturdays: [],
        };
      }

      if (isDev) {
        console.log('Uploading calendar:', calendarData);
      }
      const calendarResponse = await calendarService.uploadCalendar(calendarData);
      if (isDev) {
        console.log('Calendar response:', calendarResponse);
      }
      
      if (!calendarResponse.success) {
        throw new Error(calendarResponse.error || 'Failed to upload calendar');
      }

      // Step 2: Parse the timetable data
      if (isDev) {
        console.log('=== Parsing Timetable Data ===');
      }
      
      let jsonData;
      
      if (inputMode === 'text') {
        // Parse from textarea
        try {
          jsonData = JSON.parse(timetableJson);
        } catch (error) {
          throw new Error('Invalid timetable JSON format. Please check your syntax.');
        }
      } else {
        // Parse from file
        const fileExt = timetableFile!.name.split('.').pop()?.toLowerCase();
        
        if (fileExt !== 'json') {
          throw new Error('Please upload a JSON file of your timetable.');
        }
        
        const fileText = await timetableFile!.text();
        jsonData = JSON.parse(fileText);
      }
      
      if (isDev) {
        console.log('Parsed timetable JSON:', jsonData);
      }
      
      // Check if this is the new comprehensive format
      let timetableData;
      let metadata: any = null;
      let originalTimeSlots: any = null;
      
      if (jsonData.weeklySchedule && jsonData.timeSlots) {
        // New comprehensive format with predefined time slots
        if (isDev) {
          console.log('Detected comprehensive timetable format with time slots');
        }
        
        // Store the ORIGINAL time slots structure
        originalTimeSlots = jsonData.timeSlots;
        
        // Store metadata
        metadata = {
          department: jsonData.department,
          class: jsonData.class,
          semester: jsonData.semester,
          classroom: jsonData.classroom,
          courses: jsonData.courses || [],
          totalCredits: jsonData.totalCredits,
          classAdvisors: jsonData.classAdvisors || [],
          breaks: jsonData.breaks
        };
        
        // Transform to backend format
        const days: any = {};
        const timeSlots = jsonData.timeSlots;
        
        Object.keys(jsonData.weeklySchedule).forEach((day) => {
          const daySchedule = jsonData.weeklySchedule[day];
          days[day] = [];
          
          Object.keys(daySchedule).forEach((slotKey) => {
            const classInfo = daySchedule[slotKey];
            const timeSlot = timeSlots[slotKey];
            
            if (classInfo && timeSlot) {
              // Parse subject code and name
              const parts = classInfo.split(' - ');
              const subjectCode = parts[0]?.trim() || classInfo;
              const subjectName = parts[1]?.trim() || classInfo;
              
              // Check if it's a non-academic slot - universal patterns across all semesters
              const classInfoLower = classInfo.toLowerCase();
              const isNonAcademic = 
                classInfoLower.includes('library') ||
                classInfoLower.includes('class advisor') ||
                classInfoLower === 'ca' ||
                classInfoLower.includes('sports');
              
              // For non-academic slots or slots without proper course codes, mark them but still send
              if (isNonAcademic || !/[A-Z0-9]{3,}/.test(subjectCode)) {
                days[day].push({
                  time_slot: timeSlot,
                  subject_code: classInfo,
                  subject_name: classInfo,
                  room: '',
                  instructor: '',
                  is_non_academic: true  // Mark as non-academic
                });
                return;
              }
              
              // Find course details for academic subjects
              const courseDetails = jsonData.courses?.find((c: any) => 
                subjectCode.includes(c.code) || c.code.includes(subjectCode)
              );
              
              days[day].push({
                time_slot: timeSlot,
                subject_code: subjectCode,
                subject_name: subjectName,
                room: jsonData.classroom || '',
                instructor: courseDetails?.faculty || '',
                is_non_academic: false
              });
            }
          });
        });
        
        timetableData = { days };
        
        // Store metadata and original structure in localStorage
        userLocalStorage.setItem('timetableMetadata', JSON.stringify(metadata));
        userLocalStorage.setItem('originalTimeSlots', JSON.stringify(originalTimeSlots));
        userLocalStorage.setItem('originalTimetable', JSON.stringify({
          weeklySchedule: jsonData.weeklySchedule,
          timeSlots: jsonData.timeSlots
        }));
      } else {
        // Old format
        timetableData = {
          days: jsonData.schedule || jsonData.days || {}
        };
      }

      if (isDev) {
        console.log('Uploading timetable:', timetableData);
      }
      
      try {
        const timetableResponse = await timetableService.uploadTimetable(timetableData);
        if (isDev) {
          console.log('Timetable response:', timetableResponse);
        }
        
        if (!timetableResponse.success) {
          throw new Error(timetableResponse.error || 'Failed to upload timetable');
        }
      } catch (err: any) {
        if (isDev) {
          console.error('Timetable upload error details:', err);
          console.error('Error response:', err.response?.data);
        }
        throw new Error(`Timetable upload failed: ${err.response?.data?.detail || err.message}`);
      }

      // Step 3: Fetch and store the data locally
      const calendarFetch = await calendarService.getCalendar();
      const timetableFetch = await timetableService.getTimetable();

      if (calendarFetch.success && calendarFetch.data) {
        // Transform backend calendar to frontend format
        const backendCalendar = calendarFetch.data;
        const transformedCalendar = {
          semesterStartDate: backendCalendar.semester_start || '2026-01-01',
          semesterEndDate: backendCalendar.semester_end || '2026-05-31',
          holidays: Array.isArray(backendCalendar.holidays) ? backendCalendar.holidays.map((h: any) => ({
            date: h.date,
            name: h.name,
            type: h.type || 'college'
          })) : [],
          saturdayOverrides: Array.isArray(backendCalendar.saturday_overrides) ? backendCalendar.saturday_overrides.map((s: any) => ({
            date: s.date,
            followsDay: s.follows_day || s.followsDay || 'Monday'
          })) : [],
        };
        if (isDev) {
          console.log('Transformed calendar:', transformedCalendar);
        }
        setCalendar(transformedCalendar);
      }

      if (timetableFetch.success && timetableFetch.data) {
        // Check if we have original time slots from JSON input
        const storedOriginalTimeSlots = userLocalStorage.getItem('originalTimeSlots');
        const storedOriginalTimetable = userLocalStorage.getItem('originalTimetable');
        
        if (storedOriginalTimeSlots && storedOriginalTimetable) {
          // Use the EXACT time slots from the original JSON
          if (isDev) {
            console.log('Using original time slots from JSON');
          }
          
          const originalTimeSlots = JSON.parse(storedOriginalTimeSlots);
          const originalTimetable = JSON.parse(storedOriginalTimetable);
          const backendSchedule = timetableFetch.data.schedule || [];
          
          // Create time slots array from original JSON (in the exact order provided)
          const timeSlots: any[] = [];
          const slotKeyToNumber = new Map<string, number>();
          
          // Process ONLY slot keys (slot1, slot2, etc.), not break keys
          const slotKeys = Object.keys(originalTimeSlots).filter(key => key.startsWith('slot')).sort((a, b) => {
            const numA = parseInt(a.replace('slot', ''));
            const numB = parseInt(b.replace('slot', ''));
            return numA - numB;
          });
          
          if (isDev) {
            console.log('Processing slot keys in order:', slotKeys);
          }
          
          slotKeys.forEach((slotKey, index) => {
            const timeRange = originalTimeSlots[slotKey];
            const slotNumber = index + 1;
            
            slotKeyToNumber.set(slotKey, slotNumber);
            
            timeSlots.push({
              slotNumber,
              startTime: timeRange.split(' - ')[0],
              endTime: timeRange.split(' - ')[1],
              isBreak: false,
            });
            
            if (isDev) {
              console.log(`✓ Mapped ${slotKey} -> slotNumber ${slotNumber}: ${timeRange}`);
            }
          });
          
          if (isDev) {
            console.log('=== FINAL SLOT MAPPING ===');
            console.log('Total slots created:', timeSlots.length);
            console.log('Slot mapping:', Array.from(slotKeyToNumber.entries()));
            console.log('TimeSlots array:', timeSlots);
          }
          
          // Extract subjects and create entries
          const subjects: any[] = [];
          const entries: any[] = [];
          
          // Process each day's schedule using the original weeklySchedule
          Object.keys(originalTimetable.weeklySchedule).forEach((day) => {
            const daySchedule = originalTimetable.weeklySchedule[day];
            
            // Ensure day name is properly capitalized (e.g., "monday" -> "Monday")
            const capitalizedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
            
            Object.keys(daySchedule).forEach((slotKey) => {
              const classInfo = daySchedule[slotKey];
              const slotNumber = slotKeyToNumber.get(slotKey);
              
              if (classInfo && slotNumber) {
                // Parse subject code and name
                const parts = classInfo.split(' - ');
                const subjectCode = parts[0]?.trim() || classInfo;
                const subjectName = parts[1]?.trim() || classInfo;
                
                // Add subject if not already added
                if (!subjects.find(s => s.subjectCode === subjectCode)) {
                  subjects.push({
                    subjectCode: subjectCode,
                    subjectName: subjectName,
                  });
                }
                
                // Find matching class from backend for room/instructor info
                const backendDay = backendSchedule.find((d: any) => d.day === capitalizedDay);
                const timeRange = originalTimeSlots[slotKey];
                const [startTime, endTime] = timeRange.split(' - ');
                
                let room = '';
                let instructor = '';
                
                if (backendDay) {
                  const matchingClass = backendDay.classes?.find((c: any) => 
                    c.subject_code === subjectCode && 
                    c.time_slot.start_time === startTime &&
                    c.time_slot.end_time === endTime
                  );
                  
                  if (matchingClass) {
                    room = matchingClass.room || '';
                    instructor = matchingClass.instructor || '';
                  }
                }
                
                // Only add entry if slotNumber is valid
                if (slotNumber !== undefined) {
                  entries.push({
                    day: capitalizedDay,
                    slotNumber,
                    subjectCode,
                    subjectName,
                    roomNumber: room,
                    facultyName: instructor,
                  });
                }
              }
            });
          });
          
          const transformedTimetable = {
            subjects,
            timeSlots,
            entries,
          };
          
          if (isDev) {
            console.log('=== SETTING NEW TIMETABLE DATA (Fresh Upload) ===');
            console.log('Timestamp:', new Date().toISOString());
            console.log('Transformed timetable using original JSON structure:', transformedTimetable);
            console.log('Sample entries:', entries.slice(0, 5));  // Log first 5 entries
            console.log('Total entries:', entries.length);
            console.log('Total time slots:', timeSlots.length);
          }
          setTimetable(transformedTimetable);
        } else {
          // Fallback: Use backend data to derive time slots
          if (isDev) {
            console.log('No original time slots found, deriving from backend data');
          }
          
          const backendSchedule = timetableFetch.data.schedule || [];
          const subjects: any[] = [];
          const uniqueTimeSlots = new Map<string, { startTime: string; endTime: string }>();
          const tempEntries: any[] = [];

          // Collect all unique time slots and subjects
          backendSchedule.forEach((daySchedule: any) => {
            const day = daySchedule.day;
            
            (daySchedule.classes || []).forEach((classSlot: any) => {
              // Add subject if not already added
              if (!subjects.find(s => s.subjectCode === classSlot.subject_code)) {
                subjects.push({
                  subjectCode: classSlot.subject_code,
                  subjectName: classSlot.subject_name,
                });
              }

              // Collect unique time slots
              const timeKey = `${classSlot.time_slot.start_time}-${classSlot.time_slot.end_time}`;
              if (!uniqueTimeSlots.has(timeKey)) {
                uniqueTimeSlots.set(timeKey, {
                  startTime: classSlot.time_slot.start_time,
                  endTime: classSlot.time_slot.end_time,
                });
              }

              // Store temporary entry with time key
              tempEntries.push({
                day,
                timeKey,
                subjectCode: classSlot.subject_code,
                subjectName: classSlot.subject_name,
                room: classSlot.room,
                instructor: classSlot.instructor,
              });
            });
          });

          // Sort time slots by start time
          const sortedTimeSlotEntries = Array.from(uniqueTimeSlots.entries())
            .sort((a, b) => a[1].startTime.localeCompare(b[1].startTime));

          // Create time slots array with ordered slot numbers
          const timeSlots = sortedTimeSlotEntries.map(([_timeKey, times], index) => ({
            slotNumber: index + 1,
            startTime: times.startTime,
            endTime: times.endTime,
          }));

          // Create mapping from time key to slot number
          const timeKeyToSlotNumber = new Map<string, number>();
          sortedTimeSlotEntries.forEach(([timeKey], index) => {
            timeKeyToSlotNumber.set(timeKey, index + 1);
          });

          // Create final entries with correct slot numbers
          const entries = tempEntries
            .filter(entry => timeKeyToSlotNumber.get(entry.timeKey) !== undefined)
            .map(entry => ({
              day: entry.day,
              slotNumber: timeKeyToSlotNumber.get(entry.timeKey)!,
              subjectCode: entry.subjectCode,
              subjectName: entry.subjectName,
              roomNumber: entry.room,
              facultyName: entry.instructor,
            }));

          const transformedTimetable = {
            subjects,
            timeSlots,
            entries,
          };
          
          if (isDev) {
            console.log('Transformed timetable from backend:', transformedTimetable);
          }
          setTimetable(transformedTimetable);
        }
      }

      // Step 4: Generate class instances (always needed for attendance tracking)
      if (isDev) {
        console.log('=== Generating Class Instances ===');
      }
      try {
        const generateResponse = await attendanceService.generateClasses();
        if (generateResponse.success) {
          if (isDev) {
            console.log('Classes generated successfully:', generateResponse.data);
          }
        } else {
          if (isDev) {
            console.warn('Failed to generate classes:', generateResponse.error);
          }
        }
      } catch (error) {
        if (isDev) {
          console.warn('Error generating classes:', error);
        }
        // Don't fail upload if class generation fails
      }

      // Step 5: Upload Current Attendance (if provided)
      if (attendanceFile) {
        if (isDev) {
          console.log('=== Processing Attendance File ===');
        }
        
        // Parse the attendance file
        const parseResult = await parseAttendanceFile(attendanceFile);
        
        if (!parseResult.success) {
          if (isDev) {
            console.error('Attendance file parsing errors:', parseResult.errors);
          }
          setUploadError(`Attendance file errors: ${parseResult.errors.join(', ')}`);
          // Don't fail the entire upload, just warn
        } else {
          if (isDev) {
            console.log(`Parsed ${parseResult.data.length} attendance records`);
          }
          
          // Upload attendance records
          const uploadResult = await attendanceService.uploadAttendanceRecords(parseResult.data);
          
          if (uploadResult.success) {
            if (isDev) {
              console.log('Attendance uploaded:', uploadResult.data);
            }
            if (uploadResult.data?.notFound && uploadResult.data.notFound.length > 0) {
              if (isDev) {
                console.warn('Some attendance records not matched:', uploadResult.data.notFound);
              }
            }
          } else {
            if (isDev) {
              console.error('Failed to upload attendance:', uploadResult.error);
            }
            setUploadError(`Attendance upload failed: ${uploadResult.error}`);
          }
        }
      } else {
        if (isDev) {
          console.log('No attendance file provided - skipping attendance upload');
        }
      }

      // Navigate to review page
      if (isDev) {
        console.log('=== Upload Success - Navigating to Review ===');
      }
      navigate('/review');
    } catch (error: any) {
      if (isDev) {
        console.error('=== Upload Error ===', error);
      }
      const errorMessage = error.message || 'Failed to upload files';
      setError(errorMessage);
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-blue-900/20 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-slide-down">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 mb-6 shadow-2xl animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              Attendance Planner
            </span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Smart attendance tracking that helps you stay above 75% 🎯
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Real-time tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span>Smart predictions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              <span>Easy planning</span>
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 animate-slide-up">
          <div className="space-y-8">
            {/* Timetable Upload */}
            <div className="group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-lg font-bold text-gray-900 dark:text-white">
                      Your Timetable
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Weekly schedule for the semester</p>
                  </div>
                </div>
                <a 
                  href="/timetable_template.json" 
                  download="timetable_template.json"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Template
                </a>
              </div>

              {/* Tab Switcher */}
              <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                <button
                  onClick={() => setInputMode('file')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    inputMode === 'file'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  📁 Upload File
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    inputMode === 'text'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  📝 Paste JSON
                </button>
              </div>

              {inputMode === 'file' ? (
                <div className="relative mt-4 flex justify-center px-6 pt-8 pb-8 border-3 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 group-hover:shadow-2xl">
                  <div className="space-y-3 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <label className="relative cursor-pointer">
                        <span className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                          Click to upload
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".json"
                          onChange={handleTimetableChange}
                        />
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">JSON file up to 10MB</p>
                    {timetableFile && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {timetableFile.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative mt-4">
                  <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                      📋 Paste your timetable JSON here (one-time setup per semester)
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Download the template above to see the required format with day, time, subject, and room details.
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      If you generate this with an LLM, ask it to return only valid JSON in the same template format.
                    </p>
                  </div>
                  <textarea
                    value={timetableJson}
                    onChange={(e) => setTimetableJson(e.target.value)}
                    placeholder={`{\n  "schedule": {\n    "monday": [\n      {\n        "time_slot": "08:40-09:30",\n        "subject_code": "CS401",\n        "subject_name": "Operating Systems",\n        "room": "301",\n        "instructor": "Dr. Smith"\n      }\n    ],\n    ...\n  }\n}`}
                    className="w-full h-96 px-4 py-3 border-2 border-blue-300 dark:border-blue-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  {timetableJson.trim() && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      JSON data entered ({timetableJson.length} characters)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Calendar Upload */}
            <div className="group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-lg font-bold text-gray-900 dark:text-white">
                      Academic Calendar
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Holidays & semester dates (Optional)</p>
                  </div>
                </div>
                <a 
                  href="/calendar_template.json" 
                  download="calendar_template.json"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Template
                </a>
              </div>
              <div className="relative mt-4 flex justify-center px-6 pt-8 pb-8 border-3 border-dashed border-purple-300 dark:border-purple-700 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-300 group-hover:shadow-2xl">
                <div className="space-y-3 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-purple-500" />
                  </div>
                  <div>
                    <label className="relative cursor-pointer">
                      <span className="text-lg font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
                        Click to upload
                      </span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".json"
                        onChange={handleCalendarChange}
                      />
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">or add holidays later</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Optional - Can skip and add in Review page</p>
                  {calendarFile && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {calendarFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Attendance Upload (Optional) */}
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-900/30">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Attendance (Optional)
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    You can add attendance later on the Review page, or upload a file here
                  </p>
                </div>
                <a 
                  href="/attendance_template.csv" 
                  download="attendance_template.csv"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium whitespace-nowrap"
                >
                  Download Template ↓
                </a>
              </div>
              <div className="flex justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300">
                <div className="text-center">
                  <div className="flex text-sm text-gray-600 dark:text-gray-400 items-center justify-center gap-2">
                    <Upload className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <label className="relative cursor-pointer font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                      <span>Upload file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".csv,.json"
                        onChange={handleAttendanceChange}
                      />
                    </label>
                    <span className="text-gray-500 dark:text-gray-400">or add manually later</span>
                  </div>
                  {attendanceFile && (
                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-2">{attendanceFile.name}</p>
                  )}
                </div>
              </div>
            </div>

            {uploadError && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-300 dark:border-rose-700 rounded-2xl p-5 shadow-lg animate-shake">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-rose-800 dark:text-rose-300 font-medium">{uploadError}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={isUploading}
              isLoading={isUploading}
              className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              size="lg"
            >
              {isUploading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <span>Continue to Review</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Upload Once</h3>
            <p className="text-emerald-100 text-sm">Set up your timetable once per semester and reuse it throughout</p>
          </div>
          
          <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Real-time Tracking</h3>
            <p className="text-cyan-100 text-sm">Monitor your attendance percentage live and get instant alerts</p>
          </div>
          
          <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">Smart Planning</h3>
            <p className="text-teal-100 text-sm">Plan future leaves while maintaining 75% attendance easily</p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30 dark:border-gray-700/50">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center text-white text-sm">!</span>
            How it works
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">1</div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Download Templates</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get JSON templates for timetable and holidays (takes 30 seconds)</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">2</div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Fill Your Data</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add your subjects and time slots (one-time setup, 5 minutes)</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">3</div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Upload & Track</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upload files and start tracking attendance instantly</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-rose-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">4</div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Stay Above 75%</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get alerts and plan leaves smartly to maintain minimum attendance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
