export async function POST(req) {
  const { names, kind } = await req.json();

  let prompt = 'You are a data-cleaning assistant. Below is a list of ' + (kind || 'item') + ' names extracted from invoices. Some refer to the SAME real-world ' + (kind || 'item') + ' but are written differently (for example different spellings, abbreviations, or city name variants like Bangalore and Bengaluru, or company suffix differences like Pvt Ltd and Private Limited). ';
  prompt += 'Group together the names that refer to the same real-world ' + (kind || 'item') + '. Choose the most complete and correct spelling as the canonical name for each group. ';
  prompt += 'Only merge names you are confident are truly the same. If unsure, keep them separate. ';
  prompt += 'Here is the list: ' + JSON.stringify(names) + '. ';
  prompt += 'Return ONLY a valid JSON object with a single key named mapping, whose value is an object that maps each original name to its canonical name. Every original name from the list must appear as a key. No other text, no markdown, no code fences.';

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
    let mapping = {};
    try { const p = JSON.parse(content); if (p.mapping) mapping = p.mapping; } catch (e) {}
    return Response.json({ mapping });
  } catch (err) {
    return Response.json({ mapping: {} });
  }
}