import { Payment, User, Settings } from '../types';

// ใช้ URL ให้ตรงกับที่เปิดใน Replit
const API_URL = 'http://localhost:3001/api';

// --- ฟังก์ชันช่วยเหลือ (Internal Helpers) ---

// ดึงข้อมูลก้อนใหญ่จาก db.json
const fetchFullDatabase = async () => {
  const res = await fetch(`${API_URL}/data`);
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

// บันทึกข้อมูลก้อนใหญ่กลับไปที่ db.json
const saveFullDatabase = async (data: any) => {
  await fetch(`${API_URL}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

// --- ฟังก์ชันที่ UI เรียกใช้ (Exports) ---

export const initStorage = async (): Promise<void> => {
  try {
    await fetchFullDatabase();
  } catch (e) {
    console.error("Server connection failed");
  }
};

export const checkUserStatus = async (username: string): Promise<User | undefined> => {
  const data = await fetchFullDatabase();
  return data.users.find((u: User) => u.username === username);
};

export const setupUserPassword = async (username: string, password: string): Promise<boolean> => {
  const data = await fetchFullDatabase();
  const userIndex = data.users.findIndex((u: User) => u.username === username);
  if (userIndex === -1) return false;

  data.users[userIndex].password = password;
  data.users[userIndex].isFirstTime = false;
  
  await saveFullDatabase(data);
  return true;
};

export const addPayment = async (payment: Payment): Promise<void> => {
  const data = await fetchFullDatabase();
  data.payments.push(payment);
  await saveFullDatabase(data);
};

export const getPayments = async (): Promise<Payment[]> => {
  const data = await fetchFullDatabase();
  return data.payments;
};

export const updatePaymentStatus = async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<void> => {
  const data = await fetchFullDatabase();
  const index = data.payments.findIndex((p: Payment) => p.id === id);
  if (index !== -1) {
    data.payments[index].status = status;
    await saveFullDatabase(data);
  }
};

export const getSettings = async (): Promise<Settings> => {
  const data = await fetchFullDatabase();
  return data.settings || {};
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  const data = await fetchFullDatabase();
  data.settings = settings;
  await saveFullDatabase(data);
};