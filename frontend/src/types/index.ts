export interface User {
  id: string;
  studentId: string;
  email: string;
  name: string;
  contactInfo: string | null;
  isBanned: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  meetupLocation: string;
  isAvailable: boolean;
  sellerId: string;
  seller: {
    id: string;
    name: string;
    studentId: string;
    contactInfo?: string | null;
    email?: string;
  };
  createdAt: string;
  reservations?: Reservation[];
}

export interface Reservation {
  id: string;
  productId: string;
  product: Product;
  buyerId: string;
  buyer?: User;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface SellerContact {
  name: string;
  studentId: string;
  email: string;
  contactInfo: string;
  meetupLocation: string;
}
