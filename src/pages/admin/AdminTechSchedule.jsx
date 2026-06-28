import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import dayjs from 'dayjs'
import { api } from '../../api/sheetsApi.js'

function getSchoolYear() {
  const now = dayjs()
  const month = now.month() + 1
  const year = now.year()
  if (month >= 3) {
    return { startYear: year, start: `${year}-03-01`, end: `${year + 1}-02-28` }
  }
  return { startYear: year - 1, start: `${year - 1}-03-01`, end: `${year}-02-28` }
}

const SCHOOL_YEAR = getSchoolYear()

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const m = i + 3 > 12 ? i + 3 - 12 : i + 3
  const y = m <= 2 ? SCHOOL_YEAR.startYear + 1 : SCHOOL_YEAR.startYear
  const key = `${y}-${String(m).padStart(2, '0')}`
  return { year: y, month: m, label: `${m}월`, key }
})

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

export default function AdminTechSchedule() {
  const location = useLocation()
  const initialTechId = new URLSearchParams(location.search).get('techId') || ''

  const [techs, setTechs] = useState([])
  const [schools, setSchools] = useState([])
  const [selectedTechId, setSelectedTechId] = useState(initialTechId)
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [visitLoading, setVisitLoading] = useState(false)

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
    if (!selectedTechId) { setVisits([]); return }
    setVisitLoading(true)
    api.getAllVisits(SCHOOL_YEAR.start, SCHOOL_YEAR.end, selectedTechId)
      .then(setVisits)
      .catch(console.error)
      .finally(() => setVisitLoading(false))
  }, [selectedTechId])

  // 선택된 기사의 유지관리 학교 (ㄱㄴㄷ순)
  const managedSchools = useMemo(() => {
    return schools
      .filter(s => s.techId === selectedTechId && s.contractType === '유지관리')
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [schools, selectedTechId])

  // { schoolId: { 'YYYY-MM': [day, ...] } }
  const visitMap = useMemo(() => {
    const map = {}
    visits.forEach(v => {
      const d = dayjs(v.visitDate)
      const monthKey = d.format('YYYY-MM')
      if (!map[v.schoolId]) map[v.schoolId] = {}
      if (!map[v.schoolId][monthKey]) map[v.schoolId][monthKey] = []
      map[v.schoolId][monthKey].push(d.date())
    })
    return map
  }, [visits])

  if (loading) return <Spinner />

  return (
    <div className="p-4">
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">
          {SCHOOL_YEAR.startYear}년 3월 ~ {SCHOOL_YEAR.startYear + 1}년 2월 학사연도
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {techs.map(t => (
            <button
              key={t.techId}
              onClick={() => setSelectedTechId(t.techId)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition
                ${selectedTechId === t.techId
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 active:bg-gray-50'}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {!selectedTechId ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">위에서 기사를 선택하세요</p>
        </div>
      ) : visitLoading ? <Spinner /> : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            유지관리 {managedSchools.length}개교
          </p>

          {managedSchools.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <p className="text-sm">담당 유지관리 학교가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4">
              <table className="min-w-max text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 bg-blue-600 text-white border border-blue-500 px-3 py-2.5 text-left font-semibold min-w-[120px] max-w-[160px]">
                      학교명
                    </th>
                    {MONTHS.map(m => (
                      <th
                        key={m.key}
                        className={`border border-gray-200 px-2 py-2.5 text-center font-semibold min-w-[52px]
                          ${m.key === dayjs().format('YYYY-MM')
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-50 text-gray-600'}`}
                      >
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {managedSchools.map((school, idx) => (
                    <tr key={school.schoolId}>
                      <td
                        className={`sticky left-0 z-10 border border-gray-200 px-3 py-2.5 font-medium text-gray-800 truncate max-w-[160px]
                          ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        {school.name}
                      </td>
                      {MONTHS.map(m => {
                        const days = visitMap[school.schoolId]?.[m.key] || []
                        const isCurrentMonth = m.key === dayjs().format('YYYY-MM')
                        return (
                          <td
                            key={m.key}
                            className={`border border-gray-200 px-2 py-2.5 text-center
                              ${isCurrentMonth ? 'bg-blue-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            {days.length > 0 ? (
                              <span className="text-blue-700 font-medium">
                                {days.map(d => `${d}일`).join(', ')}
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
          )}
        </>
      )}
    </div>
  )
}
