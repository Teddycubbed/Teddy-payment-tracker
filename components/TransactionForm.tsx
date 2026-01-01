
import React from 'react';
import { TransactionData } from '../types';

interface TransactionFormProps {
  data: TransactionData;
  onChange: (data: TransactionData) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ data, onChange, onSave, onCancel, isSaving }) => {
  const handleChange = (field: keyof TransactionData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const fields: { label: string; key: keyof TransactionData; type: string }[] = [
    { label: 'Merchant / Recipient', key: 'merchant', type: 'text' },
    { label: 'Amount', key: 'amount', type: 'text' },
    { label: 'Currency', key: 'currency', type: 'text' },
    { label: 'Date', key: 'date', type: 'text' },
    { label: 'Time', key: 'time', type: 'text' },
    { label: 'Sender', key: 'sender', type: 'text' },
    { label: 'Method', key: 'paymentMethod', type: 'text' },
    { label: 'Transaction ID', key: 'transactionId', type: 'text' },
    { label: 'Platform', key: 'platform', type: 'text' },
    { label: 'Category', key: 'category', type: 'text' },
    { label: 'Status', key: 'status', type: 'text' },
    { label: 'Notes', key: 'notes', type: 'text' },
  ];

  const confidenceColor = data.confidenceScore > 0.8 ? 'text-green-600' : data.confidenceScore > 0.5 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full animate-in slide-in-from-bottom-4 duration-500 border border-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verify Extraction</h3>
        <div className="px-4 py-1.5 bg-slate-50 rounded-full text-sm font-bold border border-slate-100">
          Confidence: <span className={confidenceColor}>{(data.confidenceScore * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">
              {f.label}
            </label>
            <input
              type={f.type}
              value={data[f.key] as string}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 text-black font-medium transition-all shadow-sm outline-none"
            />
          </div>
        ))}
      </div>

      <div className="mt-10 flex gap-4">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 py-4 px-4 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-[2] py-4 px-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving to Sheet...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Confirm & Sync to Google Sheets
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TransactionForm;
