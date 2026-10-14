import React, { useState } from 'react';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isAdminRole, isContactComplete } from '../types';
import {
  MapPin,
  Tag,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Camera,
  X,
  Sparkles,
} from 'lucide-react';

interface CreateProductPageProps {
  onSuccess: (productId: string) => void;
  onCancel: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToLogin?: () => void;
}

export const CreateProductPage: React.FC<CreateProductPageProps> = ({ onSuccess, onCancel, onNavigateToProfile, onNavigateToLogin }) => {
  const { user, loading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [meetupLocation, setMeetupLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CMU famous meetup locations
  const popularLocations = [
    'หอสมุดกลาง มช.',
    'หน้าตึก 30 ปี คณะวิศวะ มช.',
    'โรงอาหารอ่างแก้ว',
    'ลานสัก มช.',
    'ตึก SCB1 คณะวิทยาศาสตร์',
    'โรงอาหารกลาง (RB3/RB5)',
    'คณะสถาปัตยกรรมศาสตร์ มช.',
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('กรุณากรอกชื่อสินค้า');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setErrorMsg('กรุณากรอกราคาที่ถูกต้อง');
      return;
    }
    if (!meetupLocation.trim()) {
      setErrorMsg('กรุณาเลือกหรือระบุจุดนัดรับของใน มช.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('price', price);
      formData.append('meetupLocation', meetupLocation.trim());
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const created = await productApi.createProduct(formData);
      onSuccess(created.id);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'ไม่สามารถลงขายสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  // Keep the form unavailable until authentication has resolved. The API also
  // checks the latest profile contact data before accepting a listing.
  if (authLoading) {
    return (
      <div className="max-w-[620px] mx-auto px-4 py-16 text-center" role="status" aria-live="polite">
        <p className="text-body-sm text-ink-secondary">กำลังตรวจสอบบัญชีของคุณ…</p>
      </div>
    );
  }

  // A direct visit to /create must not briefly expose the listing form to a
  // signed-out user while the API would reject the submission.
  if (!user) {
    return (
      <div className="max-w-[620px] mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-soft text-ink border border-hairline flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-display font-extrabold text-heading-md text-ink mb-2">
          เข้าสู่ระบบก่อนลงขายสินค้า
        </h2>
        <p className="text-body-sm text-ink-secondary mb-6 leading-relaxed max-w-md mx-auto">
          กรุณาเข้าสู่ระบบด้วยบัญชีนักศึกษา แล้วกรอกข้อมูลติดต่อให้ครบก่อนลงขายสินค้า
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={onCancel} className="btn-secondary-sm px-5 py-2.5 text-button-md">
            ย้อนกลับ
          </button>
          <button onClick={onNavigateToLogin} className="btn-primary-pill px-6 py-2.5 text-button-md">
            เข้าสู่ระบบ →
          </button>
        </div>
      </div>
    );
  }

  if (isAdminRole(user.role)) {
    return (
      <div className="max-w-[620px] mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-soft text-ink border border-hairline flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-display font-extrabold text-heading-md text-ink mb-2">
          บัญชีผู้ดูแลระบบไม่สามารถลงขายสินค้าได้
        </h2>
        <p className="text-body-sm text-ink-secondary mb-6 leading-relaxed max-w-md mx-auto">
          การซื้อขายเปิดให้บัญชีนักศึกษาเท่านั้น
        </p>
        <button onClick={onCancel} className="btn-secondary-sm px-5 py-2.5 text-button-md">
          กลับไปหน้าตลาด
        </button>
      </div>
    );
  }

  // Block listing until a valid mobile number and at least one social contact
  // have been saved. The backend enforces the same rule independently.
  if (!isContactComplete(user)) {
    return (
      <div className="max-w-[620px] mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-brand-orange border border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-tinted-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-display font-extrabold text-heading-md text-ink mb-2">
          จำเป็นต้องระบุข้อมูลติดต่อก่อนลงขายสินค้า
        </h2>
        <p className="text-body-sm text-ink-secondary mb-6 leading-relaxed max-w-md mx-auto">
          ตามระเบียบของระบบ เพื่อให้ผู้ซื้อสามารถติดต่อนัดรับของและชำระเงินกับคุณได้ กรุณาระบุ <strong>เบอร์โทรศัพท์</strong> และ <strong>Social Media (Line/Facebook/Instagram อย่างน้อย 1 ช่อง)</strong> ในหน้าโปรไฟล์ให้ครบถ้วนก่อนลงขายสินค้า
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary-sm px-5 py-2.5 text-button-md"
          >
            ย้อนกลับ
          </button>
          <button
            onClick={onNavigateToProfile}
            className="btn-gradient-pill px-6 py-2.5 text-button-md shadow-tinted-sm"
          >
            ไปที่หน้าโปรไฟล์เพื่อกรอกข้อมูล →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-6 pb-24">
      {/* Back button */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-body-sm font-medium text-ink-secondary hover:text-ink mb-5 transition-colors duration-clickup ease-clickup"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>ยกเลิกและย้อนกลับ</span>
      </button>

      {/* Main Form Container — design.md card-feature-panel: xxl (35px) on desktop, xl (25px) on mobile */}
      <div className="card-feature-panel sm:rounded-xxl p-6 sm:p-8 shadow-tinted-sm">
        <div className="mb-6 pb-4 border-b border-hairline">
          <div className="inline-block mb-1.5">
            <span className="eyebrow-mono bg-surface-soft text-ink-deep px-2 py-0.5 rounded-xxs border border-hairline text-[10px]">
              NEW LISTING • CMU CAMPUS
            </span>
          </div>
          <h1 className="font-display font-extrabold text-heading-md text-ink tracking-tight-sm">
            ลงขายสินค้ามือสอง
          </h1>
          <p className="text-body-sm text-ink-secondary mt-1">
            ระบุรายละเอียดสินค้าและจุดนัดรับส่งมอบตัวต่อตัวในมหาวิทยาลัยเชียงใหม่
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-50/80 border border-accent-red/20 text-accent-red text-body-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload Box */}
          <div>
            <label className="eyebrow-mono block text-caption text-ink-secondary mb-2">
              รูปภาพสินค้า
            </label>

            {imagePreview ? (
              <div className="relative aspect-[16/9] sm:aspect-[2/1] rounded-lg bg-surface overflow-hidden border border-hairline">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-ink/80 text-canvas hover:bg-ink transition-colors duration-clickup ease-clickup shadow-tinted-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-[16/9] sm:aspect-[2/1] rounded-lg border-2 border-dashed border-hairline-strong hover:border-primary bg-surface/40 hover:bg-surface cursor-pointer transition-all duration-clickup ease-clickup p-6 text-center group">
                <div className="w-11 h-11 rounded-full bg-surface-soft border border-hairline text-ink-secondary flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:text-primary transition-all duration-clickup ease-clickup">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-body-sm font-semibold text-ink">
                  คลิกเพื่ออัปโหลดรูปภาพสินค้า
                </span>
                <span className="text-[11px] font-mono text-ink-tertiary mt-1">
                  JPG, PNG, WEBP (MAX 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Product Title — design.md text-input: 44px, sm (9px) radius */}
          <div>
            <label className="eyebrow-mono block text-caption text-ink-secondary mb-1.5">
              ชื่อสินค้า / รุ่น / สภาพ <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น บอร์ด ESP32 พินครบ, หนังสือแคลคูลัส 1 มีจดโน้ต, Apple Pencil 2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full input-field"
            />
          </div>

          {/* Price */}
          <div>
            <label className="eyebrow-mono block text-caption text-ink-secondary mb-1.5">
              ราคา (บาท ฿) <span className="text-accent-red">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-ink-tertiary font-bold text-body-md">฿</span>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="เช่น 150"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full input-field pl-8"
              />
            </div>
            <p className="text-[11px] text-ink-tertiary mt-1">
              * ชำระเงินสดหรือโอนหน้างานโดยตรงระหว่างนักศึกษา (ไม่มีการหักเปอร์เซ็นต์)
            </p>
          </div>

          {/* Meetup Location */}
          <div>
            <label className="eyebrow-mono block text-caption text-ink-secondary mb-1.5">
              จุดนัดรับของภายใน มช. <span className="text-accent-red">*</span>
            </label>
            <div className="relative mb-2.5">
              <MapPin className="w-4 h-4 text-primary absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="ระบุจุดนัดรับ หรือเลือกจากจุดยอดนิยมด้านล่าง"
                value={meetupLocation}
                onChange={(e) => setMeetupLocation(e.target.value)}
                className="w-full input-field pl-10"
              />
            </div>

            {/* Location quick chips — sm (9px) radius per button-secondary */}
            <div className="flex flex-wrap gap-1.5">
              {popularLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setMeetupLocation(loc)}
                  className={`text-[11px] px-2.5 py-1 rounded-sm border transition-all duration-clickup ease-clickup ${
                    meetupLocation === loc
                      ? 'bg-ink text-canvas border-ink font-semibold'
                      : 'bg-surface text-ink-secondary border-hairline hover:border-hairline-strong hover:text-ink'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions — design.md button-primary (dark pill) vs button-secondary */}
          <div className="pt-5 border-t border-hairline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary-sm px-5 py-2.5 text-button-md"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-pill h-[48px] px-6 text-button-md flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>บันทึกและลงขายทันที</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
