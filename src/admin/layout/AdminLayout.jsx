import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

import AdminSidebar from '../components/AdminSidebar';
import { AdminDataProvider } from '../context/AdminDataContext';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin');
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );
    }
  };

  return (
    <AdminDataProvider>
      <div
        dir="rtl"
        className="min-h-screen bg-[#FFF8F3] text-[#3D2314]"
      >
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() =>
            setSidebarOpen(false)
          }
          onLogout={handleLogout}
        />

        <main className="min-h-screen lg:mr-72">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#3D2314]/10 bg-[#FFF8F3]/95 px-4 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label="فتح القائمة"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D2314] text-xl text-white"
            >
              ☰
            </button>

            <div className="text-right">
              <p className="text-sm font-black">
                كوكب السعادة
              </p>

              <p className="text-xs text-[#3D2314]/50">
                لوحة الإدارة
              </p>
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </AdminDataProvider>
  );
}