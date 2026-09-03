'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PressCraftStudioPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || !data.user) {
          router.push('/login');
        } else {
          setCurrentUser(data.user);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleExitImpersonation = async () => {
    setExiting(true);
    try {
      const res = await fetch('/api/admin/exit-impersonate', { method: 'POST' });
      const data = await res.json();
      if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        window.location.href = '/admin';
      }
    } catch {
      window.location.href = '/admin';
    }
  };

  if (!authChecked) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white font-bold font-serif text-xl shadow-lg shadow-red-600/30 mb-4 animate-pulse">
          P
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <svg className="animate-spin h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>सुरक्षित ई-पेपर स्टूडियो लोड हो रहा है...</span>
        </div>
      </div>
    );
  }

  const isImpersonating = Boolean(currentUser?.is_impersonating);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#020617', position: 'fixed', top: 0, left: 0, display: 'flex', flexDirection: 'column' }}>
      {/* TOP IMPERSONATION BANNER */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xl z-50 shrink-0 border-b border-amber-400">
          <div className="flex items-center gap-2">
            <span className="text-base animate-pulse">⚠️</span>
            <span>
              Viewing as <strong className="underline text-amber-100">{currentUser.name}</strong> ({currentUser.newspaperName || currentUser.username}) <span className="bg-amber-800/80 px-2 py-0.5 rounded text-[10px] ml-1 uppercase tracking-wider font-extrabold border border-amber-500">Admin Mode</span>
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            disabled={exiting}
            className="bg-white hover:bg-slate-100 text-amber-950 px-3.5 py-1 rounded-lg text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>🚪</span>
            <span>{exiting ? 'Exiting...' : 'Exit & Back to Admin'}</span>
          </button>
        </div>
      )}

      {/* EDITOR IFRAME */}
      <iframe
        src="/index.html"
        style={{ width: '100vw', flex: 1, border: 'none', margin: 0, padding: 0, display: 'block' }}
        title="PressCraft Broadsheet Publishing Studio"
      />
    </div>
  );
}
