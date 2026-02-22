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
    pod_status?: string | null;
    pod_timestamp?: string | null;
    pod_receiver_name?: string | null;
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

// --- Market Intelligence API ---

export interface MarketIndex {
    index_code: string;
    index_name: string;
    value: number;
    change_pct: number;
    recorded_at: string;
    sparkline: number[];
}

export interface IndexHistoryPoint {
    date: string;
    value: number;
    change_pct: number;
}

export interface IndexHistoryResponse {
    index_code: string;
    index_name: string;
    period: string;
    data: IndexHistoryPoint[];
}

export interface RouteRateData {
    origin: string;
    destination: string;
    mode: string;
    carrier: string | null;
    container_type: string | null;
    rate_usd: number;
    transit_days_min: number | null;
    transit_days_max: number | null;
    valid_from: string;
    valid_to: string | null;
}

export interface RatesResponse {
    rates: RouteRateData[];
    total: number;
    origin: string | null;
    destination: string | null;
    mode: string | null;
}

export interface RouteCompareItem {
    origin: string;
    destination: string;
    avg_rate_usd: number;
    min_rate_usd: number;
    max_rate_usd: number;
    carrier_count: number;
    latest_valid_from: string | null;
}

export interface TrendDataPoint {
    date: string;
    avg_rate: number;
    volume: number;
}

export interface TrendSummary {
    trend_direction: string;
    period_change_pct: number;
    avg_rate: number;
    total_data_points: number;
}

export interface TrendsResponse {
    period: string;
    mode: string | null;
    data: TrendDataPoint[];
    summary: TrendSummary;
}

export interface InsightData {
    type: string;
    title: string;
    description: string;
    severity: string;
    data: Record<string, unknown>;
}

export interface InsightsResponse {
    insights: InsightData[];
    generated_at: string;
}

export const fetchMarketIndices = async (): Promise<{ indices: MarketIndex[] }> => {
    const response = await api.get<{ indices: MarketIndex[] }>('/v1/market/indices');
    return response.data;
};

export const fetchIndexHistory = async (code: string, period: string = '30d'): Promise<IndexHistoryResponse> => {
    const response = await api.get<IndexHistoryResponse>(`/v1/market/indices/${code}/history?period=${period}`);
    return response.data;
};

export const fetchRouteRates = async (params: {
    origin?: string;
    destination?: string;
    mode?: string;
}): Promise<RatesResponse> => {
    const response = await api.get<RatesResponse>('/v1/market/rates', { params });
    return response.data;
};

export const fetchRatesCompare = async (routes: string, mode?: string): Promise<{ routes: RouteCompareItem[]; mode: string | null }> => {
    const response = await api.get<{ routes: RouteCompareItem[]; mode: string | null }>('/v1/market/rates/compare', {
        params: { routes, mode },
    });
    return response.data;
};

export const fetchMarketTrends = async (params: {
    period?: string;
    mode?: string;
    origin?: string;
}): Promise<TrendsResponse> => {
    const response = await api.get<TrendsResponse>('/v1/market/trends', { params });
    return response.data;
};

export const fetchMarketInsights = async (): Promise<InsightsResponse> => {
    const response = await api.get<InsightsResponse>('/v1/market/insight');
    return response.data;
};

// --- Rate Subscription API ---

export interface RateSubscription {
    id: string;
    origin: string;
    destination: string;
    target_price?: number;
    alert_frequency: string;
    mode: string;
    is_active: boolean;
    created_at: string;
}

export interface RateSubscriptionCreate {
    origin: string;
    destination: string;
    target_price?: number;
    alert_frequency: string;
    mode: string;
}

export const createRateSubscription = async (data: RateSubscriptionCreate): Promise<RateSubscription> => {
    const response = await api.post<RateSubscription>('/v1/rates/subscribe', data);
    return response.data;
};

// --- Billing API ---

export interface PlanLimits {
    shipments_per_month: number;
    users: number;
    escrows: number;
    api_rate_limit: number;
}

export interface PlanFeatures {
    analytics: string;
    whitelabel: boolean;
    email_support: boolean;
    webhook_notifications: boolean;
}

export interface Plan {
    tier: string;
    name: string;
    price_monthly: number;
    price_id: string | null;
    limits: PlanLimits;
    features: PlanFeatures;
}

export interface UsageItem {
    used: number;
    limit: number;
    percentage: number;
}

