import { User, Payment } from '../types';

const USERS_KEY = 'village_users';
const PAYMENTS_KEY = 'village_payments';
const SETTINGS_KEY = 'village_settings';

const INITIAL_USERS: User[] = [
  // Admin initial state: No password, requires setup (isSetup: false)
  { username: 'admin', password: '', role: 'admin', name: 'นิติบุคคล', isSetup: false }
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: '1', date: '2023-12-01', houseNo: '99/01', amount: 500, status: 'APPROVED', month: 'ธันวาคม', slipFileName: 'slip-dec-01.jpg' },
  { id: '2', date: '2023-12-05', houseNo: '99/02', amount: 500, status: 'PENDING', month: 'ธันวาคม', slipFileName: 'slip-dec-02.jpg' }
];

export interface PaymentSettings {
  paymentQrCode: string | null;
  bankName: string;
  accountName: string;
  accountNumber: string;
  contactNumber: string;
}

export const initStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(PAYMENTS_KEY)) {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(INITIAL_PAYMENTS));
  }
};

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const checkUserStatus = (username: string): { exists: boolean, isSetup: boolean } => {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) return { exists: false, isSetup: false };
  return { exists: true, isSetup: !!user.isSetup };
};

export const setupUserPassword = (username: string, newPassword: string): boolean => {
  const users = getUsers();
  const index = users.findIndex(u => u.username === username);
  
  if (index !== -1) {
    // Existing user setting up password or updating it
    users[index].password = newPassword;
    users[index].isSetup = true;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } else {
    // New user registration (Auto-create)
    const newUser: User = {
        username,
        password: newPassword,
        role: 'user',
        name: `เจ้าของบ้าน ${username}`, // Generic display name
        commonFee: 500, // Default fee
        isSetup: true
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  }
};

export const updateUserPassword = (username: string, newPassword: string): boolean => {
  // Reuse setup function as logic is compatible
  return setupUserPassword(username, newPassword);
};

export const getPayments = (): Payment[] => {
  const data = localStorage.getItem(PAYMENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const addPayment = (payment: Payment) => {
  const payments = getPayments();
  payments.push(payment);
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
};

export const updatePaymentStatus = (id: string, status: 'APPROVED' | 'REJECTED') => {
  const payments = getPayments();
  const index = payments.findIndex(p => p.id === id);
  if (index !== -1) {
    payments[index].status = status;
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  }
};

// --- Settings & QR Code ---

export const getSettings = (): PaymentSettings => {
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

export const saveSettings = (settings: Partial<PaymentSettings>) => {
  const data = localStorage.getItem(SETTINGS_KEY);
  const current = data ? JSON.parse(data) : {};
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
};

// Wrappers for backward compatibility if needed, using the new unified settings
export const getQrCode = (): string | null => {
  return getSettings().paymentQrCode;
};

export const saveQrCode = (base64Image: string) => {
  saveSettings({ paymentQrCode: base64Image });
};