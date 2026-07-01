import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:wellasu-fsm@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })
  if (req.headers['x-api-secret'] !== process.env.PUSH_API_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const { subscription, title, body, url } = req.body || {}
  if (!subscription) return res.status(400).json({ success: false, error: 'subscription is required' })

  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title, body, url }), { urgency: 'high' })
    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(200).json({ success: false, error: e.message, statusCode: e.statusCode })
  }
}
