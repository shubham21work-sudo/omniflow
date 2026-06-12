export function extractInvoiceFields(text) {
  const result = { vendor_name:'', invoice_number:'', invoice_date:'', gst_number:'', base_amount:'', gst_amount:'', total_amount:'', location:'' };
  if (!text) return result;
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);

  const findValueAfter = (labelRegex, valueRegex, lookahead) => {
    for (let i=0;i<lines.length;i++) {
      if (labelRegex.test(lines[i])) {
        const sameLine = lines[i].replace(labelRegex,'').trim();
        if (sameLine) { const m1 = sameLine.match(valueRegex); if (m1) return m1[0]; }
        for (let j=1;j<=lookahead;j++) {
          if (lines[i+j]) { const m2 = lines[i+j].match(valueRegex); if (m2) return m2[0]; }
        }
      }
    }
    return '';
  };

  const gstMatch = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b/);
  if (gstMatch) result.gst_number = gstMatch[0];

  const invRegex = /[A-Z]{1,5}\/[A-Z0-9]{1,5}\/\d{4}\/\d+/;
  let inv = findValueAfter(/Invoice\s*No/i, invRegex, 2);
  if (!inv) { const m = text.match(invRegex); if (m) inv = m[0]; }
  result.invoice_number = inv;

  const dateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
  let dt = findValueAfter(/Invoice\s*Date/i, dateRegex, 2);
  if (!dt) { const m = text.match(dateRegex); if (m) dt = m[0]; }
  result.invoice_date = dt;

  const nameRegex = /^[A-Za-z][A-Za-z &.,'-]{4,70}$/;
  let vendor = findValueAfter(/Bill\s*From/i, nameRegex, 3);
  if (!vendor) {
    for (const line of lines) {
      if (/(Pvt|Private|Limited|LLP)/i.test(line) && nameRegex.test(line)) { vendor = line; break; }
    }
  }
  result.vendor_name = vendor;

  const amtRegex = /[\d,]+\.\d{2}/;
  let sub = findValueAfter(/Sub\s*Total/i, amtRegex, 2);
  let grand = findValueAfter(/Grand\s*Total/i, amtRegex, 2);
  let cgst = findValueAfter(/CGST/i, amtRegex, 2);
  let sgst = findValueAfter(/SGST/i, amtRegex, 2);
  let igst = findValueAfter(/IGST/i, amtRegex, 2);
  if (!grand) { const m = findValueAfter(/Total/i, amtRegex, 2); if (m) grand = m; }

  result.base_amount = sub ? sub.replace(/,/g,'') : '';
  result.total_amount = grand ? grand.replace(/,/g,'') : '';
  let gstTotal = 0;
  if (cgst) gstTotal += parseFloat(cgst.replace(/,/g,''));
  if (sgst) gstTotal += parseFloat(sgst.replace(/,/g,''));
  if (igst) gstTotal += parseFloat(igst.replace(/,/g,''));
  if (gstTotal>0) result.gst_amount = gstTotal.toFixed(2);

  return result;
}