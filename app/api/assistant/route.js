export async function POST(req) {
  const { question, snapshot, history } = await req.json();

  let sys = 'You are OmniFlow Assistant, a helpful AI inside an invoice-approval platform called OmniFlow. ';
  sys += 'You answer questions ONLY about the OmniFlow business data provided below (invoices, vendors, agreements, approvals, finance payments, analytics). ';
  sys += 'If the user asks anything NOT related to this OmniFlow data (general knowledge, jokes, coding, weather, etc.), politely refuse and say you can only help with questions about their OmniFlow invoices, vendors, and finances. ';
  sys += 'Be concise and specific. Use actual numbers from the data. Format amounts as Rs. with Indian comma style. If the data does not contain the answer, say so honestly. ';
  sys += 'Here is the current OmniFlow data snapshot in JSON: ' + JSON.stringify(snapshot);

  const messages = [{ role: 'system', content: sys }];
  if (Array.isArray(history)) { for (const h of history) { if (h && h.role && h.content) messages.push({ role: h.role, content: h.content }); } }
  messages.push({ role: 'user', content: question });

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: messages, temperature: 0.3 }),
    });
    const data = await res.json();
    let answer = 'Sorry, I could not generate a response.';
    if (data && data.choices && data.choices[0] && data.choices[0].message) answer = data.choices[0].message.content || answer;
    return Response.json({ answer });
  } catch (err) {
    return Response.json({ answer: 'Error: ' + err.message });
  }
}