import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi, reservationApi, productApi } from '../services/api';
import { Product, Reservation, isContactComplete, isValidThaiMobileNumber } from '../types';
import { getProductImageUrls } from '../utils/productImages';
import {
  User as UserIcon,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Save,
  Trash2,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Ban,
  Tag,
  Phone,
  Globe,
  Camera,
  MapPin,
  Info,
  Sparkles,
  ArrowLeft,
  X,
} from 'lucide-react';

interface ProfilePageProps {
  onSelectProduct: (id: string) => void;
  onNavigateToFeed: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onSelectProduct, onNavigateToFeed }) => {
  const { user, refreshUser } = useAuth();

  // Contact Info Form State
  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [phone, setPhone] = useState((user?.phone || '').replace(/\D/g, '').slice(0, 10));
  const [lineId, setLineId] = useState(user?.lineId || '');
  const [facebook, setFacebook] = useState(user?.facebook || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [meetingNote, setMeetingNote] = useState(user?.meetingNote || '');

  const [savingContact, setSavingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // Tabs: 'listings' | 'reservations'
  const [activeTab, setActiveTab] = useState<'listings' | 'reservations'>('listings');
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [deleteProductError, setDeleteProductError] = useState<string | null>(null);

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
    if (user) {
      setStudentId(user.studentId || '');
      setPhone((user.phone || '').replace(/\D/g, '').slice(0, 10));
      setLineId(user.lineId || '');
      setFacebook(user.facebook || '');
      setInstagram(user.instagram || '');
      setMeetingNote(user.meetingNote || '');
    }
    loadData();
  }, [user]);

  // Client-side validations
  const isPhoneFilled = isValidThaiMobileNumber(phone);
  const isSocialFilled = lineId.trim().length > 0 || facebook.trim().length > 0 || instagram.trim().length > 0;
  const isProfileComplete = isContactComplete(user);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(false);

    if (!studentId.trim()) {
      setContactError('กรุณากรอกรหัสนักศึกษา (*จำเป็นต้องมี)');
      return;
    }

    // Validation 1: Phone is mandatory
    if (!phone.trim()) {
      setContactError('กรุณากรอกเบอร์โทรติดต่อ (*จำเป็นต้องมี)');
      return;
    }

    if (!isValidThaiMobileNumber(phone)) {
      setContactError('กรุณากรอกเบอร์มือถือไทย 10 หลัก โดยขึ้นต้นด้วย 06, 08 หรือ 09');
      return;
    }

    // Validation 2: At least 1 social media field
    if (!lineId.trim() && !facebook.trim() && !instagram.trim()) {
      setContactError('กรุณากรอกช่องทาง Social Media อย่างน้อย 1 ช่อง (Line, Facebook หรือ Instagram)');
      return;
    }

    setSavingContact(true);
    try {
      await userApi.updateProfile({
        studentId: studentId.trim(),
        phone: phone.trim(),
        lineId: lineId.trim() || undefined,
        facebook: facebook.trim() || undefined,
        instagram: instagram.trim() || undefined,
        meetingNote: meetingNote.trim() || undefined,
      });
      await refreshUser();
      setContactSuccess(true);
      setTimeout(() => setContactSuccess(false), 4000);
    } catch (err: any) {
      setContactError(err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลติดต่อได้');
    } finally {
      setSavingContact(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    e.target.value = '';
    if (!image) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(image.type)) {
      setAvatarError('รองรับไฟล์รูปภาพ JPG, PNG, WEBP หรือ GIF เท่านั้น');
      return;
    }
    if (image.size > 5 * 1024 * 1024) {
      setAvatarError('รูปโปรไฟล์ต้องมีขนาดไม่เกิน 5 MB');
      return;
    }

    setAvatarError(null);
    setAvatarUploading(true);
    try {
      await userApi.uploadAvatar(image);
      await refreshUser();
    } catch (err: any) {
      setAvatarError(err.response?.data?.message || 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้');
    } finally {
      setAvatarUploading(false);
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

  const handleDeleteProduct = async () => {
    if (!productToDelete || deletingProduct) return;
    setDeletingProduct(true);
    setDeleteProductError(null);
    try {
      await productApi.deleteProduct(productToDelete.id);
      setProductToDelete(null);
      await loadData();
    } catch (err: any) {
      setDeleteProductError(err.response?.data?.message || 'ไม่สามารถลบสินค้าได้');
    } finally {
      setDeletingProduct(false);
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
      <div className="mb-5">
        <button
          type="button"
          onClick={onNavigateToFeed}
          className="inline-flex items-center gap-2 text-body-sm font-semibold text-ink-secondary hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปหน้า Feed</span>
        </button>
      </div>

      {/* Profile Contact Status Alert Banner (if incomplete) */}
      {!isProfileComplete && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200/80 shadow-tinted-xs flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-brand-orange flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-ink text-body-sm flex items-center gap-1.5">
              ข้อมูลติดต่อจำเป็นยังไม่ครบถ้วน
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-brand-orange">
                ยังไม่เปิดสิทธิ์การจอง/ลงขาย
              </span>
            </h3>
            <p className="text-caption text-ink-secondary mt-1 leading-relaxed">
              ตามระเบียบของระบบตลาดนัด CMU นักศึกษาต้องระบุ <strong>เบอร์โทรติดต่อ</strong> และ <strong>ช่องทาง Social Media (Line, Facebook หรือ Instagram) อย่างน้อย 1 ช่อง</strong> ในแบบฟอร์มด้านล่าง จึงจะสามารถเริ่มกดจองสินค้าหรือลงประกาศขายได้
            </p>
          </div>
        </div>
      )}

      {/* Student profile panel */}
      <div className="card-section p-6 sm:p-8 mb-8 shadow-tinted-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-hairline">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-white border border-hairline text-ink font-bold text-2xl flex items-center justify-center shadow-tinted-xs overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={`รูปโปรไฟล์ ${user.name}`} className="w-full h-full object-cover" />
                ) : (
                  user.name.trim().charAt(0).toLocaleUpperCase() || '?'
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                aria-label="อัปโหลดรูปโปรไฟล์"
                title={avatarUploading ? 'กำลังอัปโหลดรูป...' : 'เปลี่ยนรูปโปรไฟล์'}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-hairline shadow-tinted-xs flex items-center justify-center text-ink hover:bg-surface-soft disabled:opacity-60"
              >
                {avatarUploading ? (
                  <span className="w-3 h-3 rounded-full border-2 border-hairline-strong border-t-primary animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
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
                {user.email}
              </p>
            </div>
          </div>

          {/* Contact Completion Badge */}
          <div>
            {isProfileComplete ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-bold bg-emerald-50 text-accent-green border border-emerald-200">
                <CheckCircle className="w-4 h-4" />
                <span>ข้อมูลติดต่อครบถ้วน (พร้อมจอง & ขาย)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-bold bg-amber-50 text-brand-orange border border-amber-200">
                <AlertCircle className="w-4 h-4" />
                <span>ข้อมูลติดต่อยังไม่สมบูรณ์</span>
              </span>
            )}
          </div>
        </div>

        {avatarError && (
          <p role="alert" className="mt-3 text-caption font-medium text-accent-red">
            {avatarError}
          </p>
        )}

        {/* Form: Mandatory Contact Info (Phone, Social Media, Meetup Notes) */}
        <form onSubmit={handleSaveContact} className="mt-6">
          <div className="mb-4 rounded-xl border border-hairline bg-surface p-4">
            <label htmlFor="profile-student-id" className="mb-2 flex items-center gap-2 text-body-sm font-bold text-ink">
              <span>รหัสนักศึกษา</span>
              <span className="font-bold text-accent-red">* จำเป็นต้องมี</span>
            </label>
            <input
              id="profile-student-id"
              type="text"
              autoComplete="username"
              maxLength={32}
              required
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="กรอกรหัสนักศึกษา"
              className="w-full input-field"
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-body-lg text-ink">
                ข้อมูลติดต่อสำหรับนัดรับสินค้า (Contact Info)
              </h2>
              <p className="text-caption text-ink-secondary mt-0.5">
                ข้อมูลนี้จะเปิดเผยเฉพาะกับผู้ซื้อหรือผู้ขายเมื่อมีรายการจองสินค้าเกิดขึ้นเท่านั้น
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Field 1: Phone Number (Mandatory) */}
            <div className="p-4 rounded-xl bg-surface border border-hairline">
              <div className="flex items-center justify-between mb-2">
                <label className="text-body-sm font-bold text-ink flex items-center gap-2">
                  <span>เบอร์โทรศัพท์สำหรับติดต่อนัดรับ</span>
                  <span className="text-accent-red font-bold">* จำเป็นต้องมี</span>
                </label>
                {isPhoneFilled ? (
                  <span className="text-[11px] font-bold text-accent-green flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> ระบุแล้ว
                  </span>
                ) : phone ? (
                  <span className="text-[11px] font-semibold text-accent-red">
                    รูปแบบไม่ถูกต้อง
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-accent-red">
                    * กรุณาระบุ
                  </span>
                )}
              </div>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="0[689][0-9]{8}"
                maxLength={10}
                aria-invalid={phone.length > 0 && !isPhoneFilled}
                placeholder="กรอกเบอร์มือถือ 10 หลัก เช่น 0812345678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setContactError(null);
                }}
                className="w-full input-field"
              />
              <p className={`text-[11px] mt-1.5 ${phone.length > 0 && !isPhoneFilled ? 'text-accent-red' : 'text-ink-tertiary'}`}>
                {phone.length > 0 && !isPhoneFilled
                  ? 'กรอกตัวเลข 10 หลักและใช้เบอร์มือถือที่ขึ้นต้นด้วย 06, 08 หรือ 09'
                  : 'เบอร์โทรสำหรับโทรยืนยันเวลานัดรับสินค้าหน้างานในมหาวิทยาลัย'}
              </p>
            </div>

            {/* Field 2: Social Media (At least 1 required: Facebook, Line, Instagram) */}
            <div className="p-4 rounded-xl bg-surface border border-hairline">
              <div className="flex items-center justify-between mb-2">
                <label className="text-body-sm font-bold text-ink flex items-center gap-2">
                  <span>ช่องทางโซเชียลมีเดีย</span>
                  <span className="text-accent-red font-bold">* จำเป็นต้องมีอย่างน้อย 1 ช่อง</span>
                </label>
                {isSocialFilled ? (
                  <span className="text-[11px] font-bold text-accent-green flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> ระบุแล้วอย่างน้อย 1 ช่อง
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-accent-red">
                    * ต้องมีอย่างน้อย 1 ช่อง
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Line ID */}
                <div>
                  <label className="text-caption font-semibold text-ink-secondary mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-accent-green" />
                    <span>Line ID</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น @somchai หรือ somchai_cpe"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    className="w-full input-field"
                  />
                </div>

                {/* Facebook */}
                <div>
                  <label className="text-caption font-semibold text-ink-secondary mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-accent-blue" />
                    <span>Facebook (ชื่อหรือลิงก์)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น Somchai Chiangmai หรือ fb.com/..."
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full input-field"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="text-caption font-semibold text-ink-secondary mb-1 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-brand-pink" />
                    <span>Instagram (@username)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น @somchai.cmu"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full input-field"
                  />
                </div>
              </div>
              <p className="text-[11px] text-ink-tertiary mt-2">
                เลือกกรอก Line, Facebook หรือ Instagram ช่องทางใดช่องทางหนึ่ง (หรือกรอกทั้งหมดเพื่อความสะดวกรวดเร็วในการติดต่อ)
              </p>
            </div>

            {/* Field 3: General Info / Preferred Meetup Places */}
            <div className="p-4 rounded-xl bg-surface border border-hairline">
              <label className="text-body-sm font-bold text-ink mb-2 flex items-center gap-2">
                <span>ข้อมูลทั่วไป / สถานที่หรือจุดที่ต้องการจะพบเจอได้</span>
                <span className="text-caption text-ink-tertiary font-normal">(ช่วยให้คู่ค้าสะดวกนัดหมาย)</span>
              </label>
              <textarea
                rows={2}
                placeholder="เช่น สะดวกนัดรับที่หอสมุดกลาง มช., ตึก 30 ปี คณะวิศวะ, หรือโรงอาหารอ่างแก้ว ช่วงเที่ยงหรือหลัง 16:30 น."
                value={meetingNote}
                onChange={(e) => setMeetingNote(e.target.value)}
                className="w-full input-field py-2.5 resize-none"
              />
              <p className="text-[11px] text-ink-tertiary mt-1.5">
                ระบุบริเวณ จุดสังเกต หรือช่วงเวลาประจำที่คุณสะดวกนัดเจอบนพื้นที่มหาวิทยาลัยเชียงใหม่
              </p>
            </div>
          </div>

          {/* Error & Success Feedback */}
          {contactError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-caption text-accent-red flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{contactError}</span>
            </div>
          )}

          {contactSuccess && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-caption text-accent-green font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>บันทึกข้อมูลติดต่อเรียบร้อยแล้ว! บัญชีของคุณพร้อมสำหรับการกดจองและลงขายสินค้าแล้ว</span>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-5 flex items-center justify-end">
            <button
              type="submit"
              disabled={savingContact}
              className="btn-gradient-pill px-6 py-2.5 text-button-md flex items-center gap-2 shadow-tinted-xs transition-all duration-clickup ease-clickup disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingContact ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลติดต่อ'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Listings and reservations tabs */}
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
                        {getProductImageUrls(p)[0] ? (
                          <img src={getProductImageUrls(p)[0]} alt="" className="w-full h-full object-cover" />
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

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-hairline">
                      <button
                        onClick={() => handleToggleStatus(p.id)}
                        className="btn-secondary-sm text-xs px-3 py-1.5"
                      >
                        {p.isAvailable ? 'พักการขาย' : 'เปิดขายต่อ'}
                      </button>
                      <button
                        onClick={() => {
                          setProductToDelete(p);
                          setDeleteProductError(null);
                        }}
                        aria-label={`ลบสินค้า ${p.title}`}
                        className="p-2 text-ink-secondary hover:text-accent-red hover:bg-red-50 rounded-md transition-colors"
                        title="ลบสินค้านี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-surface rounded-xl border border-hairline">
              <ShoppingBag className="w-10 h-10 text-ink-tertiary mx-auto mb-2 opacity-50" />
              <p className="text-body-sm text-ink-secondary">คุณยังไม่มีรายการสินค้าที่ลงขาย</p>
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
                const isPending = r.status === 'PENDING';
                const isCompleted = r.status === 'COMPLETED';
                const isCancelled = r.status === 'CANCELLED';

                return (
                  <div
                    key={r.id}
                    className="p-4 sm:p-5 bg-canvas rounded-lg border border-hairline hover:shadow-tinted-xs transition-all duration-clickup ease-clickup flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() => onSelectProduct(r.productId)}
                    >
                      <div className="w-16 h-16 rounded-md bg-surface overflow-hidden shrink-0 flex items-center justify-center border border-hairline">
                        {getProductImageUrls(r.product)[0] ? (
                          <img src={getProductImageUrls(r.product)[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Tag className="w-6 h-6 text-ink-disabled" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isPending
                                ? 'bg-amber-50 text-brand-orange border border-amber-200'
                                : isCompleted
                                ? 'bg-emerald-50 text-accent-green border border-emerald-200'
                                : 'bg-surface-soft text-ink-tertiary border border-hairline'
                            }`}
                          >
                            {isPending && 'กำลังรอนัดรับสินค้า (PENDING)'}
                            {isCompleted && 'รับของสำเร็จ (COMPLETED)'}
                            {isCancelled && 'ยกเลิกแล้ว (CANCELLED)'}
                          </span>
                          <span className="text-xs text-ink-tertiary">
                            จองเมื่อ: {new Date(r.createdAt).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <h4 className="font-semibold text-ink text-sm hover:text-primary transition-colors">
                          {r.product?.title || 'สินค้าไม่ระบุ'}
                        </h4>
                        <p className="font-display font-extrabold text-sm text-ink-deep mt-0.5">
                          ฿{r.product ? new Intl.NumberFormat('th-TH').format(r.product.price) : '0'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-hairline">
                      <button
                        onClick={() => onSelectProduct(r.productId)}
                        className="btn-secondary-sm text-xs px-3 py-1.5 flex items-center gap-1"
                      >
                        <span>ดูรายละเอียด & ข้อมูลติดต่อ</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-surface rounded-xl border border-hairline">
              <Clock className="w-10 h-10 text-ink-tertiary mx-auto mb-2 opacity-50" />
              <p className="text-body-sm text-ink-secondary">คุณยังไม่มีรายการที่กดจองไว้</p>
            </div>
          )}
        </div>
      )}

      {productToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget && !deletingProduct) {
              setProductToDelete(null);
              setDeleteProductError(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-delete-product-title"
            aria-describedby="profile-delete-product-description"
            className="w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="profile-delete-product-title" className="text-lg font-bold text-ink">
                  ยืนยันการลบรายการสินค้า?
                </h2>
                <p id="profile-delete-product-description" className="mt-2 text-sm leading-relaxed text-ink-secondary">
                  รายการ “{productToDelete.title}” จะถูกลบออกจากตลาดและไม่สามารถกู้คืนได้
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProductToDelete(null);
                  setDeleteProductError(null);
                }}
                disabled={deletingProduct}
                aria-label="ปิดหน้าต่างยืนยัน"
                className="rounded-full p-1 text-ink-tertiary hover:bg-surface-soft hover:text-ink disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {deleteProductError && (
              <p role="alert" className="mt-4 text-sm text-accent-red">
                {deleteProductError}
              </p>
            )}
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setProductToDelete(null);
                  setDeleteProductError(null);
                }}
                disabled={deletingProduct}
                className="btn-secondary-sm h-12 w-full px-3"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deletingProduct}
                className="h-12 w-full rounded-pill bg-[#dc2626] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingProduct ? 'กำลังลบ...' : 'ยืนยันลบสินค้า'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
