export function computeConfidence({ extracted, vendors, agreements }) {
  let vendorMatch = 0;
  let matchedVendor = null;
  for (const v of vendors) {
    if (extracted.vendor_name && v.name && extracted.vendor_name.toLowerCase().includes(v.name.toLowerCase())) {
      vendorMatch = 100; matchedVendor = v; break;
    }
  }
  let gstMatch = 0;
  if (matchedVendor && matchedVendor.gstin && extracted.gst_number && matchedVendor.gstin.toUpperCase() === extracted.gst_number.toUpperCase()) {
    gstMatch = 100;
  }
  let matchedAgreement = null;
  for (const a of agreements) {
    const sameVendor = matchedVendor ? (a.vendor_id === matchedVendor.id || (a.vendor_name && a.vendor_name.toLowerCase() === matchedVendor.name.toLowerCase())) : false;
    if (sameVendor) { matchedAgreement = a; break; }
  }
  let amountCheck = 0;
  const base = parseFloat(extracted.base_amount) || 0;
  const gst = parseFloat(extracted.gst_amount) || 0;
  const total = parseFloat(extracted.total_amount) || 0;
  if (total > 0) {
    const diff = Math.abs((base + gst) - total);
    if (diff <= 1) amountCheck = 100;
  }
  let filled = 0; const fieldCount = 5;
  ['vendor_name','invoice_number','invoice_date','total_amount','gst_number'].forEach(k=>{ if (extracted[k]) filled++; });
  const completeness = Math.round((filled/fieldCount)*100);
  const confidence = Math.round((vendorMatch + gstMatch + amountCheck + completeness)/4);
  return { vendorMatch, gstMatch, amountCheck, completeness, confidence, matchedVendor, matchedAgreement };
}