export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentRow {
  id: string;
  method: string;
  details: string;
  date: string;
  amount: number;
}

export interface ReceiptData {
  businessName: string;
  businessTaxId: string;
  businessAddress: string;
  businessPhone: string;
  logoUrl: string;
  documentType: string;
  documentNumber: string;
  date: string;
  time: string;
  isOriginal: boolean;
  customerName: string;
  customerTaxId: string;
  customerAddress: string;
  customerCity: string;
  customerPhone: string;
  customerFax: string;
  customerReference: string;
  allocationNumber: string;
  items: ReceiptItem[];
  includeVat: boolean;
  vatRate: number;
  discount: number;
  payments: PaymentRow[];
  documentProducer: string;
  recipientName: string;
  recipientSignature: string; // data-URL of the drawn signature image
  recipientDate: string;
}

function nowDate() {
  return new Date().toISOString().split('T')[0];
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const defaultReceiptData: ReceiptData = {
  businessName: '',
  businessTaxId: '',
  businessAddress: '',
  businessPhone: '',
  logoUrl: '',
  documentType: 'חשבונית מס',
  documentNumber: '1',
  date: nowDate(),
  time: nowTime(),
  isOriginal: false,
  customerName: '',
  customerTaxId: '',
  customerAddress: '',
  customerCity: '',
  customerPhone: '',
  customerFax: '',
  customerReference: '',
  allocationNumber: '',
  items: [{ id: '1', description: '', quantity: 1, unitPrice: 0 }],
  includeVat: true,
  vatRate: 18,
  discount: 0,
  payments: [{ id: '1', method: 'העברה בנקאית', details: '', date: nowDate(), amount: 0 }],
  documentProducer: '',
  recipientName: '',
  recipientSignature: '',
  recipientDate: '',
};
