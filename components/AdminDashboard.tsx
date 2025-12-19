import React, { useState, useEffect } from 'react';
import { User, Payment, MONTHS, BANKS } from '../types';
import { getPayments, updatePaymentStatus, updateUserPassword, saveSettings, getSettings } from '../services/storageService';
import { LogOut, CheckCircle, XCircle, FileText, Search, AlertTriangle, Lock, QrCode, Upload, CreditCard, Building, User as UserIcon, Phone, ChevronLeft } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  
  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'default' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'default'
  });

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  // QR Code & Settings Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [previewQr, setPreviewQr] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    contactNumber: ''
  });
  const [qrMsg, setQrMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setPayments(getPayments());
  };

  const handleOpenQrModal = () => {
      const settings = getSettings();
      setPreviewQr(settings.paymentQrCode);
      setSettingsForm({
          bankName: settings.bankName,
          accountName: settings.accountName,
          accountNumber: settings.accountNumber,
          contactNumber: settings.contactNumber || ''
      });
      setIsQrModalOpen(true);
  };

  const handleVerify = (id: string, status: 'APPROVED' | 'REJECTED') => {
    const isApprove = status === 'APPROVED';
    setConfirmDialog({
        isOpen: true,
        title: isApprove ? 'ยืนยันการอนุมัติ' : 'ยืนยันการปฏิเสธ',
        message: isApprove 
            ? 'คุณต้องการอนุมัติรายการชำระเงินนี้ใช่หรือไม่?' 
            : 'คุณต้องการปฏิเสธรายการชำระเงินนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้',
        variant: isApprove ? 'default' : 'danger',
        onConfirm: () => {
            updatePaymentStatus(id, status);
            refreshData();
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
    });
  };

  const handleLogoutClick = () => {
      setConfirmDialog({
          isOpen: true,
          title: 'ยืนยันการออกจากระบบ',
          message: 'คุณต้องการออกจากระบบใช่หรือไม่?',
          variant: 'danger',
          onConfirm: () => {
              onLogout();
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  // --- Password Handlers ---
  const handlePasswordInput = (field: 'current' | 'new' | 'confirm', value: string) => {
      const numericValue = value.replace(/\D/g, '').slice(0, 4);
      setPasswordForm(prev => ({ ...prev, [field]: numericValue }));
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (passwordForm.new.length !== 4) {
          setPasswordMsg({ text: 'รหัสผ่านต้องเป็นตัวเลข 4 หลัก', type: 'error' });
          return;
      }

      if (passwordForm.new !== passwordForm.confirm) {
          setPasswordMsg({ text: 'รหัสผ่านใหม่ไม่ตรงกัน', type: 'error' });
          return;
      }
      
      // Verify current password
      if (user.password !== passwordForm.current) {
          setPasswordMsg({ text: 'รหัสผ่านปัจจุบันไม่ถูกต้อง', type: 'error' });
          return;
      }

      const success = updateUserPassword(user.username, passwordForm.new);
      if (success) {
          user.password = passwordForm.new; // Update local reference
          setPasswordMsg({ text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', type: 'success' });
          setTimeout(() => {
              setIsPasswordModalOpen(false);
              setPasswordForm({ current: '', new: '', confirm: '' });
              setPasswordMsg({ text: '', type: '' });
          }, 1500);
      } else {
          setPasswordMsg({ text: 'เกิดข้อผิดพลาด', type: 'error' });
      }
  };

  // --- QR & Settings Handlers ---
  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewQr(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
      saveSettings({
          paymentQrCode: previewQr,
          bankName: settingsForm.bankName,
          accountName: settingsForm.accountName,
          accountNumber: settingsForm.accountNumber,
          contactNumber: settingsForm.contactNumber
      });
      setQrMsg({ text: 'บันทึกข้อมูลเรียบร้อยแล้ว', type: 'success' });
      setTimeout(() => {
        setIsQrModalOpen(false);
        setQrMsg({ text: '', type: '' });
      }, 1500);
  };

  // Derived Stats
  const totalIncome = payments
    .filter(p => p.status === 'APPROVED')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;

  // Filtered List
  const displayPayments = payments
    .filter(p => filterStatus === 'ALL' || p.status === filterStatus)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col relative pb-safe">
       {/* Top Nav with Safe Area */}
       <header className="bg-white shadow-md z-20 border-b border-slate-200 sticky top-0 pt-safe">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
                <FileText size={18} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Admin</h1>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">System Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
                <button 
                    onClick={handleOpenQrModal}
                    className="p-2 text-slate-600 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-100"
                >
                    <QrCode size={20} />
                </button>
                <button 
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="p-2 text-slate-600 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-100"
                >
                    <Lock size={20} />
                </button>
                <button onClick={handleLogoutClick} className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50">
                    <LogOut size={20} />
                </button>
            </div>
         </div>
       </header>

       <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-y-auto">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-slate-500 text-xs font-bold mb-1">ยอดเงินรวม (อนุมัติแล้ว)</p>
                <h3 className="text-2xl font-extrabold text-emerald-600">{totalIncome.toLocaleString()} ฿</h3>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                <CheckCircle size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-slate-500 text-xs font-bold mb-1">รายการรอตรวจสอบ</p>
                <h3 className="text-2xl font-extrabold text-amber-600">{pendingCount} รายการ</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full text-amber-600">
                <FileText size={20} />
              </div>
            </div>
          </div>

          {/* Payment List Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px] max-h-[70vh]">
              <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    📋 รายการชำระเงิน
                    </h2>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                  {(['ALL', 'PENDING', 'APPROVED'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                        filterStatus === status 
                        ? 'bg-white text-blue-700 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {status === 'ALL' ? 'ทั้งหมด' : status === 'PENDING' ? 'รอตรวจ' : 'อนุมัติ'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="overflow-auto flex-1 bg-white relative">
                {displayPayments.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p className="font-medium">ไม่พบรายการข้อมูล</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">วันที่ / บ้านเลขที่</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">รายละเอียด</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">ยอดเงิน</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 align-top">
                            <p className="font-bold text-slate-900">{payment.houseNo}</p>
                            <p className="text-xs text-slate-500">{payment.date}</p>
                          </td>
                          <td className="p-4 align-top">
                            <span className="inline-block bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded mb-1 font-semibold">
                              {payment.month}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-slate-400 max-w-[120px] truncate">
                              <FileText size={12} /> 
                              <span className="truncate">{payment.slipFileName || 'no-file'}</span>
                            </div>
                          </td>
                          <td className="p-4 align-top text-right">
                            <span className="font-bold text-slate-800">
                                {payment.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4 align-top text-center">
                            {payment.status === 'PENDING' ? (
                              <div className="flex justify-center gap-2">
                                <button 
                                  onClick={() => handleVerify(payment.id, 'APPROVED')}
                                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 p-2 rounded-lg transition-colors active:scale-95"
                                  title="อนุมัติ"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button 
                                  onClick={() => handleVerify(payment.id, 'REJECTED')}
                                  className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-lg transition-colors active:scale-95"
                                  title="ปฏิเสธ"
                                >
                                  <XCircle size={18} />
                                </button>
                              </div>
                            ) : (
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                                payment.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {payment.status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
          </div>
       </main>

       {/* Confirmation Modal */}
       {confirmDialog.isOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 animate-fade-in">
             <div className="flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                confirmDialog.variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                }`}>
                <AlertTriangle size={28} />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmDialog.title}</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
                    {confirmDialog.message}
                </p>
                
                <div className="flex gap-3 w-full">
                <button 
                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors"
                >
                    ยกเลิก
                </button>
                <button 
                    onClick={confirmDialog.onConfirm}
                    className={`flex-1 px-4 py-3 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${
                        confirmDialog.variant === 'danger' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    ยืนยัน
                </button>
                </div>
             </div>
           </div>
         </div>
       )}

       {/* QR Code & Settings Upload Modal */}
       {isQrModalOpen && (
           <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm transition-opacity">
               <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6 transform transition-all scale-100 animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto pb-safe">
                   <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                       <div className="flex items-center gap-3">
                           <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                               <QrCode size={20} />
                           </div>
                           <h3 className="text-lg font-bold text-slate-900">ตั้งค่าระบบ</h3>
                       </div>
                       <button 
                         onClick={() => setIsQrModalOpen(false)}
                         className="text-slate-400 hover:text-slate-600 transition-colors"
                       >
                         <XCircle size={24} />
                       </button>
                   </div>

                   <div className="space-y-6">
                        {/* Contact Info Section */}
                        <div className="space-y-3">
                           <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                               <Phone size={16} className="text-blue-600" /> 
                               ข้อมูลการติดต่อ
                           </h4>
                           <div>
                               <label className="text-xs font-bold text-slate-500 mb-1 block">เบอร์โทรศัพท์ (สำหรับลูกบ้านติดต่อ)</label>
                               <input 
                                   type="tel"
                                   className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                                   placeholder="เช่น 02-123-4567"
                                   value={settingsForm.contactNumber}
                                   onChange={e => setSettingsForm({...settingsForm, contactNumber: e.target.value})}
                               />
                           </div>
                       </div>

                       <div className="border-t border-slate-100 my-2"></div>

                       {/* Bank Info Section */}
                       <div className="space-y-3">
                           <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                               <Building size={16} className="text-blue-600" /> 
                               รายละเอียดบัญชี
                           </h4>
                           <div className="grid gap-3">
                               <div>
                                   <label className="text-xs font-bold text-slate-500 mb-1 block">ชื่อธนาคาร</label>
                                   <select
                                       className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                                       value={settingsForm.bankName}
                                       onChange={e => setSettingsForm({...settingsForm, bankName: e.target.value})}
                                   >
                                       <option value="">-- เลือกธนาคาร --</option>
                                       {BANKS.map((bank) => (
                                           <option key={bank} value={bank}>{bank}</option>
                                       ))}
                                   </select>
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-slate-500 mb-1 block">เลขที่บัญชี</label>
                                   <input 
                                       type="text"
                                       inputMode="numeric"
                                       className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                                       placeholder="xxx-x-xxxxx-x"
                                       value={settingsForm.accountNumber}
                                       onChange={e => setSettingsForm({...settingsForm, accountNumber: e.target.value})}
                                   />
                               </div>
                               <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">ชื่อบัญชี</label>
                                   <input 
                                       type="text"
                                       className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 font-medium"
                                       placeholder="ชื่อบัญชีนิติบุคคล"
                                       value={settingsForm.accountName}
                                       onChange={e => setSettingsForm({...settingsForm, accountName: e.target.value})}
                                   />
                               </div>
                           </div>
                       </div>

                       <div className="border-t border-slate-100 my-2"></div>

                       {/* QR Code Section */}
                       <div className="space-y-3">
                           <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                               <QrCode size={16} className="text-blue-600" /> 
                               QR Code รับเงิน
                           </h4>
                           
                           <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 min-h-[150px] relative group">
                               {previewQr ? (
                                   <div className="relative w-full h-full flex items-center justify-center">
                                       <img src={previewQr} alt="QR Preview" className="max-w-full max-h-[140px] object-contain" />
                                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                           <label className="cursor-pointer bg-white text-slate-800 px-4 py-2 rounded-full font-bold shadow-lg transform scale-95 hover:scale-100 transition-transform">
                                               เปลี่ยนรูป
                                               <input type="file" className="hidden" accept="image/*" onChange={handleQrFileChange} />
                                           </label>
                                       </div>
                                   </div>
                               ) : (
                                   <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                                       <Upload size={24} className="text-slate-400 mb-2" />
                                       <span className="text-sm text-slate-500 font-bold">อัพโหลด QR</span>
                                       <input type="file" className="hidden" accept="image/*" onChange={handleQrFileChange} />
                                   </label>
                               )}
                           </div>
                       </div>

                       {qrMsg.text && (
                          <div className={`text-sm p-3 rounded-lg flex items-center gap-2 font-medium ${qrMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {qrMsg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                              {qrMsg.text}
                          </div>
                       )}

                       <div className="flex gap-3 pt-2">
                           <button 
                               onClick={() => {
                                   setIsQrModalOpen(false);
                                   setQrMsg({ text: '', type: '' });
                               }}
                               className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors"
                           >
                               ยกเลิก
                           </button>
                           <button 
                               onClick={handleSaveSettings}
                               className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-transform active:scale-95"
                           >
                               บันทึก
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* Change Password Modal */}
       {isPasswordModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
               <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100 animate-fade-in">
                   <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                       <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                           <Lock size={20} />
                       </div>
                       <h3 className="text-lg font-bold text-slate-900">เปลี่ยนรหัสผ่าน Admin</h3>
                   </div>

                   <form onSubmit={handleChangePassword} className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">รหัสผ่านปัจจุบัน</label>
                           <input 
                               type="password"
                               inputMode="numeric"
                               pattern="[0-9]*"
                               maxLength={4}
                               value={passwordForm.current}
                               onChange={e => handlePasswordInput('current', e.target.value)}
                               className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest text-slate-900 font-medium"
                               placeholder="ตัวเลข 4 หลัก"
                               required
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">รหัสผ่านใหม่</label>
                           <input 
                               type="password"
                               inputMode="numeric"
                               pattern="[0-9]*"
                               maxLength={4}
                               value={passwordForm.new}
                               onChange={e => handlePasswordInput('new', e.target.value)}
                               className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest text-slate-900 font-medium"
                               placeholder="ตัวเลข 4 หลัก"
                               required
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">ยืนยันรหัสผ่านใหม่</label>
                           <input 
                               type="password"
                               inputMode="numeric"
                               pattern="[0-9]*"
                               maxLength={4}
                               value={passwordForm.confirm}
                               onChange={e => handlePasswordInput('confirm', e.target.value)}
                               className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest text-slate-900 font-medium"
                               placeholder="ตัวเลข 4 หลัก"
                               required
                           />
                       </div>

                       {passwordMsg.text && (
                           <div className={`text-xs p-2 rounded flex items-center gap-2 font-medium ${passwordMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                               {passwordMsg.type === 'error' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                               {passwordMsg.text}
                           </div>
                       )}

                       <div className="flex gap-3 pt-2">
                           <button 
                               type="button"
                               onClick={() => {
                                   setIsPasswordModalOpen(false);
                                   setPasswordForm({ current: '', new: '', confirm: '' });
                                   setPasswordMsg({ text: '', type: '' });
                               }}
                               className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold transition-colors text-sm"
                           >
                               ยกเลิก
                           </button>
                           <button 
                               type="submit"
                               className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-md transition-transform active:scale-95 text-sm"
                           >
                               บันทึก
                           </button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};

export default AdminDashboard;