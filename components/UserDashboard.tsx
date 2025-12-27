import React, { useState, useEffect } from 'react';
import { User, Payment, MONTHS } from '../types';
import { getPayments, addPayment, updateUserPassword, getSettings, PaymentSettings } from '../services/storageService';
import { Phone, CreditCard, History, CheckCircle, Clock, XCircle, Upload, LogOut, Settings, Lock, Home } from 'lucide-react';

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'pay' | 'history' | 'settings'>('pay');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);

  // Form State
  const [amount] = useState(user.commonFee || 500); // Fixed amount
  const [selectedMonth] = useState(MONTHS[new Date().getMonth()]); // Default to current month
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const allPayments = getPayments();
    setPayments(allPayments.filter(p => p.houseNo === user.username));
    
    // Load Settings
    const loadedSettings = getSettings();
    setSettings(loadedSettings);
  }, [user.username, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('กรุณาอัพโหลดรูปสลิป');
      return;
    }

    const newPayment: Payment = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      houseNo: user.username,
      amount: amount,
      status: 'PENDING',
      month: selectedMonth,
      slipFileName: file.name
    };

    addPayment(newPayment);
    setSubmitSuccess(true);
    setFile(null);
    setPreviewUrl(null);
    
    // Reset after delay
    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  const handlePasswordInput = (value: string, setter: (val: string) => void) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setter(numericValue);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length !== 4) {
      setPasswordMessage({ text: 'รหัสผ่านต้องเป็นตัวเลข 4 หลัก', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'รหัสผ่านใหม่ไม่ตรงกัน', type: 'error' });
      return;
    }
    
    if (user.password !== currentPassword) {
      setPasswordMessage({ text: 'รหัสผ่านเดิมไม่ถูกต้อง', type: 'error' });
      return;
    }

    const success = updateUserPassword(user.username, newPassword);
    if (success) {
      setPasswordMessage({ text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMessage({ text: 'เกิดข้อผิดพลาด กรุณาลองใหม่', type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="flex items-center text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle size={12} className="mr-1" /> อนุมัติแล้ว</span>;
      case 'PENDING':
        return <span className="flex items-center text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs font-bold"><Clock size={12} className="mr-1" /> รอตรวจสอบ</span>;
      case 'REJECTED':
        return <span className="flex items-center text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-bold"><XCircle size={12} className="mr-1" /> ถูกปฏิเสธ</span>;
      default:
        return null;
    }
  };

  const defaultQr = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021129370016A000000677010111011300660000000005802TH530376463041926";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar with Safe Area */}
      <div className="bg-white shadow-sm sticky top-0 z-30 pt-safe border-b border-slate-100">
        <div className="px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                    <Home size={20} className="text-blue-600" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-blue-900 leading-tight">Village Pay</h1>
                    <p className="text-xs text-slate-500 font-medium">ห้อง: {user.username}</p>
                </div>
            </div>
            <button onClick={onLogout} className="p-2 -mr-2 text-slate-400 hover:text-red-500 transition-colors">
                <LogOut size={22} />
            </button>
        </div>
      </div>

      {/* Main Content Area - padded for bottom nav */}
      <div className="flex-1 overflow-y-auto pb-[100px] pb-safe px-4 pt-4 space-y-4">
        
        {/* Contact Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-between gap-3 animate-fade-in">
           <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2.5 rounded-full text-slate-600">
                 <Phone size={20} />
              </div>
              <div>
                 <h3 className="font-bold text-slate-800 text-sm">นิติบุคคล</h3>
                 <p className="text-slate-500 text-xs font-medium">08:30 - 17:30 น.</p>
              </div>
           </div>
           
           <a 
             href={`tel:${settings?.contactNumber || '021234567'}`} 
             className="bg-blue-600 active:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
           >
             <Phone size={14} />
             <span>โทร</span>
           </a>
        </div>

        {/* Content based on Active Tab */}
        {activeTab === 'pay' && (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 text-center">
                <h2 className="text-base font-bold text-slate-800 mb-3">QR Code รับเงิน</h2>
                <div className="bg-white p-2 rounded-xl inline-block border-2 border-dashed border-slate-200 shadow-inner">
                  <img 
                    src={settings?.paymentQrCode || defaultQr} 
                    alt="Payment QR" 
                    className="w-48 h-48 mx-auto object-contain mix-blend-multiply"
                  />
                </div>
                
                <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-left space-y-1.5">
                    <p className="text-xs text-slate-500 font-bold">บัญชีรับโอน:</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{settings?.bankName || 'ธนาคารกสิกรไทย'}</p>
                    <p className="text-lg font-bold text-blue-700 tracking-wide font-mono">{settings?.accountNumber || 'xxx-x-xxxxx'}</p>
                    <p className="text-xs text-slate-600 truncate">{settings?.accountName || 'ชื่อบัญชีนิติบุคคล'}</p>
                </div>
             </div>

             <form onSubmit={handlePaymentSubmit} className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">แนบสลิปโอนเงิน</label>
                  <div className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-colors ${file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50'}`}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 z-10"
                    />
                    <div className="flex flex-col items-center justify-center min-h-[100px]">
                      {previewUrl ? (
                          <div className="relative">
                              <img src={previewUrl} alt="Preview" className="h-32 object-contain rounded-lg shadow-sm" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                  <span className="bg-white/90 text-slate-800 text-xs px-2 py-1 rounded-full font-bold shadow">เปลี่ยนรูป</span>
                              </div>
                          </div>
                      ) : (
                          <>
                            <div className="bg-white p-3 rounded-full shadow-sm mb-2">
                                <Upload className="text-blue-500" size={24} />
                            </div>
                            <span className="text-sm text-slate-600 font-bold">แตะเพื่ออัพโหลด</span>
                            <span className="text-xs text-slate-400 mt-1">รองรับไฟล์รูปภาพ</span>
                          </>
                      )}
                    </div>
                  </div>
               </div>

               <button 
                type="submit"
                disabled={!file}
                className={`w-full py-3.5 rounded-xl font-bold shadow-md transition-all active:scale-95 text-sm ${
                    file 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
               >
                 ยืนยันการชำระเงิน
               </button>
             </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3 animate-fade-in pb-4">
            <h2 className="text-base font-bold text-slate-800 px-1">ประวัติการชำระ</h2>
            {payments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
                <History className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-400 font-medium text-sm">ยังไม่มีประวัติ</p>
              </div>
            ) : (
              payments.slice().reverse().map((payment) => (
                <div key={payment.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center active:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 text-sm">เดือน{payment.month}</span>
                      {getStatusBadge(payment.status)}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">วันที่: {payment.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-700 text-base">{payment.amount.toLocaleString()} ฿</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 space-y-6 animate-fade-in">
             <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Lock className="text-blue-600" size={20} />
                <h2 className="text-base font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h2>
             </div>

             <form onSubmit={handleChangePassword} className="space-y-4">
                {[
                    { label: 'รหัสผ่านปัจจุบัน', val: currentPassword, set: setCurrentPassword },
                    { label: 'รหัสผ่านใหม่ (4 หลัก)', val: newPassword, set: setNewPassword },
                    { label: 'ยืนยันรหัสผ่านใหม่', val: confirmPassword, set: setConfirmPassword }
                ].map((field, idx) => (
                    <div key={idx}>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">{field.label}</label>
                        <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={field.val}
                            onChange={(e) => handlePasswordInput(e.target.value, field.set)}
                            autoComplete={field.label.includes('เดิม') ? 'current-password' : 'new-password'}
                            required
                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-[0.2em] text-slate-900 font-bold text-lg"
                        />
                    </div>
                ))}

                {passwordMessage.text && (
                  <div className={`p-3 rounded-xl text-xs font-bold flex items-center ${passwordMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {passwordMessage.type === 'success' ? <CheckCircle size={14} className="mr-2"/> : <XCircle size={14} className="mr-2"/>}
                    {passwordMessage.text}
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-sm"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
             </form>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {submitSuccess && (
         <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-[60] backdrop-blur-sm px-4">
           <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center animate-bounce-in w-full max-w-xs">
             <div className="bg-emerald-100 p-4 rounded-full mb-4 ring-4 ring-emerald-50">
              <CheckCircle className="text-emerald-600 w-10 h-10" />
             </div>
             <h3 className="text-xl font-bold text-slate-900">สำเร็จ!</h3>
             <p className="text-slate-500 text-sm mt-2 text-center">ส่งข้อมูลการชำระเงินเรียบร้อยแล้ว</p>
           </div>
         </div>
      )}

      {/* Fixed Bottom Navigation (Mobile App Style) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40">
        <div className="flex justify-around items-center px-2 py-1">
          <button
            onClick={() => setActiveTab('pay')}
            className={`flex flex-col items-center justify-center w-full py-2.5 rounded-lg transition-all ${
              activeTab === 'pay' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CreditCard size={24} className={`mb-1 transition-transform ${activeTab === 'pay' ? 'scale-110' : ''}`} strokeWidth={activeTab === 'pay' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">ชำระเงิน</span>
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center w-full py-2.5 rounded-lg transition-all ${
              activeTab === 'history' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <History size={24} className={`mb-1 transition-transform ${activeTab === 'history' ? 'scale-110' : ''}`} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">ประวัติ</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center w-full py-2.5 rounded-lg transition-all ${
              activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Settings size={24} className={`mb-1 transition-transform ${activeTab === 'settings' ? 'scale-110' : ''}`} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">ตั้งค่า</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;