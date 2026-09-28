import axios from 'axios';
import { User, Product, Reservation, SellerContact, AdminStats, AdminUserSummary, AdminUserDetail } from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send HTTP-Only cookies
});

export const authApi = {
  getMe: async (): Promise<User | null> => {
    try {
      const res = await api.get<{ success: boolean; user: User }>('/auth/me');
      return res.data.user;
    } catch {
      return null;
    }
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  mockLogin: async (data: { studentId?: string; name?: string; email?: string; role?: string }): Promise<User> => {
    const res = await api.post<{ success: boolean; user: User }>('/auth/mock-login', data);
    return res.data.user;
  },
};

export const productApi = {
  getProducts: async (params?: { search?: string; available?: string }): Promise<Product[]> => {
    const res = await api.get<{ success: boolean; products: Product[] }>('/products', { params });
    return res.data.products;
  },
  getProductById: async (
    id: string
  ): Promise<{
    product: Product;
    isUserSeller: boolean;
    isUserBuyer: boolean;
    activeReservation: Reservation | null;
  }> => {
    const res = await api.get<{
      success: boolean;
      product: Product & {
        isUserSeller: boolean;
        isUserBuyer: boolean;
        activeReservation: Reservation | null;
      };
    }>(`/products/${id}`);
    return {
      product: res.data.product,
      isUserSeller: res.data.product.isUserSeller,
      isUserBuyer: res.data.product.isUserBuyer,
      activeReservation: res.data.product.activeReservation,
    };
  },
  createProduct: async (formData: FormData): Promise<Product> => {
    const res = await api.post<{ success: boolean; product: Product }>('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.product;
  },
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

export const reservationApi = {
  createReservation: async (
    productId: string
  ): Promise<{ reservation: Reservation; sellerContact: SellerContact }> => {
    const res = await api.post<{
      success: boolean;
      reservation: Reservation;
      sellerContact: SellerContact;
    }>('/reservations', { productId });
    return {
      reservation: res.data.reservation,
      sellerContact: res.data.sellerContact,
    };
  },
  cancelReservation: async (id: string): Promise<void> => {
    await api.post(`/reservations/${id}/cancel`);
  },
  completeReservation: async (id: string): Promise<void> => {
    await api.post(`/reservations/${id}/complete`);
  },
  reportGhost: async (id: string): Promise<string> => {
    const res = await api.post<{ success: boolean; message: string }>(`/reservations/${id}/report-ghost`);
    return res.data.message;
  },
  getMyReservations: async (): Promise<Reservation[]> => {
    const res = await api.get<{ success: boolean; reservations: Reservation[] }>('/reservations/my');
    return res.data.reservations;
  },
  getSellerReservations: async (): Promise<Reservation[]> => {
    const res = await api.get<{ success: boolean; reservations: Reservation[] }>('/reservations/seller');
    return res.data.reservations;
  },
};

export const userApi = {
  getProfile: async (): Promise<User & { products: Product[]; reservations: Reservation[] }> => {
    const res = await api.get<{
      success: boolean;
      user: User & { products: Product[]; reservations: Reservation[] };
    }>('/users/profile');
    return res.data.user;
  },
  updateProfile: async (contactInfo: string): Promise<User> => {
    const res = await api.patch<{ success: boolean; user: User }>('/users/profile', { contactInfo });
    return res.data.user;
  },
  getMyProducts: async (): Promise<Product[]> => {
    const res = await api.get<{ success: boolean; products: Product[] }>('/users/my-products');
    return res.data.products;
  },
  toggleProductStatus: async (productId: string): Promise<Product> => {
    const res = await api.patch<{ success: boolean; product: Product }>(
      `/users/products/${productId}/toggle-status`
    );
    return res.data.product;
  },
};

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await api.get<{ success: boolean; stats: AdminStats }>('/admin/stats');
    return res.data.stats;
  },
  getUsers: async (params?: {
    search?: string;
    role?: string;
    status?: string;
    side?: string;
  }): Promise<AdminUserSummary[]> => {
    const res = await api.get<{ success: boolean; users: AdminUserSummary[] }>('/admin/users', { params });
    return res.data.users;
  },
  getUserDetail: async (id: string): Promise<AdminUserDetail> => {
    const res = await api.get<{ success: boolean } & AdminUserDetail>(`/admin/users/${id}`);
    return {
      user: res.data.user,
      sellerSide: res.data.sellerSide,
      buyerSide: res.data.buyerSide,
    };
  },
  toggleBan: async (id: string, isBanned?: boolean): Promise<{ success: boolean; message: string; user: User }> => {
    const res = await api.patch<{ success: boolean; message: string; user: User }>(`/admin/users/${id}/ban`, {
      isBanned,
    });
    return res.data;
  },
  updateRole: async (id: string, role: 'STUDENT' | 'ADMIN'): Promise<{ success: boolean; message: string; user: User }> => {
    const res = await api.patch<{ success: boolean; message: string; user: User }>(`/admin/users/${id}/role`, {
      role,
    });
    return res.data;
  },
};

export default api;
