export function computeConfidence({ extracted, vendors, agreements }) {
  let vendorMatch = 0;
  let matchedVendor = null;
  for (const v of vendors) {
    if (extracted.vendor_name && v.name && extracted.vendor_name.toLowerCase().includes(v.name.toLowerCase())) {
      vendorMatch = 100; matchedVendor = v; break;
    }
  }
  let gstMatch = 0;
  let matchedAgreement = null;
  for (const a of agreements) {
    const sameVendor = matchedVendor ? (a.vendor_id === matchedVendor.id || (a.vendor_name && a.vendor_name.toLowerCase() === matchedVendor.name.toLowerCase())) : false;
    if (sameVendor) {
      matchedAgreement = a;
      if (a.gst_number && extracted.gst_number && a.gst_number.toUpperCase() === extracted.gst_number.toUpperCase()) gstMatch = 100;
      break;
    }
  }
  let agreementActive = 0;
  if (matchedAgreement && matchedAgreement.start_date && matchedAgreement.end_date) {
    const today = new Date();
    const start = new Date(matchedAgreement.start_date);
    const end = new Date(matchedAgreement.end_date);
    if (today >= start && today <= end) agreementActive = 100;
  }
  let filled = 0; const total = 5;
  ['vendor_name','invoice_number','invoice_date','total_amount','gst_number'].forEach(k=>{ if (extracted[k]) filled++; });
  const completeness = Math.round((filled/total)*100);
  const confidence = Math.round((vendorMatch + gstMatch + agreementActive + completeness)/4);
  return { vendorMatch, gstMatch, agreementActive, completeness, confidence, matchedVendor, matchedAgreement };
}