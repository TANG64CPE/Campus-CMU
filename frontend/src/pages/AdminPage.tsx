import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { AdminStats, AdminUserSummary, AdminUserDetail } from '../types';
import {
  Users,
  Shield,
  ShoppingBag,
  Clock,
  Search,
  CheckCircle,
  AlertTriangle,
  Ban,
  UserCheck,
  ChevronRight,
  X,
  ExternalLink,
  MapPin,
  Mail,
  MessageSquare,
  Tag,
  RefreshCw,
  Eye,
  Calendar,
  Sparkles,
  Phone,
} from 'lucide-react';

interface AdminPageProps {
  onNavigateHome: () => void;
  onSelectProduct?: (id: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigateHome, onSelectProduct }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSideFilter, setActiveSideFilter] = useState<'all' | 'sellers' | 'buyers' | 'banned'>('all');

  // Detail Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'seller' | 'buyer'>('seller');

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers({
          search: searchQuery,
          side: activeSideFilter === 'sellers' ? 'sellers' : activeSideFilter === 'buyers' ? 'buyers' : undefined,
          status: activeSideFilter === 'banned' ? 'banned' : undefined,
        }),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setMessage({ text: 'ไม่สามารถโหลดข้อมูลระบบ Admin ได้ กรุณาตรวจสอบสิทธิ์', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, activeSideFilter]);

  const openUserDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    setUserDetail(null);
    try {
      const detail = await adminApi.getUserDetail(userId);
      setUserDetail(detail);
      // Auto-switch to tab that has data
      if (detail.sellerSide.products.length > 0) {
        setDetailTab('seller');
      } else if (detail.buyerSide.reservations.length > 0) {
        setDetailTab('buyer');
      } else {
        setDetailTab('seller');
      }
    } catch (err: any) {
      alert('ไม่สามารถโหลดรายละเอียดผู้ใช้รายนี้ได้: ' + (err.response?.data?.message || err.message));
      setSelectedUserId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeUserDetail = () => {
    setSelectedUserId(null);
    setUserDetail(null);
  };

  const handleToggleBan = async (userSummary: AdminUserSummary) => {
    const actionWord = userSummary.isBanned ? 'ปลดแบน' : 'ระงับการใช้งาน (แบน)';
    if (!confirm(`คุณต้องการ ${actionWord} บัญชี ${userSummary.name} (${userSummary.studentId}) ใช่หรือไม่?`)) {
      return;
    }

    setActionLoadingId(userSummary.id);
    try {
      const res = await adminApi.toggleBan(userSummary.id, !userSummary.isBanned);
      setMessage({
        text: res.message || `${actionWord} เรียบร้อยแล้ว`,
        type: 'success',
      });
      // Refresh list
      await loadData();
      if (userDetail && userDetail.user.id === userSummary.id) {
        setUserDetail({
          ...userDetail,
          user: { ...userDetail.user, isBanned: res.user.isBanned },
        });
      }
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะแบน',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleToggleRole = async (userSummary: AdminUserSummary) => {
    const newRole = userSummary.role === 'ADMIN' ? 'STUDENT' : 'ADMIN';
    if (!confirm(`ต้องการเปลี่ยนสิทธิ์ของ ${userSummary.name} เป็น ${newRole} หรือไม่?`)) {
      return;
    }

    setActionLoadingId(userSummary.id);
    try {
      await adminApi.updateRole(userSummary.id, newRole);
      setMessage({ text: `เปลี่ยนสิทธิ์เป็น ${newRole} เรียบร้อยแล้ว`, type: 'success' });
      await loadData();
      if (userDetail && userDetail.user.id === userSummary.id) {
        setUserDetail({
          ...userDetail,
          user: { ...userDetail.user, role: newRole },
        });
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'ไม่สามารถเปลี่ยนสิทธิ์ได้', type: 'error' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-8 py-6 pb-24">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xxs bg-surface-soft border border-hairline mb-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="eyebrow-mono text-[10px] text-ink-deep font-semibold">
              ADMINISTRATION SYSTEM • ACCOUNT MANAGEMENT
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink tracking-tight">
            ระบบจัดการบัญชีผู้ใช้งาน (Admin)
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            ตรวจสอบและจัดการบัญชีผู้ใช้ ดูสถิติทั้งฝั่งผู้ขาย (ลงขายอะไรบ้าง) และฝั่งผู้ซื้อ (กดจองอะไรบ้าง)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="btn-secondary-sm px-3 py-1.5 text-xs flex items-center gap-1.5"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">REFRESH</span>
          </button>
          <button onClick={onNavigateHome} className="btn-secondary-sm px-3.5 py-1.5 text-xs">
            กลับหน้าตลาด
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`mb-6 p-3.5 rounded-lg border text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-accent-green border-emerald-200'
              : 'bg-red-50 text-accent-red border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Overview Cards (ClickUp Workspace Tile Spec: 12px radius, hairline border) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="card-tile p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="eyebrow-mono text-[11px] text-ink-tertiary">ผู้ใช้ทั้งหมด</span>
            <div className="w-8 h-8 rounded-full bg-surface-soft border border-hairline flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
              {stats?.totalUsers ?? '...'}
            </div>
            <p className="text-[11px] text-ink-tertiary mt-0.5">บัญชีนักศึกษา/อาจารย์ในระบบ</p>
          </div>
        </div>

        <div className="card-tile p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="eyebrow-mono text-[11px] text-ink-tertiary">ฝั่งผู้ขาย (Sellers)</span>
            <div className="w-8 h-8 rounded-full bg-surface-soft border border-hairline flex items-center justify-center text-accent-green">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
              {stats?.totalSellers ?? '...'}
            </div>
            <p className="text-[11px] text-ink-tertiary mt-0.5">
              สินค้าทั้งหมดในตลาด {stats?.totalProducts ?? 0} ชิ้น
            </p>
          </div>
        </div>

        <div className="card-tile p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="eyebrow-mono text-[11px] text-ink-tertiary">ฝั่งผู้ซื้อ (Buyers)</span>
            <div className="w-8 h-8 rounded-full bg-surface-soft border border-hairline flex items-center justify-center text-brand-orange">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
              {stats?.totalBuyers ?? '...'}
            </div>
            <p className="text-[11px] text-ink-tertiary mt-0.5">
              การจอง {stats?.totalReservations ?? 0} ครั้ง (สำเร็จ {stats?.completedDeals ?? 0})
            </p>
          </div>
        </div>

        <div className="card-tile p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="eyebrow-mono text-[11px] text-ink-tertiary">บัญชีที่ถูกแบน</span>
            <div className="w-8 h-8 rounded-full bg-surface-soft border border-hairline flex items-center justify-center text-accent-red">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-accent-red">
              {stats?.totalBanned ?? '...'}
            </div>
            <p className="text-[11px] text-ink-tertiary mt-0.5">ถูกระงับเนื่องจากผิดนัด/โดนเท</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อ, รหัสนักศึกษา, อีเมล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full input-field pl-10 pr-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-ink-tertiary hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills (ClickUp segment pill tabs) */}
        <div className="inline-flex p-1 bg-surface-soft rounded-pill border border-hairline text-xs font-medium text-ink-secondary overflow-x-auto">
          <button
            onClick={() => setActiveSideFilter('all')}
            className={`px-3 py-1 rounded-pill transition-all whitespace-nowrap ${
              activeSideFilter === 'all'
                ? 'bg-canvas text-ink font-semibold shadow-tinted-xs border border-hairline'
                : 'hover:text-ink'
            }`}
          >
            ผู้ใช้ทั้งหมด ({users.length})
          </button>
          <button
            onClick={() => setActiveSideFilter('sellers')}
            className={`px-3 py-1 rounded-pill transition-all whitespace-nowrap ${
              activeSideFilter === 'sellers'
                ? 'bg-canvas text-primary font-semibold shadow-tinted-xs border border-hairline'
                : 'hover:text-ink'
            }`}
          >
            ฝั่งผู้ขาย (Sellers)
          </button>
          <button
            onClick={() => setActiveSideFilter('buyers')}
            className={`px-3 py-1 rounded-pill transition-all whitespace-nowrap ${
              activeSideFilter === 'buyers'
                ? 'bg-canvas text-brand-orange font-semibold shadow-tinted-xs border border-hairline'
                : 'hover:text-ink'
            }`}
          >
            ฝั่งผู้ซื้อ (Buyers)
          </button>
          <button
            onClick={() => setActiveSideFilter('banned')}
            className={`px-3 py-1 rounded-pill transition-all whitespace-nowrap ${
              activeSideFilter === 'banned'
                ? 'bg-canvas text-accent-red font-semibold shadow-tinted-xs border border-hairline'
                : 'hover:text-ink'
            }`}
          >
            ถูกระงับ/แบน
          </button>
        </div>
      </div>

      {/* Users List Table (ClickUp card-feature layout) */}
      <div className="bg-canvas rounded-lg border border-hairline overflow-hidden shadow-tinted-xs">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-hairline-strong border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-ink-tertiary">LOADING USER ACCOUNTS...</p>
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface border-b border-hairline eyebrow-mono text-ink-tertiary text-[11px]">
                  <th className="py-3 px-4 font-semibold">ผู้ใช้งาน (CMU Account)</th>
                  <th className="py-3 px-4 font-semibold">สิทธิ์</th>
                  <th className="py-3 px-4 font-semibold">ฝั่งผู้ขาย (ลงขาย)</th>
                  <th className="py-3 px-4 font-semibold">ฝั่งผู้ซื้อ (จองสินค้า)</th>
                  <th className="py-3 px-4 font-semibold">สถานะบัญชี</th>
                  <th className="py-3 px-4 font-semibold text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {users.map((u) => {
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-surface/50 transition-colors group cursor-pointer"
                      onClick={() => openUserDetail(u.id)}
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-surface-soft border border-hairline font-mono font-bold text-xs flex items-center justify-center text-ink shrink-0">
                            {u.studentId.slice(-3)}
                          </div>
                          <div>
                            <div className="font-semibold text-ink text-xs group-hover:text-primary transition-colors flex items-center gap-1.5">
                              <span>{u.name}</span>
                            </div>
                            <div className="font-mono text-[11px] text-ink-tertiary flex items-center gap-1">
                              <span>{u.studentId}</span>
                              <span>•</span>
                              <span className="truncate max-w-[180px]">{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`eyebrow-mono px-2 py-0.5 rounded-xxs text-[10px] font-bold border ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-50 text-primary border-purple-200'
                              : 'bg-surface text-ink-secondary border-hairline'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Seller stats */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold font-mono text-xs ${
                              u.sellerStats.totalProducts > 0 ? 'text-ink-deep' : 'text-ink-disabled'
                            }`}
                          >
                            {u.sellerStats.totalProducts} รายการ
                          </span>
                          {u.sellerStats.totalProducts > 0 && (
                            <span className="text-[10px] font-mono text-accent-green bg-emerald-50 px-1.5 py-0.5 rounded-xxs border border-emerald-200">
                              พร้อมขาย {u.sellerStats.availableProducts}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Buyer stats */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold font-mono text-xs ${
                              u.buyerStats.totalReservations > 0 ? 'text-ink-deep' : 'text-ink-disabled'
                            }`}
                          >
                            {u.buyerStats.totalReservations} ครั้ง
                          </span>
                          {u.buyerStats.pendingReservations > 0 && (
                            <span className="text-[10px] font-mono text-brand-orange bg-amber-50 px-1.5 py-0.5 rounded-xxs border border-amber-200">
                              รอรับ {u.buyerStats.pendingReservations}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-accent-red border border-red-200">
                            <Ban className="w-3 h-3" /> ถูกแบน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-accent-green border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> ปกติ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openUserDetail(u.id)}
                            className="btn-secondary-sm px-2.5 py-1 text-[11px] flex items-center gap-1"
                            title="ดูรายละเอียดการขายและการจอง"
                          >
                            <Eye className="w-3 h-3 text-primary" />
                            <span>ดูประวัติ</span>
                          </button>

                          <button
                            onClick={() => handleToggleBan(u)}
                            disabled={actionLoadingId === u.id}
                            className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold border transition-all ${
                              u.isBanned
                                ? 'bg-emerald-50 text-accent-green border-emerald-200 hover:bg-emerald-100'
                                : 'bg-surface text-ink-secondary hover:text-accent-red hover:bg-red-50 border-hairline'
                            }`}
                          >
                            {u.isBanned ? 'ปลดแบน' : 'ระงับบัญชี'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-ink-disabled mx-auto mb-2" />
            <h3 className="font-display font-bold text-sm text-ink">ไม่พบบัญชีผู้ใช้ตามเงื่อนไข</h3>
            <p className="text-xs text-ink-tertiary mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองอื่นดูนะครับ</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* USER DETAIL MODAL: VIEW BOTH SELLER SIDE AND BUYER SIDE IN FULL DETAIL     */}
      {/* ========================================================================= */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-ink-darkest/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div
            className="bg-canvas rounded-xl sm:rounded-xxl border border-hairline shadow-tinted-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-hairline bg-surface flex items-start justify-between gap-4">
              {detailLoading || !userDetail ? (
                <div className="flex items-center gap-2 text-xs font-mono text-ink-tertiary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>กำลังดึงข้อมูลรายละเอียดผู้ใช้...</span>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-canvas border border-hairline font-mono font-bold text-base flex items-center justify-center text-ink shadow-tinted-xs shrink-0">
                    {userDetail.user.studentId.slice(-3)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="font-display font-extrabold text-lg text-ink">
                        {userDetail.user.name}
                      </h2>
                      <span className="eyebrow-mono bg-canvas px-2 py-0.5 rounded-xxs border border-hairline text-[10px] font-bold">
                        {userDetail.user.role}
                      </span>
                      {userDetail.user.isBanned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-accent-red">
                          <Ban className="w-3 h-3" /> บัญชีถูกแบน
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-secondary space-y-0.5">
                      <p className="font-mono text-ink-tertiary text-[11px]">
                        รหัสนักศึกษา: {userDetail.user.studentId} • {userDetail.user.email}
                      </p>
                      <p className="text-[11px] text-ink">
                        ข้อมูลติดต่อ: {userDetail.user.contactInfo || 'ยังไม่ได้ระบุ Line หรือเบอร์โทร'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={closeUserDetail}
                className="w-8 h-8 rounded-full bg-canvas border border-hairline flex items-center justify-center text-ink-tertiary hover:text-ink hover:border-hairline-strong transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs: Seller Side vs Buyer Side */}
            {userDetail && (
              <div className="flex border-b border-hairline bg-canvas px-6 pt-3 gap-2">
                <button
                  onClick={() => setDetailTab('seller')}
                  className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                    detailTab === 'seller'
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-ink-secondary hover:text-ink'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    ฝั่งผู้ขาย: รายการสินค้าที่ลงขาย ({userDetail.sellerSide.products.length})
                  </span>
                </button>

                <button
                  onClick={() => setDetailTab('buyer')}
                  className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                    detailTab === 'buyer'
                      ? 'border-brand-orange text-brand-orange font-bold'
                      : 'border-transparent text-ink-secondary hover:text-ink'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>
                    ฝั่งผู้ซื้อ: ประวัติที่กดจองสินค้า ({userDetail.buyerSide.reservations.length})
                  </span>
                </button>
              </div>
            )}

            {/* Modal Body: Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {detailLoading || !userDetail ? (
                <div className="py-16 text-center text-xs font-mono text-ink-tertiary">
                  LOADING DETAILS...
                </div>
              ) : detailTab === 'seller' ? (
                /* ========================================================================= */
                /* TAB 1: SELLER SIDE DETAILS (รายการที่ลงขายทั้งหมด)                          */
                /* ========================================================================= */
                <div className="space-y-4">
                  {/* Seller KPI Summary Mini Bar */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-surface rounded-md border border-hairline text-center text-xs">
                    <div>
                      <span className="eyebrow-mono text-[10px] text-ink-tertiary block">ลงขายทั้งหมด</span>
                      <span className="font-display font-extrabold text-base text-ink">
                        {userDetail.sellerSide.stats.totalListed} ชิ้น
                      </span>
                    </div>
                    <div className="border-x border-hairline">
                      <span className="eyebrow-mono text-[10px] text-ink-tertiary block">พร้อมส่งมอบ</span>
                      <span className="font-display font-extrabold text-base text-accent-green">
                        {userDetail.sellerSide.stats.activeListed} ชิ้น
                      </span>
                    </div>
                    <div>
                      <span className="eyebrow-mono text-[10px] text-ink-tertiary block">ติดจอง / ปิดการขาย</span>
                      <span className="font-display font-extrabold text-base text-brand-orange">
                        {userDetail.sellerSide.stats.reservedOrCompleted} ชิ้น
                      </span>
                    </div>
                  </div>

                  {userDetail.sellerSide.products.length > 0 ? (
                    <div className="space-y-3">
                      {userDetail.sellerSide.products.map((prod) => {
                        const hasReservations = prod.reservations && prod.reservations.length > 0;
                        return (
                          <div
                            key={prod.id}
                            className="p-4 bg-canvas rounded-lg border border-hairline hover:border-hairline-strong transition-all shadow-tinted-xs"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-14 h-14 rounded-md bg-surface border border-hairline shrink-0 overflow-hidden flex items-center justify-center">
                                  {prod.imageUrl ? (
                                    <img src={prod.imageUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Tag className="w-5 h-5 text-ink-disabled" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        prod.isAvailable
                                          ? 'bg-emerald-50 text-accent-green border border-emerald-200'
                                          : 'bg-amber-50 text-brand-orange border border-amber-200'
                                      }`}
                                    >
                                      {prod.isAvailable ? 'พร้อมขาย' : 'ติดจอง / ปิดรับจอง'}
                                    </span>
                                    <span className="text-[11px] text-ink-tertiary">
                                      ลงเมื่อ: {new Date(prod.createdAt).toLocaleDateString('th-TH')}
                                    </span>
                                  </div>
                                  <h4 className="font-semibold text-ink text-xs sm:text-sm">{prod.title}</h4>
                                  <div className="flex items-center gap-3 mt-1 text-xs">
                                    <span className="font-display font-extrabold text-ink-deep">
                                      ฿{new Intl.NumberFormat('th-TH').format(prod.price)}
                                    </span>
                                    <span className="text-[11px] text-ink-secondary flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-primary" />
                                      {prod.meetupLocation}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {onSelectProduct && (
                                <button
                                  onClick={() => {
                                    closeUserDetail();
                                    onSelectProduct(prod.id);
                                  }}
                                  className="btn-secondary-sm px-3 py-1 text-[11px] flex items-center gap-1 shrink-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>เปิดดูในตลาด</span>
                                </button>
                              )}
                            </div>

                            {/* Reservation History on this Product */}
                            {hasReservations && (
                              <div className="mt-3 pt-2.5 border-t border-hairline bg-surface/50 rounded-sm p-2.5">
                                <p className="eyebrow-mono text-[10px] text-ink-tertiary mb-1.5">
                                  ประวัติผู้ที่กดจองสินค้านี้:
                                </p>
                                <div className="space-y-1.5">
                                  {prod.reservations.map((resv) => (
                                    <div
                                      key={resv.id}
                                      className="flex items-center justify-between text-xs p-1.5 bg-canvas rounded-xxs border border-hairline"
                                    >
                                      <div className="flex items-center gap-2">
                                        <UserCheck className="w-3.5 h-3.5 text-primary" />
                                        <span className="font-semibold text-ink">{resv.buyer.name}</span>
                                        <span className="font-mono text-[10px] text-ink-tertiary">
                                          ({resv.buyer.studentId})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xxs ${
                                            resv.status === 'COMPLETED'
                                              ? 'bg-emerald-50 text-accent-green'
                                              : resv.status === 'PENDING'
                                              ? 'bg-amber-50 text-brand-orange'
                                              : 'bg-surface text-ink-disabled'
                                          }`}
                                        >
                                          {resv.status}
                                        </span>
                                        <span className="text-[10px] text-ink-tertiary font-mono">
                                          {new Date(resv.createdAt).toLocaleDateString('th-TH')}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-xs text-ink-tertiary bg-surface rounded-md border border-hairline">
                      ผู้ใช้รายนี้ยังไม่มีรายการลงขายสินค้า
                    </div>
                  )}
                </div>
              ) : (
                /* ========================================================================= */
                /* TAB 2: BUYER SIDE DETAILS (ประวัติที่กดจองสินค้าทั้งหมด)                     */
                /* ========================================================================= */
                <div className="space-y-4">
                  {/* Buyer KPI Summary Mini Bar */}
                  <div className="grid grid-cols-4 gap-2.5 p-3 bg-surface rounded-md border border-hairline text-center text-xs">
                    <div>
                      <span className="eyebrow-mono text-[10px] text-ink-tertiary block">จองทั้งหมด</span>
                      <span className="font-display font-extrabold text-base text-ink">
                        {userDetail.buyerSide.stats.totalReserved} ครั้ง
                      </span>
                    </div>
                    <div>
                      <span className="eyebrow-mono text-[10px] text-ink-tertiary block">รอส่งมอบ</span>
                      <span className="font-display font-extrabold text-base text-brand-orange">
                        {userDetail.buyerSide.stats.pendingReservations}
                      </span>
                    </div>
                    <div>
                      <span className="eyebrow-mono text-[10px] text-ink-tertiary block">ซื้อสำเร็จ</span>
                      <span className="font-display font-extrabold text-base text-accent-green">
                        {userDetail.buyerSide.stats.completedReservations}
                      </span>
                    </div>
                    <div>
                      <span className="eyebrow-mono text-[10px] text-ink-tertiary block">ยกเลิกแล้ว</span>
                      <span className="font-display font-extrabold text-base text-ink-tertiary">
                        {userDetail.buyerSide.stats.cancelledReservations}
                      </span>
                    </div>
                  </div>

                  {userDetail.buyerSide.reservations.length > 0 ? (
                    <div className="space-y-3">
                      {userDetail.buyerSide.reservations.map((resv) => {
                        return (
                          <div
                            key={resv.id}
                            className="p-4 bg-canvas rounded-lg border border-hairline hover:border-hairline-strong transition-all shadow-tinted-xs"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-14 h-14 rounded-md bg-surface border border-hairline shrink-0 overflow-hidden flex items-center justify-center">
                                  {resv.product?.imageUrl ? (
                                    <img src={resv.product.imageUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Tag className="w-5 h-5 text-ink-disabled" />
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        resv.status === 'COMPLETED'
                                          ? 'bg-emerald-50 text-accent-green border border-emerald-200'
                                          : resv.status === 'PENDING'
                                          ? 'bg-amber-50 text-brand-orange border border-amber-200'
                                          : 'bg-surface text-ink-disabled border border-hairline'
                                      }`}
                                    >
                                      {resv.status === 'PENDING'
                                        ? 'รอส่งมอบหน้างาน'
                                        : resv.status === 'COMPLETED'
                                        ? 'ซื้อขายสำเร็จ'
                                        : 'ยกเลิกแล้ว'}
                                    </span>
                                    <span className="text-[11px] text-ink-tertiary">
                                      จองเมื่อ:{' '}
                                      {new Date(resv.createdAt).toLocaleDateString('th-TH', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>

                                  <h4 className="font-semibold text-ink text-xs sm:text-sm">
                                    {resv.product?.title || 'สินค้าในระบบ'}
                                  </h4>

                                  <div className="flex items-center gap-3 mt-1 text-xs">
                                    <span className="font-display font-extrabold text-ink-deep">
                                      ฿{new Intl.NumberFormat('th-TH').format(resv.product?.price || 0)}
                                    </span>
                                    <span className="text-[11px] text-ink-secondary flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-primary" />
                                      {resv.product?.meetupLocation}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Seller Info for this reservation */}
                              <div className="p-2.5 bg-surface rounded-sm border border-hairline text-left text-xs min-w-[200px]">
                                <span className="eyebrow-mono text-[9px] text-ink-tertiary block">
                                  ผู้ขายสินค้าชิ้นนี้:
                                </span>
                                <span className="font-semibold text-ink text-xs block">
                                  {resv.product?.seller?.name || 'นักศึกษา มช.'}
                                </span>
                                <span className="font-mono text-[10px] text-ink-secondary block">
                                  {resv.product?.seller?.studentId} • {resv.product?.seller?.email}
                                </span>
                                {resv.product?.seller?.contactInfo && (
                                  <span className="text-[10px] text-primary block mt-0.5">
                                    {resv.product.seller.contactInfo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-xs text-ink-tertiary bg-surface rounded-md border border-hairline">
                      ผู้ใช้รายนี้ยังไม่มีประวัติการกดจองสินค้า
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            {userDetail && (
              <div className="p-4 sm:p-5 border-t border-hairline bg-surface flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRole(userDetail.user as AdminUserSummary)}
                    className="btn-secondary-sm px-3 py-1.5 text-xs font-semibold"
                  >
                    สลับบทบาทเป็น {userDetail.user.role === 'ADMIN' ? 'STUDENT' : 'ADMIN'}
                  </button>

                  <button
                    onClick={() => handleToggleBan(userDetail.user as AdminUserSummary)}
                    className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition-all ${
                      userDetail.user.isBanned
                        ? 'bg-emerald-50 text-accent-green border-emerald-200 hover:bg-emerald-100'
                        : 'bg-red-50 text-accent-red border-red-200 hover:bg-red-100'
                    }`}
                  >
                    {userDetail.user.isBanned ? 'ปลดแบนบัญชีนี้' : 'แบนระงับบัญชีนี้'}
                  </button>
                </div>

                <button onClick={closeUserDetail} className="btn-primary-pill px-5 py-2 text-xs">
                  ปิดหน้าต่าง
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
