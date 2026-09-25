// Vercel Serverless Function for Dien Mat Troi Xanh AI Chat
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body || {};
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel' });

  const systemPrompt = `Bạn là Chuyên viên Kỹ thuật & Tư vấn AI của Công ty TNHH Điện Mặt Trời Xanh (Điện Mặt Trời XANH - Tiên Phong Năng Lượng Sạch).
Trả lời thẳng vào trọng tâm, súc tích, chuyên nghiệp bằng tiếng Việt.
Thông tin công ty:
- Hotline / Zalo 24/7: 0787 691 089
- VP TP.HCM: 364 Cộng Hòa, P.13, Tân Bình, TP.HCM
- CN Gia Lai: Tổ 47, KP 5, P. Quy Nhơn Nam, Gia Lai
- Gói bám tải 5kWp: ~45 - 55 triệu VNĐ (tiết kiệm ~1.5 - 2 triệu/tháng).
- Gói bám tải 10kWp: ~85 - 95 triệu VNĐ (tiết kiệm ~3 - 3.5 triệu/tháng).
- Hệ Hybrid 5kW + Pin Lithium 10kWh: ~115 - 135 triệu VNĐ (điện 24/7 khi cúp điện).
- Bơm nông nghiệp 3HP - 10HP cho rẫy cà phê, sầu riêng Gia Lai/Tây Nguyên.
- Thiết bị Tier-1: Solis, Deye, Canadian Solar, LONGi, Pylontech. Bảo hành 10 - 25 năm. Khảo sát 3D miễn phí.`;

  const models = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
  const contents = [
    ...history.slice(-6).map(h => ({
      role: h.role || 'user',
      parts: h.parts || [{ text: '' }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: contents,
          generationConfig: { maxOutputTokens: 600, temperature: 0.5 }
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.status(200).json({ reply: reply });
      }
    } catch (err) {
      console.warn(`Error with ${model}:`, err.message);
    }
  }

  return res.status(503).json({ error: 'AI models busy' });
}
