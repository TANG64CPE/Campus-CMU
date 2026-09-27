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
  Phone,
  MessageSquare,
  Mail,
  ShieldAlert,
  Trash2,
  Calendar,
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
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-10 h-10 border-4 border-cmu-200 border-t-cmu-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 text-sm">กำลังโหลดข้อมูลสินค้า...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">ไม่พบสินค้านี้</h2>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-cmu-600 text-white rounded-xl text-sm font-medium"
        >
          กลับหน้าตลาด
        </button>
      </div>
    );
  }

  const isReserved = !product.isAvailable;
  const isCurrentUserTheBuyer = isBuyer || (activeReservation && activeReservation.buyerId === user?.id);
  const isCurrentUserTheSeller = isSeller || product.sellerId === user?.id;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-cmu-600 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>กลับไปหน้าตลาด</span>
      </button>

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div>{successMsg}</div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          {/* Big Product Image */}
          <div className="relative aspect-square rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Tag className="w-16 h-16 text-cmu-300 mb-2 stroke-[1.5]" />
                <span className="text-sm font-medium">รูปภาพตัวอย่างสินค้า</span>
              </div>
            )}

            {/* Reserved Overlay Badge */}
            {isReserved && (
              <div className="absolute top-4 right-4 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-lg shadow-amber-500/30">
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
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-cmu-700 border border-purple-200">
                  <MapPin className="w-3 h-3 text-cmu-500" />
                  {product.meetupLocation}
                </span>

                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(product.createdAt).toLocaleDateString('th-TH')}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-3">
                {product.title}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-1 text-3xl font-extrabold text-cmu-700 mb-6">
                <span className="text-xl">฿</span>
                <span>{new Intl.NumberFormat('th-TH').format(product.price)}</span>
                <span className="text-xs font-normal text-slate-400 ml-2">
                  (ชำระเงินสดหรือสแกนจ่ายหน้างาน)
                </span>
              </div>

              {/* Seller Summary Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cmu-100 text-cmu-700 flex items-center justify-center font-bold text-sm">
                    {product.seller.studentId?.slice(-3) || 'CMU'}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">ผู้ลงขายสินค้า</p>
                    <p className="text-sm font-semibold text-slate-800">{product.seller.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-slate-500">
                    {product.seller.studentId ? `รหัส ...${product.seller.studentId.slice(-3)}` : 'นักศึกษา มช.'}
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* CORE BUSINESS STATES: STATE 1, STATE 2, STATE 3 & SELLER VIEW */}
            {/* ============================================================== */}
            <div className="pt-4 border-t border-slate-100">
              {/* CASE A: CURRENT USER IS THE SELLER */}
              {isCurrentUserTheSeller ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-cmu-900">
                    <p className="font-semibold flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-cmu-700" />
                      นี่คือสินค้าที่คุณลงขายเอง
                    </p>
                    {isReserved && activeReservation ? (
                      <p className="mt-1 text-slate-600">
                        มีนักศึกษาจองสินค้านี้แล้ว กรุณาติดต่อเพื่อส่งมอบและรับเงินหน้างาน
                      </p>
                    ) : (
                      <p className="mt-1 text-slate-600">
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
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>ยืนยันส่งมอบสินค้าและรับเงินสำเร็จ (ปิดการขาย)</span>
                      </button>

                      {/* Anti-Ghosting Report Button */}
                      <button
                        onClick={handleReportGhost}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>รายงานผู้ซื้อโดนเท / ไม่มาตามนัด (แบนบัญชีผู้ซื้อ)</span>
                      </button>
                    </div>
                  )}

                  {!isReserved && (
                    <button
                      onClick={handleDeleteProduct}
                      disabled={actionLoading}
                      className="w-full py-2.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
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
                      <button
                        onClick={handleReserve}
                        disabled={actionLoading}
                        className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cmu-700 via-cmu-600 to-cmu-700 hover:from-cmu-800 hover:to-cmu-800 text-white font-bold text-base shadow-lg shadow-cmu-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Tag className="w-5 h-5" />
                        <span>กดจองสินค้า (Reserve Product)</span>
                      </button>
                      <p className="text-center text-xs text-slate-400 mt-2">
                        กดจองเพื่อเปิดข้อมูลติดต่อเพื่อนัดรับและชำระเงินหน้างาน (ไม่มีตัดบัตร)
                      </p>
                    </div>
                  ) : isCurrentUserTheBuyer ? (
                    /* BUYER WHO HAS RESERVED THIS PRODUCT: STATE 2 vs STATE 3 */
                    <div className="space-y-4">
                      {/* Revealed Contact Information Box */}
                      <div className="p-4 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 rounded-2xl border-2 border-purple-200/90 shadow-sm">
                        <div className="flex items-center gap-2 text-cmu-800 font-bold text-sm mb-3">
                          <UserCheck className="w-5 h-5 text-cmu-600" />
                          <span>ข้อมูลติดต่อผู้ขาย (เพื่อนัดรับสินค้า)</span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-slate-700">
                            <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-slate-500">Contact / Line:</span>
                            <span className="font-bold text-slate-900">
                              {product.seller.contactInfo ||
                                revealedSellerContact?.contactInfo ||
                                'ยังไม่ได้ระบุ Line ID (กรุณาใช้อีเมล มช.)'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-700">
                            <Mail className="w-4 h-4 text-cmu-600 shrink-0" />
                            <span className="font-semibold text-slate-500">CMU Mail:</span>
                            <span className="font-mono text-slate-900">
                              {revealedSellerContact?.email || `${product.seller.studentId}@cmu.ac.th`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-700">
                            <MapPin className="w-4 h-4 text-cmu-600 shrink-0" />
                            <span className="font-semibold text-slate-500">จุดนัดรับของ:</span>
                            <span className="font-bold text-cmu-800">{product.meetupLocation}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-purple-100 text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>💡 แนะนำให้นัดเจอกันในเวลากลางวัน ณ จุดนัดรับในมหาวิทยาลัย</span>
                        </div>
                      </div>

                      {/* STATE 2: จองแล้ว ภายใน 3 ชม. */}
                      {isWithin3Hours ? (
                        <div className="space-y-2">
                          <button
                            onClick={handleBuyerCancel}
                            disabled={actionLoading}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md shadow-red-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                          >
                            <span>ยกเลิกการจองสินค้า (Cancel Reservation)</span>
                          </button>
                          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              เวลายกเลิกคงเหลือ: {timeRemainingText}
                            </span>
                            <span className="text-[11px] text-slate-400">(สิทธิ์ยกเลิกภายใน 3 ชม.)</span>
                          </div>
                        </div>
                      ) : (
                        /* STATE 3: จองแล้ว เกิน 3 ชม. (ซ่อนปุ่มยกเลิก พร้อมข้อความเตือน) */
                        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-800">
                                หมดเวลายกเลิกการจองด้วยตนเอง (เกินกำหนด 3 ชั่วโมง)
                              </p>
                              <p className="mt-0.5 text-amber-700 leading-relaxed">
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
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                      <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                      <p className="font-bold text-slate-700 text-sm">สินค้านี้มีนักศึกษาจองอยู่แล้ว</p>
                      <p className="mt-0.5 text-slate-400">
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
