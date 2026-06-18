export async function POST(req) {
  const { stats } = await req.json();

  let prompt = 'You are a financial analyst for an invoice platform called OmniFlow. Based on this real invoice data, write a concise professional analysis. ';
  prompt += 'DATA: Total invoices: ' + stats.totalInvoices + '. ';
  prompt += 'Total spend: Rs. ' + stats.totalSpend + '. ';
  prompt += 'Approved: ' + stats.approved + ', Pending: ' + stats.pending + ', Rejected: ' + stats.rejected + '. ';
  prompt += 'Total GST: Rs. ' + stats.totalGst + '. ';
  prompt += 'Monthly spend: ' + JSON.stringify(stats.monthly) + '. ';
  prompt += 'Top vendors: ' + JSON.stringify(stats.topVendors) + '. ';
  prompt += 'Spend by location: ' + JSON.stringify(stats.byLocation) + '. ';
  prompt += 'Months of data available: ' + stats.monthCount + '. ';
  prompt += 'Next-month projection already calculated from monthly average: Rs. ' + stats.projection + '. ';
  prompt += 'INSTRUCTIONS: Return ONLY a valid JSON object with exactly these keys: summary (a 2-3 sentence overview), insights (an array of 4 short one-sentence bullets), projection_note (1-2 sentences explaining the Rs. ' + stats.projection + ' projection and noting it is based on only ' + stats.monthCount + ' month(s) of data so it is an early estimate). ';
  prompt += 'Use the actual numbers. Do not invent data. Do not wrap in markdown. Return only the JSON object.';

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    let content = '';
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      content = data.choices[0].message.content || '';
    }
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) content = content.substring(start, end + 1);
    let parsed;
    try { parsed = JSON.parse(content); }
    catch (e) { parsed = { summary: 'Could not generate insights at this time.', insights: [], projection_note: '' }; }
    return Response.json(parsed);
  } catch (err) {
    return Response.json({ summary: 'Error generating insights: ' + err.message, insights: [], projection_note: '' });
  }
}