export async function POST(req) {
  const { summary } = await req.json();

  let prompt = 'You are an operations analyst for an invoice approval platform. ';
  prompt += 'Below are turn-around-time (TAT) numbers in days for the approval workflow. ';
  prompt += 'The target is: each approver should approve within ' + (summary.approver_limit_days || 2) + ' days, and finance should pay within ' + (summary.finance_limit_days || 3) + ' days after final approval. ';
  prompt += 'Average days Approver 1 took: ' + (summary.avg_approver_1 === null ? 'no data' : summary.avg_approver_1) + '. ';
  prompt += 'Average days Approver 2 took: ' + (summary.avg_approver_2 === null ? 'no data' : summary.avg_approver_2) + '. ';
  prompt += 'Average days Approver 3 took: ' + (summary.avg_approver_3 === null ? 'no data' : summary.avg_approver_3) + '. ';
  prompt += 'Average days finance took to pay after approval: ' + (summary.avg_payment === null ? 'no data' : summary.avg_payment) + '. ';
  prompt += 'Total invoices analysed: ' + (summary.total_invoices || 0) + '. Payments that missed the finance deadline: ' + (summary.delayed_payments || 0) + '. ';
  prompt += 'Write a short, practical analysis in 3 to 4 sentences. Point out which stage is the slowest bottleneck, whether targets are being met, and one concrete suggestion to improve speed. If data is limited, say so honestly. Use plain language, no markdown, no bullet points.';

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.3 }),
    });
    const data = await res.json();
    let content = '';
    if (data && data.choices && data.choices[0] && data.choices[0].message) content = data.choices[0].message.content || '';
    return Response.json({ insight: content.trim() });
  } catch (err) {
    return Response.json({ insight: 'Could not generate insight right now.' });
  }
}