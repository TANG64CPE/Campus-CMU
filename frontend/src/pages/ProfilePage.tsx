import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi, reservationApi, productApi } from '../services/api';
import { Product, Reservation } from '../types';
import {
  User as UserIcon,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  Save,
  Trash2,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Ban,
  Tag,
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
        <p className="text-ink-secondary mb-4 text-body-md">
          กรุณาเข้าสู่ระบบด้วย CMU Account ก่อนเข้าดูหน้าโปรไฟล์
        </p>
        <button
          onClick={onNavigateToFeed}
          className="btn-primary-pill px-5 py-2.5 text-button-md"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-clickup mx-auto px-4 sm:px-[40px] py-6 pb-24">
      {/* Student Profile Overview Card — design.md card-section: surface bg, xl (25px) radius */}
      <div className="card-section p-6 sm:p-8 mb-8 shadow-tinted-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-hairline">
          <div className="flex items-center gap-4">
            {/* ClickUp Avatar chip */}
            <div className="w-14 h-14 rounded-full bg-surface-soft border border-hairline text-ink font-mono font-bold text-lg flex items-center justify-center shadow-tinted-xs">
              {user.studentId.slice(-3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-heading-md text-ink">{user.name}</h1>
                {user.isBanned ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xxs text-[10px] font-bold bg-red-100 text-accent-red border border-red-200">
                    <Ban className="w-3 h-3" /> ถูกแบน
                  </span>
                ) : (
                  <span className="eyebrow-mono inline-flex items-center gap-1 px-2 py-0.5 rounded-xxs text-[10px] bg-canvas text-primary border border-hairline font-bold">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED CMU
                  </span>
                )}
              </div>
              <p className="text-caption text-ink-secondary font-mono mt-0.5">
                รหัสนักศึกษา: {user.studentId} • {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Form: Contact Info (Line ID, Phone Number) */}
        <form onSubmit={handleSaveContact} className="mt-6">
          <label className="eyebrow-mono block text-caption text-ink-secondary mb-2">
            ข้อมูลติดต่อสำหรับผู้ซื้อเมื่อมีการจอง (Contact Info)
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <MessageSquare className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="เช่น Line ID: @cmu_student หรือ เบอร์โทร: 081-xxx-xxxx"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full input-field pl-10"
              />
            </div>
            <button
              type="submit"
              disabled={savingContact}
              className="btn-primary-pill h-[44px] px-5 text-button-md flex items-center justify-center gap-1.5 transition-all duration-clickup ease-clickup"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingContact ? 'กำลังบันทึก...' : 'บันทึกข้อมูลติดต่อ'}</span>
            </button>
          </div>
          {contactSuccess && (
            <p className="text-xs text-accent-green font-medium mt-2 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> บันทึกข้อมูลติดต่อเรียบร้อยแล้ว
            </p>
          )}
          <p className="text-[11px] text-ink-tertiary mt-1.5">
            * ข้อมูลนี้จะเปิดเผยเฉพาะกับผู้ซื้อที่กดจองสินค้าของคุณแล้วเท่านั้น
          </p>
        </form>
      </div>

      {/* Tabs (ClickUp Modern Segment Tabs) */}
      <div className="flex border-b border-hairline mb-6">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 px-4 text-button-md font-bold flex items-center gap-2 border-b-2 transition-all duration-clickup ease-clickup ${
            activeTab === 'listings'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-ink-secondary hover:text-ink'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>สินค้าที่ฉันลงขาย ({myProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 px-4 text-button-md font-bold flex items-center gap-2 border-b-2 transition-all duration-clickup ease-clickup ${
            activeTab === 'reservations'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-ink-secondary hover:text-ink'
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
            <p className="text-xs font-mono text-ink-tertiary text-center py-8">
              LOADING LISTINGS...
            </p>
          ) : myProducts.length > 0 ? (
            <div className="space-y-3">
              {myProducts.map((p) => {
                return (
                  <div
                    key={p.id}
                    className="p-4 sm:p-5 bg-canvas rounded-lg border border-hairline hover:border-hairline-strong hover:shadow-tinted-xs transition-all duration-clickup ease-clickup flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() => onSelectProduct(p.id)}
                    >
                      <div className="w-16 h-16 rounded-md bg-surface overflow-hidden shrink-0 flex items-center justify-center border border-hairline">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Tag className="w-6 h-6 text-ink-disabled" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.isAvailable
                                ? 'bg-emerald-50 text-accent-green border border-emerald-200'
                                : 'bg-amber-50 text-brand-orange border border-amber-200'
                            }`}
                          >
                            {p.isAvailable ? 'พร้อมขาย' : 'ติดจอง / ปิดรับจอง'}
                          </span>
                          <span className="text-xs text-ink-tertiary">
                            📍 {p.meetupLocation}
                          </span>
                        </div>
                        <h4 className="font-semibold text-ink text-sm hover:text-primary transition-colors">
                          {p.title}
                        </h4>
                        <p className="font-display font-extrabold text-sm text-ink-deep mt-0.5">
                          ฿{new Intl.NumberFormat('th-TH').format(p.price)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-0 border-hairline">
                      <button
                        onClick={() => handleToggleStatus(p.id)}
                        className={`btn-secondary-sm px-3 py-1.5 text-xs ${
                          p.isAvailable
                            ? 'text-brand-orange hover:border-brand-orange/40'
                            : 'text-accent-green hover:border-accent-green/40'
                        }`}
                      >
                        {p.isAvailable ? 'สลับเป็นติดจอง' : 'สลับเป็นพร้อมขาย'}
                      </button>

                      <button
                        onClick={() => onSelectProduct(p.id)}
                        className="btn-secondary-sm px-3 py-1.5 text-xs flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ดูสินค้า</span>
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 rounded-sm text-ink-tertiary hover:text-accent-red hover:bg-red-50 transition-colors"
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
            <div className="text-center py-12 bg-canvas rounded-xl border border-hairline p-6">
              <ShoppingBag className="w-10 h-10 text-ink-disabled mx-auto mb-2" />
              <p className="text-xs font-semibold text-ink">คุณยังไม่ได้ลงขายสินค้าใดๆ</p>
              <button
                onClick={onNavigateToFeed}
                className="btn-secondary-sm mt-3 px-4 py-2 text-button-md"
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
            <p className="text-xs font-mono text-ink-tertiary text-center py-8">
              LOADING RESERVATIONS...
            </p>
          ) : myReservations.length > 0 ? (
            <div className="space-y-3">
              {myReservations.map((r) => {
                return (
                  <div
                    key={r.id}
                    className="p-4 sm:p-5 bg-canvas rounded-lg border border-hairline hover:border-hairline-strong hover:shadow-tinted-xs transition-all duration-clickup ease-clickup flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() => onSelectProduct(r.productId)}
                    >
                      <div className="w-16 h-16 rounded-md bg-surface overflow-hidden shrink-0 flex items-center justify-center border border-hairline">
                        {r.product?.imageUrl ? (
                          <img
                            src={r.product.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Clock className="w-6 h-6 text-ink-disabled" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'PENDING'
                                ? 'bg-amber-50 text-brand-orange border border-amber-200'
                                : r.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-accent-green border border-emerald-200'
                                : 'bg-surface-soft text-ink-secondary border border-hairline'
                            }`}
                          >
                            {r.status === 'PENDING'
                              ? 'รอส่งมอบหน้างาน'
                              : r.status === 'COMPLETED'
                              ? 'ซื้อขายสำเร็จ'
                              : 'ยกเลิกแล้ว'}
                          </span>

                          <span className="eyebrow-mono text-[10px] text-ink-tertiary">
                            จองเมื่อ: {new Date(r.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h4 className="font-semibold text-ink text-sm hover:text-primary transition-colors">
                          {r.product?.title || 'สินค้าในระบบ'}
                        </h4>

                        <p className="font-display font-extrabold text-sm text-ink-deep mt-0.5">
                          ฿{r.product ? new Intl.NumberFormat('th-TH').format(r.product.price) : 0}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex justify-end">
                      <button
                        onClick={() => onSelectProduct(r.productId)}
                        className="btn-primary-pill px-4 py-2 text-button-md flex items-center gap-1.5"
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
            <div className="text-center py-12 bg-canvas rounded-xl border border-hairline p-6">
              <Clock className="w-10 h-10 text-ink-disabled mx-auto mb-2" />
              <p className="text-body-sm font-semibold text-ink">คุณยังไม่มีรายการจองสินค้า</p>
              <button
                onClick={onNavigateToFeed}
                className="btn-secondary-sm mt-3 px-4 py-2 text-button-md"
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
