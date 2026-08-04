export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const productId = process.env.VITE_PRODUCT_ID
  const intelUrl = process.env.INTEL_SUPABASE_URL
  const intelKey = process.env.INTEL_SUPABASE_KEY
  if (!intelUrl || !intelKey) return res.status(500).json({ error: 'Missing intel DB config' })
  try {
    const r = await fetch(
      `${intelUrl}/rest/v1/product_manuals?product_id=eq.${productId}&select=manual&limit=1`,
      { headers: { apikey: intelKey, Authorization: `Bearer ${intelKey}` } }
    )
    const data = await r.json()
    const manual = data?.[0]?.manual || null
    res.status(200).json({ manual })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
}
