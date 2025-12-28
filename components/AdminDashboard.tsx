import React, { useState, useEffect } from 'react';
import { User, Payment, MONTHS, BANKS } from '../types';
// ปรับฟังก์ชันที่ import ให้ตรงกับ storageService.ts ของเรา
import { getPayments, updatePaymentStatus, setupUserPassword, saveSettings, getSettings } from '../services/storageService';
import { LogOut, CheckCircle, XCircle, FileText, Search, AlertTriangle, Lock, QrCode, Upload, Building, Phone, Loader2 } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  
  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'default' | 'danger';
  }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'default'
  });

  // Settings & QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [previewQr, setPreviewQr] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    bankName: '', accountName: '', accountNumber: '', contactNumber: ''
  });
  const [qrMsg, setQrMsg] = useState({ text: '', type: '' });

  // 1. ดึงข้อมูลจาก Server แบบ Async
  const refreshData = async () => {
    setIsLoading(true);
    const allPayments = await getPayments();
    setPayments(allPayments);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpenQrModal = async () => {
      const settings = await getSettings();
      setPreviewQr(settings.paymentQrCode || null);
      setSettingsForm({
          bankName: settings.bankName || '',
          accountName: settings.accountName || '',
          accountNumber: settings.accountNumber || '',
          contactNumber: settings.contactNumber || ''
      });
      setIsQrModalOpen(true);
  };

  // 2. ปรับการเปลี่ยนสถานะ (อนุมัติ/ปฏิเสธ) ให้ส่งข้อมูลไป Server
  const handleVerify = (id: string, status: 'APPROVED' | 'REJECTED') => {
    const isApprove = status === 'APPROVED';
    setConfirmDialog({
        isOpen: true,
        title: isApprove ? 'ยืนยันการอนุมัติ' : 'ยืนยันการปฏิเสธ',
        message: isApprove 
            ? 'คุณต้องการอนุมัติรายการชำระเงินนี้ใช่หรือไม่?' 
            : 'คุณต้องการปฏิเสธรายการชำระเงินนี้? ลูกบ้านจะต้องส่งสลิปใหม่',
        variant: isApprove ? 'default' : 'danger',
        onConfirm: async () => {
            await updatePaymentStatus(id, status); // ส่งไป Server
            await refreshData(); // โหลดข้อมูลใหม่
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
    });
  };

  // 3. ปรับการบันทึกการตั้งค่า (QR/เบอร์โทร)
  const handleSaveSettings = async () => {
      await saveSettings({
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

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setPreviewQr(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const totalIncome = payments
    .filter(p => p.status === 'APPROVED')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;

  const displayPayments = payments
    .filter(p => filterStatus === 'ALL' || p.status === filterStatus)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col relative pb-safe">
       <header className="bg-white shadow-md z-20 border-b border-slate-200 sticky top-0 pt-safe">
         <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
                <FileText size={18} />
              </div>
              <h1 className="text-lg font-bold text-slate-800">แผงควบคุมแอดมิน</h1>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={handleOpenQrModal} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full"><QrCode size={20} /></button>
                <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-600"><LogOut size={20} /></button>
            </div>
         </div>
       </header>

       <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <p className="text-slate-500 text-[10px] font-bold uppercase">ยอดรวม</p>
              <h3 className="text-xl font-extrabold text-emerald-600">{totalIncome.toLocaleString()} ฿</h3>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <p className="text-slate-500 text-[10px] font-bold uppercase">รอตรวจ</p>
              <h3 className="text-xl font-extrabold text-amber-600">{pendingCount} รายการ</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
              <div className="p-4 border-b border-slate-100 flex bg-slate-50 gap-2 overflow-x-auto">
                {(['ALL', 'PENDING', 'APPROVED'] as const).map((status) => (
                  <button key={status} onClick={() => setFilterStatus(status)} className={`flex-1 px-4 py-2 text-xs font-bold rounded-xl transition-all ${filterStatus === status ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>
                    {status === 'ALL' ? 'ทั้งหมด' : status === 'PENDING' ? 'รอตรวจ' : 'อนุมัติแล้ว'}
                  </button>
                ))}
              </div>
              
              <div className="overflow-auto flex-1">
                {isLoading ? (
                    <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : displayPayments.length === 0 ? (
                    <div className="text-center py-20 text-slate-400"><Search className="mx-auto mb-2 opacity-20" size={40} /><p>ไม่พบรายการ</p></div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {displayPayments.map((payment) => (
                      <div key={payment.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">บ้านเลขที่: {payment.houseNo}</p>
                            <p className="text-[10px] text-slate-500">วันที่: {payment.date} | เดือน: {payment.month}</p>
                          </div>
                          <p className="font-bold text-blue-700 text-base">{payment.amount.toLocaleString()} ฿</p>
                        </div>

                        {payment.status === 'PENDING' ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleVerify(payment.id, 'APPROVED')} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm"><CheckCircle size={14}/> อนุมัติ</button>
                            <button onClick={() => handleVerify(payment.id, 'REJECTED')} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm"><XCircle size={14}/> ปฏิเสธ</button>
                          </div>
                        ) : (
                          <div className={`text-center py-1.5 rounded-lg text-[10px] font-bold ${payment.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {payment.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>
       </main>

       {/* Modal แจ้งเตือนยืนยัน */}
       {confirmDialog.isOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-bounce-in">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmDialog.title}</h3>
                <p className="text-slate-500 text-sm mb-6">{confirmDialog.message}</p>
                <div className="flex gap-3">
                    <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">ยกเลิก</button>
                    <button onClick={confirmDialog.onConfirm} className={`flex-1 py-3 text-white rounded-xl font-bold ${confirmDialog.variant === 'danger' ? 'bg-red-600' : 'bg-blue-600'}`}>ยืนยัน</button>
                </div>
           </div>
         </div>
       )}

       {/* Modal ตั้งค่า QR & บัญชี */}
       {isQrModalOpen && (
           <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
               <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md p-6 max-h-[85vh] overflow-y-auto">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-bold text-slate-900">ตั้งค่าการรับเงิน</h3>
                       <button onClick={() => setIsQrModalOpen(false)}><XCircle size={24} className="text-slate-300" /></button>
                   </div>
                   <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">เบอร์โทรศัพท์ติดต่อ</label>
                            <input type="tel" className="w-full p-3 border rounded-xl bg-slate-50" value={settingsForm.contactNumber} onChange={e => setSettingsForm({...settingsForm, contactNumber: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">เลือกธนาคาร</label>
                            <select className="w-full p-3 border rounded-xl bg-slate-50 mb-2 text-slate-900" value={settingsForm.bankName} onChange={e => setSettingsForm({...settingsForm, bankName: e.target.value})}>
                                <option value="">-- เลือกธนาคาร --</option>
                                {BANKS.map((bank) => (
                                    <option key={bank} value={bank}>{bank}</option>
                                ))}
                            </select>
                            <label className="text-xs font-bold text-slate-500 mb-1 block mt-2">ชื่อบัญชี</label>
                            <input type="text" className="w-full p-3 border rounded-xl bg-slate-50" placeholder="ชื่อบัญชี" value={settingsForm.accountName} onChange={e => setSettingsForm({...settingsForm, accountName: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">รูปภาพ QR Code</label>
                            <div className="border-2 border-dashed rounded-xl p-4 text-center">
                                {previewQr ? <img src={previewQr} className="w-32 h-32 mx-auto mb-2 object-contain" /> : <QrCode className="mx-auto text-slate-300 mb-2" size={40} />}
                                <input type="file" accept="image/*" onChange={handleQrFileChange} className="text-xs" />
                            </div>
                        </div>
                        {qrMsg.text && <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl text-center text-xs font-bold">{qrMsg.text}</div>}
                        <button onClick={handleSaveSettings} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold">บันทึกทั้งหมด</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default AdminDashboard;