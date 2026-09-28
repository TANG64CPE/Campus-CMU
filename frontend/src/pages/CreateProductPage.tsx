import React, { useState } from 'react';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
}

export const CreateProductPage: React.FC<CreateProductPageProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
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

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-8 py-6 pb-24">
      {/* Back button */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>ยกเลิกและย้อนกลับ</span>
      </button>

      {/* Main Form Container (ClickUp card-feature-panel: 25px/35px radius, 1px hairline) */}
      <div className="bg-canvas rounded-xl sm:rounded-xxl border border-hairline shadow-tinted-sm p-6 sm:p-8">
        <div className="mb-6 pb-4 border-b border-hairline">
          <div className="inline-block mb-1.5">
            <span className="eyebrow-mono bg-surface-soft text-ink-deep px-2 py-0.5 rounded-xxs border border-hairline text-[10px]">
              NEW LISTING • CMU CAMPUS
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl text-ink">
            ลงขายสินค้ามือสอง
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            ระบุรายละเอียดสินค้าและจุดนัดรับส่งมอบตัวต่อตัวในมหาวิทยาลัยเชียงใหม่
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-50/80 border border-accent-red/20 text-accent-red text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload Box */}
          <div>
            <label className="eyebrow-mono block text-xs text-ink-secondary mb-2">
              รูปภาพสินค้า
            </label>

            {imagePreview ? (
              <div className="relative aspect-[16/9] sm:aspect-[2/1] rounded-lg bg-surface overflow-hidden border border-hairline">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-ink/80 text-canvas hover:bg-ink transition-colors shadow-tinted-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-[16/9] sm:aspect-[2/1] rounded-lg border-2 border-dashed border-hairline-strong hover:border-primary bg-surface/40 hover:bg-surface cursor-pointer transition-all p-6 text-center group">
                <div className="w-11 h-11 rounded-full bg-surface-soft border border-hairline text-ink-secondary flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:text-primary transition-all">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-ink">
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

          {/* Product Title (ClickUp 44px text input) */}
          <div>
            <label className="eyebrow-mono block text-xs text-ink-secondary mb-1.5">
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
            <label className="eyebrow-mono block text-xs text-ink-secondary mb-1.5">
              ราคา (บาท ฿) <span className="text-accent-red">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-ink-tertiary font-bold text-sm">฿</span>
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
            <label className="eyebrow-mono block text-xs text-ink-secondary mb-1.5">
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

            {/* Location quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {popularLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setMeetupLocation(loc)}
                  className={`text-[11px] px-2.5 py-1 rounded-sm border transition-all ${
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

          {/* Submit Actions: ClickUp Dark Pill CTA vs Secondary */}
          <div className="pt-5 border-t border-hairline flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary-sm px-5 py-2.5 text-xs"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-pill h-[48px] px-6 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
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
