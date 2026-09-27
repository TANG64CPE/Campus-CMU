import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi, reservationApi, productApi } from '../services/api';
import { Product, Reservation } from '../types';
import {
  User as UserIcon,
  ShoppingBag,
  Clock,
  Phone,
  CheckCircle,
  AlertCircle,
  Save,
  Trash2,
  MapPin,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Ban,
} from 'lucide-react';

interface ProfilePageProps {
  onSelectProduct: (id: string) => void;
  onNavigateToFeed: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onSelectProduct, onNavigateToFeed }) => {
  const { user, refreshUser } = useAuth();
  const [contactInfo, setContactInfo] = useState(user?.contactInfo || '');
  const [savingContact, setSavingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Tabs: 'listings' | 'reservations'
  const [activeTab, setActiveTab] = useState<'listings' | 'reservations'>('listings');
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, resvs] = await Promise.all([
        userApi.getMyProducts(),
        reservationApi.getMyReservations(),
      ]);
      setMyProducts(prods);
      setMyReservations(resvs);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.contactInfo) {
      setContactInfo(user.contactInfo);
    }
    loadData();
  }, [user]);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    setContactSuccess(false);
    try {
      await userApi.updateProfile(contactInfo);
      await refreshUser();
      setContactSuccess(true);
      setTimeout(() => setContactSuccess(false), 3000);
    } catch (err) {
      alert('ไม่สามารถบันทึกข้อมูลติดต่อได้');
    } finally {
      setSavingContact(false);
    }
  };

  const handleToggleStatus = async (productId: string) => {
    try {
      await userApi.toggleProductStatus(productId);
      await loadData();
    } catch (err) {
      alert('ไม่สามารถเปลี่ยนสถานะสินค้าได้');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('ยืนยันที่จะลบสินค้านี้?')) return;
    try {
      await productApi.deleteProduct(productId);
      await loadData();
    } catch (err) {
      alert('ไม่สามารถลบสินค้าได้');
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <p className="text-slate-600 mb-4">กรุณาเข้าสู่ระบบด้วย CMU Account ก่อนเข้าดูหน้าโปรไฟล์</p>
        <button
          onClick={onNavigateToFeed}
          className="px-5 py-2.5 bg-cmu-600 text-white rounded-xl text-sm font-semibold"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Student Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cmu-700 to-cmu-500 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-cmu-600/20">
              {user.studentId.slice(-3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
                {user.isBanned ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    <Ban className="w-3 h-3" /> ถูกแบน
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-cmu-700">
                    <ShieldCheck className="w-3 h-3 text-cmu-600" /> นักศึกษา มช.
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                รหัสนักศึกษา: {user.studentId} | {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Form: Contact Info (Line ID, Phone Number) */}
        <form onSubmit={handleSaveContact} className="mt-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            ข้อมูลติดต่อสำหรับผู้ซื้อเมื่อมีการจอง (Contact Info)
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="เช่น Line ID: @cmu_student หรือ เบอร์โทร: 081-xxx-xxxx"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-cmu-500"
              />
            </div>
            <button
              type="submit"
              disabled={savingContact}
              className="px-5 py-2.5 rounded-xl bg-cmu-600 hover:bg-cmu-700 text-white text-xs font-bold shadow-md shadow-cmu-600/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingContact ? 'กำลังบันทึก...' : 'บันทึกข้อมูลติดต่อ'}</span>
            </button>
          </div>
          {contactSuccess && (
            <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> บันทึกข้อมูลติดต่อเรียบร้อยแล้ว
            </p>
          )}
          <p className="text-[11px] text-slate-400 mt-1">
            * ข้อมูลนี้จะเปิดเผยเฉพาะกับผู้ซื้อที่กดจองสินค้าของคุณแล้วเท่านั้น
          </p>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'listings'
              ? 'border-cmu-600 text-cmu-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>สินค้าที่ฉันลงขาย ({myProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'reservations'
              ? 'border-cmu-600 text-cmu-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>รายการที่ฉันจองไว้ ({myReservations.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: MY LISTINGS */}
      {activeTab === 'listings' && (
        <div>
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-8">กำลังโหลดข้อมูล...</p>
          ) : myProducts.length > 0 ? (
            <div className="space-y-4">
              {myProducts.map((p) => {
                const hasPendingReservation = p.reservations && p.reservations.length > 0;
                return (
                  <div
                    key={p.id}
                    className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() => onSelectProduct(p.id)}
                    >
                      <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-cmu-300" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {p.isAvailable ? 'พร้อมขาย' : 'ติดจอง / ปิดรับจอง'}
                          </span>
                          <span className="text-xs text-slate-400">
                            📍 {p.meetupLocation}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-800 text-sm hover:text-cmu-600 transition-colors">
                          {p.title}
                        </h4>
                        <p className="text-cmu-700 font-extrabold text-sm mt-0.5">
                          ฿{new Intl.NumberFormat('th-TH').format(p.price)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <button
                        onClick={() => handleToggleStatus(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          p.isAvailable
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {p.isAvailable ? 'สลับเป็นติดจอง' : 'สลับเป็นพร้อมขาย'}
                      </button>

                      <button
                        onClick={() => onSelectProduct(p.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ดูสินค้า</span>
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="ลบสินค้า"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">คุณยังไม่ได้ลงขายสินค้าใดๆ</p>
              <button
                onClick={onNavigateToFeed}
                className="mt-3 px-4 py-2 bg-cmu-600 text-white rounded-xl text-xs font-semibold"
              >
                ไปเลือกดูตลาด
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: MY RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div>
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-8">กำลังโหลดข้อมูล...</p>
          ) : myReservations.length > 0 ? (
            <div className="space-y-4">
              {myReservations.map((r) => {
                const isPending = r.status === 'PENDING';
                return (
                  <div
                    key={r.id}
                    className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() => onSelectProduct(r.productId)}
                    >
                      <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {r.product?.imageUrl ? (
                          <img
                            src={r.product.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Clock className="w-6 h-6 text-cmu-300" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : r.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {r.status === 'PENDING'
                              ? 'รอส่งมอบหน้างาน'
                              : r.status === 'COMPLETED'
                              ? 'ซื้อขายสำเร็จ'
                              : 'ยกเลิกแล้ว'}
                          </span>

                          <span className="text-xs text-slate-400">
                            จองเมื่อ: {new Date(r.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h4 className="font-semibold text-slate-800 text-sm hover:text-cmu-600 transition-colors">
                          {r.product?.title || 'สินค้าในระบบ'}
                        </h4>

                        <p className="text-cmu-700 font-extrabold text-sm mt-0.5">
                          ฿{r.product ? new Intl.NumberFormat('th-TH').format(r.product.price) : 0}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex justify-end">
                      <button
                        onClick={() => onSelectProduct(r.productId)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-cmu-600 hover:bg-cmu-700 text-white shadow-sm flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ดูข้อมูลนัดรับ & ผู้ขาย</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">คุณยังไม่มีรายการจองสินค้า</p>
              <button
                onClick={onNavigateToFeed}
                className="mt-3 px-4 py-2 bg-cmu-600 text-white rounded-xl text-xs font-semibold"
              >
                ไปเลือกดูสินค้าในตลาด
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
