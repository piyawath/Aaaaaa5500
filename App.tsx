import React, { useState, useEffect } from 'react';
import { User } from './types';
import { initStorage } from './services/storageService';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // สร้างฟังก์ชัน async ภายใน useEffect
    const setupApp = async () => {
      try {
        // 1. รอให้ Server เตรียมไฟล์ db.json ให้พร้อม
        await initStorage();
        
        // 2. เช็ค Session เดิม (ถ้ามี)
        const savedUser = localStorage.getItem('current_session');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("ไม่สามารถเชื่อมต่อกับ Server ได้:", error);
      } finally {
        // 3. ปิดหน้า Loading เมื่อทุกอย่างเสร็จสิ้น
        setLoading(false);
      }
    };

    setupApp();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // บันทึกลงเครื่องเพื่อให้ไม่ต้อง Login ใหม่บ่อยๆ แต่ข้อมูลหลักจะซิงค์จาก Server
    localStorage.setItem('current_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current_session');
  };

  // --- ส่วนการแสดงผล (Rendering) ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-blue-600 font-medium">กำลังเชื่อมต่อฐานข้อมูล...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser.role === 'admin' ? (
        <AdminDashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <UserDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;