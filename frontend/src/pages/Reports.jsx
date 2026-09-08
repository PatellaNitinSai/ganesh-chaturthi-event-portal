import React, { useState } from 'react';
import api from '../api';

function toCsv(rows, columns) {
  const header = columns.map((c) => c.label).join(',');
  const lines = rows.map((r) =>
    columns
      .map((c) => {
        const val = c.value(r);
        const str = String(val ?? '').replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',')
  );
  return [header, ...lines].join('\n');
}

function download(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [busy, setBusy] = useState('');

  const exportDonations = async () => {
    setBusy('donations');
    try {
      const res = await api.get('/donations');
      const csv = toCsv(res.data, [
        { label: 'Date', value: (r) => r.date },
        { label: 'Donor Name', value: (r) => r.donor_name },
        { label: 'Contact', value: (r) => r.donor_contact },
        { label: 'Type', value: (r) => r.type },
        { label: 'Amount', value: (r) => r.amount },
        { label: 'Payment Mode', value: (r) => r.payment_mode },
        { label: 'Receipt No', value: (r) => r.receipt_no },
        { label: 'Notes', value: (r) => r.notes },
      ]);
      download('donations_report.csv', csv);
    } finally {
      setBusy('');
    }
  };

  const exportExpenses = async () => {
    setBusy('expenses');
    try {
      const res = await api.get('/expenses');
      const csv = toCsv(res.data, [
        { label: 'Date', value: (r) => r.date },
        { label: 'Category', value: (r) => r.category },
        { label: 'Description', value: (r) => r.description },
        { label: 'Total Amount', value: (r) => r.total_amount },
        { label: 'Advance Paid', value: (r) => r.advance_paid },
        { label: 'Settled Amount', value: (r) => r.settled_amount },
        { label: 'Balance Due', value: (r) => r.balance_due },
        { label: 'Status', value: (r) => r.status },
        { label: 'Payment Mode', value: (r) => r.payment_mode },
        { label: 'Bill No', value: (r) => r.bill_no },
        { label: 'Notes', value: (r) => r.notes },
      ]);
      download('expenses_report.csv', csv);
    } finally {
      setBusy('');
    }
  };

  const exportVendors = async () => {
    setBusy('vendors');
    try {
      const res = await api.get('/vendors');
      const csv = toCsv(res.data, [
        { label: 'Vendor', value: (r) => r.name },
        { label: 'Category', value: (r) => r.category },
        { label: 'Contact Person', value: (r) => r.contact_person },
        { label: 'Phone', value: (r) => r.phone },
        { label: 'Agreed / Quoted', value: (r) => r.total_agreed || r.quoted_amount },
        { label: 'Advance Paid', value: (r) => r.total_advance },
        { label: 'Settled', value: (r) => r.total_settled },
        { label: 'Balance Due', value: (r) => r.balance_due },
      ]);
      download('vendors_report.csv', csv);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="panel">
      <div className="panel-header"><h3>Export Reports</h3></div>
      <p className="muted">Download complete financial records as CSV files for offline record-keeping, printing, or sharing with the committee / auditors.</p>
      <div className="report-buttons">
        <button className="btn-primary" disabled={busy === 'donations'} onClick={exportDonations}>
          {busy === 'donations' ? 'Preparing…' : 'Export Donations (CSV)'}
        </button>
        <button className="btn-primary" disabled={busy === 'expenses'} onClick={exportExpenses}>
          {busy === 'expenses' ? 'Preparing…' : 'Export Expenses (CSV)'}
        </button>
        <button className="btn-primary" disabled={busy === 'vendors'} onClick={exportVendors}>
          {busy === 'vendors' ? 'Preparing…' : 'Export Vendor Ledger (CSV)'}
        </button>
      </div>
    </div>
  );
}
