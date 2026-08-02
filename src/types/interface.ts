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
    ADMIN = 'ADMIN',
    ENTREPRISE = 'ENTREPRISE',
    CHAUFFEUR = 'CHAUFFEUR',
    LIVREUR = 'LIVREUR',
    GAZIER = 'GAZIER',
    MARKETING = 'MARKETING',
    GARAGISTE_VENTE_PIECE_AUTO = 'GARAGISTE_VENTE_PIECE_AUTO',
    FOURNISSEUR = 'FOURNISSEUR',
    RESTAURANT = 'RESTAURANT'
}

// RBAC dynamique (Role / Authorization / Policy) — voir backend/src/rbac
export interface MyAccess {
    roles: string[];
    policies: string[];
}

export interface AuthorizationNode {
    id: string;
    code: string;
    name: string;
    icon: string | null;
    description: string | null;
    category: string | null;
    frontendRoute: string | null;
    backendRoute: string | null;
    order: number;
    policies: string[];
    children: AuthorizationNode[];
    // Menus dynamiques (additif) — voir backend/src/menu.
    typeMenuId?: string | null;
    groupId?: string | null;
    groupLabel?: string | null;
    groupOrder?: number;
}

// Menus dynamiques (TypeMenu/MenuGroup/Menu) — voir backend/src/menu.
// Architecture hybride : HOME est backé par Menu (accès public possible,
// permission optionnelle) ; AKWABA/ADMIN restent backés par Authorization
// (JWT obligatoire). GET /menus/type/:code normalise les deux sources.
export type MenuSource = 'MENU' | 'AUTHORIZATION';

export interface MenuTypeNode {
    id: string;
    code: string;
    label: string;
    description: string | null;
    source: MenuSource;
    isActive: boolean;
    order: number;
}

export interface MenuGroupNode {
    id: string;
    typeMenuId: string;
    code: string;
    label: string;
    isActive: boolean;
    order: number;
}

export interface MenuNode {
    id: string;
    code: string;
    label: string;
    icon: string | null;
    route: string | null;
    order: number;
    groupId: string | null;
    groupLabel: string | null;
    groupOrder: number;
    permission: string | null;
    children: MenuNode[];
}

// Ligne brute de l'admin CRUD (GET /menus, GET /menu-types, GET /menu-groups) —
// distinct de MenuNode (façade publique GET /menus/type/:code, déjà normalisée
// en arbre). Ici on garde les champs bruts du modèle Prisma pour les formulaires.
export interface MenuAdminRow {
    id: string;
    typeMenuId: string;
    groupId: string | null;
    parentId: string | null;
    code: string;
    label: string;
    icon: string | null;
    route: string | null;
    permissionCode: string | null;
    isActive: boolean;
    order: number;
}

export interface DynamicRole {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    order: number;
}

export enum TransportType {
    MARITIME = 'MARITIME',
    AERIEN = 'AERIEN',
    HORS_GABARIT = 'HORS_GABARIT',
    SANTE = 'SANTE',
    LOGISTIQUE_STOCKAGE = 'LOGISTIQUE_STOCKAGE',
    DOUANE = 'DOUANE'
}

export enum QuoteStatus {
    PENDING = 'PENDING',
    REVIEWING = 'REVIEWING',
    PROPOSED = 'PROPOSED',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED'
}

export enum DeliveryStatus {
    PREPARING = 'PREPARING',
    IN_TRANSIT = 'IN_TRANSIT',
    AT_CUSTOMS = 'AT_CUSTOMS',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
    CARD = 'CARD',
    MOBILE_MONEY = 'MOBILE_MONEY',
    ADMIN = 'ADMIN'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED'
}

