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

function parseExemptSet(exemptMonth) {
  if (!exemptMonth) return new Set()
  return new Set(
    String(exemptMonth)
      .split(/[,\s·\/]+/)
      .map(s => parseInt(s.replace(/[월달]/g, '').trim()))
      .filter(n => !isNaN(n) && n >= 1 && n <= 12)
  )
}

// 학교명 매칭용 정규화: 공백/줄바꿈 모두 제거 (시트 간 표기 차이 흡수)
function normName(s) {
  return String(s == null ? '' : s).replace(/\s+/g, '')
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
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

export default function TechManaged() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [selectedYear, setSelectedYear] = useState(getDefaultYear)
  const [schools, setSchools] = useState([])
  const [eqStats, setEqStats] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [visitLoading, setVisitLoading] = useState(false)

  const [schoolModal, setSchoolModal] = useState(null)
  const [equipment, setEquipment] = useState([])
  const [equipLoading, setEquipLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteEditing, setNoteEditing] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)

  const [visitModal, setVisitModal] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState({ visits: [], asList: [] })
  const [historyLoading, setHistoryLoading] = useState(false)

  const MONTHS = useMemo(() => getMonths(selectedYear), [selectedYear])

  useEffect(() => {
    if (!user?.techId) return
    setLoading(true)
    Promise.all([
      api.getMySchools(user.techId, selectedYear),
      api.getAllEquipmentStats(selectedYear),
    ])
      .then(([s, eq]) => {
        setSchools(s)
        setEqStats(eq)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.techId, selectedYear])

  useEffect(() => {
    if (!user?.techId) return
    const start = `${selectedYear}-03-01`
    const end = `${selectedYear + 1}-02-28`
    setVisitLoading(true)
    api.getMyVisits(user.techId, start, end)
      .then(setVisits)
      .catch(console.error)
      .finally(() => setVisitLoading(false))
  }, [user?.techId, selectedYear])

  const managedSchools = useMemo(() =>
    schools
      .filter(s => s.contractType === '유지관리')
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  , [schools])

  const eqStatsMap = useMemo(() =>
    Object.fromEntries(eqStats.map(e => [normName(e.schoolName), e]))
  , [eqStats])

  const visitMap = useMemo(() => {
    const map = {}
    visits.forEach(v => {
      const mk = dayjs(v.visitDate).format('YYYY-MM')
      if (!map[v.schoolId]) map[v.schoolId] = {}
      if (!map[v.schoolId][mk]) map[v.schoolId][mk] = []
      map[v.schoolId][mk].push(v)
    })
    return map
  }, [visits])

  async function openSchoolModal(school) {
    setSchoolModal(school)
    setNoteText(school.note || '')
    setNoteEditing(false)
    setEquipment([])
    setEquipLoading(true)
    setShowHistory(false)
    setHistoryData({ visits: [], asList: [] })
    try {
      const data = await api.getEquipment(school.schoolId, school.name)
      setEquipment([...data].sort((a, b) => a.location.localeCompare(b.location, 'ko')))
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

  if (loading) return <div className="p-4"><Spinner /></div>

  return (
    <div className="p-4 pb-24 md:pb-8">
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-800 mb-0.5">관리계정</h2>
        <p className="text-xs text-gray-400">유지관리 학교 연간 방문 현황</p>
      </div>

      {/* 학년도 필터 */}
      <div className="mb-3">
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-400 bg-white"
        >
          {YEAR_OPTIONS.map(y => (
            <option key={y} value={y}>{y}년도</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        {selectedYear}.3 ~ {selectedYear + 1}.2 · 유지관리 {managedSchools.length}개교
      </p>

      {visitLoading ? <Spinner /> : managedSchools.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <p className="text-sm">담당 유지관리 학교가 없습니다</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="min-w-max md:min-w-0 md:w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-blue-600 text-white border border-blue-500 px-3 py-2.5 text-left font-semibold min-w-[130px]">
                  학교명
                </th>
                <th className="bg-blue-600 text-white border border-blue-500 px-2 py-2.5 text-center font-semibold min-w-[80px]">
                  계약자
                </th>
                <th className="bg-blue-600 text-white border border-blue-500 px-2 py-2.5 text-center font-semibold min-w-[52px] whitespace-nowrap">
                  설치대수
                </th>
                <th className="bg-blue-600 text-white border border-blue-500 px-2 py-2.5 text-center font-semibold min-w-[64px]">
                  면제달
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
              {managedSchools.map((school, idx) => {
                const stats = eqStatsMap[normName(school.name)]
                const exemptSet = parseExemptSet(stats?.exemptMonth)
                return (
                  <tr key={school.schoolId || school.name || idx}>
                    <td
                      className={`sticky left-0 z-10 border border-gray-200 px-3 py-2.5 font-medium text-blue-700 truncate max-w-[160px] cursor-pointer hover:bg-blue-50 transition
                        ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      onClick={() => openSchoolModal(school)}
                    >
                      {school.name}
                    </td>
                    <td className={`border border-gray-200 px-2 py-2.5 text-center text-gray-600 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      {school.contractor || '-'}
                    </td>
                    <td className={`border border-gray-200 px-2 py-2.5 text-center text-gray-700 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      {stats?.totalInstall ?? '-'}
                    </td>
                    <td className={`border border-gray-200 px-2 py-2.5 text-center text-gray-500 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      {stats?.exemptMonth || '-'}
                    </td>
                    {MONTHS.map(m => {
                      const cellVisits = visitMap[school.schoolId]?.[m.key] || []
                      const isExempt = exemptSet.has(m.month)
                      const isCurrentMonth = m.key === dayjs().format('YYYY-MM')
                      return (
                        <td
                          key={m.key}
                          className={`border border-gray-200 px-2 py-2.5 text-center cursor-pointer hover:bg-blue-50 transition
                            ${isCurrentMonth ? 'bg-blue-50/40' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          onClick={() => !isExempt && setVisitModal({ school, monthKey: m.key, label: m.label, visits: cellVisits })}
                        >
                          {isExempt ? (
                            <span className="text-gray-300 font-medium">면</span>
                          ) : cellVisits.length > 0 ? (
                            <span className="text-blue-700 font-semibold">
                              {cellVisits.map(v => dayjs(v.visitDate).date() + '일').join(', ')}
                            </span>
                          ) : (
                            <span className="text-gray-200">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
                <p className="text-xs text-gray-400 mt-0.5">
                  {[
                    schoolModal.region,
                    schoolModal.contractType,
                    eqStatsMap[normName(schoolModal.name)]?.exemptMonth || '',
                  ].filter(Boolean).join(' / ')}
                </p>
              </div>
              <CloseBtn onClick={closeSchoolModal} />
            </div>

            {/* 방문 · AS 목록 버튼 (헤더 구분선 바로 아래) */}
            <button
              onClick={async () => {
                if (showHistory) { setShowHistory(false); return }
                setShowHistory(true)
                setHistoryLoading(true)
                try {
                  const d = await api.getSchoolHistory(schoolModal.schoolId, schoolModal.name)
                  setHistoryData(d)
                } catch { setHistoryData({ visits: [], asList: [] }) }
                finally { setHistoryLoading(false) }
              }}
              className="flex items-center justify-between w-full px-5 py-3 border-b border-gray-100 bg-gray-50/60 hover:bg-gray-100 transition shrink-0"
            >
              <span className="text-sm font-medium text-gray-700">방문 · AS 목록</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 방문 · AS 확장 패널 */}
            {showHistory && (
              <div className="border-b border-gray-100 max-h-64 overflow-y-auto bg-gray-50/40 px-5 py-3 space-y-4 shrink-0">
                {historyLoading ? (
                  <div className="flex justify-center py-4"><Spinner /></div>
                ) : (
                  <>
                    {/* 방문 목록 */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">방문 목록 ({historyData.visits.length}건)</p>
                      {historyData.visits.length === 0 ? (
                        <p className="text-xs text-gray-300">방문 기록 없음</p>
                      ) : (
                        <div className="space-y-1.5">
                          {historyData.visits.map(v => (
                            <div key={v.visitId} className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-800">
                                    {v.visitDate} · {v.visitType}
                                  </p>
                                  {v.techName && <p className="text-xs text-gray-400">{v.techName}</p>}
                                  {v.workContent && (
                                    <p className="text-xs text-gray-500 truncate">{v.workContent}</p>
                                  )}
                                </div>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium
                                  ${v.status === '완료' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {v.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* AS 목록 */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">AS 목록 ({historyData.asList.length}건)</p>
                      {historyData.asList.length === 0 ? (
                        <p className="text-xs text-gray-300">AS 접수 내역 없음</p>
                      ) : (
                        <div className="space-y-1.5">
                          {historyData.asList.map(a => (
                            <div key={a.asId} className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-800">
                                    {a.reportedDate} · {a.symptom}
                                  </p>
                                  {a.techName && <p className="text-xs text-gray-400">{a.techName}</p>}
                                  {(a.location || a.model) && (
                                    <p className="text-xs text-gray-500">{[a.location, a.model].filter(Boolean).join(' / ')}</p>
                                  )}
                                </div>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium
                                  ${a.status === '완료' ? 'bg-green-100 text-green-700'
                                  : a.status === '발행대기' ? 'bg-orange-100 text-orange-700'
                                  : 'bg-yellow-100 text-yellow-700'}`}>
                                  {a.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="overflow-y-auto p-5 space-y-5">
              {/* 기본 정보 */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">기본 정보</p>
                {schoolModal.contractor && <InfoRow label="계약자" value={schoolModal.contractor} />}
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

              {/* 비고(메모) */}
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

              {/* 설치 장비 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  설치 장비 {equipment.length > 0 ? `(${equipment.reduce((s, e) => s + (Number(e.installCount) || 1), 0)}대)` : ''}
                </p>
                {equipLoading ? <Spinner /> : equipment.length === 0 ? (
                  <p className="text-xs text-gray-300 py-2">등록된 장비 없음</p>
                ) : (
                  <div className="space-y-1">
                    {equipment.map(eq => (
                      <div key={eq.equipmentId} className="bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                        {/* 1행: 제품위치 (제품명) ——— 교체주기-(계약구분) */}
                        <div className="flex items-center min-w-0">
                          <span className="text-xs font-medium text-gray-800 truncate">{eq.location}</span>
                          <span className="text-xs text-gray-400 ml-1 shrink-0">({eq.model})</span>
                          <div className="flex-1 border-b border-dashed border-gray-200 mx-2 mb-0.5 min-w-2"></div>
                          <span className="text-xs text-gray-500 shrink-0">
                            {eq.filterInterval}개월{eq.contractType ? `-(${eq.contractType})` : ''}
                          </span>
                        </div>
                        {/* 2행: 설치일 (임대/무상기간) */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">{eq.installDate || '-'}</span>
                          {eq.leasePeriod && <span className="text-xs text-gray-400">({eq.leasePeriod})</span>}
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
                  <p className="text-sm text-gray-400 mb-4">이 달에 방문 기록이 없습니다</p>
                  <button
                    onClick={() => {
                      setVisitModal(null)
                      navigate('/visit/new', { state: { schoolId: visitModal.school.schoolId } })
                    }}
                    className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl"
                  >
                    방문 등록
                  </button>
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
                  <button
                    onClick={() => {
                      setVisitModal(null)
                      navigate('/visit/new', { state: { schoolId: visitModal.school.schoolId } })
                    }}
                    className="w-full mt-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl"
                  >
                    + 방문 추가 등록
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
