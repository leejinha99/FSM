import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import dayjs from 'dayjs'
import { api } from '../api/sheetsApi.js'

const ALERT_OPTIONS = ['끄기', '10분전', '30분전', '1시간전']

const inputClass = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
const disabledClass = 'w-full px-3.5 py-2.5 border border-gray-100 rounded-xl text-gray-400 text-sm bg-gray-50'

function SectionLabel({ children }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{children}</label>
  )
}

export default function VisitEdit() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const visit = location.state?.visit

  const [form, setForm] = useState({
    visitDate:         visit?.visitDate || dayjs().format('YYYY-MM-DD'),
    visitTime:         visit?.visitTime || '',
    alertSetting:      visit?.alertSetting || '끄기',
    workContent:       visit?.workContent || '',
    nextScheduledDate: visit?.nextScheduledDate || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!visit) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-lg mx-auto flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm">방문 정보를 불러올 수 없습니다.</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm font-medium">돌아가기</button>
      </div>
    )
  }

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.visitDate || !form.visitTime) {
      setError('방문일과 방문시간은 필수입니다.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.updateVisit(visitId, form)
      navigate(-1)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 pt-12 pb-4 sticky top-0 z-30 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-900">방문 수정</h1>
          <p className="text-xs text-gray-400">{visit.schoolName}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-32">
        {/* 읽기 전용 정보 */}
        <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">학교</span>
            <span className="font-semibold text-gray-800">{visit.schoolName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">방문유형</span>
            <span className="font-semibold text-gray-800">{visit.visitType}</span>
          </div>
        </div>

        {/* 방문일 + 방문시간 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <SectionLabel>방문일</SectionLabel>
            <input
              type="date"
              value={form.visitDate}
              onChange={e => set('visitDate', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <SectionLabel>방문시간</SectionLabel>
            <input
              type="time"
              value={form.visitTime}
              onChange={e => set('visitTime', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* 알림설정 */}
        <div>
          <SectionLabel>알림설정</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {ALERT_OPTIONS.map(opt => (
              <button
                type="button"
                key={opt}
                onClick={() => set('alertSetting', opt)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition border
                  ${form.alertSetting === opt
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 작업내용 */}
        <div>
          <SectionLabel>작업내용</SectionLabel>
          <textarea
            value={form.workContent}
            onChange={e => set('workContent', e.target.value)}
            rows={4}
            placeholder="작업 내용을 입력하세요"
            className={inputClass + ' resize-none'}
          />
        </div>

        {/* 다음예정일 */}
        <div>
          <SectionLabel>다음예정일</SectionLabel>
          <input
            type="date"
            value={form.nextScheduledDate}
            onChange={e => set('nextScheduledDate', e.target.value)}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
      </form>

      {/* 저장 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pb-6 pt-3 bg-white border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-2xl
            hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '저장 중...' : '수정 완료'}
        </button>
      </div>
    </div>
  )
}