export enum OrderPaymentMethod {
    LIVRAISON = 'LIVRAISON',
    WAVE = 'WAVE',
    ORANGE = 'ORANGE',
    MTN = 'MTN',
    MOOV = 'MOOV'
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
    indicatif?: string;
    avatar?: string;
    avatarUrl?: string; // Standardized field
    companyName?: string;
    siegeSocial?: string;
    boitePostale?: string;
    storeName?: string;
    storeLogo?: string;
    logo?: string;
    signature?: string;
    cni?: string;
    cniUrl?: string; // Standardized field
    role: Role;
    // Rôles/policies dynamiques (RBAC) — renvoyés par /auth/me et /auth/my-space,
    // vides ([]) pour les profils tiers embarqués ailleurs (ex. service.user, order.user).
    roles?: string[];
    policies?: string[];
    isPremium: boolean;
    credits: number;
    acceptedTerms: boolean;
    isSuspended: boolean;
    recoveryRequested: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface StoreUserInfo {
    id: string;
    email?: string;
    fullName?: string;
    indicatif?: string;
    phone?: string;
    companyName?: string;
    storeName?: string;
    storeLogo?: string;
    productCount?: number;
}

export interface StoreStats {
    totalProducts: number;
    activeProducts: number;
    ordersReceivedCount: number;
    pendingOrdersCount: number;
    boostedProductsCount: number;
    totalRevenue: number;
}

export interface RestaurantStats {
    totalMenuItems: number;
    activeMenuItems: number;
    ordersReceivedCount: number;
    pendingOrdersCount: number;
    boostedMenuItemsCount: number;
    totalRevenue: number;
}

export interface ServiceStats {
    totalServices: number;
    activeServices: number;
    bookingsReceivedCount: number;
    pendingBookingsCount: number;
    boostedServicesCount: number;
    totalRevenue: number;
}

export interface AnnonceStats {
    totalAnnonces: number;
    activeAnnonces: number;
    bookingsReceivedCount: number;
    pendingBookingsCount: number;
    boostedAnnoncesCount: number;
    totalRevenue: number;
}

export interface LiveStats {
    total: number;
    published: number;
    pending: number;
    rejected: number;
}

export interface LogisticStats {
    totalServices: number;
    activeServices: number;
    quotesReceivedCount: number;
    pendingQuotesCount: number;
    boostedServicesCount: number;
    totalRevenue: number;
}



export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    serviceLimit: number;
    durationDays: number;
    isActive: boolean;
    description?: string;
    defaultFeatures?: { id?: string; label: string }[];
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
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    paymentProof?: string;
    autoRenew: boolean;
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
    categories?: Category[];
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
    annonceId?: string | null;
    bookingType?: 'SERVICE' | 'ANNONCE';
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
    client?: { id: string; email: string; role: string; fullName?: string; phone?: string; avatar?: string; } | null;
    provider?: { id: string; email: string; role: string; fullName?: string; phone?: string; avatar?: string; } | null;
    service?: Service | null;
    annonce?: Annonce | null;
}

export interface Category {
    id: string;
    label: string;
    iconName: string;
    _count?: {
        services: number;
    };
}

export interface UserLocation {
    lat: number | null;
    lng: number | null;
    country?: string | null;
    countryCode?: string | null;
    city?: string | null;
    district?: string | null;
    street?: string | null;
    subtitle?: string | null;
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
    servicesCount?: number;
    annoncesCount?: number;
    bookingsCount?: number;
    subscription?: Subscription;
    subscriptions?: Subscription[];
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
    _count?: {
        annonces: number;
    };
}

export interface CategorieAnnonce {
    id: string;
    label: string;
    slug: string;
    iconName?: string;
    _count?: {
        annonces: number;
    };
}

export interface TechnicalSheet {
    key: string;
    value: string;
    category?: string;
}

export interface Equipment {
    name: string;
    isAvailable: boolean;
}

export interface RealEstateOption {
    id: string;
    name: string;
}

export interface VehicleType {
    id: string;
    name: string;
}

