import { useRegisterSW } from 'virtual:pwa-register/react'

// 새 버전이 배포되면 우측 상단에 빨간 글씨로 "업데이트" 안내를 띄운다.
export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      // 앱을 오래 켜둬도 30분마다 새 버전을 확인
      if (r) {
        setInterval(() => { r.update() }, 30 * 60 * 1000)
      }
    },
  })

  if (!needRefresh) return null

  return (
    <button
      onClick={() => updateServiceWorker(true)}
      className="fixed top-2 right-2 z-[100] bg-white border border-red-300 shadow-md rounded-full px-3 py-1.5 text-xs font-bold text-red-600 active:bg-red-50 animate-pulse"
    >
      🔄 새 버전 업데이트
    </button>
  )
}
