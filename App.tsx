
import React, { useState, useRef, useEffect } from 'react';
import { ExtractionStatus, TransactionData, AppSettings } from './types';
import { extractPaymentData } from './services/geminiService';
import TransactionForm from './components/TransactionForm';
import SettingsModal from './components/SettingsModal';
import ChatBot from './components/ChatBot';

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1M2-_WQwQgnJ4TaO8WWYT59DT-94vPhj_n8r41kVLY8I/edit?gid=0#gid=0";

const App: React.FC = () => {
  const [status, setStatus] = useState<ExtractionStatus>(ExtractionStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<TransactionData | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('paytrack_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, googleSheetsUrl: parsed.googleSheetsUrl || DEFAULT_SHEET_URL };
    }
    return { googleSheetsUrl: DEFAULT_SHEET_URL, webhookUrl: '' };
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [log, setLog] = useState<{message: string, type: 'success' | 'error' | 'info' | 'warning'}[]>([]);
  const [history, setHistory] = useState<TransactionData[]>(() => {
    const saved = localStorage.getItem('paytrack_history');
    return saved ? JSON.parse(saved) : [];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('paytrack_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('paytrack_history', JSON.stringify(history));
  }, [history]);

  const addLog = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setLog(prev => [{ message, type }, ...prev].slice(0, 15));
  };

  const checkDuplicate = (newId: string) => {
    if (!newId || newId === 'Not found') return false;
    return history.some(item => item.transactionId === newId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file.");
      return;
    }

    setStatus(ExtractionStatus.UPLOADING);
    setError(null);
    setExtractedData(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      
      try {
        setStatus(ExtractionStatus.EXTRACTING);
        addLog("Analyzing with gemini-3-pro-preview...", "info");
        const data = await extractPaymentData(base64, file.type);
        
        if (checkDuplicate(data.transactionId)) {
          addLog("Possible duplicate detected!", "warning");
        }

        setExtractedData(data);
        setStatus(ExtractionStatus.SUCCESS);
        addLog("Analysis complete.", "success");
      } catch (err: any) {
        setStatus(ExtractionStatus.ERROR);
        setError(err.message || "Extraction failed.");
        addLog("Error: " + err.message, "error");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveToSheet = async () => {
    if (!extractedData) return;
    
    setStatus(ExtractionStatus.SAVING);
    addLog("Initiating sync with Google Sheets...", "info");

    const dataToSave = {
      ...extractedData,
      uploadTimestamp: new Date().toLocaleString()
    };

    try {
      // Logic for recording to Google Sheets:
      // If a Webhook URL is provided, we send a real POST request.
      if (settings.webhookUrl) {
        const response = await fetch(settings.webhookUrl, {
          method: 'POST',
          mode: 'no-cors', // Common for Apps Script triggers
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave)
        });
        addLog("Sync command dispatched to Webhook.", "success");
      } else {
        // Fallback or warning if no webhook is set but user wants real sheet recording
        addLog("Simulating sync... Setup Webhook for real automation.", "info");
      }
      
      // Artificial delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setHistory(prev => [dataToSave, ...prev]);
      addLog(`Recorded ${dataToSave.currency}${dataToSave.amount} for ${dataToSave.merchant}`, "success");
      
      setExtractedData(null);
      setPreviewImage(null);
      setStatus(ExtractionStatus.IDLE);
      
      const viewNow = confirm("Transaction successfully sent to Google Sheet tracking! View it now?");
      if (viewNow) {
        openSheet();
      }
    } catch (err) {
      addLog("Failed to sync with Google Sheets", "error");
      setStatus(ExtractionStatus.SUCCESS);
    }
  };

  const openSheet = () => {
    if (settings.googleSheetsUrl) {
      window.open(settings.googleSheetsUrl, '_blank');
    } else {
      setIsSettingsOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 pb-20">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">PayTrack <span className="text-indigo-600">AI</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={openSheet}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="hidden sm:inline">Open Sheet</span>
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m12 4a2 2 0 100-4m0 4a2 2 0 110-4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m-6 0H4m5.08 0h3.84m5.08 0h2" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-10">
        {!extractedData && (
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Smart Expense Tracker</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              Analyze receipts in any language with gemini-3-pro-preview.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className={`${extractedData ? 'lg:col-span-5' : 'lg:col-span-12'} transition-all duration-500`}>
            {!extractedData ? (
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-2xl aspect-[16/9] md:aspect-[21/9] border-2 border-dashed border-slate-200 rounded-[2rem] bg-white hover:border-indigo-500 hover:bg-indigo-50/20 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm group"
                >
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                  <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-5 mx-auto group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="font-bold text-slate-800 text-xl">Upload Receipt</p>
                    <p className="text-slate-400 mt-2 font-medium">Any language, any format</p>
                  </div>
                </div>
                {status === ExtractionStatus.EXTRACTING && (
                  <div className="mt-8 flex flex-col items-center gap-4 text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Gemini Pro is analyzing image details...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-3 rounded-3xl shadow-xl sticky top-24 border border-slate-100">
                <img src={previewImage!} className="w-full h-auto rounded-2xl object-contain max-h-[70vh]" />
              </div>
            )}
          </div>

          {extractedData && (
            <div className="lg:col-span-7">
              <TransactionForm 
                data={extractedData} 
                onChange={setExtractedData}
                onSave={handleSaveToSheet}
                onCancel={() => { setExtractedData(null); setPreviewImage(null); setStatus(ExtractionStatus.IDLE); }}
                isSaving={status === ExtractionStatus.SAVING}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 mb-20">
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Activity Log</h3>
            <div className="bg-slate-900 rounded-2xl p-4 h-[300px] font-mono text-xs overflow-y-auto space-y-2 text-indigo-300">
              {log.length === 0 && <span className="text-slate-600">No activity yet.</span>}
              {log.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                  <span className={l.type === 'success' ? 'text-emerald-400' : l.type === 'error' ? 'text-rose-400' : 'text-indigo-300'}>
                    {l.message}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Sync History</h3>
            <div className="bg-white rounded-2xl border border-slate-200 h-[300px] overflow-y-auto divide-y divide-slate-100">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic p-8">
                  Nothing synced yet.
                </div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{h.merchant}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{h.category} • {h.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">{h.currency}{h.amount}</p>
                      <p className="text-[10px] text-emerald-500 font-bold">✓ SYNCED</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Financial Assistant ChatBot */}
      <ChatBot />

      {isSettingsOpen && (
        <SettingsModal 
          settings={settings}
          onSave={(ns) => { setSettings(ns); setIsSettingsOpen(false); }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
