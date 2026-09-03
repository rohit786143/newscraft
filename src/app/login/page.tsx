'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          if (data.user.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both Username and Password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setIsExpired(false);
    setIsBlocked(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'EXPIRED') {
          setIsExpired(true);
        } else if (data.code === 'BLOCKED') {
          setIsBlocked(true);
        }
        setErrorMsg(data.error || 'Authentication failed.');
        setLoading(false);
        return;
      }

      if (data.success && data.user) {
        if (data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setErrorMsg('Failed to connect to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 relative font-sans antialiased">
      
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl z-10">
        
        {/* LOGO & BRAND */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/20 mb-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 font-serif">
            PressCraft <span className="text-red-600">Studio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Broadsheet Newspaper & E-Paper Publishing Portal
          </p>
        </div>

        {/* ERROR / EXPIRED / BLOCKED NOTIFICATION */}
        {errorMsg && (
          <div className={`p-4 rounded-2xl mb-6 text-xs leading-relaxed border ${
            isExpired || isBlocked
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start gap-2.5">
              <span className="text-base shrink-0">{isExpired ? '⏳' : isBlocked ? '🚫' : '⚠️'}</span>
              <div>
                <p className="font-extrabold mb-0.5">{isExpired ? 'Subscription Expired' : isBlocked ? 'Account Suspended' : 'Login Error'}</p>
                <p>{errorMsg}</p>
                {(isExpired || isBlocked) && (
                  <p className="mt-2 text-[11px] text-amber-800 font-bold">
                    📞 Please contact your Administrator to unblock or renew your subscription.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Username or Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username / Email"
              className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-2.5 text-slate-900 text-sm outline-none transition font-medium"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-2.5 text-slate-900 text-sm outline-none transition font-medium"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white font-extrabold rounded-xl text-sm shadow-lg shadow-red-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In to Studio →</span>
            )}
          </button>
        </form>
      </div>

      <div className="text-center text-slate-500 text-xs mt-6 font-medium">
        © 2026 PressCraft Pro Studio • All-in-One Newspaper Publishing Platform
      </div>
    </div>
  );
}
