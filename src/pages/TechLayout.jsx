import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotification } from '../context/NotificationContext.jsx'
import BottomNav from '../components/BottomNav.jsx'

const NAV_ITEMS = [
  {
    key: 'calendar',
    path: '/calendar',
    label: '캘린더',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'stock',
    path: '/stock',
    label: '내 재고',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'as',
    path: '/as',
    label: 'AS 접수함',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    key: 'managed',
    path: '/managed',
    label: '관리계정',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'vehicle',
    path: '/vehicle',
    label: '차량관리',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h10l2-2zM13 6l2.5 5H20a1 1 0 011 1v3a1 1 0 01-1 1h-1" />
      </svg>
    ),
  },
]

export default function TechLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { asUnread } = useNotification()

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* 데스크탑 사이드바 (md+) */}
      <nav className="hidden md:flex flex-col w-[200px] bg-blue-800 text-white fixed top-0 bottom-0 left-0 z-30">
        <div className="px-4 pt-8 pb-5 border-b border-blue-700">
          <h1 className="text-sm font-bold">웰라수 FSM</h1>
          <p className="text-xs text-blue-300 mt-1">{user?.name} 기사</p>
        </div>

        <div className="flex-1 py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.path)
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left
                  ${active ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-700/60 hover:text-white'}`}
              >
                {item.icon(active)}
                <span>{item.label}</span>
                {item.key === 'as' && asUnread > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {asUnread > 9 ? '9+' : asUnread}
                  </span>
                )}
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

      {/* 콘텐츠 영역 */}
      <div className="flex-1 md:ml-[200px]">
        <Outlet />
      </div>

      {/* 모바일 하단 네비게이션 */}
      <BottomNav />
    </div>
  )
}
