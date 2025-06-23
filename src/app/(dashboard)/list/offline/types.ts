export interface LocationPoint {
  address: string;
  latitude: number;
  longitude: number;
}

export interface OfflineDelivery {
  id: string;
  _id?: string; // API might return _id instead of id
  user_id: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    firstname?: string;
    lastname?: string;
  };
  rider_id: string;
  rider?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    vehicletype?: string;
    vehicle_type?: string; // Added both field options for compatibility
    firstname?: string;
    lastname?: string;
  };
  price: number;
  distance: string;
  startpoint: string | LocationPoint;
  endpoint: string | LocationPoint;
  vehicle_type: string;
  transaction_type: string;
  package_size: string;
  delivery_speed: string;
  completion_date: string;
  created_at: string;
  payment_status: string;
  payment_reference?: string;
  admin_notes?: string;
  status?: {
    current: string;
    timestamp: string;
  };
}

export interface OfflineDeliveryResponse {
  offline_deliveries?: OfflineDelivery[];
  deliveries?: OfflineDelivery[]; // Added to handle alternative API response format
  total: number;
  count: number;
  success: boolean;
  _staleData?: boolean;
  _error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