export interface Annonce {
    id: string;
    title: string;
    code: string;
    description: string;
    companyName?: string;
    price?: number;
    startDate?: string;
    endDate?: string;
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
    categories?: CategorieAnnonce[];
    technicalSheets?: TechnicalSheet[];
    equipments?: Equipment[];
    realEstateOptionId?: string;
    vehicleTypeId?: string;
    realEstateOption?: RealEstateOption;
    vehicleType?: VehicleType;
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
    bookingsReceived: Pagination<Booking>;
    bookingsPlaced: Pagination<Booking>;
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
    status: boolean
    /** MARKETPLACE (défaut) = catégories marchandises classiques. RESTAURANT = catégories de menu (Entrées/Plats/Desserts...). */
    scope?: 'MARKETPLACE' | 'RESTAURANT'
    subCategories?: SubCategoryProd[]
}

export interface SubCategoryProd {
    id: string
    name: string
    slug: string
    image?: string
    status: boolean
    categoryId: string
}

export enum ProductCondition {
    NEUF = 'NEUF',
    COMME_NEUF = 'COMME_NEUF',
    TRES_BON_ETAT = 'TRES_BON_ETAT',
    BON_ETAT = 'BON_ETAT',
    ETAT_CORRECT = 'ETAT_CORRECT',
    OCCASION = 'OCCASION',
    RECONDITIONNE = 'RECONDITIONNE',
    POUR_PIECES = 'POUR_PIECES',
}

export const productConditionLabels: Record<ProductCondition, string> = {
    [ProductCondition.NEUF]: "Neuf",
    [ProductCondition.COMME_NEUF]: "Comme neuf",
    [ProductCondition.TRES_BON_ETAT]: "Très bon état",
    [ProductCondition.BON_ETAT]: "Bon état",
    [ProductCondition.ETAT_CORRECT]: "État correct",
    [ProductCondition.OCCASION]: "Occasion",
    [ProductCondition.RECONDITIONNE]: "Reconditionné",
    [ProductCondition.POUR_PIECES]: "Pour pièces",
};

export interface Product {
    id: string
    name: string
    description?: string | null
    price: number
    pricePromo?: number | null
    discountPercent?: number | null
    stock: number
    sku: string
    etat: ProductCondition
    typeVente?: 'UNITE' | 'GROS'
    prixVenteGros?: number | null
    /** absent/null = produit marketplace classique. "SUPPLIER" = catalogue B2B Fournisseurs/Grossistes. "RESTAURANT" = plat de menu. */
    productType?: 'SUPPLIER' | 'RESTAURANT' | null
    /** Restaurant propriétaire du plat (productType = RESTAURANT uniquement) — un même vendeur peut posséder plusieurs restaurants. */
    restaurantId?: string | null
    /** Temps de préparation en minutes (plats de restaurant uniquement). */
    preparationTime?: number | null
    /** Accompagnements proposés pour ce plat (plats de restaurant uniquement) — voir ProductAccompagnementOption. */
    accompagnements?: ProductAccompagnementOption[]
    imageUrl?: string | null
    imageUrls?: string[]
    images?: string[]
    files?: FileManager[]
    isActive: boolean
    categoryId: string
    subCategoryId?: string | null
    userId: string
    category: CategoryProd
    subCategory?: SubCategoryProd | null
    user?: Partial<User>
    createdAt: string
    updatedAt: string
}

/** Type de cuisine (Ivoirien, Libanais, Asiatique...) — un restaurant peut en avoir plusieurs. */
export interface RestaurantType {
    id: string
    name: string
    slug: string
    icon?: string | null
    status: boolean
    order: number
}

/** Accompagnement générique (Attiéké, Frites, Alloco...) — créé et géré uniquement par l'admin. */
export interface Accompagnement {
    id: string
    name: string
    status: boolean
    order: number
}

/** Accompagnement proposé pour un plat précis, avec son supplément spécifique à ce plat. */
export interface ProductAccompagnementOption {
    id: string
    name: string
    supplementPrice: number
    isDefault: boolean
}

