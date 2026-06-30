import { useState, useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/sheetsApi.js'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function resizeImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

// ── 연차 사용내역 전체보기 ──────────────────────────────────────────────────

function LeaveHistoryView({ leaveData, year, onBack }) {
  const TYPE_STYLE = {
    '연차':    'bg-gray-100 text-gray-600',
    '오전반차': 'bg-blue-50 text-blue-600',
    '오후반차': 'bg-orange-50 text-orange-600',
    '유급':    'bg-emerald-50 text-emerald-600',
  }
  const usages = leaveData?.usages || []
  return (
    <div className="pb-20">
      <div className="bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg active:bg-gray-200">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-sm font-bold text-gray-900">{year}년 연차 사용 내역</h2>
        <span className="ml-auto text-xs text-gray-400">총 {usages.length}건</span>
      </div>
      <div className="px-4 pt-3 space-y-2">
        {usages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center mt-4">
            <p className="text-gray-400 text-sm">사용 내역이 없습니다.</p>
          </div>
        ) : (
          usages.map((u, i) => {
            const d = dayjs(u.date)
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-sm font-semibold text-gray-800">
                    {d.format('M월 D일')}
                    <span className="ml-1 text-xs font-normal text-gray-400">({WEEKDAYS[d.day()]})</span>
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">{d.format('YYYY년')}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_STYLE[u.type] || 'bg-gray-100 text-gray-600'}`}>
                  {u.type}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── 연차 탭 ─────────────────────────────────────────────────────────────────

const TYPE_CHIP = {
  '연차':    'bg-gray-300 text-gray-700',
  '오전반차': 'bg-blue-300 text-blue-800',
  '오후반차': 'bg-orange-300 text-orange-800',
  '유급':    'bg-emerald-300 text-emerald-800',
}

function LeaveTab({ user }) {
  const today = dayjs()
  const [currentMonth, setCurrentMonth] = useState(() => today.startOf('month'))
  const [leaveData, setLeaveData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const year = currentMonth.year()

  useEffect(() => {
    setLoading(true)
    api.getMyLeaveInfo(user.techId, year)
      .then(d => setLeaveData(d))
      .catch(() => setLeaveData(null))
      .finally(() => setLoading(false))
  }, [user.techId, year])

  if (showHistory) {
    return <LeaveHistoryView leaveData={leaveData} year={year} onBack={() => setShowHistory(false)} />
  }

  const summary = leaveData?.summary || {}
  const usageMap = {}
  if (leaveData?.usages) {
    leaveData.usages.forEach(u => { usageMap[u.date] = u.type })
  }

  const firstDay = currentMonth.startOf('month').day()
  const daysInMonth = currentMonth.daysInMonth()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  const todayStr = today.format('YYYY-MM-DD')

  return (
    <div className="pb-4">
      {/* 통계 요약 바 (작게) */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-around">
        <div className="text-center">
          <p className="text-[10px] text-gray-400 leading-none mb-0.5">총 연차</p>
          <p className="text-sm font-bold text-gray-800 leading-none">{loading ? '…' : (summary.totalLeave ?? '-')}<span className="text-[9px] font-normal">일</span></p>
        </div>
        <div className="w-px h-5 bg-gray-100" />
        <div className="text-center">
          <p className="text-[10px] text-green-500 leading-none mb-0.5">남은 연차</p>
          <p className="text-sm font-bold text-green-600 leading-none">{loading ? '…' : (summary.remaining ?? '-')}<span className="text-[9px] font-normal">일</span></p>
        </div>
        <div className="w-px h-5 bg-gray-100" />
        <div className="text-center">
          <p className="text-[10px] text-gray-400 leading-none mb-0.5">사용 연차</p>
          <p className="text-sm font-bold text-gray-700 leading-none">{loading ? '…' : (summary.usedLeave ?? '-')}<span className="text-[9px] font-normal">일</span></p>
        </div>
        <div className="w-px h-5 bg-gray-100" />
        <div className="text-center">
          <p className="text-[10px] text-gray-400 leading-none mb-0.5">반차</p>
          <p className="text-sm font-bold text-gray-700 leading-none">{loading ? '…' : (summary.usedHalfDay ?? '-')}<span className="text-[9px] font-normal">회</span></p>
        </div>
        <div className="w-px h-5 bg-gray-100" />
        <div className="text-center">
          <p className="text-[10px] text-gray-400 leading-none mb-0.5">합계</p>
          <p className="text-sm font-bold text-gray-700 leading-none">{loading ? '…' : (summary.totalUsed ?? '-')}<span className="text-[9px] font-normal">일</span></p>
        </div>
      </div>

      {/* 월 네비게이션 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))} className="p-2 hover:bg-gray-100 rounded-lg active:bg-gray-200">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold text-gray-900">{currentMonth.format('YYYY년 M월')}</span>
        <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))} className="p-2 hover:bg-gray-100 rounded-lg active:bg-gray-200">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 캘린더 */}
      <div className="bg-white mx-3 mt-3 rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`text-center text-xs font-medium py-2.5 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) return <div key={'e-' + idx} className="min-h-[70px] border-b border-r border-gray-50" />
              const dateStr = currentMonth.date(day).format('YYYY-MM-DD')
              const isToday = dateStr === todayStr
              const isSunday = idx % 7 === 0
              const isSaturday = idx % 7 === 6
              const leaveType = usageMap[dateStr]
              return (
                <div key={dateStr} className={`min-h-[70px] border-b border-r border-gray-50 p-1 flex flex-col items-center pt-1.5 ${leaveType ? 'bg-gray-50/70' : ''}`}>
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-blue-600 text-white' : isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  {leaveType && (
                    <span className={`mt-1 text-[9px] font-semibold px-1 py-0.5 rounded-sm w-full text-center leading-tight ${TYPE_CHIP[leaveType] || 'bg-gray-300 text-gray-700'}`}>
                      {leaveType}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="mx-3 mt-2.5 px-1 flex gap-3 flex-wrap">
        {Object.entries(TYPE_CHIP).map(([type, cls]) => (
          <div key={type} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-sm inline-block ${cls}`} />
            <span className="text-[10px] text-gray-500">{type}</span>
          </div>
        ))}
      </div>

      {/* 사용 내역 전체 보기 버튼 */}
      <div className="mx-3 mt-4">
        <button
          onClick={() => setShowHistory(true)}
          className="w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 flex items-center justify-center gap-2 shadow-sm active:bg-gray-50"
        >
          사용 내역 전체 보기
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── 계기판 탭 (기존 차량관리 내용) ──────────────────────────────────────────

function DashcamTab({ user }) {
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().startOf('month'))
  const [photoMap, setPhotoMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [pendingDate, setPendingDate] = useState(null)
  const fileInputRef = useRef()
  const today = dayjs().format('YYYY-MM-DD')

  useEffect(() => { loadData() }, [currentMonth])

  async function loadData() {
    setLoading(true)
    try {
      const data = await api.getDashcamPhotos(user.name, currentMonth.year(), currentMonth.month() + 1)
      const map = {}
      data.forEach(d => { map[d.date] = { commute: d.commute, leave: d.leave } })
      setPhotoMap(map)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  function handlePlusClick(dateStr) {
    const now = new Date()
    const type = now.getHours() < 12 ? '출근' : '퇴근'
    const existing = photoMap[dateStr] || {}
    const alreadyHas = type === '출근' ? !!existing.commute : !!existing.leave
    setPendingDate(dateStr)
    setConfirm({ type, alreadyHas })
  }

  function handleConfirmYes() { setConfirm(null); fileInputRef.current?.click() }
  function handleConfirmNo()  { setConfirm(null); setPendingDate(null) }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || !pendingDate) { e.target.value = ''; return }
    e.target.value = ''
    setUploading(true)
    try {
      const now = new Date()
      const type = now.getHours() < 12 ? '출근' : '퇴근'
      const timestamp = dayjs().format('YYYY.MM.DD HH:mm')
      const resized = await resizeImage(file)
      const base64 = resized.split(',')[1]
      await api.saveDashcamPhoto({ techName: user.name, base64Image: base64, mimeType: 'image/jpeg', timestamp, date: pendingDate, type })
      await loadData()
    } catch (err) {
      alert('사진 저장 중 오류가 발생했습니다.\n' + err.message)
    } finally { setUploading(false); setPendingDate(null) }
  }

  const firstDay = currentMonth.startOf('month').day()
  const daysInMonth = currentMonth.daysInMonth()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="pb-4">
      {/* 월 네비게이션 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))} className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold text-gray-900">{currentMonth.format('YYYY년 M월')}</span>
        <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))} className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="bg-white mx-3 mt-3 rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`text-center text-xs font-medium py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) return <div key={'empty-' + idx} className="min-h-[76px] border-b border-r border-gray-50" />
              const dateStr = currentMonth.date(day).format('YYYY-MM-DD')
              const isToday = dateStr === today
              const isFuture = dateStr > today
              const isSunday = idx % 7 === 0
              const isSaturday = idx % 7 === 6
              const photo = photoMap[dateStr] || {}
              return (
                <div key={dateStr} className={`min-h-[76px] border-b border-r border-gray-50 p-1 flex flex-col ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className="flex justify-center mb-0.5">
                    <span className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white text-[11px]' : isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700'}`}>{day}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1 items-stretch">
                    {photo.commute && <span className="text-[9px] font-medium bg-teal-100 text-teal-700 rounded px-0.5 py-0.5 text-center leading-tight">출근완료</span>}
                    {photo.leave   && <span className="text-[9px] font-medium bg-orange-100 text-orange-600 rounded px-0.5 py-0.5 text-center leading-tight">퇴근완료</span>}
                  </div>
                  {isToday && !isFuture && (
                    <div className="flex justify-center mt-0.5">
                      <button onClick={() => handlePlusClick(dateStr)} disabled={uploading} className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-base font-bold hover:bg-blue-700 disabled:opacity-50 leading-none">+</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mx-3 mt-3 flex gap-4 px-1">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-100 border border-teal-300 inline-block" /><span className="text-xs text-gray-500">출근완료</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-300 inline-block" /><span className="text-xs text-gray-500">퇴근완료</span></div>
      </div>
      <p className="mx-3 mt-2 px-1 text-xs text-gray-400">오늘 날짜의 + 버튼을 눌러 계기판 사진을 촬영하세요. 오전 12시 이전은 출근, 이후는 퇴근으로 등록됩니다.</p>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />

      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">촬영하시겠습니까?</h3>
            <p className="text-sm text-gray-600 mb-1">
              <span className={confirm.type === '출근' ? 'text-teal-600 font-semibold' : 'text-orange-500 font-semibold'}>{confirm.type} 사진</span>으로 등록됩니다.
            </p>
            {confirm.alreadyHas && <p className="text-xs text-red-500 mb-4">이미 {confirm.type} 사진이 있습니다. 덮어쓰시겠습니까?</p>}
            <div className={confirm.alreadyHas ? '' : 'mb-4'} />
            <div className="flex gap-3">
              <button onClick={handleConfirmNo} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium">취소</button>
              <button onClick={handleConfirmYes} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">확인</button>
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black/60 flex flex-col items-center justify-center z-50">
          <svg className="animate-spin w-10 h-10 text-white mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-white text-sm font-medium">사진 저장 중...</p>
          <p className="text-white/70 text-xs mt-1">잠시만 기다려주세요</p>
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function TechVehicle() {
  const { user } = useAuth()
  const [tab, setTab] = useState('leave')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">근태관리</h1>
        <span className="text-sm text-gray-500">{user.name}</span>
      </div>

      {/* 탭 */}
      <div className="bg-white px-4 py-2 border-b border-gray-100">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[['leave', '연차'], ['dashcam', '계기판']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${tab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'leave'   && <LeaveTab user={user} />}
      {tab === 'dashcam' && <DashcamTab user={user} />}
    </div>
  )
}
