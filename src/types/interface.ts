export interface BaseResponse<T = any> {
    statusCode: number;
    message: string;
    data?: T;
    timestamp: string;
}

export interface TablePagination {
    page: number
    limit: number
    total: number
    totalPages: number
    onPageChange: (page: number) => void
}

export interface Pagination<T> {
    status: boolean
    total: number
    totalPages: number
    page: number
    limit: number
    data: T[]
}

export enum Role {
    CLIENT = 'CLIENT',
    PRESTATAIRE = 'PRESTATAIRE',
    ADMIN = 'ADMIN'
}

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED'
}

export enum ServiceType {
    DEPANNAGE = 'DEPANNAGE',
    VENTE = 'VENTE',
    LOCATION = 'LOCATION',
    INSTALLATION = 'INSTALLATION',
    CONSEIL = 'CONSEIL'
}

export enum ServiceStatus {
    AVAILABLE = 'AVAILABLE',
    UNAVAILABLE = 'UNAVAILABLE',
    PENDING = 'PENDING'
}

export enum BookingStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    PAID = 'PAID'
}

export enum InterventionType {
    URGENCE = 'URGENCE',
    RDV = 'RDV'
}

export interface User {
    id: string;
    email: string;
    fullName?: string;
    phone?: string;
    role: Role;
    isPremium: boolean;
    credits: number;
    createdAt: string;
    updatedAt: string;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    serviceLimit: number;
    durationDays: number;
    isActive: boolean;
    features?: string[];
    entities?: PlanEntity[];
    _count?: {
        subscriptions: number;
    };
}

export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    startDate: string;
    endDate: string;
    status: SubscriptionStatus;
    plan?: SubscriptionPlan;
}

