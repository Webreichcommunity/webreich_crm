export const DEFAULT_PROJECT_TYPES = ['Website', 'Internship', 'Custom'];
export const DEFAULT_PRODUCTS = ['Website', 'Custom Software', 'Civil CRM', 'Hotel CRM', 'Jewellery Website', 'Gold Rate Board', 'Other'];
export const DEFAULT_PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];
export const DEFAULT_MEETING_TYPES = ['Call', 'Office Visit', 'Online Demo', 'Follow-up'];

export const formatINR = (value = 0) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export const getMonthKey = (date) => new Date(date).toISOString().slice(0, 7);

export const buildSerial = ({ product, date, normalCounter, goldCounter }) => {
  const productLower = (product || '').toLowerCase();
  if (productLower.includes('gold rate board')) {
    return `WR-GOLD-${String(goldCounter).padStart(3, '0')}`;
  }
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `WR-${dd}${mm}${yy}-${normalCounter}`;
};
