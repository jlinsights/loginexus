import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Auth Token Management ---

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
    if (token) {
        localStorage.setItem('access_token', token);
    } else {
        localStorage.removeItem('access_token');
    }
};

export const getAccessToken = (): string | null => {
    if (accessToken) return accessToken;
    if (typeof window !== 'undefined') {
        accessToken = localStorage.getItem('access_token');
    }
    return accessToken;
};

// Request interceptor: attach token
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            setAccessToken(null);
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// --- Auth API ---

export interface LoginRequest {
    username: string; // email
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    const response = await api.post<LoginResponse>('/v1/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    setAccessToken(response.data.access_token);
    return response.data;
};

export const logout = () => {
    setAccessToken(null);
};

export const fetchMe = async (): Promise<User> => {
    const response = await api.get<User>('/v1/auth/me');
    return response.data;
};

// --- Interfaces ---

export interface TenantCreate {
    name: string;
    subdomain: string;
    logo_url?: string;
    primary_color?: string;
}

export interface TenantResponse extends TenantCreate {
    id: string;
    created_at: string;
}

export interface Shipment {
    id: string;
    tracking_number: string;
    origin: string;
    destination: string;
    current_status: string;
    blockchain_status: string;
    latitude: number | null;
    longitude: number | null;
    eta: string | null;
    tenant_id: string;
    carbon_emission?: number;
    is_green_certified?: boolean;
    transport_mode?: string;
    escrow_id?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    skip: number;
    limit: number;
}

// --- Tenant API ---
export const registerTenant = async (data: TenantCreate): Promise<TenantResponse> => {
    const response = await api.post<TenantResponse>('/v1/tenants/', data);
    return response.data;
};

export const createTenant = registerTenant;

export const fetchCurrentTenant = async (): Promise<TenantResponse> => {
    const response = await api.get<TenantResponse>('/v1/tenants/me');
    return response.data;
};

// --- Shipment API ---
export const fetchShipments = async (skip = 0, limit = 50): Promise<PaginatedResponse<Shipment>> => {
    const response = await api.get<PaginatedResponse<Shipment>>('/v1/shipments/', {
        params: { skip, limit },
    });
    return response.data;
};

export const fetchShipment = async (id: string): Promise<Shipment> => {
    const response = await api.get<Shipment>(`/v1/shipments/${id}`);
    return response.data;
};

export const fetchShipmentByTracking = async (trackingNumber: string): Promise<Shipment> => {
    const response = await api.get<Shipment>(`/v1/shipments/tracking/${trackingNumber}`);
    return response.data;
};

export const deliverShipment = async (id: string): Promise<Shipment> => {
    await api.post<Shipment>(`/v1/shipments/${id}/deliver`);
    return fetchShipment(id);
};

// --- Escrow API ---

export interface EscrowResponse {
    id: string;
    shipment_id: string;
    escrow_contract_address: string | null;
    buyer_wallet_address: string;
    seller_wallet_address: string;
    amount_usdc: number;
    status: string;
    chain_id: number | null;
    is_locked: boolean;
    tx_hash_deposit: string | null;
    tx_hash_release: string | null;
    tx_hash_dispute: string | null;
    tx_hash_refund: string | null;
    funded_at: string | null;
    resolved_at: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface EscrowCreate {
    shipment_id: string;
    buyer_wallet_address: string;
    seller_wallet_address: string;
    amount_usdc: number;
    escrow_contract_address: string;
    chain_id?: number;
}

export const createEscrow = async (data: EscrowCreate): Promise<EscrowResponse> => {
    const response = await api.post<EscrowResponse>('/v1/escrows/', data);
    return response.data;
};

export const fetchEscrow = async (id: string): Promise<EscrowResponse> => {
    const response = await api.get<EscrowResponse>(`/v1/escrows/${id}`);
    return response.data;
};

export const fetchEscrowByShipment = async (shipmentId: string): Promise<EscrowResponse> => {
    const response = await api.get<EscrowResponse>(`/v1/escrows/shipment/${shipmentId}`);
    return response.data;
};

export const syncEscrow = async (id: string): Promise<EscrowResponse> => {
    const response = await api.post<EscrowResponse>(`/v1/escrows/${id}/sync`);
    return response.data;
};

export const simulatePayment = async (id: string): Promise<EscrowResponse> => {
    const response = await api.post<EscrowResponse>(`/v1/escrows/${id}/simulate_payment`);
    return response.data;
};

// --- Analytics API ---

export interface AnalyticsSummary {
    total_shipments: number;
    in_transit: number;
    delivered: number;
    booked: number;
    on_time_rate: number;
    avg_transit_days: number;
}

export interface VolumeDataPoint {
    date: string;
    count: number;
    status_booked: number;
    status_in_transit: number;
    status_delivered: number;
}

export interface StatusDistribution {
    status: string;
    count: number;
    percentage: number;
}

export interface RoutePerformance {
    origin: string;
    destination: string;
    shipment_count: number;
    avg_transit_days: number;
    on_time_rate: number;
}

export interface EscrowStatusBreakdown {
    status: string;
    count: number;
    volume_usdc: number;
}

export interface EscrowAnalyticsSummary {
    total_volume_usdc: number;
    escrow_count: number;
    status_breakdown: EscrowStatusBreakdown[];
}

interface AnalyticsParams {
    start_date?: string;
    end_date?: string;
    granularity?: string;
}

export const fetchAnalyticsSummary = async (params?: AnalyticsParams): Promise<AnalyticsSummary> => {
    const response = await api.get<AnalyticsSummary>('/v1/analytics/summary', { params });
    return response.data;
};

export const fetchAnalyticsVolume = async (params?: AnalyticsParams): Promise<VolumeDataPoint[]> => {
    const response = await api.get<VolumeDataPoint[]>('/v1/analytics/volume', { params });
    return response.data;
};

export const fetchStatusDistribution = async (params?: AnalyticsParams): Promise<StatusDistribution[]> => {
    const response = await api.get<StatusDistribution[]>('/v1/analytics/status-distribution', { params });
    return response.data;
};

export const fetchRoutePerformance = async (params?: AnalyticsParams): Promise<RoutePerformance[]> => {
    const response = await api.get<RoutePerformance[]>('/v1/analytics/route-performance', { params });
    return response.data;
};

export const fetchEscrowAnalyticsSummary = async (params?: AnalyticsParams): Promise<EscrowAnalyticsSummary> => {
    const response = await api.get<EscrowAnalyticsSummary>('/v1/analytics/escrow-summary', { params });
    return response.data;
};

// --- User API ---

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

export interface UserInvite {
    email: string;
    full_name: string;
    role: string;
}

export const fetchUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>('/v1/users/');
    return response.data;
};

export const inviteUser = async (data: UserInvite): Promise<User> => {
    const response = await api.post<User>('/v1/users/invite', data);
    return response.data;
};

// --- Rate API ---

export interface RateSubscription {
    id: string;
    origin: string;
    destination: string;
    target_price?: number;
    alert_frequency: string;
    is_active: boolean;
    created_at: string;
}

export interface RateSubscriptionCreate {
    origin: string;
    destination: string;
    target_price?: number;
    alert_frequency: string;
}

export const createRateSubscription = async (data: RateSubscriptionCreate): Promise<RateSubscription> => {
    const response = await api.post<RateSubscription>('/v1/rates/subscribe', data);
    return response.data;
};

export default api;
