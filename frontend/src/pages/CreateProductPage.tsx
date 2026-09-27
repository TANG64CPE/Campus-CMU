import React, { useState } from 'react';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Upload,
  MapPin,
  Tag,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Camera,
  X,
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-cmu-600 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ยกเลิกและย้อนกลับ</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            ลงขายสินค้ามือสอง (CMU Campus)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ระบุรายละเอียดสินค้าและจุดนัดรับภายในมหาวิทยาลัยเชียงใหม่
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              รูปภาพสินค้า (จัดเก็บในเครื่อง Server)
            </label>

            {imagePreview ? (
              <div className="relative aspect-[16/9] sm:aspect-[2/1] rounded-2xl bg-slate-100 overflow-hidden border-2 border-dashed border-cmu-300">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-[16/9] sm:aspect-[2/1] rounded-2xl border-2 border-dashed border-slate-300 hover:border-cmu-500 bg-slate-50/50 hover:bg-purple-50/30 cursor-pointer transition-all p-6 text-center group">
                <div className="w-12 h-12 rounded-2xl bg-purple-100/70 text-cmu-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  คลิกเพื่ออัปโหลดรูปภาพสินค้า
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 5MB
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

          {/* Product Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ชื่อสินค้า / รุ่น / สภาพ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น บอร์ด ESP32 พินครบ, หนังสือแคลคูลัส 1 มีจดโน้ต, Apple Pencil 2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cmu-500 bg-slate-50/30"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ราคา (บาท ฿) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-400 font-bold text-sm">฿</span>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="เช่น 150"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cmu-500 bg-slate-50/30"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              * ชำระเงินสดหรือโอนหน้างานโดยตรงระหว่างนักศึกษา (ไม่มีหักเปอร์เซ็นต์)
            </p>
          </div>

          {/* Meetup Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              จุดนัดรับของภายใน มช. <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-2.5">
              <MapPin className="w-4 h-4 text-cmu-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="ระบุจุดนัดรับ หรือเลือกจากจุดยอดนิยมด้านล่าง"
                value={meetupLocation}
                onChange={(e) => setMeetupLocation(e.target.value)}
                className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cmu-500 bg-slate-50/30"
              />
            </div>

            {/* Location quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {popularLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setMeetupLocation(loc)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    meetupLocation === loc
                      ? 'bg-cmu-600 text-white border-cmu-600 font-medium'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-cmu-400'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cmu-600 to-cmu-700 hover:from-cmu-700 hover:to-cmu-800 text-white text-sm font-bold shadow-md shadow-cmu-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
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
