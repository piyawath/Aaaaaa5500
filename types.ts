export type Role = 'user' | 'admin';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  username: string;
  password?: string; // Optional for safety when passing around UI
  role: Role;
  name: string;
  commonFee?: number;
  isSetup?: boolean; // New flag to check if user has set their own password
}

export interface Payment {
  id: string;
  date: string;
  houseNo: string;
  amount: number;
  status: PaymentStatus;
  month: string;
  slipFileName?: string;
}

export const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const BANKS = [
  "ธนาคารกสิกรไทย (KBANK)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารกรุงศรีอยุธยา (Krungsri)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารออมสิน (GSB)",
  "ธนาคารเกียรตินาคินภัทร (KKP)",
  "ธนาคารซีไอเอ็มบี ไทย (CIMBT)",
  "ธนาคารทิสโก้ (TISCO)",
  "ธนาคารยูโอบี (UOB)",
  "ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)",
  "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BAAC)",
  "ธนาคารอาคารสงเคราะห์ (GHB)",
  "ธนาคารอิสลามแห่งประเทศไทย (IBANK)"
];