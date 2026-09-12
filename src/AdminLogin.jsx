
// src/pages/AdminLogin.jsx

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase/config';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError('');

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError('من فضلك أدخل البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      navigate('/admin/dashboard', { replace: true });
    } catch (firebaseError) {
      // Do not expose Firebase's internal error details to the user.
      console.error('Admin login failed:', firebaseError?.code);

      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-[#FFF8F3] flex items-center justify-center px-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">

        <div className="bg-white rounded-3xl shadow-xl border border-orange-100 p-8">

          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div
              className="text-6xl mb-4"
              aria-hidden="true"
            >
              🍩
            </div>

            <h1 className="text-3xl font-black text-[#3D2314]">
              لوحة التحكم
            </h1>

            <p className="text-gray-500 mt-2">
              تسجيل دخول المسؤول
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-3 mb-5 text-sm font-bold text-center"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="space-y-5"
            noValidate={false}
          >

            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-black text-[#3D2314] mb-2"
              >
                البريد الإلكتروني
              </label>

              <input
                id="admin-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="admin@example.com"
                autoComplete="username"
                inputMode="email"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF8F3] border border-orange-100 focus:outline-none focus:border-[#FF6600] disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-black text-[#3D2314] mb-2"
              >
                كلمة المرور
              </label>

              <input
                id="admin-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF8F3] border border-orange-100 focus:outline-none focus:border-[#FF6600] disabled:opacity-60"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6600] hover:bg-[#e65c00] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-full font-black text-base shadow-lg transition-all"
            >
              {loading
                ? 'جاري تسجيل الدخول...'
                : 'تسجيل الدخول 🔐'}
            </button>

          </form>

        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          كوكب السعادة © 2026
        </p>

      </div>
    </main>
  );
}

