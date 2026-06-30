import { useState, useEffect } from 'react'
import { api } from '../../api/sheetsApi.js'

export default function AdminLeave() {
  const curYear = new Date().getFullYear()
  const [year, setYear] = useState(curYear)
  const [leaveList, setLeaveList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getAllLeaveInfo(year)
      .then(d => setLeaveList(d || []))
      .catch(() => setLeaveList([]))
      .finally(() => setLoading(false))
  }, [year])

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">근태 관리</h2>
          <p className="text-sm text-gray-500 mt-0.5">기사별 연차 현황 · 유급은 차감 없음</p>
        </div>

        {/* 연도 선택 */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <button
            onClick={() => setYear(y => y - 1)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-800 w-16 text-center">{year}년</span>
          <button
            onClick={() => setYear(y => y + 1)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
            disabled={year >= curYear}
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : leaveList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">등록된 기사가 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 데스크탑 테이블 */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500">기사명</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500">입사일</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500">총연차</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500">연차사용</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500">반차사용</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500">합계사용</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500">남은연차</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaveList.map(tech => (
                  <tr key={tech.techId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-800">{tech.techName}</td>
                    <td className="px-5 py-4 text-gray-500">{tech.joinDate || '-'}</td>
                    <td className="px-4 py-4 text-center text-gray-700">{tech.totalLeave}일</td>
                    <td className="px-4 py-4 text-center text-gray-700">{tech.usedLeave}일</td>
                    <td className="px-4 py-4 text-center text-gray-700">{tech.usedHalfDay}회</td>
                    <td className="px-4 py-4 text-center font-medium text-gray-800">{tech.totalUsed}일</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-bold text-base ${tech.remaining <= 0 ? 'text-red-500' : tech.remaining <= 3 ? 'text-orange-500' : 'text-green-600'}`}>
                        {tech.remaining}일
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <div className="md:hidden space-y-3">
            {leaveList.map(tech => (
              <div key={tech.techId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-gray-800 text-base">{tech.techName}</span>
                    {tech.joinDate && (
                      <span className="ml-2 text-xs text-gray-400">입사 {tech.joinDate}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-bold ${tech.remaining <= 0 ? 'text-red-500' : tech.remaining <= 3 ? 'text-orange-500' : 'text-green-600'}`}>
                      {tech.remaining}
                    </span>
                    <span className={`text-xs ml-0.5 ${tech.remaining <= 0 ? 'text-red-400' : tech.remaining <= 3 ? 'text-orange-400' : 'text-green-500'}`}>일 남음</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-gray-400 mb-0.5">총연차</p>
                    <p className="text-sm font-bold text-gray-700">{tech.totalLeave}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-gray-400 mb-0.5">연차</p>
                    <p className="text-sm font-bold text-gray-700">{tech.usedLeave}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-gray-400 mb-0.5">반차</p>
                    <p className="text-sm font-bold text-gray-700">{tech.usedHalfDay}회</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-gray-400 mb-0.5">합계</p>
                    <p className="text-sm font-bold text-gray-700">{tech.totalUsed}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
