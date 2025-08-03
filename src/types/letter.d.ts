export interface LetterData {
  subject: string;
  to: string;
  department: string;
  priority: string;
  content: string;
  attachments: string[];
  cc: string[];
  ccEmployees: Record<string, string[]>;
  from: string;
  rejectionReason?: string;
  rejectedAt?: string;
  status?: string;
}
