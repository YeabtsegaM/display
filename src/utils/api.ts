const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Cartela {
  id: string;
  cartelaId: number;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getCartelas(sessionId?: string): Promise<ApiResponse<Cartela[]>> {
    const endpoint = sessionId 
      ? `/display/cartelas?sessionId=${sessionId}`
      : `/display/cartelas`;
    
    return this.request<Cartela[]>(endpoint);
  }

  async getPlacedBetCartelas(sessionId?: string): Promise<ApiResponse<number[]>> {
    const endpoint = sessionId 
      ? `/display/placed-cartelas?sessionId=${sessionId}`
      : '/display/placed-cartelas';
    
    return this.request<number[]>(endpoint);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
