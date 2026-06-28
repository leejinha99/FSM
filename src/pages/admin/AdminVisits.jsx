import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
dayjs.extend(isSameOrAfter)
import { api } from '../../api/sheetsApi.js'

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

const VISIT_TYPE_BADGE = {
  '필터교체': 'bg-blue-100 text-blue-700',
  'AS':       'bg-red-100 text-red-700',
  '점검':     'bg-green-100 text-green-700',
  '설치':     'bg-purple-100 text-purple-700',
}

const STATUS_BADGE = {
  '예정': 'bg-yellow-100 text-yellow-700',
  '완료': 'bg-gray-100 text-gray-500',
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

export default function AdminVisits() {
  const [visits, setVisits]   = useState([])
  const [techs, setTechs]     = useState([])
  const [loading, setLoading] = useState(true)
  const currentYear = dayjs().year()
  const [filterYear,  setFilterYear]  = useState(String(currentYear))
  const [filterMonth, setFilterMonth] = useState(String(dayjs().month() + 1))
  const [filterDay,   setFilterDay]   = useState('')
  const [techFilter,  setTechFilter]  = useState('')
  const [typeFilter,  setTypeFilter]  = useState('')

  const { startDate, endDate } = useMemo(() => {
    const y = filterYear
    const m = filterMonth ? filterMonth.padStart(2, '0') : null
    const d = filterDay   ? filterDay.padStart(2, '0')   : null
    if (d && m) { const dt = `${y}-${m}-${d}`; return { startDate: dt, endDate: dt } }
    if (m) return { startDate: `${y}-${m}-01`, endDate: dayjs(`${y}-${m}`).endOf('month').format('YYYY-MM-DD') }
    return { startDate: `${y}-01-01`, endDate: `${y}-12-31` }
  }, [filterYear, filterMonth, filterDay])

  async function load() {
    setLoading(true)
    try {
      const [v, t] = await Promise.all([
        api.getAllVisits(startDate, endDate, techFilter || null),
        api.getAllTechs(),
      ])
      setVisits(v)
      setTechs(t.filter(t => t.role === '기사'))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [startDate, endDate, techFilter])

  const filtered = useMemo(() => {
    if (!typeFilter) return visits
    return visits.filter(v => v.visitType === typeFilter)
  }, [visits, typeFilter])

  const grouped = useMemo(() => {
    return filtered.reduce((acc, v) => {
      if (!acc[v.visitDate]) acc[v.visitDate] = []
      acc[v.visitDate].push(v)
      return acc
    }, {})
  }, [filtered])

  const sortedDates = Object.keys(grouped).sort()

  return (
    <div>
      {/* 필터 영역 */}
      <div className="sticky top-0 bg-gray-50 z-10 px-4 pt-4 pb-3 border-b border-gray-100 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">년도</label>
            <select
              value={filterYear}
              onChange={e => { setFilterYear(e.target.value); setFilterDay('') }}
              className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              {Array.from({ length: 5 }, (_, i) => String(currentYear - 1 + i)).map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">월</label>
            <select
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setFilterDay('') }}
              className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="">전체</option>
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(m => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">일</label>
            <select
              value={filterDay}
              onChange={e => setFilterDay(e.target.value)}
              disabled={!filterMonth}
              className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-300"
            >
              <option value="">전체</option>
              {Array.from({ length: filterMonth ? dayjs(`${filterYear}-${filterMonth.padStart(2,'0')}`).daysInMonth() : 31 }, (_, i) => String(i + 1)).map(d => (
                <option key={d} value={d}>{d}일</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={techFilter}
            onChange={e => setTechFilter(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="">전체 기사</option>
            {techs.map(t => <option key={t.techId} value={t.techId}>{t.name}</option>)}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="">전체 유형</option>
            {['필터교체', '점검', 'AS', '설치'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <p className="text-xs text-gray-400">{filtered.length}건</p>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* 모바일: 날짜별 카드 목록 */}
          <div className="md:hidden px-4 py-3 space-y-5">
            {sortedDates.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <p className="text-sm">해당 기간에 방문 기록이 없습니다</p>
              </div>
            ) : sortedDates.map(dateStr => {
              const day = dayjs(dateStr)
              const items = grouped[dateStr].slice().sort((a, b) => a.visitTime.localeCompare(b.visitTime))
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
                  <div className="space-y-2">
                    {items.map(v => (
                      <div key={v.visitId} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">{v.schoolName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{v.techName} · {v.visitTime}</p>
                            {v.workContent && (
                              <p className="text-xs text-gray-500 mt-1 truncate">{v.workContent}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VISIT_TYPE_BADGE[v.visitType] || 'bg-gray-100 text-gray-600'}`}>
                              {v.visitType}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[v.status] || 'bg-gray-100 text-gray-500'}`}>
                              {v.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 데스크탑: 테이블 */}
          <div className="hidden md:block px-6 py-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <p className="text-sm">해당 기간에 방문 기록이 없습니다</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">방문일</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">시간</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">학교명</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">기사</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">유형</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">작업내용</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice().sort((a, b) => b.visitDate.localeCompare(a.visitDate) || b.visitTime.localeCompare(a.visitTime)).map(v => (
                      <tr key={v.visitId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{v.visitDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{v.visitTime || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{v.schoolName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{v.techName}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VISIT_TYPE_BADGE[v.visitType] || 'bg-gray-100 text-gray-600'}`}>
                            {v.visitType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{v.workContent || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[v.status] || 'bg-gray-100 text-gray-500'}`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
