import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { api } from '../../api/sheetsApi.js'

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

const VISIT_TYPE_BADGE = {
  '필터교체': 'bg-blue-100 text-blue-700',
  'AS':       'bg-red-100 text-red-700',
  '점검':     'bg-green-100 text-green-700',
  '설치':     'bg-purple-100 text-purple-700',
}

const AS_STATUS_BADGE = {
  '접수':   'bg-yellow-100 text-yellow-700',
  '처리중': 'bg-orange-100 text-orange-700',
  '완료':   'bg-green-100 text-green-600',
}

function StatCard({ label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition-transform"
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </button>
  )
}

function ASStatCard({ label, value, bgColor, textColor, borderColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 ${bgColor} rounded-2xl p-3 border ${borderColor} text-center active:scale-95 transition-transform`}
    >
      <p className={`text-xs font-medium ${textColor} mb-1`}>{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </button>
  )
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const today = dayjs()
  const todayStr = today.format('YYYY-MM-DD')

  const [stats, setStats] = useState({
    schools: 0, techs: 0, invoicePending: 0, pendingAS: 0,
    newAS: 0, processingAS: 0, completedAS: 0,
  })
  const [todayVisits, setTodayVisits] = useState([])
  const [pendingAS, setPendingAS] = useState([])
  const [invoiceList, setInvoiceList] = useState([])
  const [techList, setTechList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [schools, techs, visits, asAll] = await Promise.all([
          api.getAllSchools(),
          api.getAllTechs(),
          api.getAllVisits(todayStr, todayStr),
          api.getAllAS(),
        ])
        const activeTechs = techs.filter(t => t.role === '기사' && t.active)
        const pending = asAll.filter(a => a.status !== '완료')
        const invoicePendingList = asAll.filter(a => a.status === '발행대기')
        setStats({
          schools: schools.length,
          techs: activeTechs.length,
          invoicePending: invoicePendingList.length,
          pendingAS: pending.length,
          newAS:        asAll.filter(a => a.status === '접수').length,
          processingAS: asAll.filter(a => a.status === '처리중').length,
          completedAS:  asAll.filter(a => a.status === '완료').length,
        })
        setTodayVisits(visits.slice(0, 5))
        setPendingAS(pending.slice(0, 3))
        setInvoiceList(invoicePendingList)
        setTechList(activeTechs)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400">
            {today.format('YYYY년 M월 D일')} ({DAY_KO[today.day()]})
          </p>
          <h2 className="text-xl font-bold text-gray-800 mt-0.5">전체 현황</h2>
        </div>
        <button
          onClick={() => navigate('/admin/as?new=1')}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-full shadow active:bg-blue-700 transition mt-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          AS 접수
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="관리 학교"      value={stats.schools}       color="text-blue-600"   onClick={() => navigate('/admin/schools')} />
        <StatCard label="소속 기사"      value={stats.techs}         color="text-green-600"  onClick={() => navigate('/admin/techs')} />
        <StatCard label="세금계산서 발행" value={stats.invoicePending} color="text-purple-600" onClick={() => navigate('/admin/as?status=발행대기')} />
        <StatCard label="미처리 AS"      value={stats.pendingAS}     color="text-red-500"    onClick={() => navigate('/admin/as')} />
      </div>

      {/* AS 접수함 요약 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">AS 접수함</h3>
          <button onClick={() => navigate('/admin/as')} className="text-xs text-blue-600">전체 보기</button>
        </div>
        <div className="flex gap-2">
          <ASStatCard
            label="총 접수"
            value={stats.newAS}
            bgColor="bg-red-50"
            textColor="text-red-600"
            borderColor="border-red-100"
            onClick={() => navigate('/admin/as?status=접수')}
          />
          <ASStatCard
            label="처리중"
            value={stats.processingAS}
            bgColor="bg-orange-50"
            textColor="text-orange-600"
            borderColor="border-orange-100"
            onClick={() => navigate('/admin/as?status=처리중')}
          />
          <ASStatCard
            label="완료"
            value={stats.completedAS}
            bgColor="bg-green-50"
            textColor="text-green-700"
            borderColor="border-green-100"
            onClick={() => navigate('/admin/as?status=완료')}
          />
        </div>
        {stats.newAS > 0 && (
          <p className="text-xs text-red-500 mt-1.5 text-center">
            미확인 접수 {stats.newAS}건 — 빠른 처리가 필요합니다
          </p>
        )}
      </section>

      {/* 세금계산서 발행 대기 */}
      {invoiceList.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">세금계산서 발행 대기</h3>
            <button onClick={() => navigate('/admin/as?status=발행대기')} className="text-xs text-blue-600">전체 보기</button>
          </div>
          <div className="space-y-2">
            {invoiceList.slice(0, 3).map(a => (
              <div
                key={a.asId}
                onClick={() => navigate('/admin/as?status=발행대기')}
                className="bg-white rounded-xl px-4 py-3 shadow-sm border border-purple-100 cursor-pointer active:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{a.schoolName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.reportedDate}
                      {a.paymentInfo?.total ? ` · ${a.paymentInfo.total.toLocaleString()}원` : ''}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700 shrink-0">발행대기</span>
                </div>
              </div>
            ))}
            {invoiceList.length > 3 && (
              <button
                onClick={() => navigate('/admin/as?status=발행대기')}
                className="w-full text-center text-xs text-purple-600 py-2 bg-white rounded-xl border border-gray-100 shadow-sm"
              >
                + {invoiceList.length - 3}건 더 보기
              </button>
            )}
          </div>
        </section>
      )}

      {todayVisits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">오늘 방문 일정</h3>
            <button onClick={() => navigate('/admin/visits')} className="text-xs text-blue-600">전체 보기</button>
          </div>
          <div className="space-y-2">
            {todayVisits.map(v => (
              <div key={v.visitId} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{v.schoolName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{v.techName} · {v.visitTime}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${VISIT_TYPE_BADGE[v.visitType] || 'bg-gray-100 text-gray-600'}`}>
                    {v.visitType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">기사별 관리일정</h3>
          <button onClick={() => navigate('/admin/tech-schedule')} className="text-xs text-blue-600">전체 보기</button>
        </div>
        {techList.length === 0 ? (
          <p className="text-xs text-gray-400">등록된 기사가 없습니다</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {techList.map(t => (
              <button
                key={t.techId}
                onClick={() => navigate(`/admin/tech-schedule?techId=${t.techId}`)}
                className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-left active:bg-gray-50 transition"
              >
                <p className="font-medium text-gray-800 text-sm">{t.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">월별 일정 보기 →</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {pendingAS.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">미처리 AS</h3>
            <button onClick={() => navigate('/admin/as')} className="text-xs text-blue-600">전체 보기</button>
          </div>
          <div className="space-y-2">
            {pendingAS.map(a => (
              <div key={a.asId} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-red-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{a.schoolName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.reportedDate} · {a.symptom}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${AS_STATUS_BADGE[a.status] || ''}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
            {stats.pendingAS > 3 && (
              <button
                onClick={() => navigate('/admin/as')}
                className="w-full text-center text-xs text-blue-600 py-2 bg-white rounded-xl border border-gray-100 shadow-sm"
              >
                + {stats.pendingAS - 3}건 더 보기
              </button>
            )}
          </div>
        </section>
      )}

      {invoiceList.length === 0 && todayVisits.length === 0 && pendingAS.length === 0 && techList.length === 0 && (
        <div className="flex flex-col items-center py-8 text-gray-400">
          <p className="text-sm">오늘 방문 일정과 미처리 AS가 없습니다</p>
        </div>
      )}
    </div>
  )
}
