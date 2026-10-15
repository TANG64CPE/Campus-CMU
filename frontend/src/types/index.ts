import type { ProductCategory } from '../utils/productCategories';

export interface User {
  id: string;
  studentId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
  lineId?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  meetingNote?: string | null;
  contactInfo: string | null;
  hasCompletedContact?: boolean;
  role?: UserRole;
  isBanned: boolean;
  createdAt: string;
}

export type UserRole = 'STUDENT' | 'ADMIN' | 'ADMIN1' | 'ADMIN2' | 'ADMIN3';

export const isAdminRole = (role?: string | null): boolean =>
  role === 'ADMIN' || role === 'ADMIN1' || role === 'ADMIN2' || role === 'ADMIN3';

export function isValidThaiMobileNumber(phone?: string | null): boolean {
  const normalizedPhone = phone?.trim().replace(/[-\s]/g, '');
  return Boolean(
    normalizedPhone &&
    /^0[689]\d{8}$/.test(normalizedPhone) &&
    !/^([0-9])\1{9}$/.test(normalizedPhone)
  );
}

export function isContactComplete(user?: User | null): boolean {
  if (!user) return false;
  const phone = user.phone?.trim();
  const lineId = user.lineId?.trim();
  const facebook = user.facebook?.trim();
  const instagram = user.instagram?.trim();
  return Boolean(isValidThaiMobileNumber(phone) && (lineId || facebook || instagram));
}

export interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  imageUrls?: string[];
  category?: ProductCategory | null;
  meetupLocation: string;
  isAvailable: boolean;
  sellerId: string;
  seller: {
    id: string;
    name: string;
    studentId: string;
    avatarUrl?: string | null;
    email?: string;
    phone?: string | null;
    lineId?: string | null;
    facebook?: string | null;
    instagram?: string | null;
    meetingNote?: string | null;
    contactInfo?: string | null;
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

export interface ChatMessage {
  id: string;
  reservationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export interface ChatThread {
  id: string;
  product: Pick<Product, 'id' | 'title' | 'imageUrl'>;
  otherParticipant: Pick<User, 'id' | 'name'>;
  latestMessage: ChatMessage | null;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export interface AdminSupportConversation {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'studentId' | 'avatarUrl' | 'isBanned'>;
  latestMessage: SupportMessage | null;
  updatedAt: string;
  isResolved: boolean;
}

export interface SellerContact {
  name: string;
  studentId: string;
  email: string;
  phone?: string | null;
  lineId?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  meetingNote?: string | null;
  contactInfo: string;
  meetupLocation: string;
}

export interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  totalBanned: number;
  totalProducts: number;
  totalReservations: number;
  completedDeals: number;
}

export interface AdminUserSummary {
  id: string;
  studentId: string;
  name: string;
  avatarUrl?: string | null;
  email: string;
  contactInfo: string | null;
  role: UserRole;
  isBanned: boolean;
  createdAt: string;
  sellerStats: {
    totalProducts: number;
    availableProducts: number;
    reservedOrSoldProducts: number;
  };
  buyerStats: {
    totalReservations: number;
    pendingReservations: number;
    completedReservations: number;
  };
}

export interface AdminUserDetail {
  user: User;
  sellerSide: {
    stats: {
      totalListed: number;
      activeListed: number;
      reservedOrCompleted: number;
      totalEstimatedSalesValue: number;
    };
    products: Array<{
      id: string;
      title: string;
      price: number;
      imageUrl: string | null;
      imageUrls?: string[];
      meetupLocation: string;
      isAvailable: boolean;
      createdAt: string;
      reservations: Array<{
        id: string;
        status: string;
        createdAt: string;
        buyer: {
          id: string;
          studentId: string;
          name: string;
          email: string;
          contactInfo: string | null;
        };
      }>;
    }>;
  };
  buyerSide: {
    stats: {
      totalReserved: number;
      pendingReservations: number;
      completedReservations: number;
      cancelledReservations: number;
      totalSpent: number;
    };
    reservations: Array<{
      id: string;
      status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      createdAt: string;
      product: {
        id: string;
        title: string;
        price: number;
        imageUrl: string | null;
        imageUrls?: string[];
        meetupLocation: string;
        isAvailable: boolean;
        seller: {
          id: string;
          studentId: string;
          name: string;
          email: string;
          contactInfo: string | null;
        };
      };
    }>;
  };
}
