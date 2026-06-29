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

export default function TechVehicle() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().startOf('month'))
  const [photoMap, setPhotoMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [pendingDate, setPendingDate] = useState(null)
  const fileInputRef = useRef()
  const today = dayjs().format('YYYY-MM-DD')

  useEffect(() => {
    loadData()
  }, [currentMonth])

  async function loadData() {
    setLoading(true)
    try {
      const data = await api.getDashcamPhotos(user.name, currentMonth.year(), currentMonth.month() + 1)
      const map = {}
      data.forEach(d => { map[d.date] = { commute: d.commute, leave: d.leave } })
      setPhotoMap(map)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  function handlePlusClick(dateStr) {
    const now = new Date()
    const type = now.getHours() < 12 ? '출근' : '퇴근'
    const existing = photoMap[dateStr] || {}
    const alreadyHas = type === '출근' ? !!existing.commute : !!existing.leave
    setPendingDate(dateStr)
    setConfirm({ type, alreadyHas })
  }

  function handleConfirmYes() {
    setConfirm(null)
    fileInputRef.current?.click()
  }

  function handleConfirmNo() {
    setConfirm(null)
    setPendingDate(null)
  }

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

      await api.saveDashcamPhoto({
        techName: user.name,
        base64Image: base64,
        mimeType: 'image/jpeg',
        timestamp,
        date: pendingDate,
        type,
      })

      await loadData()
    } catch (err) {
      alert('사진 저장 중 오류가 발생했습니다.\n' + err.message)
    } finally {
      setUploading(false)
      setPendingDate(null)
    }
  }

  // 캘린더 그리드 구성
  const firstDay = currentMonth.startOf('month').day()
  const daysInMonth = currentMonth.daysInMonth()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">차량관리</h1>
        <span className="text-sm text-gray-500">{user.name}</span>
      </div>

      {/* 월 네비게이션 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button
          onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold text-gray-900">
          {currentMonth.format('YYYY년 M월')}
        </span>
        <button
          onClick={() => setCurrentMonth(m => m.add(1, 'month'))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 캘린더 */}
      <div className="bg-white mx-3 mt-3 rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-medium py-2 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {d}
            </div>
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
              if (!day) {
                return (
                  <div
                    key={'empty-' + idx}
                    className="min-h-[76px] border-b border-r border-gray-50"
                  />
                )
              }

              const dateStr = currentMonth.date(day).format('YYYY-MM-DD')
              const isToday = dateStr === today
              const isFuture = dateStr > today
              const isSunday = idx % 7 === 0
              const isSaturday = idx % 7 === 6
              const photo = photoMap[dateStr] || {}
              const hasCommute = !!photo.commute
              const hasLeave = !!photo.leave

              return (
                <div
                  key={dateStr}
                  className={`min-h-[76px] border-b border-r border-gray-50 p-1 flex flex-col ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* 날짜 숫자 */}
                  <div className="flex justify-center mb-0.5">
                    <span
                      className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-blue-600 text-white text-[11px]'
                          : isSunday
                          ? 'text-red-500'
                          : isSaturday
                          ? 'text-blue-500'
                          : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </span>
                  </div>

                  {/* 상태 뱃지 */}
                  <div className="flex flex-col gap-0.5 flex-1 items-stretch">
                    {hasCommute && (
                      <span className="text-[9px] font-medium bg-teal-100 text-teal-700 rounded px-0.5 py-0.5 text-center leading-tight">
                        출근완료
                      </span>
                    )}
                    {hasLeave && (
                      <span className="text-[9px] font-medium bg-orange-100 text-orange-600 rounded px-0.5 py-0.5 text-center leading-tight">
                        퇴근완료
                      </span>
                    )}
                  </div>

                  {/* + 버튼 (오늘만) */}
                  {isToday && !isFuture && (
                    <div className="flex justify-center mt-0.5">
                      <button
                        onClick={() => handlePlusClick(dateStr)}
                        disabled={uploading}
                        className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-base font-bold hover:bg-blue-700 disabled:opacity-50 leading-none"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="mx-3 mt-3 flex gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-teal-100 border border-teal-300 inline-block" />
          <span className="text-xs text-gray-500">출근완료</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-100 border border-orange-300 inline-block" />
          <span className="text-xs text-gray-500">퇴근완료</span>
        </div>
      </div>

      {/* 안내 문구 */}
      <p className="mx-3 mt-2 px-1 text-xs text-gray-400">
        오늘 날짜의 + 버튼을 눌러 계기판 사진을 촬영하세요. 오전 12시 이전은 출근, 이후는 퇴근으로 등록됩니다.
      </p>

      {/* 숨김 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* 촬영 확인 모달 */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">촬영하시겠습니까?</h3>
            <p className="text-sm text-gray-600 mb-1">
              <span
                className={
                  confirm.type === '출근'
                    ? 'text-teal-600 font-semibold'
                    : 'text-orange-500 font-semibold'
                }
              >
                {confirm.type} 사진
              </span>
              으로 등록됩니다.
            </p>
            {confirm.alreadyHas ? (
              <p className="text-xs text-red-500 mb-4">
                이미 {confirm.type} 사진이 있습니다. 덮어쓰시겠습니까?
              </p>
            ) : (
              <div className="mb-4" />
            )}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmNo}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium"
              >
                취소
              </button>
              <button
                onClick={handleConfirmYes}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 업로드 중 오버레이 */}
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
