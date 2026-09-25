// Vercel / Netlify / Node.js Serverless Function for Điện Mặt Trời Xanh AI Chat
// Place this in the api/ folder.
// In your Vercel or Netlify dashboard, set Environment Variable: GEMINI_API_KEY = your_key

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [] } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment variables' });
  }

  const systemPrompt = `Bạn là Chuyên viên Kỹ thuật & Tư vấn AI của Công ty TNHH Điện Mặt Trời Xanh (Điện Mặt Trời XANH - Tiên Phong Năng Lượng Sạch).
QUY TẮC CỐT LÕI:
1. KHÔNG lặp lại câu chào "Dạ chào Anh/Chị! Em là Trợ lý AI..." hay các lời chào khuôn mẫu dài dòng ở mỗi câu trả lời.
2. Trả lời thẳng vào trọng tâm câu hỏi của khách hàng, súc tích, chuyên nghiệp, thông tin kỹ thuật và báo giá thực tế, dễ hiểu, có gạch đầu dòng rõ ràng.
3. Nếu khách hỏi câu hỏi giao tiếp thông thường, địa lý, kiến thức chung (ví dụ "thủ đô Việt Nam là gì", "thời tiết hôm nay", "chào bạn"), hãy trả lời chính xác, lịch sự câu hỏi đó trước, sau đó khéo léo kết nối với giải pháp điện mặt trời nếu phù hợp.
4. Báo giá tham khảo:
   • Gói bám tải 5kWp: ~45 - 55 triệu VNĐ (tiết kiệm ~1.5 - 2 triệu/tháng).
   • Gói bám tải 10kWp: ~85 - 95 triệu VNĐ (tiết kiệm ~3 - 3.5 triệu/tháng).
   • Hệ Hybrid lưu trữ 5kW + Pin Lithium 10kWh: ~115 - 135 triệu VNĐ.
   • Bơm nông nghiệp 3HP - 10HP Tây Nguyên / Gia Lai.
   • Thiết bị chính hãng Tier-1: Solis, Deye, Canadian Solar, LONGi, Pylontech. Bảo hành tấm pin 12-25 năm, Inverter 5-10 năm.
5. Hotline / Zalo 24/7: 0787 691 089 | VP: 364 Cộng Hòa, Tân Bình, TP.HCM & Tổ 47, KP 5, Gia Lai.`;

  const models = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];

  const contents = [
    ...history.slice(-6).map(h => ({
      role: h.role || 'user',
      parts: h.parts || [{ text: '' }]
    })),
    {
      role: 'user',
      parts: [{ text: message }]
    }
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
        if (reply) {
          return res.status(200).json({ reply: reply });
        }
      }
    } catch (err) {
      console.warn(`Error with ${model}:`, err.message);
    }
  }

  return res.status(503).json({ error: 'All AI models are currently busy. Please try again shortly.' });
}
