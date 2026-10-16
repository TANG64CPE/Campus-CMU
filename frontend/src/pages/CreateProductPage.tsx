import React, { useEffect, useRef, useState } from 'react';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isAdminRole, isContactComplete } from '../types';
import { MAX_PRODUCT_IMAGE_BYTES, MAX_PRODUCT_IMAGES } from '../utils/productImages';
import { PRODUCT_CATEGORIES, type ProductCategory } from '../utils/productCategories';
import { ScrollReveal } from '../components/ScrollReveal';
import {
  MapPin,
  Tag,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Camera,
  X,
  Sparkles,
  ImagePlus,
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
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [meetupLocation, setMeetupLocation] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imagePreviewsRef = useRef(imagePreviews);
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

  useEffect(() => () => imagePreviewsRef.current.forEach(URL.revokeObjectURL), []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = '';
    if (!selectedFiles.length) return;

    const availableSlots = MAX_PRODUCT_IMAGES - imageFiles.length;
    const validFiles = selectedFiles.filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isAllowedSize = file.size <= MAX_PRODUCT_IMAGE_BYTES;
      return isImage && isAllowedSize;
    });

    if (validFiles.length !== selectedFiles.length) {
      setErrorMsg('กรุณาเลือกไฟล์รูป JPG, PNG, WEBP หรือ GIF ขนาดไม่เกิน 5MB ต่อรูป');
    } else if (validFiles.length > availableSlots) {
      setErrorMsg(`อัปโหลดรูปได้สูงสุด ${MAX_PRODUCT_IMAGES} รูป (เพิ่มได้อีก ${availableSlots} รูป)`);
    } else {
      setErrorMsg(null);
    }

    const filesToAdd = validFiles.slice(0, Math.max(availableSlots, 0));
    if (!filesToAdd.length) return;

    setImageFiles((current) => [...current, ...filesToAdd]);
    setImagePreviews((current) => {
      const next = [...current, ...filesToAdd.map((file) => URL.createObjectURL(file))];
      imagePreviewsRef.current = next;
      return next;
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setImagePreviews((current) => {
      URL.revokeObjectURL(current[index]);
      const next = current.filter((_, previewIndex) => previewIndex !== index);
      imagePreviewsRef.current = next;
      return next;
    });
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
    if (!/^\d+$/.test(quantity) || Number(quantity) < 1 || Number(quantity) > 10000) {
      setErrorMsg('กรุณาระบุจำนวนสินค้าเป็นจำนวนเต็มตั้งแต่ 1 ถึง 10,000 ชิ้น');
      return;
    }
    if (!category) {
      setErrorMsg('กรุณาเลือกหมวดหมู่สินค้า');
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
      formData.append('quantity', quantity);
      formData.append('category', category);
      formData.append('meetupLocation', meetupLocation.trim());
      imageFiles.forEach((file) => formData.append('images', file));

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
      <ScrollReveal>
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
          <fieldset>
            <legend className="eyebrow-mono block text-caption text-ink-secondary mb-2">
              หมวดหมู่สินค้า <span className="text-accent-red">*</span>
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRODUCT_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                  className={`rounded-lg border px-3 py-2.5 text-body-sm transition-all duration-clickup ease-clickup ${
                    category === item.id
                      ? 'border-ink bg-ink text-white font-semibold'
                      : 'border-hairline bg-surface text-ink-secondary hover:border-hairline-strong hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Image Upload Box */}
          <div>
            <label className="eyebrow-mono block text-caption text-ink-secondary mb-2">
              รูปภาพสินค้า
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={preview} className="relative aspect-[4/3] rounded-lg bg-surface overflow-hidden border border-hairline">
                  <img src={preview} alt={`รูปสินค้า ${index + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-ink/75 px-2 py-0.5 text-[10px] text-white">
                    {index + 1}/{MAX_PRODUCT_IMAGES}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`ลบรูปที่ ${index + 1}`}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-ink/80 text-canvas hover:bg-ink shadow-tinted-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {imageFiles.length < MAX_PRODUCT_IMAGES && (
              <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-lg border-2 border-dashed border-hairline-strong hover:border-primary bg-surface/40 hover:bg-surface cursor-pointer transition-all duration-clickup ease-clickup p-5 text-center group">
                <div className="w-11 h-11 rounded-full bg-surface-soft border border-hairline text-ink-secondary flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:text-primary transition-all duration-clickup ease-clickup">
                  {imageFiles.length ? <ImagePlus className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                </div>
                <span className="text-body-sm font-semibold text-ink">
                  {imageFiles.length ? 'เพิ่มรูปภาพ' : 'คลิกเพื่ออัปโหลดรูปภาพสินค้า'}
                </span>
                <span className="text-[11px] font-mono text-ink-tertiary mt-1">
                  JPG, PNG, WEBP (สูงสุดรูปละ 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              )}
            </div>
            <p className="text-[11px] text-ink-tertiary mt-2">
              เลือกได้สูงสุด {MAX_PRODUCT_IMAGES} รูป · {imageFiles.length}/{MAX_PRODUCT_IMAGES} รูป
            </p>
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

          <div>
            <label htmlFor="product-quantity" className="eyebrow-mono block text-caption text-ink-secondary mb-1.5">
              จำนวนสินค้า (ชิ้น) <span className="text-accent-red">*</span>
            </label>
            <input
              id="product-quantity"
              type="number"
              required
              min="1"
              max="10000"
              step="1"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full input-field"
            />
            <p className="text-[11px] text-ink-tertiary mt-1">ใส่จำนวนสินค้าที่รวมอยู่ในรายการขายนี้</p>
          </div>

          {/* Meetup Location */}
          <div>
            <label className="eyebrow-mono block text-caption text-ink-secondary mb-1.5">
              จุดนัดรับของภายใน มช. <span className="text-accent-red">*</span>
            </label>
            <div className="relative mb-2.5">
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
          <div className="pt-5 border-t border-hairline flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary-sm h-12 w-full px-5 py-0 text-button-md sm:w-56"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-pill h-12 w-full px-5 py-0 text-button-md flex items-center justify-center gap-2 disabled:opacity-50 sm:w-56"
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
      </ScrollReveal>
    </div>
  );
};
