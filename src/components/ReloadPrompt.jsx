import { useRegisterSW } from 'virtual:pwa-register/react'

// 새 버전이 배포되면 하단에 "업데이트" 배너를 띄운다.
export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
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
    <div className="fixed bottom-0 inset-x-0 z-[100] p-3 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-gray-900 text-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-md w-full">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">새 버전이 나왔어요</p>
          <p className="text-xs text-gray-300 mt-0.5">업데이트하면 최신 기능이 적용됩니다.</p>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 bg-blue-600 active:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl"
        >
          업데이트
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="shrink-0 text-gray-400 text-sm px-1 py-2"
        >
          나중에
        </button>
      </div>
    </div>
  )
}
