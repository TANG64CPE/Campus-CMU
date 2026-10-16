import axios from 'axios';
import { User, Product, Reservation, SellerContact, AdminStats, AdminUserSummary, AdminUserDetail, ChatMessage, ChatThread, SupportMessage, AdminSupportConversation } from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send HTTP-Only cookies
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response.data?.isBanned === true) {
      window.dispatchEvent(new Event('campusmart:account-banned'));
    }
    return Promise.reject(error);
  }
);

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
  getChatThreads: async (): Promise<ChatThread[]> => {
    const res = await api.get<{ success: boolean; threads: ChatThread[] }>('/reservations/chats');
    return res.data.threads;
  },
  getMessages: async (reservationId: string): Promise<ChatMessage[]> => {
    const res = await api.get<{ success: boolean; messages: ChatMessage[] }>(`/reservations/${reservationId}/messages`);
    return res.data.messages;
  },
  sendMessage: async (reservationId: string, content: string): Promise<ChatMessage> => {
    const res = await api.post<{ success: boolean; message: ChatMessage }>(`/reservations/${reservationId}/messages`, { content });
    return res.data.message;
  },
  createReservation: async (
    productId: string,
    quantity: number = 1
  ): Promise<{ reservation: Reservation; sellerContact: SellerContact }> => {
    const res = await api.post<{
      success: boolean;
      reservation: Reservation;
      sellerContact: SellerContact;
    }>('/reservations', { productId, quantity });
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

export const supportApi = {
  getMyMessages: async (): Promise<SupportMessage[]> => {
    const res = await api.get<{ success: boolean; messages: SupportMessage[] }>('/support/messages');
    return res.data.messages;
  },
  sendMessage: async (content: string): Promise<SupportMessage> => {
    const res = await api.post<{ success: boolean; message: SupportMessage }>('/support/messages', { content });
    return res.data.message;
  },
  getConversations: async (resolved = false): Promise<AdminSupportConversation[]> => {
    const res = await api.get<{ success: boolean; conversations: AdminSupportConversation[] }>('/admin/support', {
      params: { resolved },
    });
    return res.data.conversations;
  },
  getConversationMessages: async (userId: string): Promise<SupportMessage[]> => {
    const res = await api.get<{ success: boolean; messages: SupportMessage[] }>(`/admin/support/${userId}/messages`);
    return res.data.messages;
  },
  sendAdminMessage: async (userId: string, content: string): Promise<SupportMessage> => {
    const res = await api.post<{ success: boolean; message: SupportMessage }>(`/admin/support/${userId}/messages`, { content });
    return res.data.message;
  },
  setConversationResolved: async (userId: string, isResolved: boolean): Promise<void> => {
    await api.patch(`/admin/support/${userId}/status`, { isResolved });
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
  updateProfile: async (data: {
    studentId: string;
    phone: string;
    lineId?: string;
    facebook?: string;
    instagram?: string;
    meetingNote?: string;
  }): Promise<User> => {
    const res = await api.patch<{ success: boolean; user: User }>('/users/profile', data);
    return res.data.user;
  },
  uploadAvatar: async (image: File): Promise<User> => {
    const formData = new FormData();
    formData.append('image', image);
    const res = await api.patch<{ success: boolean; user: User }>('/users/profile/avatar', formData);
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