export interface Service {
    id: string;
    title: string;
    code: string;
    description: string;
    type: ServiceType;
    status: ServiceStatus;
    frais?: number;
    price: number;
    reduction: number;
    tags: string[];
    location: string;
    latitude?: number;
    longitude?: number;
    imageUrls: string[];
    images?: string[];
    files: FileManager[];
    userId: string;
    categoryId: string;
    user?: User;
    category?: Category;
    ville?: string;
    duration?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Booking {
    id: string;
    clientId: string;
    code: string;
    providerId: string;
    serviceId?: string;
    annonceId?: string;
    bookingType: 'SERVICE' | 'ANNONCE';
    status: BookingStatus;
    price?: number;
    rating?: number;
    comment?: string;
    interventionType: InterventionType;
    scheduledDate?: string;
    scheduledTime?: string;
    description?: string;
    userQrCode?: string;
    prestaQrCode?: string;
    userQrScanned?: boolean;
    prestaQrScanned?: boolean;
    service?: Service;
    annonce?: Annonce;
    client?: User;
    provider?: User;
    createdAt?: string;
    updatedAt?: string;
}

export interface BookingsCalendar {
    id: string;
    clientId: string;
    code: string;
    providerId: string;
    serviceId: string;
    status: BookingStatus;
    price: number | null;
    rating: number | null;
    comment: string | null;
    interventionType: InterventionType;
    scheduledDate: string | null;
    scheduledTime: string | null;
    description: string | null;
    userQrCode: string | null;
    prestaQrCode: string | null;
    userQrScanned: boolean | null;
    prestaQrScanned: boolean | null;
    createdAt: string;
    updatedAt: string;
    client?: { id: string; email: string; role: string; fullName?: string; phone?: string; } | null;
    provider?: { id: string; email: string; role: string; fullName?: string; phone?: string; } | null;
    service?: Service | null;
}

export interface Category {
    id: string;
    label: string;
    iconName: string;
}

export interface UserLocation {
    lat: number | null;
    lng: number | null;
    country?: string | null;
    city?: string | null;
    district?: string | null;
    street?: string | null;
}

export interface ReverseGeocodeData {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    category: string;
    type: string;
    place_rank: number;
    importance: number;
    addresstype: string;
    name: string;
    display_name: string;
    address: Address;
    boundingbox: string[];
}

export interface Address {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    "ISO3166-2-lvl4"?: string;
    country?: string;
    country_code?: string;
}


// ===============================
// ACCOUNT / PROFILE
// ===============================

export interface UserProfile extends User {
    fullName?: string;
    phone?: string;
    companyName?: string;
    servicesCount?: number;
    annoncesCount?: number;
    bookingsCount?: number;
    subscription?: Subscription;
}

// ===============================
// FILE MANAGER
// ===============================
export interface FileManager {
    id: number;
    fileCode: string;
    fileName: string;
    fileMimeType: string;
    fileSize: number;
    fileUrl: string;
    fileType: string;
    targetId: string;
    filePath?: string;
    createdAt: string;
    updatedAt: string;
}

// ===============================
// ANNONCES
// ===============================

export enum AnnonceStatus {
    ACTIVE = 'ACTIVE',
    DRAFT = 'DRAFT',
    EXPIRED = 'EXPIRED',
    SOLD = 'SOLD',
    CANCELLED = 'CANCELLED'
}

export interface TypeAnnonce {
    id: string;
    label: string;
    slug: string;
}

export interface CategorieAnnonce {
    id: string;
    label: string;
    slug: string;
    iconName?: string;
}

export interface Annonce {
    id: string;
    title: string;
    code: string;
    description: string;
    price?: number;
    options?: string[];
    imageUrls: string[];
    images?: string[];
    files: FileManager[];
    latitude?: number;
    longitude?: number;
    status: AnnonceStatus;
    userId: string;
    user?: User;
    typeId: string;
    categorieId: string;
    type?: TypeAnnonce;
    categorie?: CategorieAnnonce;
    ville?: string;
    createdAt: string;
    updatedAt: string;
}

// ===============================
// DEMANDES SUR ANNONCE (leads/messages)
// ===============================
export interface AnnonceRequest {
    id: string;
    annonceId: string;
    client: User;
    message: string;
    createdAt: string;
}


// ===============================
// GLOBAL SEARCH RESPONSE
// ===============================

export interface GlobalSearchResponse {
    services: Service[];
    servicesPagination: TablePagination;
    annonces: Annonce[];
    annoncesPagination: TablePagination;
    activeBookings: Booking[];
    activeBookingsPagination: TablePagination;
    stats: GlobalStats;
    searchParams: SearchParams;
}

export interface MySpaceResponse {
    user: UserProfile;
    services: Service[];
    annonces: Annonce[];
    bookings: Booking[];
    annoncesBookings: Booking[];
    history: Booking[];
    totalGain: number;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface GlobalStats {
    totalServices: number;
    totalAnnonces: number;
    totalActiveBookings: number;
    totalUsers: number;
    totalPrestataires: number;
}

export interface SearchParams {
    lat?: number;
    lng?: number;
    radiusKm: number;
    query?: string;
}

// DTO pour la recherche
export interface SearchDto {
    activeTab?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    query?: string;
    page?: number;
    limit?: number;
}

// Si tu veux l'intégrer dans BaseResponse
export type GlobalSearchBaseResponse = BaseResponse<GlobalSearchResponse>;

// ===============================
// LOGS
// ===============================
export interface Log {
    timestamp: string;
    level: string;
    context?: string;
    message: string;
    metadata?: any;
    stack?: string;
}

export interface LogsResponse {
    data: Log[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}


export interface CategoryProd {
    id: string
    name: string
}

export interface Product {
    id: string
    name: string
    description?: string | null
    price: number
    stock: number
    sku: string
    imageUrl?: string | null
    imageUrls?: string[]
    images?: string[]
    files?: FileManager[]
    isActive: boolean
    categoryId: string
    userId: string
    category: CategoryProd
    user?: Partial<User>
    createdAt: string
    updatedAt: string
}

export interface OrderItem {
    id: string
    productId: string
    quantity: number
    price: number
    product?: Product
}

export enum OrderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    VALIDATED = 'VALIDATED',
    PAID = 'PAID',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

export interface Order {
    id: string
    code: string
    userId: string
    status: OrderStatus
    paymentMethod?: string
    totalAmount: number
    items: OrderItem[]
    user?: User
    createdAt: string
    updatedAt: string
}

// ===============================
// ADMIN DTOs & PARAMS
// ===============================

export interface AdminQueryParams {
    [key: string]: string | number | boolean | undefined | null;
    page?: number;
    limit?: number;
    query?: string;
    level?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    role?: Role;
}

export interface AdminUserUpdateDto {
    fullName?: string;
    phone?: string;
    role?: Role;
    isPremium?: boolean;
    credits?: number;
}

export interface AdminProductUpdateDto {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryId?: string;
    isActive?: boolean;
}

export interface AdminServiceUpdateDto {
    title?: string;
    description?: string;
    price?: number;
    duration?: number;
    status?: ServiceStatus;
    categoryId?: string;
}

export interface AdminAnnonceUpdateDto {
    title?: string;
    description?: string;
    price?: number;
    status?: AnnonceStatus;
    typeId?: string;
    categorieId?: string;
}

export interface AdminSubscriptionPlanDto {
    name: string;
    price: number;
    serviceLimit: number;
    durationDays: number;
    isActive: boolean;
    features?: string[];
    entityIds?: string[];
}

export interface PlanEntity {
    id: string;
    entityName: string;
    createdAt: string;
    _count?: {
        plans: number;
    };
}

export interface AdminUserSubscription extends Subscription {
    user: User;
}

export interface AdminLog {
    id: string;
    level: string;
    message: string;
    context?: string;
    timestamp: string;
    metadata?: any;
}

