'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize or retrieve persistent Device ID on client
  useEffect(() => {
    try {
      let storedId = localStorage.getItem('presscraft_device_id');
      if (!storedId) {
        // Generate random 8-character alphanumeric device identifier
        const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        storedId = `DEV-${part1}-${part2}`;
        localStorage.setItem('presscraft_device_id', storedId);
      }
      setDeviceId(storedId);
    } catch {
      setDeviceId('DEV-PC-' + Math.floor(1000 + Math.random() * 9000));
    }

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

  const copyDeviceId = () => {
    if (!deviceId) return;
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('कृपया Username और Password दर्ज करें।');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setIsExpired(false);
    setIsBlocked(false);
    setShowDeviceModal(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: username.trim(),
          password: password.trim(),
          deviceId: deviceId.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'DEVICE_NOT_REGISTERED') {
          setShowDeviceModal(true);
          setErrorMsg(data.message || 'यह डिवाइस आपके सब्सक्रिप्शन में एक्टिवेट नहीं है।');
        } else if (data.code === 'EXPIRED') {
          setIsExpired(true);
          setErrorMsg(data.error || 'Subscription expired.');
        } else if (data.code === 'BLOCKED') {
          setIsBlocked(true);
          setErrorMsg(data.error || 'Account suspended.');
        } else {
          setErrorMsg(data.error || 'Authentication failed.');
        }
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

        {/* DEVICE NOT REGISTERED BANNER & MODAL */}
        {showDeviceModal && (
          <div className="p-4 rounded-2xl mb-6 text-xs leading-relaxed bg-amber-50 border border-amber-300 text-amber-900 shadow-sm animate-in fade-in">
            <div className="flex items-start gap-2.5 mb-2.5">
              <span className="text-lg shrink-0">💻</span>
              <div>
                <p className="font-extrabold text-sm text-amber-950">डिवाइस एक्टिवेशन आवश्यक (Device Not Bound)</p>
                <p className="mt-1 text-xs text-amber-800 font-medium">
                  यह सिस्टम अभी एक्टिवेट नहीं है। मल्टीपल डिवाइस सब्सक्रिप्शन के लिए यह कोड एडमिन को भेजें।
                </p>
              </div>
            </div>

            {/* DEVICE CODE COPY BOX */}
            <div className="mt-3 p-3 bg-white border border-amber-300 rounded-xl flex items-center justify-between gap-2 shadow-inner">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Your Device ID:</span>
                <span className="font-mono font-black text-sm text-slate-900 tracking-wider select-all">{deviceId}</span>
              </div>
              <button
                type="button"
                onClick={copyDeviceId}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                }`}
              >
                {copied ? <span>✓ Copied!</span> : <span>📋 Copy Code</span>}
              </button>
            </div>

            {/* WHATSAPP ACTION */}
            <div className="mt-3 flex items-center justify-between pt-1 border-t border-amber-200/60">
              <span className="text-[11px] text-amber-800 font-semibold">Admin: +91 98576-40014</span>
              <a
                href={`https://api.whatsapp.com/send?phone=919857640014&text=${encodeURIComponent(
                  `नमस्ते एडमिन, कृपया मेरे नए डिवाइस को PressCraft Studio में एक्टिवेट करें।\nUsername: ${username || 'मेरा यूज़रनेम'}\nDevice ID: ${deviceId}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
              >
                <span>💬 WhatsApp पर भेजें →</span>
              </a>
            </div>
          </div>
        )}

        {/* ERROR / EXPIRED / BLOCKED NOTIFICATION */}
        {!showDeviceModal && errorMsg && (
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
                    📞 Please contact Admin at <a href="https://api.whatsapp.com/send?phone=919857640014" target="_blank" rel="noreferrer" className="underline font-black text-emerald-800">+91 98576-40014 (WhatsApp)</a> to unblock or renew.
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

          {/* DEVICE ID INFO BADGE */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>Machine Device ID:</span>
            <span className="font-mono font-bold text-slate-600">{deviceId || 'Detecting...'}</span>
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
                <span>Verifying credentials & device...</span>
              </>
            ) : (
              <span>Sign In to Studio →</span>
            )}
          </button>
        </form>
      </div>

      <div className="text-center text-slate-500 text-xs mt-6 font-medium">
        © 2026 PressCraft Pro Studio • Multi-Device Protected Publishing Platform
      </div>
    </div>
  );
}
