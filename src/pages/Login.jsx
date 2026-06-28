import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, isMockMode } from '../api/sheetsApi.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!id.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const userData = await api.login(id.trim(), password)
      login(userData)
      if (userData.role === '관리자') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/calendar', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-blue-800 px-6">
      {/* 로고 영역 */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h1 className="text-white text-2xl font-bold">웰라수 FSM</h1>
        <p className="text-blue-200 text-sm mt-1">정수기 유지관리 시스템</p>
      </div>

      {/* 로그인 카드 */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-gray-800 text-lg font-semibold mb-6 text-center">로그인</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">아이디</label>
            <input
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              placeholder="아이디 입력"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-base
              hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                확인 중...
              </>
            ) : '로그인'}
          </button>
        </form>
      </div>

      {isMockMode && (
        <div className="mt-4 bg-yellow-500/20 border border-yellow-400/30 rounded-xl px-4 py-3 w-full max-w-sm">
          <p className="text-yellow-100 text-xs font-medium mb-1">목(Mock) 데이터 모드</p>
          <p className="text-yellow-200 text-xs">기사: kim01 / 1234 &nbsp;|&nbsp; 관리자: admin / admin1234</p>
        </div>
      )}

      <p className="text-blue-300 text-xs mt-8">© 2026 웰라수. All rights reserved.</p>
    </div>
  )
}
