import { User, Payment } from '../types';

const USERS_KEY = 'village_users';
const PAYMENTS_KEY = 'village_payments';
const SETTINGS_KEY = 'village_settings';

const INITIAL_USERS: User[] = [
  { username: 'admin', password: '', role: 'admin', name: 'นิติบุคคล', isSetup: false }
];

const INITIAL_PAYMENTS: Payment[] = [];

export interface PaymentSettings {
  paymentQrCode: string | null;
  bankName: string;
  accountName: string;
  accountNumber: string;
  contactNumber: string;
}

export const initStorage = async () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(PAYMENTS_KEY)) {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(INITIAL_PAYMENTS));
  }
};

export const getUsers = async (): Promise<User[]> => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const checkUserStatus = async (username: string): Promise<{ exists: boolean, isSetup: boolean }> => {
  const users = await getUsers();
  const user = users.find(u => u.username === username);
  if (!user) return { exists: false, isSetup: false };
  return { exists: true, isSetup: !!user.isSetup };
};

export const setupUserPassword = async (username: string, newPassword: string): Promise<boolean> => {
  const users = await getUsers();
  const index = users.findIndex(u => u.username === username);
  
  if (index !== -1) {
    users[index].password = newPassword;
    users[index].isSetup = true;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } else {
    const newUser: User = {
        username,
        password: newPassword,
        role: 'user',
        name: `เจ้าของบ้าน ${username}`,
        commonFee: 500,
        isSetup: true
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  }
};

export const updateUserPassword = async (username: string, newPassword: string): Promise<boolean> => {
  return setupUserPassword(username, newPassword);
};

export const getPayments = async (): Promise<Payment[]> => {
  const data = localStorage.getItem(PAYMENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const addPayment = async (payment: Payment) => {
  const payments = await getPayments();
  payments.push(payment);
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
};

export const updatePaymentStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
  const payments = await getPayments();
  const index = payments.findIndex(p => p.id === id);
  if (index !== -1) {
    payments[index].status = status;
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  }
};

export const getSettings = async (): Promise<PaymentSettings> => {
  const data = localStorage.getItem(SETTINGS_KEY);
  const defaults: PaymentSettings = {
    paymentQrCode: null,
    bankName: '',
    accountName: '',
    accountNumber: '',
    contactNumber: '02-123-4567'
  };
  
  if (data) {
    return { ...defaults, ...JSON.parse(data) };
  }
  return defaults;
};

export const saveSettings = async (settings: Partial<PaymentSettings>) => {
  const data = localStorage.getItem(SETTINGS_KEY);
  const current = data ? JSON.parse(data) : {};
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
};

export const getQrCode = async (): Promise<string | null> => {
  const settings = await getSettings();
  return settings.paymentQrCode || null;
};

export const saveQrCode = async (base64Image: string) => {
  await saveSettings({ paymentQrCode: base64Image });
};
