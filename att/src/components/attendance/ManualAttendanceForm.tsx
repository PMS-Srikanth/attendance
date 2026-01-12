import React, { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { Subject } from '@/types/timetable';
import { getCurrentAttendance, setCurrentAttendance } from '@/utils/currentAttendance';

interface ManualAttendanceFormProps {
  subjects: Subject[];
  onSave: () => void;
}

interface SubjectAttendance {
  subjectCode: string;
  classesAttended: number;
  totalClasses: number;
  percentage: number;
}

export const ManualAttendanceForm: React.FC<ManualAttendanceFormProps> = ({ subjects, onSave }) => {
  const [attendanceData, setAttendanceData] = useState<Record<string, { attended: string; total: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Load existing attendance once so the user can continue from previous values
  useEffect(() => {
    try {
      const existing = getCurrentAttendance();
      if (existing.length > 0) {
        const seed: Record<string, { attended: string; total: string }> = {};
        existing.forEach((x) => {
          seed[x.subjectCode] = { attended: String(x.attended ?? 0), total: String(x.total ?? 0) };
        });
        setAttendanceData(seed);
      }
    } catch {
      // ignore
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const handleInputChange = (subjectCode: string, field: 'attended' | 'total', value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [subjectCode]: {
        ...prev[subjectCode],
        attended: field === 'attended' ? value : prev[subjectCode]?.attended || '',
        total: field === 'total' ? value : prev[subjectCode]?.total || '',
      }
    }));
  };

  const calculatePercentage = (attended: string, total: string): number => {
    const a = parseInt(attended) || 0;
    const t = parseInt(total) || 0;
    if (t === 0) return 0;
    return Math.round((a / t) * 100);
  };

  const handleSave = async () => {
    // Validate inputs
    const hasData = Object.keys(attendanceData).length > 0;
    if (!hasData) {
      setMessage({ type: 'error', text: 'Please enter attendance data for at least one subject' });
      return;
    }

    // Validate each entry
    for (const [code, data] of Object.entries(attendanceData)) {
      const attended = parseInt(data.attended) || 0;
      const total = parseInt(data.total) || 0;
      
      if (data.attended && data.total && attended > total) {
        setMessage({ type: 'error', text: `${code}: Classes attended cannot exceed total classes` });
        return;
      }
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const existingAttendance = getCurrentAttendance();
      
      // Create new attendance entries
      const newEntries = Object.entries(attendanceData)
        .filter(([_, data]) => (data.attended ?? '').toString().length > 0 || (data.total ?? '').toString().length > 0)
        .map(([code, data]) => ({
          subjectCode: code,
          attended: parseInt(data.attended) || 0,
          total: parseInt(data.total) || 0,
          percentage: calculatePercentage(data.attended, data.total)
        }));
      
      // Merge with existing - NEVER decrease existing values
      const mergedAttendance = [...existingAttendance];
      const decreased: string[] = [];
      newEntries.forEach((newEntry) => {
        const existingIndex = mergedAttendance.findIndex((e) => e.subjectCode === newEntry.subjectCode);
        if (existingIndex >= 0) {
          const prev = mergedAttendance[existingIndex];
          const nextAttended = Math.max(prev.attended ?? 0, newEntry.attended ?? 0);
          const nextTotal = Math.max(prev.total ?? 0, newEntry.total ?? 0);

          if ((newEntry.attended ?? 0) < (prev.attended ?? 0) || (newEntry.total ?? 0) < (prev.total ?? 0)) {
            decreased.push(newEntry.subjectCode);
          }

          mergedAttendance[existingIndex] = {
            ...prev,
            attended: nextAttended,
            total: nextTotal,
            percentage: calculatePercentage(String(nextAttended), String(nextTotal)),
          };
        } else {
          mergedAttendance.push(newEntry);
        }
      });
      
      setCurrentAttendance(mergedAttendance);

      if (decreased.length > 0) {
        setMessage({
          type: 'warning',
          text: `Saved. Note: we ignored decreases for ${decreased.join(', ')} (current attendance only goes up).`,
        });
      } else {
        setMessage({
          type: 'success',
          text: `Successfully saved attendance for ${newEntries.length} subjects! Total: ${mergedAttendance.length}`
        });
      }
      
      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (error) {
      console.error('Attendance save error:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Preparing attendance tracker...</p>
        </div>
      </div>
    );
  }

  // Identify lab subjects dynamically
  const labSubjects = subjects.filter(subject => 
    subject.subjectName.toLowerCase().includes('lab') ||
    /\(lab\s*\d*\)/i.test(subject.subjectName)
  );

  // Create a map of lab codes to their theory subject codes
  const labToTheoryMap = new Map<string, string>();
  labSubjects.forEach(lab => {
    // Find theory subject with similar name (without "Lab" part)
    const labBaseName = lab.subjectName
      .replace(/\s*\(lab\s*\d*\)/gi, '')
      .replace(/\s*lab\s*/gi, '')
      .trim()
      .toLowerCase();
    
    const theorySubject = subjects.find(s => 
      !s.subjectName.toLowerCase().includes('lab') &&
      s.subjectName.toLowerCase().includes(labBaseName)
    );
    
    if (theorySubject) {
      labToTheoryMap.set(lab.subjectCode, theorySubject.subjectCode);
    }
  });

  // Filter and prepare subjects for display
  const displaySubjects = subjects.filter(subject => {
    // Remove only LIBRARY and ADVISOR (keep free electives)
    if (subject.subjectCode.includes('LIBRARY') || 
        subject.subjectCode.includes('ADVISOR')) {
      return false;
    }
    
    // DON'T filter lab subjects - we'll handle merging differently
    // Just keep all subjects for now
    return true;
  });

  // Check if a subject has an associated lab
  const hasLab = (subjectCode: string) => {
    return Array.from(labToTheoryMap.values()).includes(subjectCode);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Quick Setup:</strong> Enter how many classes you've attended so far for each subject.
        </p>
      </div>

      <div className="space-y-4">
        {displaySubjects.map((subject) => {
          const data = attendanceData[subject.subjectCode] || { attended: '', total: '' };
          const percentage = calculatePercentage(data.attended, data.total);
          
          // Add note if subject has lab component
          const displayName = hasLab(subject.subjectCode)
            ? `${subject.subjectName} (includes Lab)`
            : subject.subjectName;
          
          return (
            <div
              key={subject.subjectCode}
              className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-3">
                <p className="font-medium text-gray-900 dark:text-white">
                  {subject.subjectCode}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {displayName}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Classes Attended
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={data.attended}
                    onChange={(e) => handleInputChange(subject.subjectCode, 'attended', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Classes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={data.total}
                    onChange={(e) => handleInputChange(subject.subjectCode, 'total', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
              
              {data.total && (
                <div className="mt-2 text-right">
                  <span className={`text-sm font-semibold ${
                    percentage >= 75 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    Current: {percentage}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
              : message.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
          }`}
        >
          <p
            className={`text-sm ${
              message.type === 'success'
                ? 'text-green-800 dark:text-green-300'
                : message.type === 'warning'
                ? 'text-yellow-800 dark:text-yellow-300'
                : 'text-red-800 dark:text-red-300'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={isSaving}
        isLoading={isSaving}
        className="w-full"
      >
        Save Attendance
      </Button>
    </div>
  );
};