export interface Restaurant {
    id: string
    userId: string
    name: string
    slug: string
    description?: string | null
    logo?: string | null
    coverPhoto?: string | null
    images: string[]
    phone?: string | null
    whatsapp?: string | null
    email?: string | null
    address?: string | null
    city?: string | null
    district?: string | null
    latitude?: number | null
    longitude?: number | null
    horaires?: any
    preparationTimeMin?: number | null
    preparationTimeMax?: number | null
    isActive: boolean
    types?: RestaurantType[]
    menuCount?: number
    createdAt: string
    updatedAt: string
}

export type SupplierQuoteStatus = 'PENDING' | 'VALIDATED' | 'REJECTED' | 'CANCELLED'

/** Demande de devis B2B ("Je souhaite être livré") sur un produit Fournisseur (productType=SUPPLIER). */
export interface SupplierQuote {
    id: string
    code: string
    buyerId: string
    supplierId: string
    productId: string
    quantity: number
    unitPrice: number
    totalAmount: number
    achatType: 'UNITE' | 'GROS'
    deliveryFullName: string
    deliveryPhone: string
    deliveryAddress: string
    deliveryCity: string
    deliveryDistrict?: string | null
    deliveryLandmark?: string | null
    deliveryInstructions?: string | null
    comment?: string | null
    supplierComment?: string | null
    status: SupplierQuoteStatus
    orderId?: string | null
    createdAt: string
    updatedAt: string
    product?: Partial<Product>
    buyer?: Partial<User>
    supplier?: Partial<User>
}

export interface OrderItem {
    id: string
    productId: string
    subOrderId?: string | null
    quantity: number
    price: number
    achatType?: 'UNITE' | 'GROS'
    removed?: boolean
    removedAt?: string | null
    /** Accompagnement choisi, figé au moment de la commande (jamais recalculé depuis Product.accompagnements). */
    accompagnementId?: string | null
    accompagnementName?: string | null
    accompagnementSupplement?: number | null
    /** Suppléments additionnels choisis en plus de l'accompagnement inclus (sélection multiple), figés au moment de la commande. */
    extras?: { id: string; accompagnementId: string | null; name: string; supplementPrice: number }[]
    product?: Product
}

export enum OrderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    VALIDATED = 'VALIDATED',
    PAID = 'PAID',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    PARTIELLEMENT_EXPEDIEE = 'PARTIELLEMENT_EXPEDIEE',
    PARTIELLEMENT_COMPLETE = 'PARTIELLEMENT_COMPLETE'
}

export interface SubOrder {
    id: string
    orderId: string
    vendorId: string
    vendor?: Partial<User>
    /** Restaurant précis d'origine quand les items proviennent d'un restaurant (un même vendor peut en posséder plusieurs). */
    restaurantId?: string | null
    restaurant?: { id: string; name: string; logo?: string | null } | null
    status: OrderStatus
    totalPrice: number
    shippingPrice: number
    discount: number
    taxes: number
    trackingNumber?: string | null
    deliveryProvider?: string | null
    notes?: string | null
    items: OrderItem[]
    createdAt: string
    updatedAt: string
}

export interface Order {
    id: string
    code: string
    userId: string
    status: OrderStatus
    paymentMethod?: OrderPaymentMethod
    totalAmount: number
    items: OrderItem[]
    subOrders?: SubOrder[]
    user?: User
    createdAt: string
    updatedAt: string
}

export interface OrdersGroupedResponse {
    ordersReceived: Pagination<Order>;
    ordersPlaced: Pagination<Order>;
}

export interface BookingsGroupedResponse {
    bookingsReceived: Pagination<Booking>;
    bookingsPlaced: Pagination<Booking>;
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
    roleNotIn?: string;
}

