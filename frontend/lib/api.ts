import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

// Shipment Interface
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
    // Green Supply Chain
    carbon_emission?: number;
    is_green_certified?: boolean;
    transport_mode?: string;
    escrow_id?: string;
}

// --- Tenant API ---
export const registerTenant = async (data: TenantCreate): Promise<TenantResponse> => {
    const response = await api.post<TenantResponse>('/tenants/', data);
    return response.data;
};

export const createTenant = registerTenant;

export const fetchCurrentTenant = async (): Promise<TenantResponse> => {
    const response = await api.get<TenantResponse>('/tenants/me');
    return response.data;
};

// --- Shipment API ---
export const fetchShipments = async (): Promise<Shipment[]> => {
    const response = await api.get<Shipment[]>('/shipments/');
    return response.data;
};

export const fetchShipment = async (id: string): Promise<Shipment> => {
    const response = await api.get<Shipment>(`/shipments/${id}`);
    return response.data;
};

export const fetchShipmentByTracking = async (trackingNumber: string): Promise<Shipment> => {
    const response = await api.get<Shipment>(`/shipments/tracking/${trackingNumber}`);
    return response.data;
};

export const deliverShipment = async (id: string): Promise<Shipment> => {
    await api.post<Shipment>(`/shipments/${id}/deliver`);
    // Re-fetch to ensure fresh data
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
    const response = await api.post<EscrowResponse>('/escrows/', data);
    return response.data;
};

export const fetchEscrow = async (id: string): Promise<EscrowResponse> => {
    const response = await api.get<EscrowResponse>(`/escrows/${id}`);
    return response.data;
};

export const fetchEscrowByShipment = async (shipmentId: string): Promise<EscrowResponse> => {
    const response = await api.get<EscrowResponse>(`/escrows/shipment/${shipmentId}`);
    return response.data;
};

export const syncEscrow = async (id: string): Promise<EscrowResponse> => {
    const response = await api.post<EscrowResponse>(`/escrows/${id}/sync`);
    return response.data;
};

export const simulatePayment = async (id: string): Promise<EscrowResponse> => {
    const response = await api.post<EscrowResponse>(`/escrows/${id}/simulate_payment`);
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
    const response = await api.get<AnalyticsSummary>('/analytics/summary', { params });
    return response.data;
};

export const fetchAnalyticsVolume = async (params?: AnalyticsParams): Promise<VolumeDataPoint[]> => {
    const response = await api.get<VolumeDataPoint[]>('/analytics/volume', { params });
    return response.data;
};

export const fetchStatusDistribution = async (params?: AnalyticsParams): Promise<StatusDistribution[]> => {
    const response = await api.get<StatusDistribution[]>('/analytics/status-distribution', { params });
    return response.data;
};

export const fetchRoutePerformance = async (params?: AnalyticsParams): Promise<RoutePerformance[]> => {
    const response = await api.get<RoutePerformance[]>('/analytics/route-performance', { params });
    return response.data;
};

export const fetchEscrowAnalyticsSummary = async (params?: AnalyticsParams): Promise<EscrowAnalyticsSummary> => {
    const response = await api.get<EscrowAnalyticsSummary>('/analytics/escrow-summary', { params });
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
    const response = await api.get<User[]>('/users/');
    return response.data;
};

export const inviteUser = async (data: UserInvite): Promise<User> => {
    const response = await api.post<User>('/users/invite', data);
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
    const response = await api.post<RateSubscription>('/rates/subscribe', data);
    return response.data;
};

export default api;