export interface SubscriptionInfo {
    tenant_id: string;
    plan_tier: string;
    subscription_status: string;
    billing_period_start: string | null;
    billing_period_end: string | null;
    usage: {
        shipments: { used: number; limit: number };
        users: { used: number; limit: number };
        escrows: { used: number; limit: number };
    };
    stripe_subscription_id: string | null;
}

export interface Invoice {
    id: string;
    amount_due: number;
    amount_paid: number;
    currency: string;
    status: string | null;
    invoice_url: string | null;
    invoice_pdf: string | null;
    period_start: string | null;
    period_end: string | null;
    created: string | null;
}

export const fetchPlans = async (): Promise<{ plans: Plan[] }> => {
    const response = await api.get<{ plans: Plan[] }>('/v1/billing/plans');
    return response.data;
};

export const fetchSubscription = async (): Promise<SubscriptionInfo> => {
    const response = await api.get<SubscriptionInfo>('/v1/billing/subscription');
    return response.data;
};

export const createCheckoutSession = async (priceId: string): Promise<{ checkout_url: string; session_id: string }> => {
    const response = await api.post<{ checkout_url: string; session_id: string }>('/v1/billing/checkout', { price_id: priceId });
    return response.data;
};

export const createPortalSession = async (returnUrl: string = '/billing'): Promise<{ portal_url: string }> => {
    const response = await api.post<{ portal_url: string }>('/v1/billing/portal', { return_url: returnUrl });
    return response.data;
};

export const fetchInvoices = async (limit = 10): Promise<{ invoices: Invoice[]; has_more: boolean }> => {
    const response = await api.get<{ invoices: Invoice[]; has_more: boolean }>(`/v1/billing/invoices?limit=${limit}`);
    return response.data;
};

export const fetchUsage = async (): Promise<{
    period_start: string | null;
    period_end: string | null;
    shipments: UsageItem;
    users: UsageItem;
    escrows: UsageItem;
    api_calls: UsageItem;
}> => {
    const response = await api.get('/v1/billing/usage');
    return response.data;
};

// --- POD API ---

export interface PODUploadResponse {
    message: string;
    status: string;
    pod_status: string;
    tracking_number: string;
    pod_timestamp: string;
    photo_count: number;
}

export interface PODDetail {
    tracking_number: string;
    pod_status: string | null;
    pod_signature: string | null;
    pod_photos: string[] | null;
    pod_location: { lat: number; lng: number; accuracy?: number } | null;
    pod_timestamp: string | null;
    pod_receiver_name: string | null;
    pod_receiver_contact: string | null;
    pod_notes: string | null;
    pod_verified_at: string | null;
    pod_verified_by: string | null;
    shipment_origin: string;
    shipment_destination: string;
    current_status: string;
}

export interface PODListItem {
    tracking_number: string;
    origin: string;
    destination: string;
    pod_status: string | null;
    pod_timestamp: string | null;
    pod_receiver_name: string | null;
    photo_count: number;
    current_status: string;
}

export interface PODVerifyRequest {
    action: 'verify' | 'dispute';
    notes?: string;
}

export const uploadPOD = async (
    trackingNumber: string,
    formData: FormData
): Promise<PODUploadResponse> => {
    const response = await api.post<PODUploadResponse>(
        `/v1/shipments/${trackingNumber}/pod`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

export const fetchPOD = async (trackingNumber: string): Promise<PODDetail> => {
    const response = await api.get<PODDetail>(`/v1/shipments/${trackingNumber}/pod`);
    return response.data;
};

export const verifyPOD = async (
    trackingNumber: string,
    data: PODVerifyRequest
): Promise<{ tracking_number: string; pod_status: string }> => {
    const response = await api.post(`/v1/shipments/${trackingNumber}/pod/verify`, data);
    return response.data;
};

export const fetchPODList = async (
    params?: { status?: string; page?: number; limit?: number }
): Promise<{ items: PODListItem[]; total: number; page: number; limit: number }> => {
    const response = await api.get('/v1/shipments/pods/list', { params });
    return response.data;
};

export interface PODReceipt {
    tracking_number: string;
    origin: string;
    destination: string;
    pod_status: string | null;
    pod_timestamp: string | null;
    pod_receiver_name: string | null;
    pod_location: { lat: number; lng: number; accuracy?: number } | null;
    photo_count: number;
    verified: boolean;
    verified_at: string | null;
}

export const fetchPODReceipt = async (trackingNumber: string): Promise<PODReceipt> => {
    const response = await api.get<PODReceipt>(`/v1/shipments/${trackingNumber}/pod/receipt`);
    return response.data;
};

export default api;
