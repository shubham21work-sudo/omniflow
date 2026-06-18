export async function POST(req) {
  const { vendorName, rawText } = await req.json();

  let prompt = 'You are an expense categorization assistant. Based on the vendor name and invoice text, classify this invoice into EXACTLY ONE of these categories: Rent, Coffee, Consumables, Manpower, IT, Utilities, Travel, Maintenance, Other. ';
  prompt += 'Vendor name: ' + (vendorName || 'unknown') + '. ';
  prompt += 'Invoice text (may be partial): ' + ((rawText || '').slice(0, 1500)) + '. ';
  prompt += 'Return ONLY a valid JSON object with a single key named category whose value is one of the listed options exactly. No other text, no markdown, no code fences.';

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0 }),
    });
    const data = await res.json();
    let content = '';
    if (data && data.choices && data.choices[0] && data.choices[0].message) content = data.choices[0].message.content || '';
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) content = content.substring(start, end + 1);
    let category = 'Other';
    try { const p = JSON.parse(content); if (p.category) category = p.category; } catch (e) {}
    const allowed = ['Rent','Coffee','Consumables','Manpower','IT','Utilities','Travel','Maintenance','Other'];
    if (!allowed.includes(category)) category = 'Other';
    return Response.json({ category });
  } catch (err) {
    return Response.json({ category: 'Other' });
  }
}