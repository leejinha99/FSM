import { useCallback, useState } from 'react'
import { api } from '../api/sheetsApi.js'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY
}

export function usePushSubscription(techId) {
  const [status, setStatus] = useState('idle') // idle | requesting | granted | denied | error

  const subscribe = useCallback(async () => {
    if (!isPushSupported() || !techId) return false
    setStatus('requesting')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return false
      }
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      }
      await api.savePushSubscription(techId, subscription.toJSON())
      setStatus('granted')
      return true
    } catch (e) {
      console.error(e)
      setStatus('error')
      return false
    }
  }, [techId])

  return { status, subscribe }
}
