export async function POST(req) {
  const { rawText } = await req.json();

  const prompt = 'Extract the following fields from this invoice text and return ONLY a valid JSON object with these exact keys: vendor_name, invoice_number, invoice_date, gst_number, base_amount, gst_amount, total_amount, location. Rules: vendor_name is the SELLER or SUPPLIER company name issuing the invoice, the one billing FROM, not the buyer or recipient. invoice_date must be in YYYY-MM-DD format. gst_number is the SELLER GSTIN, 15 characters. base_amount is the taxable value before tax. gst_amount is the total tax amount, sum of CGST plus SGST or IGST. total_amount is the grand total payable. location is the seller city or state. If a field is missing use an empty string. Return only the JSON object and nothing else.\n\nInvoice text:\n' + rawText;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    }),
  });

  const data = await res.json();
  let content = '';
  if (data && data.choices && data.choices[0] && data.choices[0].message) {
    content = data.choices[0].message.content || '';
  }

  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start !== -1 && end !== -1) content = content.substring(start, end+1);

  let fields;
  try {
    fields = JSON.parse(content);
  } catch (e) {
    fields = { vendor_name:'', invoice_number:'', invoice_date:'', gst_number:'', base_amount:'', gst_amount:'', total_amount:'', location:'' };
  }

  return Response.json(fields);
}