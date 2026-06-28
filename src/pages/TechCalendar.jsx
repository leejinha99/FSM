import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { api } from '../api/sheetsApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const VISIT_TYPE_DOT = {
  '필터교체': 'bg-blue-500',
  'AS': 'bg-red-500',
  'AS접수': 'bg-orange-500',
  '점검': 'bg-green-500',
  '설치': 'bg-purple-500',
}

const VISIT_TYPE_BADGE = {
  '필터교체': 'bg-blue-100 text-blue-700',
  'AS': 'bg-red-100 text-red-700',
  'AS접수': 'bg-orange-100 text-orange-700',
  '점검': 'bg-green-100 text-green-700',
  '설치': 'bg-purple-100 text-purple-700',
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// ─── 방문 카드 ──────────────────────────────────────────────────────────────

function VisitCard({ visit, compact = false, onEdit }) {
  const isAS = visit.isAS
  const statusStyle = visit.status === '완료'
    ? 'border-l-gray-300 bg-gray-50'
    : isAS ? 'border-l-orange-500 bg-white' : 'border-l-blue-500 bg-white'

  return (
    <div
      className={`border-l-4 ${statusStyle} rounded-r-lg p-3 shadow-sm active:opacity-70 transition-opacity cursor-pointer`}
      onClick={() => onEdit && onEdit(visit)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-500 text-xs font-medium shrink-0">{visit.visitDate} {visit.visitTime}</span>
          <span className="font-semibold text-gray-800 text-sm truncate">{visit.schoolName}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${VISIT_TYPE_BADGE[visit.visitType] || 'bg-gray-100 text-gray-600'}`}>
          {visit.visitType}
        </span>
      </div>
      {!compact && visit.workContent && (
        <p className="text-gray-500 text-xs mt-1.5 truncate">{visit.workContent}</p>
      )}
      {visit.status === '완료' && (
        <span className="inline-block text-xs text-gray-400 mt-1">완료됨</span>
      )}
    </div>
  )
}

// ─── 월간 뷰 ────────────────────────────────────────────────────────────────

function MonthView({ currentDate, visitsByDate, selectedDate, onSelectDate }) {
  const gridStart = currentDate.startOf('month').startOf('week')
  const cells = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'))
  const todayStr = dayjs().format('YYYY-MM-DD')

  return (
    <div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className={`text-center py-2 text-xs font-medium
            ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 셀 */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const dateStr = day.format('YYYY-MM-DD')
          const isCurrentMonth = day.month() === currentDate.month()
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate?.format('YYYY-MM-DD')
          const dayVisits = visitsByDate[dateStr] || []
          const col = i % 7

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(day)}
              className={`min-h-[3.5rem] px-1 pt-1 pb-1.5 flex flex-col items-center border-b border-gray-100
                ${isSelected && !isToday ? 'bg-blue-50' : ''}
                ${!isCurrentMonth ? 'opacity-35' : ''}
                active:bg-gray-100 transition-colors`}
            >
              <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm leading-none
                ${isToday ? 'bg-blue-600 text-white font-bold' : ''}
                ${col === 0 && !isToday ? 'text-red-500' : ''}
                ${col === 6 && !isToday ? 'text-blue-500' : ''}
                ${!isToday && col !== 0 && col !== 6 ? 'text-gray-800' : ''}`}>
                {day.date()}
              </span>

              {/* 방문 점 */}
              {dayVisits.length > 0 && (
                <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
                  {dayVisits.slice(0, 3).map(v => (
                    <span key={v.visitId}
                      className={`w-1.5 h-1.5 rounded-full ${VISIT_TYPE_DOT[v.visitType] || 'bg-gray-400'}`} />
                  ))}
                  {dayVisits.length > 3 && (
                    <span className="text-gray-400 leading-none" style={{ fontSize: '8px' }}>+{dayVisits.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── 주간 뷰 ────────────────────────────────────────────────────────────────

function WeekView({ currentDate, visitsByDate, onEdit }) {
  const weekStart = currentDate.startOf('week')
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))
  const todayStr = dayjs().format('YYYY-MM-DD')

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 px-3 py-3 min-w-max">
        {days.map((day, i) => {
          const dateStr = day.format('YYYY-MM-DD')
          const dayVisits = (visitsByDate[dateStr] || [])
            .slice().sort((a, b) => a.visitTime.localeCompare(b.visitTime))
          const isToday = dateStr === todayStr

          return (
            <div key={dateStr} className="w-36 flex-shrink-0">
              <div className={`text-center py-2 rounded-t-xl text-sm
                ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                <div className={`text-xs ${isToday ? 'text-blue-100' : i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
                  {DAY_LABELS[i]}
                </div>
                <div className="font-bold text-base">{day.date()}</div>
              </div>

              <div className="bg-gray-50 rounded-b-xl min-h-[7rem] p-1.5 space-y-1.5">
                {dayVisits.length === 0 ? (
                  <p className="text-center text-gray-300 text-xs mt-3">-</p>
                ) : (
                  dayVisits.map(v => (
                    <div key={v.visitId}
                      onClick={() => onEdit && onEdit(v)}
                      className={`text-xs p-2 rounded-lg bg-white shadow-sm border-l-2 cursor-pointer active:opacity-70 transition-opacity ${
                        v.visitType === 'AS' ? 'border-red-400' :
                        v.visitType === 'AS접수' ? 'border-orange-400' :
                        v.visitType === '점검' ? 'border-green-400' :
                        v.visitType === '설치' ? 'border-purple-400' : 'border-blue-400'
                      }`}>
                      <div className="font-semibold text-gray-800 truncate">{v.schoolName}</div>
                      <div className="text-gray-500">{v.visitTime}</div>
                      <div className={`mt-0.5 text-xs ${VISIT_TYPE_BADGE[v.visitType]?.split(' ')[1] || 'text-gray-500'}`}>
                        {v.visitType}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── 목록 뷰 ────────────────────────────────────────────────────────────────

function ListView({ visitsByDate, currentDate, onEdit }) {
  const todayStr = dayjs().format('YYYY-MM-DD')

  const sortedDates = Object.keys(visitsByDate)
    .filter(d => d >= todayStr)
    .sort()

  if (sortedDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">예정된 방문이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 space-y-5">
      {sortedDates.map(dateStr => {
        const day = dayjs(dateStr)
        const visits = visitsByDate[dateStr].slice().sort((a, b) => a.visitTime.localeCompare(b.visitTime))

        return (
          <div key={dateStr}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-bold ${dateStr === todayStr ? 'text-blue-600' : 'text-gray-700'}`}>
                {day.format('M월 D일')} ({DAY_LABELS[day.day()]})
              </span>
              {dateStr === todayStr && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">오늘</span>
              )}
              <span className="text-xs text-gray-400">{visits.length}건</span>
            </div>
            <div className="space-y-2">
              {visits.map(v => <VisitCard key={v.visitId} visit={v} onEdit={onEdit} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── AS 접수 등록 모달 (기사용) — 관리자 양식과 동일한 구조 ──────────────────

const AS_MODAL_INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white'

function TechCreateASModal({ user, onSave, onClose }) {
  const [contractType, setContractType] = useState('')
  const [region, setRegion] = useState('')
  const [form, setForm] = useState({
    schoolId: '',
    schoolNameManual: '',
    reportedDate: dayjs().format('YYYY-MM-DD'),
    symptom: '',
    note: '',
    location: '',
    model: '',
  })
  const [schools, setSchools] = useState([])
  const [equipment, setEquipment] = useState([])
  const [eqLoading, setEqLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [productNames, setProductNames] = useState([])
  const [productCategory, setProductCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isContract = contractType === '계약'

  useEffect(() => {
    Promise.all([
      api.getMySchools(user.techId),
      api.getProductNames(),
    ])
      .then(([s, pn]) => { setSchools(s); setProductNames(pn) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user.techId])

  const pnCategories = useMemo(() => [...new Set(productNames.map(p => p.category))], [productNames])

  const regions = useMemo(() => {
    const set = new Set(schools.filter(s => s.contractType === '유지관리').map(s => s.region).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
  }, [schools])

  const schoolsByRegion = useMemo(() => {
    if (!region) return []
    return schools
      .filter(s => s.region === region && s.contractType === '유지관리')
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [schools, region])

  const locations = useMemo(() => [...new Set(equipment.map(e => e.location).filter(Boolean))], [equipment])

  const models = useMemo(() => {
    if (!form.location) return []
    return equipment.filter(e => e.location === form.location).map(e => e.model)
  }, [equipment, form.location])

  function update(patch) { setForm(f => ({ ...f, ...patch })) }

  function handleContractTypeChange(ct) {
    setContractType(ct)
    setRegion('')
    setEquipment([])
    setProductCategory('')
    setForm(f => ({ ...f, schoolId: '', schoolNameManual: '', location: '', model: '' }))
  }

  function handleRegionChange(r) {
    setRegion(r)
    setEquipment([])
    update({ schoolId: '', location: '', model: '' })
  }

  async function handleSchoolChange(schoolId) {
    update({ schoolId, location: '', model: '' })
    if (schoolId) {
      setEqLoading(true)
      try {
        const eq = await api.getEquipment(schoolId)
        setEquipment(eq)
      } catch (e) {
        console.error(e)
      } finally {
        setEqLoading(false)
      }
    } else {
      setEquipment([])
    }
  }

  async function handleSubmit() {
    if (!contractType) return setError('계약구분을 선택해주세요.')
    if (isContract && !form.schoolId) return setError('학교를 선택해주세요.')
    if (!isContract && !form.schoolNameManual.trim()) return setError('학교명을 입력해주세요.')
    if (!form.symptom.trim()) return setError('증상을 입력해주세요.')
    setSaving(true)
    setError('')
    try {
      await api.createAS({ ...form, contractType, assignedTechId: user.techId })
      onSave()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">AS 접수 등록</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 1. 계약구분 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">계약구분 <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {['계약', '미계약'].map(ct => (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => handleContractTypeChange(ct)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition
                      ${contractType === ct
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 active:bg-gray-50'}`}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 지역 (계약 학교만) */}
            {contractType && isContract && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">지역 <span className="text-red-500">*</span></label>
                <select value={region} onChange={e => handleRegionChange(e.target.value)} className={AS_MODAL_INPUT}>
                  <option value="">지역 선택</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            {/* 3. 학교명 */}
            {contractType && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">학교명 <span className="text-red-500">*</span></label>
                {isContract ? (
                  <select
                    value={form.schoolId}
                    onChange={e => handleSchoolChange(e.target.value)}
                    className={AS_MODAL_INPUT}
                    disabled={!region}
                  >
                    <option value="">{region ? '학교 선택' : '지역을 먼저 선택하세요'}</option>
                    {schoolsByRegion.map(s => <option key={s.schoolId} value={s.schoolId}>{s.name}</option>)}
                  </select>
                ) : (
                  <input
                    value={form.schoolNameManual}
                    onChange={e => update({ schoolNameManual: e.target.value })}
                    className={AS_MODAL_INPUT}
                    placeholder="학교명 직접 입력"
                  />
                )}
              </div>
            )}

            {/* 4. 설치위치 */}
            {contractType && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">설치위치</label>
                {isContract ? (
                  eqLoading ? (
                    <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-400">장비 불러오는 중...</div>
                  ) : (
                    <select
                      value={form.location}
                      onChange={e => update({ location: e.target.value, model: '' })}
                      className={AS_MODAL_INPUT}
                      disabled={!form.schoolId}
                    >
                      <option value="">{form.schoolId ? (locations.length ? '설치위치 선택' : '등록된 장비 없음') : '학교를 먼저 선택하세요'}</option>
                      {locations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  )
                ) : (
                  <input
                    value={form.location}
                    onChange={e => update({ location: e.target.value })}
                    className={AS_MODAL_INPUT}
                    placeholder="설치위치 직접 입력"
                  />
                )}
              </div>
            )}

            {/* 5. 모델명 */}
            {contractType && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">모델명</label>
                {isContract ? (
                  <select
                    value={form.model}
                    onChange={e => update({ model: e.target.value })}
                    className={AS_MODAL_INPUT}
                    disabled={!form.location}
                  >
                    <option value="">{form.location ? '모델 선택' : '설치위치를 먼저 선택하세요'}</option>
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={productCategory}
                      onChange={e => { setProductCategory(e.target.value); update({ model: '' }) }}
                      className={AS_MODAL_INPUT}
                    >
                      <option value="">품목 선택</option>
                      {pnCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                      value={form.model}
                      onChange={e => update({ model: e.target.value })}
                      className={AS_MODAL_INPUT}
                      disabled={!productCategory}
                    >
                      <option value="">{productCategory ? '제품명 선택' : '품목을 먼저 선택하세요'}</option>
                      {productNames.filter(p => p.category === productCategory).map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* 6. 접수일 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">접수일</label>
              <input type="date" value={form.reportedDate} onChange={e => update({ reportedDate: e.target.value })} className={AS_MODAL_INPUT} />
            </div>

            {/* 7. 증상 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">증상 <span className="text-red-500">*</span></label>
              <textarea
                value={form.symptom}
                onChange={e => update({ symptom: e.target.value })}
                className={AS_MODAL_INPUT}
                rows={3}
                placeholder="증상을 입력하세요"
              />
            </div>

            {/* 8. 메모 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">메모</label>
              <textarea
                value={form.note}
                onChange={e => update({ note: e.target.value })}
                className={AS_MODAL_INPUT}
                rows={2}
                placeholder="메모 (선택사항)"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving || loading}
          className="mt-5 w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 active:bg-blue-700 transition"
        >
          {saving ? '저장 중...' : 'AS 접수 등록'}
        </button>
      </div>
    </div>
  )
}

// ─── 당일 방문 패널 ─────────────────────────────────────────────────────────

function DayPanel({ date, visits, onEdit }) {
  const dayLabel = date ? `${date.format('M월 D일')} (${DAY_LABELS[date.day()]})` : ''
  const sorted = (visits || []).slice().sort((a, b) => a.visitTime.localeCompare(b.visitTime))

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{dayLabel}</span>
        <span className="text-xs text-gray-400">{sorted.length}건</span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-5">일정이 없습니다</p>
      ) : (
        <div className="px-4 pb-3 space-y-2 max-h-64 overflow-y-auto">
          {sorted.map(v => <VisitCard key={v.visitId} visit={v} onEdit={onEdit} />)}
        </div>
      )}
    </div>
  )
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

function ASummaryCard({ label, value, bgColor, textColor, borderColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 ${bgColor} rounded-2xl p-3 border ${borderColor} text-center active:scale-95 transition-transform`}
    >
      <p className={`text-xs font-medium ${textColor} mb-0.5`}>{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </button>
  )
}

export default function TechCalendar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [viewMode, setViewMode] = useState('month')
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [visits, setVisits] = useState([])
  const [asTickets, setAsTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateAS, setShowCreateAS] = useState(false)

  const visitsByDate = useMemo(() => {
    return visits.reduce((acc, v) => {
      if (!acc[v.visitDate]) acc[v.visitDate] = []
      acc[v.visitDate].push(v)
      return acc
    }, {})
  }, [visits])

  const fetchVisits = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')

    let start, end
    if (viewMode === 'week') {
      start = currentDate.startOf('week').format('YYYY-MM-DD')
      end = currentDate.endOf('week').format('YYYY-MM-DD')
    } else {
      start = currentDate.startOf('month').subtract(7, 'day').format('YYYY-MM-DD')
      end = currentDate.endOf('month').add(7, 'day').format('YYYY-MM-DD')
    }

    try {
      const [visitsData, asData] = await Promise.all([
        api.getMyVisits(user.techId, start, end),
        api.getMyAS(user.techId),
      ])
      setAsTickets(asData)
      const asEvents = asData
        .filter(a => a.reportedDate >= start && a.reportedDate <= end)
        .map(a => ({
          visitId: a.asId,
          visitDate: a.reportedDate,
          visitTime: '',
          schoolName: a.schoolName,
          visitType: 'AS접수',
          workContent: a.symptom,
          status: a.status,
          isAS: true,
        }))
      setVisits([...visitsData, ...asEvents])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, currentDate, viewMode])

  useEffect(() => {
    fetchVisits()
  }, [fetchVisits])

  function handleEditVisit(visit) {
    navigate('/visit/edit/' + visit.visitId, { state: { visit } })
  }

  function goBack() {
    if (viewMode === 'week') {
      setCurrentDate(d => d.subtract(1, 'week'))
    } else {
      setCurrentDate(d => d.subtract(1, 'month'))
    }
  }

  function goForward() {
    if (viewMode === 'week') {
      setCurrentDate(d => d.add(1, 'week'))
    } else {
      setCurrentDate(d => d.add(1, 'month'))
    }
  }

  function goToday() {
    setCurrentDate(dayjs())
    setSelectedDate(dayjs())
  }

  function getHeaderTitle() {
    if (viewMode === 'week') {
      const ws = currentDate.startOf('week')
      const we = currentDate.endOf('week')
      if (ws.month() === we.month()) return ws.format('YYYY년 M월')
      return `${ws.format('M')}~${we.format('M월')}`
    }
    return currentDate.format('YYYY년 M월')
  }

  const selectedVisits = visitsByDate[selectedDate?.format('YYYY-MM-DD')] || []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 pt-12 md:pt-4 pb-0 sticky top-0 z-30">
        {/* 모바일 전용: 유저 정보 + 로그아웃 */}
        <div className="md:hidden flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{user?.name} 기사</h1>
            <p className="text-xs text-gray-400">내 방문 일정</p>
          </div>
          <button onClick={logout} className="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 rounded-full">
            로그아웃
          </button>
        </div>
        {/* 데스크탑 전용: 페이지 타이틀 */}
        <div className="hidden md:flex items-center mb-3">
          <h1 className="text-lg font-bold text-gray-900">방문 일정</h1>
        </div>

        {/* 뷰 탭 */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-3">
          {[['month', '월간'], ['week', '주간'], ['list', '목록']].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all
                ${viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 네비게이션 (목록 뷰 제외) */}
        {viewMode !== 'list' && (
          <div className="flex items-center justify-between pb-3">
            <button onClick={goBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-800">{getHeaderTitle()}</span>
              <button onClick={goToday}
                className="text-xs text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                오늘
              </button>
            </div>

            <button onClick={goForward}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </header>

      {/* 에러 */}
      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchVisits} className="text-red-600 font-medium ml-2">재시도</button>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-8">
          <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* 뷰 콘텐츠 */}
      {!loading && (
        <div className="flex-1 overflow-y-auto pb-28 md:pb-8">
          {/* ── AS 현황 섹션 ─────────────────────────────────── */}
          <div className="px-4 pt-3 pb-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">내 AS 현황</h3>
              <button onClick={() => navigate('/as')} className="text-xs text-blue-600">전체 보기</button>
            </div>
            <div className="flex gap-2">
              {(() => {
                const monthPrefix = currentDate.format('YYYY-MM')
                const monthly = asTickets.filter(a => a.reportedDate.startsWith(monthPrefix))
                return (
                  <>
                    <ASummaryCard
                      label="접수"
                      value={monthly.filter(a => a.status === '접수').length}
                      bgColor="bg-yellow-50"
                      textColor="text-yellow-700"
                      borderColor="border-yellow-100"
                      onClick={() => navigate('/as')}
                    />
                    <ASummaryCard
                      label="처리중"
                      value={monthly.filter(a => a.status === '처리중').length}
                      bgColor="bg-orange-50"
                      textColor="text-orange-600"
                      borderColor="border-orange-100"
                      onClick={() => navigate('/as')}
                    />
                    <ASummaryCard
                      label="완료"
                      value={monthly.filter(a => a.status === '완료').length}
                      bgColor="bg-green-50"
                      textColor="text-green-700"
                      borderColor="border-green-100"
                      onClick={() => navigate('/as')}
                    />
                  </>
                )
              })()}
            </div>
          </div>

          {/* ── 구분선 ─────────────────────────────────────── */}
          <div className="h-2 bg-gray-100 border-y border-gray-200" />

          {/* ── 캘린더 섹션 ──────────────────────────────────── */}
          {viewMode === 'month' && (
            <>
              <MonthView
                currentDate={currentDate}
                visitsByDate={visitsByDate}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
              {/* ── 구분선 ─────────────────────────────────── */}
              <div className="h-2 bg-gray-100 border-y border-gray-200" />
              {/* ── 선택한 날짜의 AS 목록 ─────────────────── */}
              <DayPanel date={selectedDate} visits={selectedVisits} onEdit={handleEditVisit} />
            </>
          )}
          {viewMode === 'week' && (
            <WeekView currentDate={currentDate} visitsByDate={visitsByDate} onEdit={handleEditVisit} />
          )}
          {viewMode === 'list' && (
            <ListView visitsByDate={visitsByDate} currentDate={currentDate} onEdit={handleEditVisit} />
          )}
        </div>
      )}

      {/* 방문/AS 등록 버튼 */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
        <button
          onClick={() => setShowCreateAS(true)}
          className="flex items-center gap-1.5 bg-white text-orange-600 border border-orange-400 px-4 py-2.5 rounded-full shadow-md text-sm font-semibold active:bg-orange-50 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          AS접수등록
        </button>
        <button
          onClick={() => navigate('/visit/new')}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-semibold active:bg-blue-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          방문등록
        </button>
      </div>

      {showCreateAS && (
        <TechCreateASModal
          user={user}
          onSave={() => { setShowCreateAS(false); fetchVisits() }}
          onClose={() => setShowCreateAS(false)}
        />
      )}

    </div>
  )
}