export interface AdminUserUpdateDto {
    fullName?: string;
    phone?: string;
    // string (pas l'enum Role) : le rôle vient désormais dynamiquement du RBAC backend (GET /roles).
    role?: string;
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
    etat?: ProductCondition;
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
    defaultFeatures?: string[];
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

// ===============================
// LOGISTICS
// ===============================

export interface LogisticService {
    id: string;
    label: string;
    description: string;
    transportType: TransportType;
    isActive: boolean;
    companyId: string;
    company?: {
        id: string;
        fullName?: string;
        companyName?: string;
        email?: string;
        phone?: string;
    };
    images: {
        id: number;
        url: string;
        fileName: string;
        mimeType: string;
        size: number;
    }[];
    createdAt: string;
    updatedAt: string;
}

export interface Quote {
    id: string;
    transportType: TransportType;
    serviceId: string;
    service?: LogisticService;
    departureCountry?: string;
    arrivalCountry?: string;
    departureAddress: string;
    arrivalAddress: string;
    description: string;
    volume?: number;
    weight?: number;
    images?: string[];
    status: QuoteStatus;
    montantTransac?: number;
    senderId: string;
    receiverId?: string;
    prestataireId?: string;
    prestataire?: {
        id: string;
        fullName: string;
        companyName?: string;
    };
    sender?: {
        fullName: string;
        email: string;
    };
    delivery?: Delivery;
    createdAt: string;
    updatedAt: string;
}

export interface Delivery {
    id: string;
    quoteId: string;
    quote?: Quote;
    trackingCode: string;
    status: DeliveryStatus;
    estimatedDeparture?: string;
    estimatedArrival?: string;
    actualDeparture?: string;
    actualArrival?: string;
    trackingEvents?: DeliveryTracking[];
    drivers?: User[];
    flotes?: Flote[];
    createdAt: string;
    updatedAt: string;
}

export interface DeliveryTracking {
    id: string;
    deliveryId: string;
    status: DeliveryStatus;
    location: string;
    note?: string;
    createdAt: string;
}

// ===============================
// GAS DELIVERY (recharge de gaz à domicile)
// ===============================

export enum GasDeliveryStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    DELIVERED = 'DELIVERED',
    CANCELED = 'CANCELED'
}

export interface GasProvider {
    id: string;
    userId: string;
    companyName: string;
    whatsapp?: string;
    phone?: string;
    isAvailable: boolean;
    address?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    bottlesCount?: number;
    createdAt: string;
    updatedAt: string;
}

export enum GasBottleFormat {
    B6 = 'B6',
    B12 = 'B12',
    B15 = 'B15',
    B28 = 'B28',
    B38 = 'B38'
}

