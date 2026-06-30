import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const TABS = [
  { key: '',              label: '대시보드' },
  { key: 'schools',       label: '학교' },
  { key: 'techs',         label: '기사' },
  { key: 'visits',        label: '방문' },
  { key: 'as',            label: 'AS' },
  { key: 'tech-schedule', label: '관리일정' },
  { key: 'stock',         label: '재고' },
  { key: 'leave',         label: '근태' },
]

const SIDEBAR_ICONS = {
  '': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  'schools': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  'techs': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'visits': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'as': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  'tech-schedule': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  'stock': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  'leave': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
}

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const current = pathname.replace('/admin', '').replace(/^\//, '')

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* 모바일 상단 헤더 탭바 */}
      <header className="md:hidden bg-blue-700 text-white px-4 pt-10 pb-0 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-bold">웰라수 관리자</h1>
            <p className="text-xs text-blue-200">FSM 통합 관리</p>
          </div>
          <button
            onClick={logout}
            className="text-xs text-blue-200 border border-blue-500 px-3 py-1.5 rounded-full active:bg-blue-600 transition"
          >
            로그아웃
          </button>
        </div>

        <div className="flex overflow-x-auto scrollbar-hide -mx-1 px-1">
          {TABS.map(tab => {
            const active = current === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.key ? `/admin/${tab.key}` : '/admin')}
                className={`flex-shrink-0 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors
                  ${active
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-200 hover:text-white'}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* 데스크탑 사이드바 (md+) */}
      <nav className="hidden md:flex flex-col w-[200px] bg-blue-800 text-white fixed top-0 bottom-0 left-0 z-30">
        <div className="px-4 pt-8 pb-5 border-b border-blue-700">
          <h1 className="text-sm font-bold">웰라수 관리자</h1>
          <p className="text-xs text-blue-300 mt-0.5">FSM 통합 관리</p>
        </div>

        <div className="flex-1 py-3 px-2 space-y-0.5">
          {TABS.map(tab => {
            const active = current === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.key ? `/admin/${tab.key}` : '/admin')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left
                  ${active ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-700/60 hover:text-white'}`}
              >
                {SIDEBAR_ICONS[tab.key]}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="px-4 pb-8">
          <button
            onClick={logout}
            className="text-xs text-blue-300 hover:text-white transition border border-blue-600 rounded-full px-3 py-1.5 w-full text-center"
          >
            로그아웃
          </button>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 md:ml-[200px] overflow-y-auto pb-8">
        <Outlet />
      </main>
    </div>
  )
}
