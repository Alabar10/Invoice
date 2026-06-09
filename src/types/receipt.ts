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
  isOriginal: boolean;
  sectionName: string;
  customerName: string;
  customerTaxId: string;
  customerAddress: string;
  items: ReceiptItem[];
  includeVat: boolean;
  vatRate: number;
  payments: PaymentRow[];
}

export const defaultReceiptData: ReceiptData = {
  businessName: '',
  businessTaxId: '',
  businessAddress: '',
  businessPhone: '',
  logoUrl: '',
  documentType: 'חשבונית מס / קבלה',
  documentNumber: '1',
  date: new Date().toISOString().split('T')[0],
  isOriginal: true,
  sectionName: '',
  customerName: '',
  customerTaxId: '',
  customerAddress: '',
  items: [{ id: '1', description: '', quantity: 1, unitPrice: 0 }],
  includeVat: true,
  vatRate: 18,
  payments: [
    {
      id: '1',
      method: 'העברה בנקאית',
      details: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
    },
  ],
};
