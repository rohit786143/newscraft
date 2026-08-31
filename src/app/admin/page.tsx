'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  newspaperName: string;
  planType: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'blocked' | 'expired';
  createdAt: string;
  notes?: string;
}

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  blockedUsers: number;
  expiringSoon: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'blocked'>('all');

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNewspaper, setNewNewspaper] = useState('');
  const [newPlanType, setNewPlanType] = useState('1-month');
  const [newCustomDate, setNewCustomDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editPassword, setEditPassword] = useState('');

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Verify admin session
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.authenticated || meData.user?.role !== 'admin') {
        router.push('/login');
        return;
      }

      // 2. Fetch users list
      const usersRes = await fetch('/api/admin/users');
      const usersData = await usersRes.json();
      if (usersRes.ok && usersData.users) {
        setUsers(usersData.users);
      }

      // 3. Fetch stats
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsRes.ok && statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Add User Submission
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername || !newPassword) {
      setModalError('Please fill in Name, Username, and Password.');
      return;
    }

    setActionLoading(true);
    setModalError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          username: newUsername,
          email: newEmail,
          password: newPassword,
          newspaperName: newNewspaper,
          planType: newPlanType,
          customEndDate: newPlanType === 'custom' ? newCustomDate : undefined,
          notes: newNotes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || 'Failed to create user.');
        return;
      }

      showToast(`User "${newName}" added successfully with active subscription!`);
      setShowAddModal(false);
      // Reset form
      setNewName('');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewNewspaper('');
      setNewPlanType('1-month');
      setNewNotes('');
      fetchDashboardData();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Action: Block / Unblock / Extend
  const handleUserAction = async (userId: string, action: 'block' | 'unblock' | 'extend', months: number = 1) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          extendMonths: months
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Action failed.', 'error');
        return;
      }

      if (action === 'block') showToast('User account has been suspended (Blocked).', 'error');
      else if (action === 'unblock') showToast('User account unblocked and subscription renewed!');
      else if (action === 'extend') showToast(`Subscription extended by +${months} Month(s)!`);

      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Edit User Submission
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          newspaperName: editingUser.newspaperName,
          password: editPassword ? editPassword : undefined,
          newEndDate: editingUser.endDate,
          status: editingUser.status,
          notes: editingUser.notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Update failed.', 'error');
        return;
      }

      showToast('User details updated successfully!');
      setEditingUser(null);
      setEditPassword('');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Delete failed.', 'error');
        return;
      }
      showToast('User removed successfully!');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Helper for expiry countdown
  const getExpiryDetails = (endDateStr: string, status: string) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (status === 'blocked') {
      return { text: 'Suspended (Admin Blocked)', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (diffDays < 0) {
      return { text: `Expired (${Math.abs(diffDays)}d ago)`, badgeClass: 'bg-red-50 text-red-700 border-red-200' };
    }
    if (diffDays === 0) {
      return { text: 'Expires Today', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (diffDays <= 3) {
      return { text: `${diffDays} days left (Expiring Soon)`, badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { text: `${diffDays} days remaining`, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' };
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    if (u.role === 'admin') return false; // Don't show admin in client subscription list
    
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.newspaperName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return u.status === 'active' && new Date(u.endDate) > new Date();
    if (filterStatus === 'expired') return u.status === 'expired' || (u.status !== 'blocked' && new Date(u.endDate) <= new Date());
    if (filterStatus === 'blocked') return u.status === 'blocked';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* TOAST ALERT */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-bounce ${
          toastMsg.type === 'error' ? 'bg-red-600 border-red-700 text-white' : 'bg-emerald-600 border-emerald-700 text-white'
        }`}>
          <span>{toastMsg.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* TOP ADMIN NAVBAR (BRIGHT PROFESSIONAL) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white font-bold font-serif text-2xl shadow-md shadow-red-500/25">
            P
          </div>
          <div>
            <h1 className="font-black text-slate-900 text-2xl tracking-tight font-serif">
              PressCraft <span className="text-red-600">Admin Portal</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open('/', '_blank')}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Open Editor in new tab"
          >
            <span>📰</span> Open Live Studio
          </button>
          
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </header>

      {/* MAIN ADMIN CONTENT */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* 1. METRICS / STATS CARDS (BRIGHT & VIBRANT) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Users */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Accounts</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{stats?.totalUsers ?? '...'}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl border border-blue-100 shadow-inner">
                👥
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">All registered newspaper clients</p>
          </div>

          {/* Card 2: Active Subscriptions */}
          <div className="bg-white border border-emerald-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Subscriptions</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">{stats?.activeUsers ?? '...'}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl border border-emerald-200 shadow-inner">
                🟢
              </div>
            </div>
            <p className="text-[11px] text-emerald-700 mt-2 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Full studio access enabled
            </p>
          </div>

          {/* Card 3: Expired (Auto-Blocked) */}
          <div className="bg-white border border-red-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Expired (Auto-Blocked)</p>
                <p className="text-3xl font-black text-red-600 mt-1">{stats?.expiredUsers ?? '...'}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl border border-red-200 shadow-inner">
                ⏳
              </div>
            </div>
            <p className="text-[11px] text-red-700 mt-2 font-semibold">Locked automatically after duration</p>
          </div>

          {/* Card 4: Suspended / Blocked */}
          <div className="bg-white border border-rose-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Suspended Accounts</p>
                <p className="text-3xl font-black text-rose-600 mt-1">{stats?.blockedUsers ?? '...'}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl border border-rose-200 shadow-inner">
                🚫
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">Manually restricted by admin</p>
          </div>

        </div>

        {/* 2. USER MANAGEMENT ACTIONS BAR (BRIGHT) */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          
          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                placeholder="Search by user or publication..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
              />
              <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg font-bold transition ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All ({users.filter(u => u.role !== 'admin').length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1 rounded-lg font-bold transition ${filterStatus === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-emerald-700'}`}
              >
                Active 🟢
              </button>
              <button
                onClick={() => setFilterStatus('expired')}
                className={`px-3 py-1 rounded-lg font-bold transition ${filterStatus === 'expired' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-red-700'}`}
              >
                Expired ⏳
              </button>
              <button
                onClick={() => setFilterStatus('blocked')}
                className={`px-3 py-1 rounded-lg font-bold transition ${filterStatus === 'blocked' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-rose-700'}`}
              >
                Suspended 🚫
              </button>
            </div>
          </div>

          {/* Add New User Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span className="text-base font-bold">+</span>
            <span>Add New User</span>
          </button>
        </div>

        {/* 3. USERS TABLE (BRIGHT & CRISP) */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">User / Publication Name</th>
                  <th className="py-3.5 px-4">Login Username</th>
                  <th className="py-3.5 px-4">Subscription Plan</th>
                  <th className="py-3.5 px-4">Expiration Date</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-slate-400 font-medium">
                      {loading ? 'Loading subscription data...' : 'No users found matching your criteria. Click "+ Add New User" to register a client.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const expiry = getExpiryDetails(u.endDate, u.status);
                    const isAccountBlocked = u.status === 'blocked' || u.status === 'expired' || new Date(u.endDate) <= new Date();

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        {/* Name & Newspaper */}
                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-slate-900 text-sm">{u.name}</p>
                          <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <span>📰</span> {u.newspaperName || 'Daily Edition'}
                          </p>
                        </td>

                        {/* Username & Email */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                            {u.username}
                          </span>
                          <span className="block text-slate-400 text-[10px] mt-1 font-sans">{u.email}</span>
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {u.planType === '1-month' ? '1 Month' : u.planType === '3-months' ? '3 Months' : u.planType === '6-months' ? '6 Months' : u.planType === '1-year' ? '1 Year' : 'Custom Plan'}
                          </span>
                        </td>

                        {/* Expiry Date & Countdown */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">
                            {new Date(u.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${expiry.badgeClass}`}>
                            {expiry.text}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          {isAccountBlocked ? (
                            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              <span>Locked / Blocked</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Active</span>
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            
                            {/* UNBLOCK / BLOCK BUTTON */}
                            {isAccountBlocked ? (
                              <button
                                onClick={() => handleUserAction(u.id, 'unblock')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                                title="Unblock user and auto-renew subscription (+1 Month from today)"
                              >
                                <span>🔓</span> Unblock
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(u.id, 'block')}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200 cursor-pointer"
                                title="Immediately suspend user access"
                              >
                                <span>🔒</span> Block
                              </button>
                            )}

                            {/* +1 MONTH EXTENSION BUTTON */}
                            <button
                              onClick={() => handleUserAction(u.id, 'extend', 1)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition border border-blue-200 cursor-pointer shadow-sm"
                              title="Extend subscription by +1 month"
                            >
                              +1 Month
                            </button>

                            {/* EDIT BUTTON */}
                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition border border-slate-200 cursor-pointer"
                              title="Edit user details"
                            >
                              ✏️ Edit
                            </button>

                            {/* DELETE BUTTON */}
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs transition border border-red-200 cursor-pointer"
                              title="Delete user"
                            >
                              🗑️
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* MODAL: ADD NEW USER (BRIGHT PROFESSIONAL) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>➕</span> Add New Newspaper Client (User)
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Newspaper Name</label>
                  <input
                    type="text"
                    value={newNewspaper}
                    onChange={(e) => setNewNewspaper(e.target.value)}
                    placeholder="e.g. Himachal News"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Login Username (Unique) *</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. rajesh123"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none font-mono font-bold transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Password *</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. pass123"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none font-mono transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="rajesh@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subscription Duration</label>
                  <select
                    value={newPlanType}
                    onChange={(e) => setNewPlanType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none font-bold transition"
                  >
                    <option value="1-month">1 Month (Auto-Blocks after 30 days)</option>
                    <option value="3-months">3 Months</option>
                    <option value="6-months">6 Months</option>
                    <option value="1-year">1 Year</option>
                    <option value="custom">Custom End Date</option>
                  </select>
                </div>
              </div>

              {newPlanType === 'custom' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Custom Expiration Date</label>
                  <input
                    type="date"
                    value={newCustomDate}
                    onChange={(e) => setNewCustomDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none transition"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact / Notes / Payment Reference</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. +91 98160-XXXXX, Paid via UPI"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-extrabold transition shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save & Activate User →'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>✏️</span> Edit Client Details ({editingUser.name})
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Newspaper Name</label>
                  <input
                    type="text"
                    value={editingUser.newspaperName}
                    onChange={(e) => setEditingUser({ ...editingUser, newspaperName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Password (leave blank to keep current)</label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={editingUser.endDate ? editingUser.endDate.split('T')[0] : ''}
                    onChange={(e) => setEditingUser({ ...editingUser, endDate: new Date(e.target.value).toISOString() })}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Account Access Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none font-bold"
                >
                  <option value="active">🟢 Active (Access Enabled)</option>
                  <option value="blocked">🚫 Suspended (Admin Blocked)</option>
                  <option value="expired">⏳ Expired (Auto-Blocked)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Admin Notes</label>
                <input
                  type="text"
                  value={editingUser.notes || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
