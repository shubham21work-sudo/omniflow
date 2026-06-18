function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/private limited|pvt ltd|pvt\.? ltd\.?|private ltd|limited|ltd\.?|llp|&|\.|,/g, ' ').replace(/\s+/g, ' ').trim();
}

function gstList(gstin) {
  if (!gstin) return [];
  return gstin.split(',').map(g => g.toUpperCase().trim()).filter(Boolean);
}

export function computeConfidence({ extracted, vendors, agreements }) {
  let vendorMatch = 0;
  let matchedVendor = null;
  const invGst = (extracted.gst_number || '').toUpperCase().trim();
  const invName = normalizeName(extracted.vendor_name);

  // 1. Match by GST first (a vendor may have several GSTINs)
  if (invGst) {
    for (const v of vendors) {
      if (gstList(v.gstin).includes(invGst)) {
        vendorMatch = 100; matchedVendor = v; break;
      }
    }
  }

  // 2. Fall back to fuzzy name matching
  if (!matchedVendor && invName) {
    for (const v of vendors) {
      const vName = normalizeName(v.name);
      if (vName && (invName.includes(vName) || vName.includes(invName))) {
        vendorMatch = 100; matchedVendor = v; break;
      }
    }
  }

  let gstMatch = 0;
  if (matchedVendor && invGst && gstList(matchedVendor.gstin).includes(invGst)) {
    gstMatch = 100;
  }

  let matchedAgreement = null;
  for (const a of agreements) {
    const sameVendor = matchedVendor ? (a.vendor_id === matchedVendor.id || (a.vendor_name && normalizeName(a.vendor_name) === normalizeName(matchedVendor.name))) : false;
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