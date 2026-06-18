import { supabase } from './supabase';

export async function createNotification(recipientEmail, title, message, link, invoiceId) {
  if (!recipientEmail) return;
  try {
    await supabase.from('notifications').insert([{
      recipient_email: recipientEmail,
      title: title || 'Notification',
      message: message || '',
      link: link || '/approvals',
      invoice_id: invoiceId || null,
      is_read: false,
    }]);
  } catch (e) {
    console.error('Notification error:', e);
  }
}
