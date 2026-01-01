
import React, { useState } from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [showGuide, setShowGuide] = useState(false);

  const appsScriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  // Append a new row with extraction data
  sheet.appendRow([
    data.date,
    data.time,
    data.amount,
    data.currency,
    data.merchant,
    data.sender,
    data.paymentMethod,
    data.transactionId,
    data.status,
    data.platform,
    data.category,
    data.notes,
    data.uploadTimestamp
  ]);
  
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    alert("Script copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Setup Integration</h2>
            <p className="text-slate-500 mt-1 font-medium">Connect PayTrack AI to your Google Sheets.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-8">
          {/* Main Inputs */}
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 px-1">
                Your Google Sheet URL
              </label>
              <input
                type="text"
                className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 text-black font-medium transition-all text-sm outline-none shadow-sm"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={formData.googleSheetsUrl}
                onChange={(e) => setFormData({ ...formData, googleSheetsUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 px-1">
                Apps Script Webhook URL
              </label>
              <input
                type="text"
                className="w-full px-5 py-4 bg-white border border-slate-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 text-black font-medium transition-all text-sm outline-none shadow-sm"
                placeholder="https://script.google.com/macros/s/..."
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              />
            </div>
          </div>

          {/* Beginner Guide Section */}
          <div className="border border-indigo-100 bg-indigo-50/50 rounded-[2rem] overflow-hidden">
            <button 
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-6 py-5 flex items-center justify-between text-indigo-900 hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-bold">Step-by-Step Beginner Guide</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${showGuide ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showGuide && (
              <div className="px-6 pb-6 space-y-6 text-sm text-slate-600 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">1</span>
                    <p>Open your <strong>Google Sheet</strong>. Click on <strong>Extensions</strong> in the top menu, then select <strong>Apps Script</strong>.</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">2</span>
                    <div className="flex-1">
                      <p className="mb-3">Delete any code in the editor and <strong>Paste this code</strong>:</p>
                      <div className="relative group">
                        <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-[11px] overflow-x-auto font-mono leading-relaxed">
                          {appsScriptCode}
                        </pre>
                        <button 
                          onClick={copyToClipboard}
                          className="absolute top-2 right-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">3</span>
                    <p>Click the <strong>Deploy</strong> button (blue) -> <strong>New Deployment</strong>. Select Type: <strong>Web App</strong>.</p>
                  </div>

                  <div className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">4</span>
                    <p>Set "Who has access" to <strong>Anyone</strong>. Click Deploy. Authorize any permissions requested by Google.</p>
                  </div>

                  <div className="flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">5</span>
                    <p>Copy the <strong>Web App URL</strong> provided and paste it into the "Apps Script Webhook URL" field above.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-500 hover:text-slate-800 font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
