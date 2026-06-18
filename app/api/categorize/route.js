export async function POST(req) {
  const { vendorName, rawText } = await req.json();

  let prompt = 'You are an expense analysis assistant for an invoice platform. Look at the vendor name and invoice text. ';
  prompt += 'First, classify the invoice into EXACTLY ONE of these categories: Rent, Coffee, Consumables, Manpower, IT, Utilities, Travel, Maintenance, Other. ';
  prompt += 'Second, write a short one-sentence remark (max 20 words) that says what the invoice appears to be for and whether anything looks notable (for example missing details or unusually high amount). ';
  prompt += 'Vendor name: ' + (vendorName || 'unknown') + '. ';
  prompt += 'Invoice text (may be partial): ' + ((rawText || '').slice(0, 1500)) + '. ';
  prompt += 'Return ONLY a valid JSON object with two keys: category (one of the listed options exactly) and remark (your one-sentence note). No other text, no markdown, no code fences.';

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
    let category = 'Other'; let remark = '';
    try { const p = JSON.parse(content); if (p.category) category = p.category; if (p.remark) remark = p.remark; } catch (e) {}
    const allowed = ['Rent','Coffee','Consumables','Manpower','IT','Utilities','Travel','Maintenance','Other'];
    if (!allowed.includes(category)) category = 'Other';
    return Response.json({ category, remark });
  } catch (err) {
    return Response.json({ category: 'Other', remark: '' });
  }
}