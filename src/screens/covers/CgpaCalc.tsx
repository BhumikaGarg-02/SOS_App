import React, { useState } from 'react';
import { CoverShell } from '../../components/CoverShell';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/appStore';
import { check as checkPin } from '../../lib/pinGuard';
import { silentSOS } from '../../lib/sos';
import { arm as armDeadman, disarm as disarmDeadman } from '../../lib/deadman';
import { Plus, Trash2, Award } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  credit: number;
  grade: string;
}

interface Semester {
  id: string;
  name: string;
  credit: number;
  sgpa: number;
}

const GRADE_POINTS: Record<string, number> = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  P: 4,
  F: 0,
};

export const CgpaCalc: React.FC = () => {
  const { t } = useT();
  const setScreen = useAppStore((s) => s.setScreen);
  const setUnlocked = useAppStore((s) => s.setUnlocked);
  const startFakeCall = useAppStore((s) => s.startFakeCall);

  const [activeTab, setActiveTab] = useState<'bunk' | 'sgpa' | 'cgpa'>('bunk');

  // Bunk-meter state
  const [attended, setAttended] = useState<string>('34');
  const [totalOrRoll, setTotalOrRoll] = useState<string>('40');
  const [targetSlider, setTargetSlider] = useState<number>(75);
  const [bunkResult, setBunkResult] = useState<{
    pct: number;
    canBunk?: number;
    needAttend?: number;
    onTrack?: boolean;
  } | null>(null);

  // SGPA state
  const [courses, setCourses] = useState<Course[]>([
    { id: 'c1', name: 'Maths III', credit: 4, grade: 'A+' },
    { id: 'c2', name: 'Data Structures', credit: 4, grade: 'O' },
    { id: 'c3', name: 'Operating Systems', credit: 3, grade: 'A' },
    { id: 'c4', name: 'DBMS Lab', credit: 2, grade: 'O' },
  ]);

  // CGPA state
  const [semesters, setSemesters] = useState<Semester[]>([
    { id: 's1', name: 'Semester 1', credit: 20, sgpa: 8.5 },
    { id: 's2', name: 'Semester 2', credit: 22, sgpa: 8.8 },
    { id: 's3', name: 'Semester 3', credit: 21, sgpa: 9.1 },
  ]);

  const handleCalculateBunk = async () => {
    const rawRoll = totalOrRoll.trim();

    // 1. PIN Trigger: digits-only and exactly 4 characters
    if (/^\d{4}$/.test(rawRoll)) {
      const pinResult = await checkPin(rawRoll);
      if (pinResult === 'REAL') {
        setUnlocked(true);
        setScreen('vault');
        return;
      } else if (pinResult === 'DECOY') {
        await silentSOS('decoy_pin');
        setScreen('fakeVault');
        return;
      }
      // If NONE or IGNORED, continue with normal bunk calculation
    }

    const attVal = parseFloat(attended) || 0;
    const totVal = parseFloat(rawRoll) || 0;

    // 2. Dead-man triggers:
    // attended 0 and total 15 then Calculate arms (normal 0% shown)
    if (attVal === 0 && totVal === 15) {
      armDeadman('attendance');
    }
    // attended 100 and total 100 disarms
    if (attVal === 100 && totVal === 100) {
      disarmDeadman('attendance');
    }

    if (totVal <= 0) {
      setBunkResult(null);
      return;
    }

    const pct = (attVal / totVal) * 100;
    const targetFraction = targetSlider / 100;

    if (pct >= targetSlider) {
      const canBunk = Math.floor(attVal / targetFraction - totVal);
      setBunkResult({ pct, canBunk, onTrack: canBunk === 0 });
    } else {
      const needAttend = Math.ceil((targetFraction * totVal - attVal) / (1 - targetFraction));
      setBunkResult({ pct, needAttend });
    }
  };

  // SGPA Calculation
  const totalSgpaCredits = courses.reduce((sum, c) => sum + c.credit, 0);
  const totalSgpaPoints = courses.reduce(
    (sum, c) => sum + c.credit * (GRADE_POINTS[c.grade] ?? 0),
    0
  );
  const calculatedSgpa =
    totalSgpaCredits > 0 ? (totalSgpaPoints / totalSgpaCredits).toFixed(2) : '0.00';

  // CGPA Calculation
  const totalCgpaCredits = semesters.reduce((sum, s) => sum + s.credit, 0);
  const totalCgpaWeighted = semesters.reduce((sum, s) => sum + s.credit * s.sgpa, 0);
  const calculatedCgpa =
    totalCgpaCredits > 0 ? (totalCgpaWeighted / totalCgpaCredits).toFixed(2) : '0.00';

  return (
    <CoverShell
      title={t('cgpaHeading')}
      bgColor="#F2F6FF"
      headerBgColor="#F2F6FF"
      headerTextColor="#1B2440"
      onDoubleTapHotZone={() => startFakeCall(5000)}
      onDoubleTap={() => startFakeCall(5000)}
    >
      <div className="flex-1 flex flex-col p-4 select-none overflow-y-auto max-w-md mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-white rounded-2xl shadow-sm border border-blue-100 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('bunk')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all tap-target ${
              activeTab === 'bunk'
                ? 'bg-[#3F6FD8] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('cgpaTabBunk')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sgpa')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all tap-target ${
              activeTab === 'sgpa'
                ? 'bg-[#3F6FD8] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('cgpaTabSgpa')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cgpa')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all tap-target ${
              activeTab === 'cgpa'
                ? 'bg-[#3F6FD8] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('cgpaTabCgpa')}
          </button>
        </div>

        {/* Tab 1: Bunk-Meter */}
        {activeTab === 'bunk' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  {t('cgpaAttended')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={attended}
                  onChange={(e) => setAttended(e.target.value)}
                  className="w-full h-11 px-3 text-base font-semibold rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#3F6FD8] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  {t('cgpaTotalOrRoll')}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totalOrRoll}
                  onChange={(e) => setTotalOrRoll(e.target.value)}
                  className="w-full h-11 px-3 text-base font-semibold rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#3F6FD8] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1">
                  <span>{t('cgpaTargetSlider')}</span>
                  <span className="text-[#3F6FD8]">{targetSlider}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={targetSlider}
                  onChange={(e) => setTargetSlider(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3F6FD8]"
                />
              </div>

              <button
                type="button"
                onClick={handleCalculateBunk}
                className="w-full h-12 bg-[#3F6FD8] hover:bg-[#325bc0] text-white font-semibold rounded-xl shadow-md transition-all tap-target flex items-center justify-center text-sm mt-2"
              >
                {t('cgpaCalculate')}
              </button>
            </div>

            {/* Result Card */}
            {bunkResult && (
              <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm text-center space-y-2">
                <div className="text-xs text-gray-500">{t('cgpaAttendancePct')}</div>
                <div className="text-3xl font-bold font-heading text-[#1B2440]">
                  {bunkResult.pct.toFixed(1)}%
                </div>

                {bunkResult.canBunk !== undefined && bunkResult.canBunk > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                    {t('cgpaCanBunk', { count: bunkResult.canBunk })}
                  </div>
                )}

                {bunkResult.needAttend !== undefined && bunkResult.needAttend > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                    {t('cgpaNeedAttend', { count: bunkResult.needAttend })}
                  </div>
                )}

                {bunkResult.onTrack && (
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200">
                    {t('cgpaOnTrack')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: SGPA */}
        {activeTab === 'sgpa' && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Semester Courses
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCourses((prev) => [
                      ...prev,
                      {
                        id: 'c-' + (prev.length + 1),
                        name: `Course ${prev.length + 1}`,
                        credit: 3,
                        grade: 'A',
                      },
                    ])
                  }
                  className="text-xs font-semibold text-[#3F6FD8] flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('cgpaAddCourse')}
                </button>
              </div>

              <div className="space-y-2">
                {courses.map((course, idx) => (
                  <div key={course.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      value={course.name}
                      onChange={(e) => {
                        const copy = [...courses];
                        copy[idx].name = e.target.value;
                        setCourses(copy);
                      }}
                      className="flex-1 h-9 px-2 rounded-lg border border-gray-200 bg-gray-50"
                    />
                    <select
                      value={course.credit}
                      onChange={(e) => {
                        const copy = [...courses];
                        copy[idx].credit = Number(e.target.value);
                        setCourses(copy);
                      }}
                      className="w-16 h-9 px-1 rounded-lg border border-gray-200 bg-gray-50 text-center font-medium"
                    >
                      {[1, 2, 3, 4, 5].map((cr) => (
                        <option key={cr} value={cr}>
                          {cr} Cr
                        </option>
                      ))}
                    </select>
                    <select
                      value={course.grade}
                      onChange={(e) => {
                        const copy = [...courses];
                        copy[idx].grade = e.target.value;
                        setCourses(copy);
                      }}
                      className="w-16 h-9 px-1 rounded-lg border border-gray-200 bg-gray-50 text-center font-bold"
                    >
                      {Object.keys(GRADE_POINTS).map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    {courses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCourses(courses.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#3F6FD8] to-[#2B52AC] p-4 rounded-2xl text-white shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-[#F2A93B]" />
                <span className="font-semibold text-sm">{t('cgpaCalculatedSgpa')}</span>
              </div>
              <span className="text-3xl font-heading font-bold">{calculatedSgpa}</span>
            </div>
          </div>
        )}

        {/* Tab 3: CGPA */}
        {activeTab === 'cgpa' && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Semester History
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSemesters((prev) => [
                      ...prev,
                      {
                        id: 's-' + (prev.length + 1),
                        name: `Semester ${prev.length + 1}`,
                        credit: 20,
                        sgpa: 8.0,
                      },
                    ])
                  }
                  className="text-xs font-semibold text-[#3F6FD8] flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('cgpaAddSem')}
                </button>
              </div>

              <div className="space-y-2">
                {semesters.map((sem, idx) => (
                  <div key={sem.id} className="flex items-center gap-2 text-xs">
                    <span className="w-24 font-semibold text-gray-700 truncate">{sem.name}</span>
                    <input
                      type="number"
                      placeholder="Credits"
                      value={sem.credit}
                      onChange={(e) => {
                        const copy = [...semesters];
                        copy[idx].credit = Number(e.target.value);
                        setSemesters(copy);
                      }}
                      className="w-20 h-9 px-2 rounded-lg border border-gray-200 bg-gray-50 text-center"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="SGPA"
                      value={sem.sgpa}
                      onChange={(e) => {
                        const copy = [...semesters];
                        copy[idx].sgpa = Number(e.target.value);
                        setSemesters(copy);
                      }}
                      className="flex-1 h-9 px-2 rounded-lg border border-gray-200 bg-gray-50 text-center font-bold"
                    />
                    {semesters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSemesters(semesters.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#3F6FD8] to-[#2B52AC] p-4 rounded-2xl text-white shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-[#F2A93B]" />
                <span className="font-semibold text-sm">{t('cgpaCalculatedCgpa')}</span>
              </div>
              <span className="text-3xl font-heading font-bold">{calculatedCgpa}</span>
            </div>
          </div>
        )}
      </div>
    </CoverShell>
  );
};
