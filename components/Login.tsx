import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getUsers, checkUserStatus, setupUserPassword, getSettings } from '../services/storageService';
import { User as UserIcon, Shield, Home, Key, ArrowRight, CheckCircle, UserPlus, Phone, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    const settings = getSettings();
    setContactNumber(settings.contactNumber || '02-123-4567');
  }, []);

  useEffect(() => {
    if (!username) {
        setIsCheckingUser(false);
        setIsFirstTimeUser(false);
        return;
    }

    setIsCheckingUser(true);
    const timer = setTimeout(() => {
        const status = checkUserStatus(username);
        if (!status.exists || !status.isSetup) {
          setIsFirstTimeUser(true);
          setError('');
        } else {
          setIsFirstTimeUser(false);
        }
        setIsCheckingUser(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [username, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length !== 4) {
        setError('รหัสผ่านต้องเป็นตัวเลข 4 หลัก');
        return;
    }

    if (!isFirstTimeUser) {
        const user = getUsers().find(u => u.username === username && u.password === password && u.role === activeTab);
        if (user) onLogin(user);
        else setError('รหัสผ่านไม่ถูกต้อง');
    } else {
        if (password !== confirmPassword) {
            setError('รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }
        setupUserPassword(username, password);
        const user = getUsers().find(u => u.username === username);
        if (user) onLogin(user);
    }
  };

  const handlePasswordInput = (value: string, setter: (val: string) => void) => {
      const numericValue = value.replace(/\D/g, '').slice(0, 4);
      setter(numericValue);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 pt-safe pb-safe">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-white">
        <div className="bg-blue-700 p-8 text-center text-white relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-white"><circle cx="10" cy="10" r="20" /><circle cx="90" cy="90" r="30" /></svg>
          </div>
          <div className="flex justify-center mb-3">
            <Home className="w-14 h-14 text-blue-100" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Village Pay</h1>
          <p className="text-blue-100 text-sm mt-1 font-medium opacity-80 uppercase tracking-widest text-[10px]">Community Payment System</p>
        </div>

        <div className="flex bg-slate-50 p-2 m-4 rounded-2xl border border-slate-200">
          <button
            className={`flex-1 py-3 text-center font-bold rounded-xl transition-all ${activeTab === 'user' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
            onClick={() => { setActiveTab('user'); setUsername(''); setPassword(''); }}
          >
            ลูกบ้าน
          </button>
          <button
            className={`flex-1 py-3 text-center font-bold rounded-xl transition-all ${activeTab === 'admin' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
            onClick={() => { setActiveTab('admin'); setUsername('admin'); setPassword(''); }}
          >
            แอดมิน
          </button>
        </div>

        <div className="px-8 pb-8 pt-2">
          <form onSubmit={handleLogin} className="space-y-6">
            {activeTab === 'user' && (
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">บ้านเลขที่</label>
                <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 font-bold"
                    placeholder="99/99"
                    autoComplete="username"
                    required
                    />
                    {isCheckingUser && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={18} />}
                </div>
              </div>
            )}

            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  {isFirstTimeUser ? 'ตั้งรหัสผ่านใหม่ (4 หลัก)' : 'รหัสผ่าน 4 หลัก'}
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={password}
                    onChange={(e) => handlePasswordInput(e.target.value, setPassword)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all tracking-[0.8em] text-center text-slate-900 font-black text-xl"
                    placeholder="••••"
                    autoComplete="current-password"
                    required
                />
              </div>
            </div>

            {isFirstTimeUser && (
                <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">ยืนยันรหัสผ่าน</label>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={confirmPassword}
                        onChange={(e) => handlePasswordInput(e.target.value, setConfirmPassword)}
                        className="w-full py-4 bg-emerald-50 border border-emerald-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all tracking-[0.8em] text-center text-slate-900 font-black text-xl"
                        placeholder="••••"
                        autoComplete="new-password"
                        required
                    />
                </div>
            )}

            {error && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl text-center border border-red-100">{error}</div>}

            <button
              type="submit"
              className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${isFirstTimeUser ? 'bg-emerald-600' : 'bg-blue-600'}`}
            >
              {isFirstTimeUser ? 'บันทึกและเข้าใช้งาน' : 'เข้าสู่ระบบ'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Technical Support</p>
            <a href={`tel:${contactNumber}`} className="inline-flex items-center gap-3 text-blue-600 bg-blue-50 px-5 py-2 rounded-full font-bold hover:bg-blue-100 transition-colors text-xs">
                <Phone size={14} fill="currentColor" />
                {contactNumber}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;