import React, { useState, useEffect } from 'react';
import { Product, Reservation, SellerContact } from '../types';
import { productApi, reservationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Tag,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Mail,
  ShieldAlert,
  Trash2,
  Calendar,
  MessageSquare,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface ProductDetailPageProps {
  productId: string;
  onBack: () => void;
  onNavigateToLogin: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onBack,
  onNavigateToLogin,
}) => {
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [isBuyer, setIsBuyer] = useState(false);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [revealedSellerContact, setRevealedSellerContact] = useState<SellerContact | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Time state for 3-Hour window
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');
  const [isWithin3Hours, setIsWithin3Hours] = useState<boolean>(true);

  const loadProduct = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await productApi.getProductById(productId);
      setProduct(data.product);
      setIsSeller(data.isUserSeller);
      setIsBuyer(data.isUserBuyer);
      setActiveReservation(data.activeReservation);

      // Check reservation time
      if (data.activeReservation) {
        check3HourWindow(data.activeReservation.createdAt);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  // Recalculate 3-hour remaining timer
  const check3HourWindow = (createdAtString: string) => {
    const createdAt = new Date(createdAtString).getTime();
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    const now = Date.now();
    const elapsed = now - createdAt;
    const remaining = THREE_HOURS_MS - elapsed;

    if (remaining > 0) {
      setIsWithin3Hours(true);
      const minutes = Math.floor((remaining / (1000 * 60)) % 60);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      setTimeRemainingText(`${hours} ชม. ${minutes} นาที`);
    } else {
      setIsWithin3Hours(false);
      setTimeRemainingText('เกิน 3 ชั่วโมงแล้ว');
    }
  };

  // Timer interval to keep remaining time updated
  useEffect(() => {
    if (!activeReservation) return;

    const interval = setInterval(() => {
      check3HourWindow(activeReservation.createdAt);
    }, 30000); // check every 30s

    return () => clearInterval(interval);
  }, [activeReservation]);

  // Handle Reserve Product
  const handleReserve = async () => {
    if (!user) {
      onNavigateToLogin();
      return;
    }

    if (user.isBanned) {
      setErrorMsg('บัญชีของคุณถูกระงับการใช้งานเนื่องจากมีประวัติผิดนัด/โดนเท');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await reservationApi.createReservation(productId);
      setRevealedSellerContact(res.sellerContact);
      setSuccessMsg('🎉 จองสินค้าสำเร็จ! ข้อมูลติดต่อผู้ขายเปิดเผยแล้วด้านล่าง');
      await loadProduct();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Buyer Cancel Reservation (< 3 hours)
  const handleBuyerCancel = async () => {
    if (!activeReservation) return;

    if (!confirm('ยืนยันที่จะยกเลิกการจองสินค้านี้หรือไม่? สินค้าจะกลับไปเป็นสถานะพร้อมขายทันที')) {
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    try {
      await reservationApi.cancelReservation(activeReservation.id);
      setSuccessMsg('ยกเลิกการจองเรียบร้อยแล้ว สินค้าเปิดให้คนอื่นจองได้อีกครั้ง');
      setRevealedSellerContact(null);
      await loadProduct();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'ไม่สามารถยกเลิกการจองได้');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Seller Complete Transaction
  const handleCompleteDeal = async () => {
    if (!activeReservation) return;

    if (!confirm('ยืนยันว่าได้ส่งมอบสินค้าและรับเงินสด/โอนเรียบร้อยแล้ว?')) {
      return;
    }

    setActionLoading(true);
    try {
      await reservationApi.completeReservation(activeReservation.id);
      setSuccessMsg('🎉 ยืนยันการซื้อขายสำเร็จ! ขอบคุณสำหรับการใช้บริการ CampusMart');
      await loadProduct();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Seller Report Ghost (Anti-Ghosting)
  const handleReportGhost = async () => {
    if (!activeReservation) return;

    if (
      !confirm(
        '⚠️ คำเตือน: คุณต้องการรายงานว่าผู้ซื้อ "โดนเท/ไม่มาตามนัด" ใช่หรือไม่?\n\nระบบจะทำการแบน (Ban) บัญชีผู้ซื้อรายนี้ และนำสินค้ากลับมาพร้อมขายใหม่อีกครั้ง'
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const msg = await reservationApi.reportGhost(activeReservation.id);
      setSuccessMsg(`🚫 ${msg}`);
      await loadProduct();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'เกิดข้อผิดพลาดในการรายงาน');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Seller Delete Product
  const handleDeleteProduct = async () => {
    if (!confirm('ต้องการลบรายการสินค้านี้ใช่หรือไม่?')) return;

    setActionLoading(true);
    try {
      await productApi.deleteProduct(productId);
      alert('ลบรายการสินค้าเรียบร้อยแล้ว');
      onBack();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'ไม่สามารถลบสินค้าได้');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-clickup mx-auto px-4 py-16 text-center">
        <div className="w-9 h-9 border-3 border-hairline-strong border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-caption font-mono text-ink-tertiary">LOADING PRODUCT DATA...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-clickup mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-brand-orange mx-auto mb-3" />
        <h2 className="font-display text-heading-sm font-bold text-ink">ไม่พบสินค้านี้</h2>
        <button onClick={onBack} className="btn-secondary-sm mt-4 px-4 py-2 text-button-md">
          กลับหน้าตลาด
        </button>
      </div>
    );
  }

  const isReserved = !product.isAvailable;
  const isCurrentUserTheBuyer = isBuyer || (activeReservation && activeReservation.buyerId === user?.id);
  const isCurrentUserTheSeller = isSeller || product.sellerId === user?.id;

  return (
    <div className="max-w-clickup mx-auto px-4 sm:px-[40px] py-6 pb-24">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-ink-secondary hover:text-ink mb-5 transition-colors duration-clickup ease-clickup"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>กลับไปหน้าตลาด</span>
      </button>

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-4 p-4 rounded-lg bg-red-50/80 border border-accent-red/20 text-accent-red text-body-sm flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-4 rounded-lg bg-emerald-50/80 border border-accent-green/20 text-accent-green text-body-sm flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Detail Container — design.md card-feature-panel: xxl (35px) radius, 1px hairline */}
      <div className="card-feature-panel sm:rounded-xxl shadow-tinted-sm overflow-hidden p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Big Product Image Frame */}
          <div className="relative aspect-square rounded-lg sm:rounded-xl bg-surface overflow-hidden flex items-center justify-center border border-hairline">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-ink-disabled">
                <Tag className="w-12 h-12 mb-2 stroke-[1.5]" />
                <span className="text-xs font-mono">ภาพตัวอย่างสินค้า</span>
              </div>
            )}

            {/* Reserved Overlay Badge */}
            {isReserved && (
              <div className="absolute top-3.5 right-3.5 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-sm text-brand-orange border border-brand-orange/30 shadow-tinted-xs">
                  <Clock className="w-3.5 h-3.5" />
                  ติดจองแล้ว
                </span>
              </div>
            )}
          </div>

          {/* Product Info & Action States */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Status pill & Meetup location */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-soft text-ink-deep border border-hairline">
                  <MapPin className="w-3 h-3 text-primary" />
                  {product.meetupLocation}
                </span>

                <span className="eyebrow-mono text-[11px] text-ink-tertiary flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(product.createdAt).toLocaleDateString('th-TH')}
                </span>
              </div>

              {/* Title — Plus Jakarta Sans heading-md (26px / 650 / -0.91px) */}
              <h1 className="font-display font-extrabold text-2xl sm:text-heading-md text-ink leading-tight mb-3 tracking-tight-sm">
                {product.title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-1 font-display font-extrabold text-3xl sm:text-display-md text-ink-deep mb-5 tracking-tight-md">
                <span className="text-xl font-semibold text-ink-tertiary">฿</span>
                <span>{new Intl.NumberFormat('th-TH').format(product.price)}</span>
                <span className="text-body-sm font-normal text-ink-tertiary ml-2 font-sans">
                  (ชำระเงินสดหรือสแกนจ่ายหน้างาน)
                </span>
              </div>

              {/* Seller Summary Box (ClickUp card-tile) */}
              <div className="p-3.5 sm:p-4 bg-surface rounded-md border border-hairline mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-soft text-ink font-mono font-bold text-xs flex items-center justify-center border border-hairline">
                    {product.seller.studentId?.slice(-3) || 'CMU'}
                  </div>
                  <div>
                    <p className="eyebrow-mono text-[10px] text-ink-tertiary">ผู้ลงขายสินค้า</p>
                    <p className="text-xs font-bold text-ink">{product.seller.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-[11px] text-ink-secondary bg-canvas px-2 py-0.5 rounded-xxs border border-hairline">
                    {product.seller.studentId ? `รหัส ...${product.seller.studentId.slice(-3)}` : 'นักศึกษา มช.'}
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* CORE BUSINESS STATES: STATE 1, STATE 2, STATE 3 & SELLER VIEW */}
            {/* ============================================================== */}
            <div className="pt-5 border-t border-hairline">
              {/* CASE A: CURRENT USER IS THE SELLER */}
              {isCurrentUserTheSeller ? (
                <div className="space-y-3">
                  <div className="p-3 bg-surface rounded-md border border-hairline text-body-sm text-ink">
                    <p className="font-semibold flex items-center gap-1.5 text-primary">
                      <UserCheck className="w-4 h-4" />
                      นี่คือสินค้าที่คุณลงขายเอง
                    </p>
                    {isReserved && activeReservation ? (
                      <p className="mt-1 text-ink-secondary">
                        มีนักศึกษาจองสินค้านี้แล้ว กรุณาติดต่อเพื่อนัดส่งมอบและรับเงินหน้างาน
                      </p>
                    ) : (
                      <p className="mt-1 text-ink-secondary">
                        ยังไม่มีผู้จอง คุณสามารถลบหรือจัดการรายการสินค้านี้ได้
                      </p>
                    )}
                  </div>

                  {/* Seller Action Controls if reserved */}
                  {isReserved && activeReservation && (
                    <div className="space-y-2">
                      <button
                        onClick={handleCompleteDeal}
                        disabled={actionLoading}
                        className="w-full py-3.5 px-6 rounded-pill bg-accent-green hover:bg-green-700 text-white text-button-md shadow-tinted-xs flex items-center justify-center gap-2 transition-all duration-clickup ease-clickup"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ยืนยันส่งมอบสินค้าและรับเงินสำเร็จ (ปิดการขาย)</span>
                      </button>

                      {/* Anti-Ghosting Report Button */}
                      <button
                        onClick={handleReportGhost}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-surface-soft hover:bg-red-50 text-accent-red border border-hairline hover:border-accent-red/30 rounded-sm text-button-md flex items-center justify-center gap-1.5 transition-all duration-clickup ease-clickup"
                      >
                        <ShieldAlert className="w-4 h-4 text-accent-red" />
                        <span>รายงานผู้ซื้อโดนเท / ไม่มาตามนัด (แบนบัญชีผู้ซื้อ)</span>
                      </button>
                    </div>
                  )}

                  {!isReserved && (
                    <button
                      onClick={handleDeleteProduct}
                      disabled={actionLoading}
                      className="w-full py-2.5 bg-surface-soft hover:bg-red-50 text-ink-secondary hover:text-accent-red border border-hairline rounded-sm text-button-md flex items-center justify-center gap-1.5 transition-all duration-clickup ease-clickup"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>ลบรายการสินค้านี้</span>
                    </button>
                  )}
                </div>
              ) : (
                /* CASE B: BUYER / GENERAL STUDENT VIEWS */
                <div>
                  {/* STATE 1: ยังไม่จอง (isAvailable === true) */}
                  {!isReserved ? (
                    <div>
                      {/* ClickUp Dominant CTA / Brand Gradient Pill CTA */}
                      <button
                        onClick={handleReserve}
                        disabled={actionLoading}
                        className="btn-gradient-pill w-full h-[52px] px-6 text-body-lg font-semibold tracking-tight-body-sm flex items-center justify-center gap-2 shadow-tinted-md active:scale-[0.99] transition-all duration-clickup ease-clickup disabled:opacity-50"
                      >
                        <Tag className="w-4 h-4" />
                        <span>กดจองสินค้า (Reserve Product)</span>
                      </button>
                      <p className="text-center text-[11px] text-ink-tertiary mt-2">
                        กดจองเพื่อเปิดข้อมูลติดต่อเพื่อนัดรับและชำระเงินหน้างาน (ไม่มีการตัดบัตร)
                      </p>
                    </div>
                  ) : isCurrentUserTheBuyer ? (
                    /* BUYER WHO HAS RESERVED THIS PRODUCT: STATE 2 vs STATE 3 */
                    <div className="space-y-4">
                      {/* Revealed Contact Information Box (ClickUp surface card) */}
                      <div className="p-4 sm:p-5 bg-surface rounded-lg border border-hairline shadow-tinted-xs">
                        <div className="flex items-center gap-2 text-ink font-bold text-body-sm mb-3">
                          <UserCheck className="w-4 h-4 text-primary" />
                          <span className="eyebrow-mono">ข้อมูลติดต่อผู้ขาย (เพื่อนัดรับสินค้า)</span>
                        </div>

                        <div className="space-y-2 text-body-sm">
                          <div className="flex items-center gap-2 text-ink">
                            <MessageSquare className="w-4 h-4 text-accent-green shrink-0" />
                            <span className="font-semibold text-ink-secondary">Contact / Line:</span>
                            <span className="font-bold text-ink">
                              {product.seller.contactInfo ||
                                revealedSellerContact?.contactInfo ||
                                'ยังไม่ได้ระบุ Line ID (กรุณาใช้อีเมล มช.)'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-ink">
                            <Mail className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-semibold text-ink-secondary">CMU Mail:</span>
                            <span className="font-mono text-ink">
                              {revealedSellerContact?.email || `${product.seller.studentId}@cmu.ac.th`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-ink">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-semibold text-ink-secondary">จุดนัดรับของ:</span>
                            <span className="font-bold text-primary">{product.meetupLocation}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-hairline text-[11px] text-ink-tertiary flex items-center gap-1.5">
                          <span>💡 แนะนำให้นัดเจอกันในเวลากลางวัน ณ จุดนัดรับในมหาวิทยาลัย</span>
                        </div>
                      </div>

                      {/* STATE 2: จองแล้ว ภายใน 3 ชม. */}
                      {isWithin3Hours ? (
                        <div className="space-y-2">
                          <button
                            onClick={handleBuyerCancel}
                            disabled={actionLoading}
                            className="w-full py-3 px-6 rounded-pill bg-accent-red hover:bg-red-700 text-white text-button-md shadow-tinted-xs active:scale-[0.99] transition-all duration-clickup ease-clickup flex items-center justify-center gap-2"
                          >
                            <span>ยกเลิกการจองสินค้า (Cancel Reservation)</span>
                          </button>
                          <div className="flex items-center justify-between px-1 text-body-sm text-ink-secondary">
                            <span className="flex items-center gap-1 text-brand-orange font-medium font-mono text-[11px]">
                              <Clock className="w-3.5 h-3.5" />
                              เวลายกเลิกคงเหลือ: {timeRemainingText}
                            </span>
                            <span className="text-[10px] text-ink-tertiary">(สิทธิ์ยกเลิกภายใน 3 ชม.)</span>
                          </div>
                        </div>
                      ) : (
                        /* STATE 3: จองแล้ว เกิน 3 ชม. (ซ่อนปุ่มยกเลิก พร้อมข้อความเตือน) */
                        <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-200/80 text-body-sm text-amber-900">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-900">
                                หมดเวลายกเลิกการจองด้วยตนเอง (เกินกำหนด 3 ชั่วโมง)
                              </p>
                              <p className="mt-0.5 text-amber-800 leading-relaxed text-[11px]">
                                เพื่อป้องกันการกั๊กสินค้า หากติดธุระหรือไม่สะดวกรับของ
                                กรุณาติดต่อผู้ขายโดยตรงผ่านช่องทางติดต่อด้านบนเพื่อแจ้งยกเลิก
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Product reserved by another student */
                    <div className="p-4 bg-surface rounded-lg border border-hairline text-center text-body-sm text-ink-secondary">
                      <Clock className="w-5 h-5 text-brand-orange mx-auto mb-1.5" />
                      <p className="font-bold text-ink text-heading-sm">สินค้านี้มีนักศึกษาจองอยู่แล้ว</p>
                      <p className="mt-0.5 text-ink-tertiary text-[11px]">
                        หากผู้ซื้อเดิมยกเลิกหรือไม่มีการส่งมอบภายใน 24 ชม. ระบบจะปล่อยสินค้ากลับมาให้จองใหม่อัตโนมัติ
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
