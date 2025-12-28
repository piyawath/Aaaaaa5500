import React, { useState, useEffect } from 'react';
import { User } from '../types';
import * as storage from '../services/storageService'; 
import { User as UserIcon, Home, Key, ArrowRight, Phone, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await storage.getSettings();
        setContactNumber(settings.contactNumber || '02-123-4567');
      } catch (err) { console.error(err); }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!username || activeTab === 'admin') {
        setIsCheckingUser(false);
        setIsFirstTimeUser(false);
        return;
    }
    setIsCheckingUser(true);
    const timer = setTimeout(async () => {
        const status = await storage.checkUserStatus(username); 
        setIsFirstTimeUser(!status.exists || !status.isSetup);
        setIsCheckingUser(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [username, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length !== 4) {
        setError('รหัสผ่านต้องเป็นตัวเลข 4 หลัก');
        return;
    }
    setIsSubmitting(true);
    try {
        if (!isFirstTimeUser) {
            const users = await storage.getUsers();
            const user = users.find(u => u.username === username && u.password === password && u.role === activeTab);
            if (user) onLogin(user);
            else setError('รหัสผ่านไม่ถูกต้อง');
        } else {
            if (password !== confirmPassword) {
                setError('รหัสผ่านไม่ตรงกัน');
                setIsSubmitting(false);
                return;
            }
            await storage.setupUserPassword(username, password);
            const users = await storage.getUsers();
            const user = users.find(u => u.username === username);
            if (user) onLogin(user);
        }
    } catch (err) {
        setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white">
        <div className="bg-blue-700 p-8 text-center text-white">
          <Home className="w-14 h-14 mx-auto mb-3 text-blue-100" />
          <h1 className="text-3xl font-extrabold">Village Pay</h1>
        </div>

        <div className="flex bg-slate-50 p-2 m-4 rounded-2xl border border-slate-200">
          <button type="button" onClick={() => setActiveTab('user')} className={`flex-1 py-3 rounded-xl font-bold ${activeTab === 'user' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>ลูกบ้าน</button>
          <button type="button" onClick={() => setActiveTab('admin')} className={`flex-1 py-3 rounded-xl font-bold ${activeTab === 'admin' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>แอดมิน</button>
        </div>

        <div className="px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {activeTab === 'user' && (
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 mb-2">บ้านเลขที่</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-bold"
                    placeholder="99/99"
                    required
                  />
                  {isCheckingUser && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={18} />}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">{isFirstTimeUser ? 'ตั้งรหัสผ่านใหม่ (4 หลัก)' : 'รหัสผ่าน 4 หลัก'}</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  maxLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center font-black text-xl tracking-widest"
                  placeholder="••••"
                  required
                />
              </div>
            </div>

            {isFirstTimeUser && (
              <input
                type="password"
                maxLength={4}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, ''))}
                className="w-full py-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center font-black text-xl tracking-widest"
                placeholder="ยืนยันรหัสผ่าน"
                required
              />
            )}

            {error && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl text-center">{error}</div>}

<button
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 ${isFirstTimeUser ? 'bg-emerald-600' : 'bg-blue-600'}`}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <ArrowRight />
                  {isFirstTimeUser ? 'บันทึกและเข้าใช้งาน' : 'เข้าสู่ระบบ'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;