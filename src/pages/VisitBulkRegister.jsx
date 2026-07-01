import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/sheetsApi.js'

const YEAR_OPTIONS = [2026, 2027, 2028, 2029, 2030]

function getDefaultYear() {
  const m = dayjs().month() + 1
  return m >= 3 ? dayjs().year() : dayjs().year() - 1
}

function getMonths(startYear) {
  return Array.from({ length: 12 }, (_, i) => {
    const m = (i + 3) > 12 ? (i + 3) - 12 : (i + 3)
    const y = m <= 2 ? startYear + 1 : startYear
    return { year: y, month: m, label: `${m}월`, key: `${y}-${String(m).padStart(2, '0')}` }
  })
}

// 학교명 매칭용 정규화: 공백/줄바꿈 모두 제거 (시트 간 표기 차이 흡수)
function normName(s) {
  return String(s == null ? '' : s).replace(/\s+/g, '')
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
}

export default function VisitBulkRegister() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [selectedYear, setSelectedYear] = useState(getDefaultYear)
  const MONTHS = useMemo(() => getMonths(selectedYear), [selectedYear])
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => dayjs().format('YYYY-MM'))

  const [schools, setSchools] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.techId) return
    setLoading(true)
    const start = `${selectedYear}-03-01`
    const end = `${selectedYear + 1}-02-28`
    Promise.all([
      api.getMySchools(user.techId, selectedYear),
      api.getMyVisits(user.techId, start, end),
    ])
      .then(([s, v]) => {
        setSchools(s)
        setVisits(v)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user?.techId, selectedYear])

  const managedSchools = useMemo(() =>
    schools
      .filter(s => s.contractType === '유지관리')
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  , [schools])

  const monthEntry = useMemo(() =>
    MONTHS.find(m => m.key === selectedMonthKey) || MONTHS[0]
  , [MONTHS, selectedMonthKey])

  const daysInMonth = useMemo(() =>
    monthEntry ? dayjs(`${monthEntry.year}-${String(monthEntry.month).padStart(2, '0')}-01`).daysInMonth() : 31
  , [monthEntry])

  // 선택한 연/월이 바뀌면, 그 달에 이미 등록된 방문이 있는 학교는 날짜를 미리 채워둠
  useEffect(() => {
    const next = {}
    managedSchools.forEach(school => {
      const existing = visits.find(v =>
        normName(v.schoolName) === normName(school.name) &&
        dayjs(v.visitDate).format('YYYY-MM') === selectedMonthKey
      )
      next[school.schoolId] = {
        day: existing ? String(dayjs(existing.visitDate).date()) : '',
        existingVisitId: existing?.visitId || null,
        existingDay: existing ? String(dayjs(existing.visitDate).date()) : '',
      }
    })
    setRows(next)
  }, [managedSchools, visits, selectedMonthKey])

  function updateDay(schoolId, value) {
    const n = value === '' ? '' : Math.min(daysInMonth, Math.max(1, Number(value) || 1))
    setRows(prev => ({ ...prev, [schoolId]: { ...prev[schoolId], day: String(n) } }))
  }

  async function handleBulkSave() {
    setSaving(true)
    setError('')
    try {
      const targets = managedSchools
        .map(school => ({ school, row: rows[school.schoolId] }))
        .filter(({ row }) => row && row.day && row.day !== row.existingDay)

      await Promise.all(targets.map(({ school, row }) => {
        const visitDate = `${monthEntry.year}-${String(monthEntry.month).padStart(2, '0')}-${String(row.day).padStart(2, '0')}`
        if (row.existingVisitId) {
          return api.updateVisit(row.existingVisitId, { visitDate })
        }
        return api.saveVisit({
          schoolId: school.schoolId,
          techId: user.techId,
          visitDate,
          visitTime: '',
          alertSetting: '끄기',
          visitType: '필터교체',
          workContent: '',
        })
      }))

      navigate('/managed')
    } catch (e) {
      setError('저장 실패: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 pb-4 pt-12 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">방문 일괄등록</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 py-4 space-y-4">
          <p className="text-xs text-gray-400">
            유지관리 학교의 이번 방문일을 한 번에 입력하세요. 이미 등록된 학교는 날짜를 바꾸면 수정됩니다. 방문유형·작업내용 등 나머지 정보는 관리계정 화면에서 각 방문을 눌러 나중에 채울 수 있습니다.
          </p>

          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-400 bg-white"
            >
              {YEAR_OPTIONS.map(y => (
                <option key={y} value={y}>{y}학년도</option>
              ))}
            </select>
            <select
              value={selectedMonthKey}
              onChange={e => setSelectedMonthKey(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-400 bg-white"
            >
              {MONTHS.map(m => (
                <option key={m.key} value={m.key}>{m.year}년 {m.label}</option>
              ))}
            </select>
          </div>

          {loading ? <Spinner /> : managedSchools.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <p className="text-sm">담당 유지관리 학교가 없습니다</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
              {managedSchools.map(school => {
                const row = rows[school.schoolId] || { day: '', existingVisitId: null }
                return (
                  <div key={school.schoolId} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="text-sm font-medium text-gray-800 truncate">{school.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={daysInMonth}
                        value={row.day}
                        onChange={e => updateDay(school.schoolId, e.target.value)}
                        placeholder="일"
                        className="w-16 text-center border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                      />
                      <span className="text-xs text-gray-400">일</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 p-4 pb-safe z-30">
        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}
        <button
          onClick={handleBulkSave}
          disabled={saving || loading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base
            hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '저장중...' : '일괄저장'}
        </button>
      </div>
    </div>
  )
}
