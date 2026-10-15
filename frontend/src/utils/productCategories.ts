export const PRODUCT_CATEGORIES = [
  {
    id: 'micro',
    label: 'ฮาร์ดแวร์ & IT',
    keyword: 'บอร์ด|ESP32|คีย์บอร์ด|Apple|IT|Pencil|จอ|สาย|RAM',
  },
  {
    id: 'books',
    label: 'หนังสือเรียน & เอกสาร',
    keyword: 'หนังสือ|แคลคูลัส|ฟิสิกส์|ชีท|ข้อสอบ|เคมี|Textbook',
  },
  {
    id: 'arch',
    label: 'เครื่องเขียน & สถาปัตย์',
    keyword: 'สถาปัตย์|กระดาน|ไม้ที|สี|โมเดล|Copic',
  },
  {
    id: 'dorm',
    label: 'ของใช้หอพัก',
    keyword: 'หอ|พัดลม|โคมไฟ|กล่อง|หม้อ|ตู้|ราว',
  },
  {
    id: 'other',
    label: 'อื่นๆ',
    keyword: null,
  },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]['id'];

export function inferProductCategory(title: string): ProductCategory {
  return PRODUCT_CATEGORIES.find(
    (category) => category.keyword && new RegExp(category.keyword, 'i').test(title)
  )?.id ?? 'other';
}
