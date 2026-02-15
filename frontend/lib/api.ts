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

export const deliverShipment = async (id: string): Promise<Shipment> => {
    await api.post<Shipment>(`/shipments/${id}/deliver`);
    // Re-fetch to ensure fresh data
    return fetchShipment(id);
};

export default api;
