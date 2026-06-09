import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReceiptEditor from '@/components/ReceiptEditor';
import { defaultReceiptData } from '@/types/receipt';

const noop = jest.fn();

describe('ReceiptEditor rendering', () => {
  it('renders without crashing', () => {
    render(<ReceiptEditor data={defaultReceiptData} onChange={noop} />);
  });

  it('shows document type in a select element', () => {
    render(<ReceiptEditor data={defaultReceiptData} onChange={noop} />);
    const select = screen.getByDisplayValue('חשבונית מס / קבלה');
    expect(select).toBeInTheDocument();
  });

  it('renders items table header', () => {
    render(<ReceiptEditor data={defaultReceiptData} onChange={noop} />);
    expect(screen.getAllByText('פירוט').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('כמות')).toBeInTheDocument();
  });

  it('renders payments table header', () => {
    render(<ReceiptEditor data={defaultReceiptData} onChange={noop} />);
    expect(screen.getByText('אמצעי תשלום')).toBeInTheDocument();
  });

  it('renders footer text', () => {
    render(<ReceiptEditor data={defaultReceiptData} onChange={noop} />);
    expect(screen.getByText('חתימה דיגיטלית מאובטחת')).toBeInTheDocument();
  });

  it('renders "לכבוד:" label for customer', () => {
    render(<ReceiptEditor data={defaultReceiptData} onChange={noop} />);
    expect(screen.getByText('לכבוד:')).toBeInTheDocument();
  });

  it('shows "מקור" button for isOriginal=true', () => {
    render(<ReceiptEditor data={defaultReceiptData} onChange={noop} />);
    expect(screen.getByText('מקור')).toBeInTheDocument();
  });

  it('shows "העתק" button for isOriginal=false', () => {
    const data = { ...defaultReceiptData, isOriginal: false };
    render(<ReceiptEditor data={data} onChange={noop} />);
    expect(screen.getByText('העתק')).toBeInTheDocument();
  });
});

describe('ReceiptEditor onChange callbacks', () => {
  it('calls onChange when business name is typed', () => {
    const onChange = jest.fn();
    render(<ReceiptEditor data={defaultReceiptData} onChange={onChange} />);
    const input = screen.getByPlaceholderText('שם העסק');
    fireEvent.change(input, { target: { value: 'חברת בדיקה' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].businessName).toBe('חברת בדיקה');
  });

  it('calls onChange when customer name is typed', () => {
    const onChange = jest.fn();
    render(<ReceiptEditor data={defaultReceiptData} onChange={onChange} />);
    const input = screen.getByPlaceholderText('שם הלקוח');
    fireEvent.change(input, { target: { value: 'לקוח ראשון' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].customerName).toBe('לקוח ראשון');
  });

  it('calls onChange with toggled isOriginal when מקור/העתק is clicked', () => {
    const onChange = jest.fn();
    render(<ReceiptEditor data={defaultReceiptData} onChange={onChange} />);
    fireEvent.click(screen.getByText('מקור'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].isOriginal).toBe(false);
  });

  it('calls onChange when "+ הוסף שורה" is clicked (adds item)', () => {
    const onChange = jest.fn();
    render(<ReceiptEditor data={defaultReceiptData} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ הוסף שורה'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].items).toHaveLength(2);
  });

  it('calls onChange when "+ הוסף תשלום" is clicked (adds payment)', () => {
    const onChange = jest.fn();
    render(<ReceiptEditor data={defaultReceiptData} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ הוסף תשלום'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].payments).toHaveLength(2);
  });
});

describe('ReceiptEditor totals display', () => {
  it('shows ₪0.00 total when all items have 0 price', () => {
    render(<ReceiptEditor data={defaultReceiptData} onChange={noop} />);
    const cells = screen.getAllByText('₪0.00');
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it('shows correct subtotal for a known item', () => {
    const data = {
      ...defaultReceiptData,
      items: [{ id: '1', description: 'עבודה', quantity: 2, unitPrice: 500 }],
    };
    render(<ReceiptEditor data={data} onChange={noop} />);
    expect(screen.getAllByText('₪1,000.00').length).toBeGreaterThanOrEqual(1);
  });
});
