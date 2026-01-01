
export interface TransactionData {
  amount: string;
  currency: string;
  date: string;
  time: string;
  merchant: string;
  sender: string;
  paymentMethod: string;
  transactionId: string;
  status: 'completed' | 'pending' | 'failed' | 'Not found';
  platform: string;
  category: string;
  notes: string;
  confidenceScore: number;
  uploadTimestamp?: string;
}

export interface AppSettings {
  googleSheetsUrl: string;
  webhookUrl: string; 
}

export enum ExtractionStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  EXTRACTING = 'EXTRACTING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  SAVING = 'SAVING'
}
