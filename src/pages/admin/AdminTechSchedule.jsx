import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { api } from '../../api/sheetsApi.js'

// 학교명 매칭용 정규화: 공백/줄바꿈 제거
function normName(s) {
  return String(s == null ? '' : s).replace(/\s+/g, '')
}

const YEAR_OPTIONS = [2025, 2026, 2027, 2028, 2029, 2030]
const VIEW_MODES = ['기사별', '지역별', '일별']
const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

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

function CloseBtn({ onClick }) {
  return (
    <button onClick={onClick} className="text-gray-400 hover:text-gray-600 p-1 -mr-1">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-gray-400 w-20 flex-shrink-0">{label}</span>
      <span className="text-gray-700 flex-1 break-all">{value}</span>
    </div>
  )
}

function SchoolMatrix({ schools, visitMap, MONTHS, onSchoolClick, onCellClick }) {
  return (
    <div className="overflow-x-auto -mx-4">
      <table className="min-w-max text-xs border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 bg-blue-600 text-white border border-blue-500 px-3 py-2.5 text-left font-semibold min-w-[120px] max-w-[160px]">
              학교명
            </th>
            {MONTHS.map(m => (
              <th key={m.key}
                className={`border border-gray-200 px-2 py-2.5 text-center font-semibold min-w-[52px]
                  ${m.key === dayjs().format('YYYY-MM') ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}
              >
                {m.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schools.map((school, idx) => (
            <tr key={school.schoolId}>
              <td
                className={`sticky left-0 z-10 border border-gray-200 px-3 py-2.5 font-medium text-blue-700 truncate max-w-[160px] cursor-pointer hover:bg-blue-50 transition
                  ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                onClick={() => onSchoolClick(school)}
              >
                {school.name}
              </td>
              {MONTHS.map(m => {
                const cellVisits = visitMap[normName(school.name)]?.[m.key] || []
                const isCurrentMonth = m.key === dayjs().format('YYYY-MM')
                return (
                  <td
                    key={m.key}
                    className={`border border-gray-200 px-2 py-2.5 text-center cursor-pointer hover:bg-blue-50 transition
                      ${isCurrentMonth ? 'bg-blue-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    onClick={() => onCellClick({ school, monthKey: m.key, label: m.label, visits: cellVisits })}
                  >
                    {cellVisits.length > 0 ? (
                      <span className="text-blue-700 font-medium">
                        {cellVisits.map(v => dayjs(v.visitDate).date() + '일').join(', ')}
                      </span>
                    ) : (
                      <span className="text-gray-200">-</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminTechSchedule() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialTechId = new URLSearchParams(location.search).get('techId') || ''

  const [viewMode, setViewMode] = useState('기사별')
  const [selectedYear, setSelectedYear] = useState(getDefaultYear)
  const [techs, setTechs] = useState([])
  const [schools, setSchools] = useState([])
  const [selectedTechId, setSelectedTechId] = useState(initialTechId)
  const [selectedRegion, setSelectedRegion] = useState('')
  const [visits, setVisits] = useState([])
  const [allVisits, setAllVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [visitLoading, setVisitLoading] = useState(false)
  const [allVisitsLoading, setAllVisitsLoading] = useState(false)

  const [schoolModal, setSchoolModal] = useState(null)
  const [equipment, setEquipment] = useState([])
  const [equipLoading, setEquipLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteEditing, setNoteEditing] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const [visitModal, setVisitModal] = useState(null)
  const [dayFilterMonth, setDayFilterMonth] = useState('')
  const [dayFilterDay, setDayFilterDay] = useState('')

  const MONTHS = useMemo(() => getMonths(selectedYear), [selectedYear])

  const regions = useMemo(() => {
    const set = new Set(schools.map(s => s.region).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
  }, [schools])

  useEffect(() => {
    async function load() {
      try {
        const [t, s] = await Promise.all([api.getAllTechs(), api.getAllSchools()])
        setTechs(t.filter(t => t.role === '기사' && t.active))
        setSchools(s)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (viewMode !== '기사별') return
    if (!selectedTechId) { setVisits([]); return }
    const start = `${selectedYear}-03-01`
    const end = `${selectedYear + 1}-02-28`
    setVisitLoading(true)
    api.getAllVisits(start, end, selectedTechId)
      .then(setVisits)
      .catch(console.error)
      .finally(() => setVisitLoading(false))
  }, [selectedTechId, selectedYear, viewMode])

  useEffect(() => {
    if (viewMode === '기사별') return
    const start = `${selectedYear}-03-01`
    const end = `${selectedYear + 1}-02-28`
    setAllVisitsLoading(true)
    api.getAllVisits(start, end, null)
      .then(setAllVisits)
      .catch(console.error)
      .finally(() => setAllVisitsLoading(false))
  }, [viewMode, selectedYear])

  const managedSchools = useMemo(() => {
    return schools
      .filter(s => s.techId === selectedTechId && s.contractType === '유지관리')
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [schools, selectedTechId])

  const regionSchools = useMemo(() => {
    if (!selectedRegion) return []
    return schools
      .filter(s => s.region === selectedRegion && s.contractType === '유지관리')
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [schools, selectedRegion])

  const visitMap = useMemo(() => {
    const map = {}
    visits.forEach(v => {
      const mk = dayjs(v.visitDate).format('YYYY-MM')
      const sk = normName(v.schoolName)
      if (!map[sk]) map[sk] = {}
      if (!map[sk][mk]) map[sk][mk] = []
      map[sk][mk].push(v)
    })
    return map
  }, [visits])

  const allVisitMap = useMemo(() => {
    const map = {}
    allVisits.forEach(v => {
      const mk = dayjs(v.visitDate).format('YYYY-MM')
      const sk = normName(v.schoolName)
      if (!map[sk]) map[sk] = {}
      if (!map[sk][mk]) map[sk][mk] = []
      map[sk][mk].push(v)
    })
    return map
  }, [allVisits])

  const visitsByDate = useMemo(() => {
    const grouped = {}
    allVisits.forEach(v => {
      if (!grouped[v.visitDate]) grouped[v.visitDate] = []
      grouped[v.visitDate].push(v)
    })
    return grouped
  }, [allVisits])

  const filteredVisitsByDate = useMemo(() => {
    if (!dayFilterMonth && !dayFilterDay) return visitsByDate
    const filtered = {}
    Object.keys(visitsByDate).forEach(dateStr => {
      const d = dayjs(dateStr)
      if (dayFilterMonth && d.month() + 1 !== Number(dayFilterMonth)) return
      if (dayFilterDay && d.date() !== Number(dayFilterDay)) return
      filtered[dateStr] = visitsByDate[dateStr]
    })
    return filtered
  }, [visitsByDate, dayFilterMonth, dayFilterDay])

  async function openSchoolModal(school) {
    setSchoolModal(school)
    setNoteText(school.note || '')
    setNoteEditing(false)
    setEquipLoading(true)
    try {
      setEquipment(await api.getEquipment(school.schoolId))
    } catch {
      setEquipment([])
    } finally {
      setEquipLoading(false)
    }
  }

  function closeSchoolModal() {
    setSchoolModal(null)
    setNoteEditing(false)
  }

  async function saveNote() {
    setNoteSaving(true)
    try {
      await api.saveSchool({ ...schoolModal, note: noteText })
      setSchools(prev => prev.map(s => s.schoolId === schoolModal.schoolId ? { ...s, note: noteText } : s))
      setSchoolModal(prev => ({ ...prev, note: noteText }))
      setNoteEditing(false)
    } catch (e) {
      alert('저장 실패: ' + e.message)
    } finally {
      setNoteSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="p-4">
      {/* 학년도 드롭다운 */}
      <div className="flex items-center gap-3 mb-3">
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-400 bg-white"
        >
          {YEAR_OPTIONS.map(y => (
            <option key={y} value={y}>{y}년도</option>
          ))}
        </select>
        <p className="text-xs text-gray-400">{selectedYear}년 3월 ~ {selectedYear + 1}년 2월</p>
      </div>

      {/* 뷰 모드 탭 */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
        {VIEW_MODES.map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition
              ${viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* ─── 기사별 뷰 ─── */}
      {viewMode === '기사별' && (
        <>
          <div className="mb-4">
            <select
              value={selectedTechId}
              onChange={e => setSelectedTechId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">기사 선택</option>
              {techs.map(t => (
                <option key={t.techId} value={t.techId}>{t.name}</option>
              ))}
            </select>
          </div>

          {!selectedTechId ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">위에서 기사를 선택하세요</p>
            </div>
          ) : visitLoading ? <Spinner /> : (
            <>
              <p className="text-xs text-gray-500 mb-3">유지관리 {managedSchools.length}개교</p>
              {managedSchools.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-gray-400">
                  <p className="text-sm">담당 유지관리 학교가 없습니다</p>
                </div>
              ) : (
                <SchoolMatrix
                  schools={managedSchools}
                  visitMap={visitMap}
                  MONTHS={MONTHS}
                  onSchoolClick={openSchoolModal}
                  onCellClick={setVisitModal}
                />
              )}
            </>
          )}
        </>
      )}

      {/* ─── 지역별 뷰 ─── */}
      {viewMode === '지역별' && (
        <>
          <div className="mb-4">
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">지역 선택</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {!selectedRegion ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <p className="text-sm">위에서 지역을 선택하세요</p>
            </div>
          ) : allVisitsLoading ? <Spinner /> : (
            <>
              <p className="text-xs text-gray-500 mb-3">{selectedRegion} 유지관리 {regionSchools.length}개교</p>
              {regionSchools.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-gray-400">
                  <p className="text-sm">해당 지역에 유지관리 학교가 없습니다</p>
                </div>
              ) : (
                <SchoolMatrix
                  schools={regionSchools}
                  visitMap={allVisitMap}
                  MONTHS={MONTHS}
                  onSchoolClick={openSchoolModal}
                  onCellClick={setVisitModal}
                />
              )}
            </>
          )}
        </>
      )}

      {/* ─── 일별 뷰 ─── */}
      {viewMode === '일별' && (
        <>
          <div className="flex gap-2 mb-4">
            <select
              value={dayFilterMonth}
              onChange={e => { setDayFilterMonth(e.target.value); setDayFilterDay('') }}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">전체 월</option>
              {MONTHS.map(m => (
                <option key={m.key} value={String(m.month)}>{m.label}</option>
              ))}
            </select>
            <select
              value={dayFilterDay}
              onChange={e => setDayFilterDay(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">전체 일</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={String(d)}>{d}일</option>
              ))}
            </select>
          </div>
          {allVisitsLoading ? <Spinner /> : (
          <div className="space-y-5">
            {Object.keys(filteredVisitsByDate).length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <p className="text-sm">해당 조건에 방문 기록이 없습니다</p>
              </div>
            ) : Object.keys(filteredVisitsByDate).sort().map(dateStr => {
              const day = dayjs(dateStr)
              const items = [...filteredVisitsByDate[dateStr]].sort((a, b) =>
                (a.visitTime || '').localeCompare(b.visitTime || '')
              )
              const isToday = dateStr === dayjs().format('YYYY-MM-DD')
              return (
                <div key={dateStr}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {day.format('M월 D일')} ({DAY_KO[day.day()]})
                    </span>
                    {isToday && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">오늘</span>
                    )}
                    <span className="text-xs text-gray-400">{items.length}건</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map(v => (
                      <div key={v.visitId} className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">{v.schoolName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {v.techName} · {v.visitType}{v.visitTime ? ` · ${v.visitTime}` : ''}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0
                            ${v.status === '완료' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {v.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </>
      )}

      {/* ─── 학교 상세 모달 ─── */}
      {schoolModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
          onClick={closeSchoolModal}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start p-5 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">{schoolModal.name}</h3>
                <span className="text-xs text-gray-400">{schoolModal.region} · {schoolModal.contractType}</span>
              </div>
              <CloseBtn onClick={closeSchoolModal} />
            </div>

            <div className="overflow-y-auto p-5 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">기본 정보</p>
                <InfoRow label="주소" value={schoolModal.address} />
                <InfoRow label="담당자" value={schoolModal.contact} />
                <InfoRow label="연락처" value={schoolModal.contactPhone} />
                <InfoRow label="이메일" value={schoolModal.email} />
                {schoolModal.bizNumber && <InfoRow label="사업자번호" value={schoolModal.bizNumber} />}
                {schoolModal.bizRegistrationLink && (
                  <div className="flex gap-2 text-xs">
                    <span className="text-gray-400 w-20 flex-shrink-0">사업자등록증</span>
                    <a href={schoolModal.bizRegistrationLink} target="_blank" rel="noreferrer"
                      className="text-blue-600 underline">링크 열기</a>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-500">메모 (비고)</p>
                  {!noteEditing ? (
                    <button onClick={() => setNoteEditing(true)} className="text-xs text-blue-600 font-medium">편집</button>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => { setNoteEditing(false); setNoteText(schoolModal.note || '') }}
                        className="text-xs text-gray-400">취소</button>
                      <button onClick={saveNote} disabled={noteSaving}
                        className="text-xs text-blue-600 font-semibold disabled:opacity-40">
                        {noteSaving ? '저장중...' : '저장'}
                      </button>
                    </div>
                  )}
                </div>
                {noteEditing ? (
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="학교에 대한 메모를 입력하세요..." />
                ) : (
                  <div className="min-h-[52px] bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-600 whitespace-pre-wrap">
                    {schoolModal.note || <span className="text-gray-300 text-xs italic">메모 없음 — 편집을 눌러 추가하세요</span>}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">설치 장비</p>
                {equipLoading ? <div className="py-4"><Spinner /></div> : equipment.length === 0 ? (
                  <p className="text-xs text-gray-300 py-2">등록된 장비 없음</p>
                ) : (
                  <div className="space-y-2">
                    {equipment.map(eq => (
                      <div key={eq.equipmentId} className="bg-gray-50 rounded-xl px-3 py-2.5">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{eq.location}</p>
                            <p className="text-xs text-gray-500">{eq.model || eq.modelName}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
                            ${eq.status === '정상' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {eq.status}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-400">
                          {eq.installDate && <span>설치일: {eq.installDate}</span>}
                          {eq.filterInterval && <span>교체주기: {eq.filterInterval}개월</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 방문기록 모달 ─── */}
      {visitModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
          onClick={() => setVisitModal(null)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{visitModal.school.name}</h3>
                <p className="text-xs text-gray-400">{selectedYear}년 {visitModal.label} 방문 기록</p>
              </div>
              <CloseBtn onClick={() => setVisitModal(null)} />
            </div>

            <div className="overflow-y-auto p-5">
              {visitModal.visits.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-400">이 달에 방문 기록이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visitModal.visits.map(v => (
                    <button
                      key={v.visitId}
                      onClick={() => { setVisitModal(null); navigate(`/visit/edit/${v.visitId}`, { state: { visit: v } }) }}
                      className="w-full text-left bg-gray-50 hover:bg-blue-50 rounded-xl px-4 py-3 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {dayjs(v.visitDate).format('M월 D일')} · {v.visitType}
                          </p>
                          {v.workContent && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{v.workContent}</p>
                          )}
                          {v.techName && (
                            <p className="text-xs text-gray-400 mt-0.5">{v.techName} 기사</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full
                            ${v.status === '완료' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {v.status}
                          </span>
                          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
