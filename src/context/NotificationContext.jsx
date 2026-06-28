import { createContext, useContext, useState } from 'react'

const NotificationContext = createContext({ asUnread: 0, setAsUnread: () => {} })

export function NotificationProvider({ children }) {
  const [asUnread, setAsUnread] = useState(0)
  return (
    <NotificationContext.Provider value={{ asUnread, setAsUnread }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  return useContext(NotificationContext)
}

export function getSeenAsIds(techId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(`as_seen_${techId}`) || '[]'))
  } catch {
    return new Set()
  }
}

export function markAsIdsSeen(techId, ids) {
  const seen = getSeenAsIds(techId)
  ids.forEach(id => seen.add(id))
  localStorage.setItem(`as_seen_${techId}`, JSON.stringify([...seen]))
}
