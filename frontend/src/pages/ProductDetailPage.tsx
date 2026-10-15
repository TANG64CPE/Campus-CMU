import React, { useState, useEffect, useCallback } from 'react';
import { Product, Reservation, SellerContact, isAdminRole, isContactComplete } from '../types';
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
  Phone,
  Globe,
  Camera,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ProductImage } from '../components/ProductImage';
import { getProductImageUrls } from '../utils/productImages';
import { ReservationChat } from '../components/ReservationChat';

interface ProductDetailPageProps {
  productId: string;
  onBack: () => void;
  onNavigateToLogin: () => void;
  onNavigateToProfile?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onBack,
  onNavigateToLogin,
  onNavigateToProfile,
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
  const [linkCopied, setLinkCopied] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showReservationChat, setShowReservationChat] = useState(false);

  // Time state for 3-Hour window
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');
  const [isWithin3Hours, setIsWithin3Hours] = useState<boolean>(true);

  const loadProduct = useCallback(async (showPageLoader = false) => {
    if (showPageLoader) setLoading(true);
    setErrorMsg(null);
    try {
      const data = await productApi.getProductById(productId);
      setProduct(data.product);
      setActiveImageIndex(0);
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
      if (showPageLoader) setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct(true);
  }, [loadProduct]);

  // Keep the seller's page current when a buyer reserves the product.
  useEffect(() => {
    if (!isSeller || activeReservation) return;
    const interval = window.setInterval(() => {
      void loadProduct();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [isSeller, activeReservation, loadProduct]);

  const handleCopyProductLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/products/${encodeURIComponent(productId)}`);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setErrorMsg('คัดลอกลิงก์ไม่ได้ กรุณาคัดลอกจากแถบที่อยู่ของเบราว์เซอร์');
    }
  };

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

    if (isAdminRole(user.role)) {
      setErrorMsg('บัญชีผู้ดูแลระบบไม่สามารถซื้อหรือจองสินค้าได้');
      return;
    }

    if (user.isBanned) {
      setErrorMsg('บัญชีของคุณถูกระงับการใช้งานเนื่องจากมีประวัติผิดนัด/โดนเท');
      return;
    }

    if (!isContactComplete(user)) {
      setErrorMsg('กรุณากรอกข้อมูลติดต่อในหน้าโปรไฟล์ให้ครบถ้วนก่อนกดจองสินค้า (จำเป็นต้องมีเบอร์โทร และ Line/Facebook/Instagram อย่างน้อย 1 ช่อง)');
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
  const handleBuyerCancel = () => {
    if (!activeReservation || actionLoading) return;
    setShowCancelConfirmation(true);
  };

  const confirmBuyerCancel = async () => {
    if (!activeReservation) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await reservationApi.cancelReservation(activeReservation.id);
      setSuccessMsg('ยกเลิกการจองเรียบร้อยแล้ว สินค้าเปิดให้คนอื่นจองได้อีกครั้ง');
      setRevealedSellerContact(null);
      setShowCancelConfirmation(false);
      await loadProduct();
    } catch (err: any) {
      setShowCancelConfirmation(false);
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
    setActionLoading(true);
    setDeleteError(null);
    try {
      await productApi.deleteProduct(productId);
      onBack();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'ไม่สามารถลบสินค้าได้');
    } finally {
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

  const productImages = getProductImageUrls(product);
  const safeImageIndex = productImages.length
    ? Math.min(activeImageIndex, productImages.length - 1)
    : 0;

  const isReserved = !product.isAvailable;
  const isCurrentUserTheBuyer = isBuyer || (activeReservation && activeReservation.buyerId === user?.id);
  const isCurrentUserTheSeller = isSeller || product.sellerId === user?.id;

  return (
    <div className="max-w-clickup mx-auto px-4 sm:px-[40px] py-6 pb-24">
      {/* Back button */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-ink-secondary hover:text-ink transition-colors duration-clickup ease-clickup"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับไปหน้าตลาด</span>
        </button>
        <button
          type="button"
          onClick={handleCopyProductLink}
          className="inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-body-sm font-medium text-ink-secondary transition-colors hover:border-primary hover:text-primary"
          aria-label="คัดลอกลิงก์สินค้า"
        >
          <Share2 className="h-4 w-4" />
          {linkCopied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
        </button>
      </div>

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
          <div>
            <div className="relative aspect-square rounded-lg sm:rounded-xl bg-surface overflow-hidden flex items-center justify-center border border-hairline">
              {productImages.length ? (
                <img src={productImages[safeImageIndex]} alt={`${product.title} รูปที่ ${safeImageIndex + 1}`} className="h-full w-full object-cover" />
              ) : (
                <ProductImage product={product} loading="eager" className="h-full w-full object-cover" />
              )}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="รูปก่อนหน้า"
                    onClick={() => setActiveImageIndex((index) => (index - 1 + productImages.length) % productImages.length)}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-sm hover:bg-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="รูปถัดไป"
                    onClick={() => setActiveImageIndex((index) => (index + 1) % productImages.length)}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-sm hover:bg-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
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
            {productImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {productImages.map((imageUrl, index) => (
                  <button
                    key={imageUrl}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`ดูรูปที่ ${index + 1}`}
                    aria-pressed={safeImageIndex === index}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${safeImageIndex === index ? 'border-primary' : 'border-hairline'}`}
                  >
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
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

              {/* Product heading */}
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

              {/* Seller summary */}
              <div className="p-3.5 sm:p-4 bg-surface rounded-md border border-hairline mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-soft text-ink font-bold text-xs flex items-center justify-center border border-hairline overflow-hidden shrink-0">
                    {product.seller.avatarUrl ? (
                      <img
                        src={product.seller.avatarUrl}
                        alt={`รูปโปรไฟล์ ${product.seller.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      product.seller.name.trim().charAt(0).toLocaleUpperCase() || '?'
                    )}
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
              {isAdminRole(user?.role) ? (
                <div className="rounded-xl border border-hairline bg-surface-soft p-4 text-center text-body-sm text-ink-secondary">
                  <ShieldAlert className="mx-auto mb-2 h-5 w-5 text-ink" />
                  <p className="font-bold text-ink">บัญชีผู้ดูแลระบบไม่สามารถซื้อหรือขายสินค้าได้</p>
                  <p className="mt-1 text-caption">คุณยังสามารถดูรายละเอียดสินค้าได้</p>
                </div>
              ) : isCurrentUserTheSeller ? (
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
                      onClick={() => setShowDeleteConfirmation(true)}
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
                      {/* Warning if user has not completed contact info */}
                      {user && !isContactComplete(user) && (
                        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-ink shadow-tinted-xs">
                          <div className="flex items-center gap-2 text-brand-orange font-bold text-body-sm">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>จำเป็นต้องระบุข้อมูลติดต่อก่อนกดจองสินค้า</span>
                          </div>
                          <p className="text-caption text-ink-secondary mt-1">
                            ตามระเบียบของระบบ คุณจำเป็นต้องระบุเบอร์โทรศัพท์และ Social Media ในหน้าโปรไฟล์ก่อน จึงจะสามารถกดจองสินค้าได้
                          </p>
                          {onNavigateToProfile && (
                            <button
                              onClick={onNavigateToProfile}
                              className="mt-2 text-caption font-bold text-primary underline hover:text-primary-deep flex items-center gap-1"
                            >
                              ไปที่หน้าโปรไฟล์เพื่อกรอกข้อมูลติดต่อ →
                            </button>
                          )}
                        </div>
                      )}

                      {/* Reservation action */}
                      <button
                        onClick={handleReserve}
                        disabled={actionLoading || (user ? !isContactComplete(user) : false)}
                        className={`w-full h-[52px] px-6 text-body-lg font-semibold tracking-tight-body-sm flex items-center justify-center gap-2 shadow-tinted-md active:scale-[0.99] transition-all duration-clickup ease-clickup ${
                          user && !isContactComplete(user)
                            ? 'bg-surface-soft text-ink-tertiary cursor-not-allowed border border-hairline'
                            : 'btn-gradient-pill disabled:opacity-50'
                        }`}
                      >
                        <Tag className="w-4 h-4" />
                        <span>
                          {user && !isContactComplete(user)
                            ? 'กรุณากรอกข้อมูลติดต่อในโปรไฟล์ก่อนกดจอง'
                            : 'กดจองสินค้า (Reserve Product)'}
                        </span>
                      </button>
                      <p className="text-center text-[11px] text-ink-tertiary mt-2">
                        กดจองเพื่อเปิดข้อมูลติดต่อเพื่อนัดรับและชำระเงินหน้างาน (ไม่มีการตัดบัตร)
                      </p>
                    </div>
                  ) : isCurrentUserTheBuyer ? (
                    /* BUYER WHO HAS RESERVED THIS PRODUCT: STATE 2 vs STATE 3 */
                    <div className="space-y-4">
                      {/* Revealed contact information */}
                      <div className="p-4 sm:p-5 bg-surface rounded-xl border border-hairline shadow-tinted-xs">
                        <div className="flex items-center gap-2 text-ink font-bold text-body-sm mb-3 pb-2 border-b border-hairline">
                          <UserCheck className="w-4 h-4 text-primary" />
                          <span className="eyebrow-mono text-primary font-bold">ข้อมูลติดต่อผู้ขาย (เพื่อนัดรับสินค้า)</span>
                        </div>

                        <div className="space-y-2.5 text-body-sm">
                          {/* Phone */}
                          {(product.seller.phone || revealedSellerContact?.phone) && (
                            <div className="flex items-center gap-2.5 text-ink">
                              <Phone className="w-4 h-4 text-primary shrink-0" />
                              <span className="font-semibold text-ink-secondary text-caption">เบอร์โทรติดต่อ:</span>
                              <a
                                href={`tel:${product.seller.phone || revealedSellerContact?.phone}`}
                                className="font-bold text-primary hover:underline font-mono"
                              >
                                {product.seller.phone || revealedSellerContact?.phone}
                              </a>
                            </div>
                          )}

                          {/* Line ID */}
                          {(product.seller.lineId || revealedSellerContact?.lineId) && (
                            <div className="flex items-center gap-2.5 text-ink">
                              <MessageSquare className="w-4 h-4 text-accent-green shrink-0" />
                              <span className="font-semibold text-ink-secondary text-caption">Line ID:</span>
                              <span className="font-bold text-ink">
                                {product.seller.lineId || revealedSellerContact?.lineId}
                              </span>
                            </div>
                          )}

                          {/* Facebook */}
                          {(product.seller.facebook || revealedSellerContact?.facebook) && (
                            <div className="flex items-center gap-2.5 text-ink">
                              <Globe className="w-4 h-4 text-accent-blue shrink-0" />
                              <span className="font-semibold text-ink-secondary text-caption">Facebook:</span>
                              <span className="font-bold text-ink">
                                {product.seller.facebook || revealedSellerContact?.facebook}
                              </span>
                            </div>
                          )}

                          {/* Instagram */}
                          {(product.seller.instagram || revealedSellerContact?.instagram) && (
                            <div className="flex items-center gap-2.5 text-ink">
                              <Camera className="w-4 h-4 text-brand-pink shrink-0" />
                              <span className="font-semibold text-ink-secondary text-caption">Instagram:</span>
                              <span className="font-bold text-ink font-mono">
                                {product.seller.instagram || revealedSellerContact?.instagram}
                              </span>
                            </div>
                          )}

                          {/* Fallback combined contactInfo if individual fields empty */}
                          {!product.seller.phone && !revealedSellerContact?.phone && !product.seller.lineId && (
                            <div className="flex items-center gap-2 text-ink">
                              <MessageSquare className="w-4 h-4 text-accent-green shrink-0" />
                              <span className="font-semibold text-ink-secondary">ช่องทางติดต่อ:</span>
                              <span className="font-bold text-ink">
                                {product.seller.contactInfo || revealedSellerContact?.contactInfo || 'ยังไม่ได้ระบุ'}
                              </span>
                            </div>
                          )}

                          {/* Meetup Notes */}
                          {(product.seller.meetingNote || revealedSellerContact?.meetingNote) && (
                            <div className="p-2.5 rounded-lg bg-surface-soft border border-hairline text-caption text-ink">
                              <div className="font-semibold text-ink-secondary mb-0.5 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                <span>จุดนัดพบที่ผู้ขายสะดวก / ข้อมูลเพิ่มเติม:</span>
                              </div>
                              <p className="font-medium text-ink">
                                {product.seller.meetingNote || revealedSellerContact?.meetingNote}
                              </p>
                            </div>
                          )}

                          {/* CMU Mail */}
                          <div className="flex items-center gap-2.5 text-ink pt-1 border-t border-hairline/60">
                            <Mail className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-semibold text-ink-secondary text-caption">CMU Mail:</span>
                            <span className="font-mono text-caption text-ink">
                              {revealedSellerContact?.email || `${product.seller.studentId}@cmu.ac.th`}
                            </span>
                          </div>

                          {/* Item Meetup Location */}
                          <div className="flex items-center gap-2.5 text-ink">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-semibold text-ink-secondary text-caption">จุดนัดรับสินค้านี้:</span>
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

      {activeReservation && user && !isAdminRole(user.role) && (isCurrentUserTheBuyer || isCurrentUserTheSeller) && (
        <>
          <button
            type="button"
            onClick={() => setShowReservationChat(true)}
            className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-ink-deep focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-haspopup="dialog"
            aria-expanded={showReservationChat}
          >
            <MessageSquare className="h-4 w-4" />
            แชตการจอง
          </button>

          {showReservationChat && (
            <div
              className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setShowReservationChat(false);
              }}
            >
              <div role="dialog" aria-modal="true" aria-label="แชตผู้ซื้อกับผู้ขาย" className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-hairline bg-white shadow-2xl sm:rounded-2xl">
                <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                  <div>
                    <h2 className="font-semibold text-ink">แชตผู้ซื้อกับผู้ขาย</h2>
                    <p className="text-xs text-ink-tertiary">{product.title}</p>
                  </div>
                  <button type="button" onClick={() => setShowReservationChat(false)} className="rounded-full p-2 text-ink-secondary transition hover:bg-surface-soft hover:text-ink" aria-label="ปิดแชต">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="max-h-[75vh] overflow-y-auto p-3 sm:max-h-[min(75vh,620px)]">
                  <ReservationChat reservationId={activeReservation.id} currentUserId={user.id} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showCancelConfirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget && !actionLoading) setShowCancelConfirmation(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-reservation-title"
            aria-describedby="cancel-reservation-description"
            className="w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="cancel-reservation-title" className="text-lg font-bold text-ink">
                  ยืนยันการยกเลิกการจอง?
                </h2>
                <p id="cancel-reservation-description" className="mt-2 text-sm leading-relaxed text-ink-secondary">
                  สินค้าจะกลับไปอยู่ในสถานะพร้อมขาย และนักศึกษาคนอื่นจะสามารถจองได้ทันที
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelConfirmation(false)}
                disabled={actionLoading}
                aria-label="ปิดหน้าต่างยืนยัน"
                className="rounded-full p-1 text-ink-tertiary hover:bg-surface-soft hover:text-ink disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirmation(false)}
                disabled={actionLoading}
                className="btn-secondary-sm h-12 w-full px-3"
              >
                กลับไปหน้าสินค้า
              </button>
              <button
                type="button"
                onClick={confirmBuyerCancel}
                disabled={actionLoading}
                className="h-12 w-full rounded-pill bg-[#dc2626] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิกการจอง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setShowDeleteConfirmation(false);
              setDeleteError(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            aria-describedby="delete-product-description"
            className="w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-soft text-ink">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="delete-product-title" className="text-lg font-bold text-ink">
                  ยืนยันการลบรายการสินค้า?
                </h2>
                <p id="delete-product-description" className="mt-2 text-sm leading-relaxed text-ink-secondary">
                  รายการ “{product.title}” จะถูกลบออกจากตลาดและไม่สามารถกู้คืนได้
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeleteError(null);
                }}
                disabled={actionLoading}
                aria-label="ปิดหน้าต่างยืนยัน"
                className="rounded-full p-1 text-ink-tertiary hover:bg-surface-soft hover:text-ink disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {deleteError && (
              <p role="alert" className="mt-4 text-sm text-accent-red">
                {deleteError}
              </p>
            )}
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeleteError(null);
                }}
                disabled={actionLoading}
                className="btn-secondary-sm h-12 w-full px-3"
              >
                กลับไปหน้าสินค้า
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={actionLoading}
                className="h-12 w-full rounded-pill bg-[#dc2626] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ? 'กำลังลบ...' : 'ยืนยันลบสินค้า'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
