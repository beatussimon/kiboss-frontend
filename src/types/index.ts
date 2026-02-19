// Common Types for KIBOSS Frontend

// ==================== Auth Types ====================
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_identity_verified: boolean;
  trust_score: string;
  total_ratings_count: number;
  is_blocked: boolean;
  verification_tier?: string;
  verification_badge?: {
    tier: string;
    color: string | null;
  };
  profile?: UserProfile;
  roles?: UserRole[];
}

export interface UserProfile {
  phone: string;
  avatar: string;
  bio: string;
  city: string;
  country: string;
  timezone: string;
}

export interface UserRole {
  role: string;
  scope_type: string;
  scope_id: string | null;
  expires_at: string | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  access_expires: number;
  refresh_expires: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ==================== Asset Types ====================
export type AssetType = 'ROOM' | 'TOOL' | 'VEHICLE' | 'SEAT_SERVICE' | 'TIME_SERVICE';

export interface Asset {
  id: string;
  name: string;
  asset_type: AssetType;
  description: string;
  address: string;
  city: string;
  country: string;
  is_verified: boolean;
  verification_status: string;
  owner: User;
  pricing_rules: PricingRule[];
  availability_rules: AvailabilityRule[];
  capacities: Capacity[];
  time_granularity: TimeGranularity | null;
  properties: Record<string, unknown>;
  photos: AssetPhoto[];
  average_rating: number;
  total_reviews: number;
  total_bookings: number;
  created_at: string;
  updated_at?: string;
}

export interface AssetPhoto {
  id: string;
  url: string;
  is_primary: boolean;
  caption?: string;
  order?: number;
}

export interface PricingRule {
  id: string;
  name: string;
  unit_type: string;
  price: number;
  min_duration_minutes?: number;
  max_duration_minutes?: number;
  priority: number;
  is_active?: boolean;
}

export interface AvailabilityRule {
  id: string;
  name: string;
  availability_type: string;
  buffer_minutes: number;
  min_advance_booking_minutes: number;
  max_advance_booking_days: number;
  days_of_week: number[];
  available_from: string;
  available_to: string;
}

export interface Capacity {
  capacity_type: string;
  quantity: number;
}

export interface TimeGranularity {
  min_duration_minutes: number;
  max_duration_minutes: number;
  increment_minutes: number;
  any_start_time: boolean;
}

export interface AssetFilters {
  asset_type?: AssetType;
  city?: string;
  country?: string;
  min_price?: number;
  max_price?: number;
  available_from?: string;
  available_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

// ==================== Booking Types ====================
export type BookingStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'ACTIVE' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'EXPIRED' 
  | 'DISPUTED';

export interface Booking {
  id: string;
  status: BookingStatus;
  renter: User;
  owner: User;
  asset: Asset;
  start_time: string;
  end_time: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
  service_fee: string;
  taxes: string;
  total_price: string;
  currency: string;
  payment: Payment;
  contract: Contract;
  created_at: string;
  expires_at: string;
  cancellation_reason?: string;
  cancellation_fee?: string;
  refund_amount?: string;
  refund_status?: string;
}

export interface BookingTimelineEvent {
  event_type: string;
  description: string;
  actor_type: string;
  created_at: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  role?: 'RENTER' | 'OWNER';
  start_time_gte?: string;
  start_time_lte?: string;
  page?: number;
}

// ==================== Payment Types ====================
export type PaymentStatus = 'PENDING' | 'ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED';

export interface Payment {
  id: string;
  booking: string;
  amount: string;
  currency: string;
  payment_method: string;
  status: PaymentStatus;
  card_last_four: string;
  card_brand: string;
  escrow_held_at: string;
  escrow_amount: string;
  escrow_released_at: string;
  penalty_amount: string;
  refunded_amount: string;
}

// ==================== Contract Types ====================
export type ContractStatus = 'PENDING' | 'ACCEPTED' | 'EXECUTED' | 'CANCELLED';

export interface Contract {
  id: string;
  booking: string;
  version: number;
  status: ContractStatus;
  snapshot: ContractSnapshot;
  jurisdiction: string;
  cancellation_policy: string;
  late_return_policy: string;
  damage_policy: string;
  owner_signature: SignatureInfo | null;
  renter_signature: SignatureInfo | null;
  generated_at: string;
}

export interface ContractSnapshot {
  booking: Record<string, unknown>;
  asset: Record<string, unknown>;
  pricing: Record<string, unknown>;
  terms: Record<string, unknown>;
}

export interface SignatureInfo {
  signed_at: string;
  ip_address: string;
  user_agent: string;
}

// ==================== Ride Types ====================
export type RideStatus = 'SCHEDULED' | 'OPEN' | 'FULL' | 'DEPARTED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface Ride {
  id: string;
  route_name: string;
  origin: string;
  destination: string;
  departure_time: string;
  estimated_arrival?: string;
  total_seats: number;
  available_seats: number;
  seat_price: number;
  currency: string;
  status: RideStatus;
  driver: User;
  driver_email?: string;
  vehicle_asset?: Asset;
  vehicle_description?: string;
  vehicle_color?: string;
  vehicle_license_plate?: string;
  stops: RideStop[];
  stops_data?: Partial<RideStop>[]; // For creating rides with stops
  photos: AssetPhoto[]; // Reuse AssetPhoto type for consistency
  confirmed_seats?: number;
  reserved_seats?: number;
  driver_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Vehicle {
  id: string;
  description: string;
  color: string;
  license_plate: string;
}

export interface RideStop {
  id: string;
  stop_type: 'PICKUP' | 'DROPOFF' | 'BOTH';
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  estimated_arrival?: string;
  departure_time?: string;
  stop_order: number;
  notes?: string;
}

export interface Seat {
  seat_number: number;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  price: string;
  booking_id?: string;
}

export interface SeatAvailability {
  ride_id: string;
  total_seats: number;
  available_seats: number;
  seats: Seat[];
}

export interface SeatBooking {
  id: string;
  ride_id: string;
  seat_number: number;
  passenger: User;
  pickup_stop: RideStop;
  dropoff_stop: RideStop;
  passenger_notes: string;
  luggage_count: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

// ==================== Messaging Types ====================
export type ThreadType = 'INQUIRY' | 'BOOKING' | 'RIDE' | 'DISPUTE' | 'DIRECT' | 'SUPPORT';
export type ThreadStatus = 'OPEN' | 'LOCKED' | 'CLOSED';

export interface Thread {
  id: string;
  thread_type: ThreadType;
  subject: string;
  status: ThreadStatus;
  participants: User[];
  messages: Message[];
  message_count: number;
  context_type?: 'ASSET' | 'BOOKING' | 'RIDE';
  context_id?: string;
  booking?: string;  // Booking ID if this is a booking-related thread
  ride?: string;    // Ride ID if this is a ride-related thread
  created_at: string;
  updated_at: string;
  is_flagged: boolean;
}

export interface Message {
  id: string;
  sender: User;
  content: string;
  content_type: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  created_at: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  file: string;
  file_type: string;
  file_name: string;
  file_size: number;
}

export interface ThreadFilters {
  thread_type?: ThreadType;
  status?: ThreadStatus;
}

// ==================== Notification Types ====================
export type NotificationCategory = 'BOOKING' | 'RIDE' | 'PAYMENT' | 'CONTRACT' | 'MESSAGE' | 'RATING' | 'SYSTEM';
export type NotificationStatus = 'PENDING' | 'SENT' | 'READ' | 'FAILED';

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  status: NotificationStatus;
  data: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  categories: Record<string, { email: boolean; push: boolean }>;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

// ==================== Rating Types ====================
export type RatingCategory = 'RENTER_TO_OWNER' | 'OWNER_TO_RENTER' | 'DRIVER_TO_PASSENGER' | 'PASSENGER_TO_DRIVER';

export interface Rating {
  id: string;
  booking_id: string;
  ride_id?: string;
  category: RatingCategory;
  rater: User;
  target: User;
  overall_rating: number;
  reliability_rating: number;
  communication_rating: number;
  cleanliness_rating?: number;
  timeliness_rating?: number;
  asset_rating?: number;
  title: string;
  comment: string;
  created_at: string;
  appeal_status?: string;
}

// ==================== Social Types ====================
export interface PublicUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string | null;
  bio: string;
  location: string;
  date_joined: string;
  rating: number;
  review_count: number;
  is_following: boolean;
  verification_badge?: {
    tier: string;
    color: string | null;
  };
  listings: Listing[];
  rides: PublicRide[];
  reviews: Review[];
}

export interface Listing {
  id: string;
  title: string;
  type: string;
  price: number;
}

export interface PublicRide {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  price: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer: {
    first_name: string;
  };
}

export interface Like {
  id: string;
  user: User;
  asset: Asset;
  created_at: string;
}

export interface Follow {
  id: string;
  follower: User;
  following: User;
  entity_type: string;
  created_at: string;
}

// ==================== Admin Types ====================
export interface AuditLog {
  id: string;
  actor: User;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface BanRequest {
  reason: string;
  justification: string;
}

export interface RoleAssignment {
  role: string;
  scope_type: string;
  scope_id: string | null;
  expires_at: string | null;
}

// ==================== API Response Types ====================
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  error: string;
  message: string;
  detail?: string;
  details?: Record<string, string[]>;
  request_id?: string;
}

// ==================== WebSocket Types ====================
export interface WSMessage {
  type: 'new_message' | 'typing' | 'read' | 'notification';
  data: unknown;
}

export interface TypingIndicator {
  user_id: string;
  thread_id: string;
}

export interface ReadReceipt {
  message_ids: string[];
  thread_id: string;
  user_id: string;
}