export interface GasBottle {
    id: string;
    providerId: string;
    provider?: GasProvider;
    brand: string;
    format: GasBottleFormat;
    weight: number;
    price: number;
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GasDelivery {
    id: string;
    clientId: string;
    client?: Pick<User, 'fullName' | 'phone' | 'indicatif'>;
    clientPhone?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    bottleId: string;
    bottle?: GasBottle;
    providerId?: string;
    provider?: GasProvider;
    status: GasDeliveryStatus;
    createdAt: string;
    updatedAt: string;
}

export interface GasProviderStats {
    totalBottles: number;
    activeBottles: number;
    deliveriesAssignedCount: number;
    inProgressDeliveriesCount: number;
    totalRevenue: number;
}

export interface GasAdminOverview {
    totalProviders: number;
    activeProviders: number;
    totalBottles: number;
    totalDeliveries: number;
    pendingDeliveries: number;
    deliveredDeliveriesCount: number;
    totalRevenue: number;
}

export interface GasProviderAdminRow extends GasProvider {
    user?: Pick<User, 'id' | 'fullName' | 'phone' | 'email' | 'indicatif' | 'isSuspended'>;
    _count?: { bottles: number; deliveries: number };
}

// ─── Annuaire des Garages ───────────────────────────────────────────────────

export interface GarageHoraires {
    day: string;
    openTime?: string;
    closeTime?: string;
    closed: boolean;
}

export interface Garage {
    id: string;
    userId: string;
    nom: string;
    slogan?: string;
    description?: string;
    logo?: string;
    coverPhoto?: string;
    images: string[];
    telephone: string;
    telephoneSecondaire?: string;
    whatsapp?: string;
    email?: string;
    pays?: string;
    ville?: string;
    commune?: string;
    quartier?: string;
    adresseComplete?: string;
    latitude?: number;
    longitude?: number;
    horaires?: GarageHoraires[];
    servicesProposes?: string;
    isPremium: boolean;
    isAgence: boolean;
    actif: boolean;
    catalogueCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface GaragePieceCatalogue {
    id: string;
    garageId: string;
    garage?: Garage;
    nom: string;
    prix: number;
    photo?: string;
    description?: string;
    marquePiece?: string;
    fabricant?: string;
    anneeCompatible?: string;
    vehicleTypeId?: string;
    vehicleType?: { id: string; name: string };
    marqueVehicule?: string;
    modele?: string;
    referenceConstructeur?: string;
    disponible: boolean;
    createdAt: string;
    updatedAt: string;
}

export enum FloteType {
    VEHICULE = 'VEHICULE',
    CAMION = 'CAMION',
    AVION = 'AVION',
    AUTRE = 'AUTRE'
}

export enum FloteStatus {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF'
}

export interface Flote {
    id: string;
    name: string;
    type: FloteType;
    status: FloteStatus;
    description?: string;
    companyId: string;
    marque?: string;
    modele?: string;
    immatriculation?: string;
    capacite?: string;
    typeCarburant?: string;
    consommation?: string;
    assurance?: string;
    dateMiseEnCirculation?: string;
    autonomie?: string;
    compagnie?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LocationLog {
    id: string;
    userId: string;
    lat: number;
    lng: number;
    date: string;
    time: string;
    createdAt: string;
    updatedAt: string;
    user?: Partial<User>;
}

export interface CarouselSlide {
    id: string;
    imageUrl: string;
    alt: string;
}

// ===============================
// NOTIFICATIONS
// ===============================
export interface NotificationSubscription {
    id: string;
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PushSubscriptionRequest {
    userId: string;
    subscription: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    };
}

export interface LogisticsClient extends User {
    companyId?: string;
}

export interface LogisticProvider {
    id: string
    fullName: string
    email: string
    phone: string
    companyName: string
    storeName: string
    siegeSocial: string
    isLogisticEnabled: boolean
    logo: string | null
    coverImage: string | null
    logisticServices: LogisticService[]
}

export interface Video {
    id: string;
    title: string;
    youtubeUrl: string;
    thumbnail?: string;
    createdAt: string;
    updatedAt: string;
}

// ===============================
// EASY DELIVERY
// ===============================

export enum EasyDeliveryStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    PICKED_UP = 'PICKED_UP',
    IN_TRANSIT = 'IN_TRANSIT',
    ARRIVED = 'ARRIVED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
}

export enum EasyDeliveryType {
    PARTICULIER = 'PARTICULIER',
    ENTREPRISE = 'ENTREPRISE',
}

export enum TypeEngin {
    VELO = 'VELO',
    VOITURE = 'VOITURE',
    MOTO = 'MOTO',
    CAMION = 'CAMION',
}

export interface EasyDelivery {
    id: string;
    userId: string;
    user?: Partial<User>;
    deliveryBasePrice?: number;
    deliveryOvertPrice?: number;
    companyName?: string;
    type: EasyDeliveryType;
    typeEngin?: TypeEngin;
    deliveryLogo?: string;
    isActive: boolean;
    activeDeliveriesCount?: number;
    historyDeliveries?: HistoryDelivery[];
    createdAt: string;
    updatedAt: string;
}

export interface HistoryDelivery {
    id: string;
    easyDeliveryId: string;
    easyDelivery?: EasyDelivery;
    orderId?: string;
    currentLat?: number;
    currentLng?: number;
    lastLocationUpdateAt?: string;
    pickupLat?: number;
    pickupLng?: number;
    dropoffLat?: number;
    dropoffLng?: number;
    routePolyline?: string;
    status: EasyDeliveryStatus;
    statusUpdatedAt?: string;
    estimatedPickupTime?: string;
    estimatedDeliveryTime?: string;
    actualPickupTime?: string;
    actualDeliveryTime?: string;
    driverName?: string;
    driverPhone?: string;
    vehicleType?: string;
    vehiclePlateNumber?: string;
    deliveryNotes?: string;
    recipientName?: string;
    recipientPhone?: string;
    deliveryPrice?: number;
    paymentStatus?: PaymentStatus;
    eta?: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface DriverStats {
    total: number;
    delivered: number;
    cancelled: number;
    pending: number;
    successRate: number;
    totalEarnings: number;
}

export interface Slider {
    id: string;
    title: string;
    description?: string;
    status: boolean;
    isActive: boolean;
    file?: FileManager;
    createdAt: string;
    updatedAt: string;
}

// ===============================
// LIVE / SHORTS
// ===============================

export enum LiveEntityType {
    PRODUCT = 'PRODUCT',
    ANNONCE = 'ANNONCE',
    SERVICE = 'SERVICE',
    SERVICE_LOGISTIQUE = 'SERVICE_LOGISTIQUE',
    PROFILE = 'PROFILE',
}

export enum LiveStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    PUBLISHED = 'PUBLISHED',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED',
}

export interface LiveUser {
    id: string;
    fullName?: string;
    storeName?: string;
    companyName?: string;
    role: string;
}

export interface Live {
    id: string;
    title: string;
    description?: string;
    videoLink: string;
    userId: string;
    user: LiveUser;
    entityType?: LiveEntityType;
    entityId?: string;
    status: LiveStatus;
    viewsCount: number;
    likesCount: number;
    sharesCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface LiveFeedResponse {
    data: Live[];
    total: number;
    hasMore: boolean;
}

export interface LiveListResponse {
    data: Live[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
// ─── Product Return / SAV ───────────────────────────────────────────────────

export enum ProductReturnStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    EXCHANGE_PROPOSED = 'EXCHANGE_PROPOSED',
    REJECTED = 'REJECTED',
    REPLACEMENT_SENT = 'REPLACEMENT_SENT',
    COMPLETED = 'COMPLETED',
    REFUNDED = 'REFUNDED',
}

export enum ProductReturnReason {
    DEFECTIVE = 'DEFECTIVE',
    WRONG_ITEM = 'WRONG_ITEM',
    NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
    DAMAGED_IN_TRANSIT = 'DAMAGED_IN_TRANSIT',
    MISSING_PARTS = 'MISSING_PARTS',
    OTHER = 'OTHER',
}

export interface ProductReturnMediaFile {
    id: number;
    fileUrl: string;
    fileMimeType: string;
    fileName: string;
}

export interface ProductReturn {
    id: string;
    orderId: string;
    orderItemId: string;
    productId: string;
    customerId: string;
    sellerId: string;
    reason: ProductReturnReason;
    description?: string;
    status: ProductReturnStatus;
    refundAmount: number;
    replacementCount: number;
    sellerNote?: string;
    createdAt: string;
    updatedAt: string;
    product?: { id: string; name: string };
    customer?: { id: string; fullName: string; phone: string };
    seller?: { id: string; fullName: string; storeName: string };
    order?: { id: string; code: string };
    orderItem?: { id: string; quantity: number; price: number };
    mediaFiles?: ProductReturnMediaFile[];
}

// ─────────────────────────────────────────
// BOOST SYSTEM
// ─────────────────────────────────────────

export type BoostEntityType = 'PRODUCT' | 'SERVICE' | 'ANNONCE' | 'LOGISTIC_SERVICE';
export type BoostStatus = 'PENDING' | 'WAITING_PAYMENT_VALIDATION' | 'ACTIVE' | 'EXPIRED' | 'REJECTED' | 'CANCELLED';
export type BoostPaymentMethod = 'ORANGE_MONEY' | 'MTN_MONEY' | 'WAVE' | 'CARD' | 'BANK_TRANSFER' | 'PAYMENT_PROOF';
export type BoostPaymentStatus = 'PENDING' | 'WAITING_VALIDATION' | 'PAID' | 'REJECTED' | 'REFUNDED';

export interface BoostTransaction {
    id: string;
    userId: string;
    boostId: string;
    amount: number;
    paymentMethod: BoostPaymentMethod;
    paymentStatus: BoostPaymentStatus;
    proofUrl?: string;
    reference?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Boost {
    id: string;
    userId: string;
    user?: { id: string; fullName: string; email: string; phone: string };
    entityType: BoostEntityType;
    entityId: string;
    startDate?: string;
    endDate?: string;
    durationDays: number;
    amount: number;
    status: BoostStatus;
    proofUrl?: string;
    paymentMethod?: BoostPaymentMethod;
    paymentStatus?: BoostPaymentStatus;
    adminNote?: string;
    activatedAt?: string;
    impressions?: number;
    views?: number;
    clicks?: number;
    lastViewedAt?: string;
    lastClickedAt?: string;
    createdAt: string;
    updatedAt: string;
    transaction?: BoostTransaction;
    transactions?: BoostTransaction[];
    files?: { id: number; fileUrl: string; fileName: string; fileType: string }[];
    /** Résumé de l'entité boostée (produit/service/annonce/service logistique) — additif, peut être absent si l'entité a été supprimée */
    entity?: BoostedEntitySummary | null;
}

export interface BoostedEntitySummary {
    id: string;
    title: string;
    image?: string;
    price?: number;
    frais?: number;
    status?: string;
    code?: string;
    storeName?: string;
    category?: string;
    badge?: string;
    description?: string;
}

export interface BoostPricingOption {
    days: number;
    pricePerDay: number;
    total: number;
}

export interface BoostPricing {
    options: BoostPricingOption[];
    currency: string;
}

export type WebPushNotifStatus = 'PENDING' | 'SENT' | 'READ' | 'FAILED';

export interface WebPushNotif {
    id: string;
    userId: string;
    oneSignalNotificationId: string | null;
    title: string;
    body: string;
    data?: Record<string, any> | null;
    status: WebPushNotifStatus;
    sentCount: number;
    lastAttemptAt: string | null;
    readAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface WebPushNotifActiveResponse {
    count: number;
    notifications: WebPushNotif[];
}

export interface WebPushNotifAdminItem extends WebPushNotif {
    user?: { id: string; fullName?: string | null; email?: string | null; phone?: string | null } | null;
}

export interface WebPushNotifAdminListResponse {
    items: WebPushNotifAdminItem[];
    total: number;
    page: number;
    totalPages: number;
}

/* ─── Abonnés WebPush (Admin) ─────────────────────────────── */
export interface NotificationSubscriptionAdminUser {
    id: string;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
}

export interface NotificationSubscriptionAdminItem {
    id: string;
    endpoint: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    browser: string;
    platform: string;
    user: NotificationSubscriptionAdminUser;
}

export interface NotificationSubscriptionListResponse {
    items: NotificationSubscriptionAdminItem[];
    total: number;
    page: number;
    totalPages: number;
}

export interface PushNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    clickAction?: string;
    tag?: string;
    lang?: string;
    dir?: 'ltr' | 'rtl' | 'auto';
    vibrate?: number[];
    requireInteraction?: boolean;
    silent?: boolean;
    renotify?: boolean;
    timestamp?: number;
    priority?: 'high' | 'normal';
    ttl?: number;
    collapseKey?: string;
    data?: Record<string, any>;
}

export interface SendPushResult {
    batchId?: string;
    total: number;
    processed: number;
    successCount: number;
    failureCount: number;
}

export interface SendPushProgressEvent {
    batchId?: string;
    total: number;
    processed: number;
    successCount: number;
    failureCount: number;
}
