import { getCookie } from '@/lib/cookies';
import { BaseResponse, Category, Pagination, ReverseGeocodeData, Role, Service, MySpaceResponse, Annonce, BookingsCalendar, Product, CategoryProd, Order, AdminQueryParams, AdminUserUpdateDto, AdminProductUpdateDto, AdminServiceUpdateDto, AdminAnnonceUpdateDto, AdminSubscriptionPlanDto, User, AdminLog, SubscriptionPlan, PlanEntity, AdminUserSubscription, Subscription, OrdersGroupedResponse, SubOrder, BookingsGroupedResponse, LogisticService, Quote, Delivery, DeliveryTracking, QuoteStatus, DeliveryStatus, TransportType, LocationLog, CategorieAnnonce, TypeAnnonce, LogisticsClient, Video, StoreUserInfo, StoreStats, ServiceStats, AnnonceStats, LiveStats, LogisticProvider, LogisticStats, GasProvider, GasBottle, GasBottleFormat, GasDelivery, GasDeliveryStatus, GasProviderStats, Booking, GasAdminOverview, GasProviderAdminRow, Garage, GaragePieceCatalogue, EasyDelivery, HistoryDelivery, EasyDeliveryStatus, DriverStats, SubCategoryProd, Slider, Live, LiveFeedResponse, LiveListResponse, LiveStatus, LiveEntityType, Boost, BoostPricing, BoostEntityType, BoostPaymentMethod, WebPushNotifActiveResponse, WebPushNotifStatus, WebPushNotifAdminListResponse, NotificationSubscriptionListResponse, PushNotificationPayload, SendPushResult, MyAccess, AuthorizationNode } from '@/types/interface';

export const getBaseUrl = (): string => {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.djamko.com/api/v1';
};

/** URL du microservice MCP IA (ms-ia-mcp). Séparé du backend principal. */
export const getMcpBaseUrl = (): string => {
    return process.env.NEXT_PUBLIC_MCP_URL || 'https://ai-mcp.djamko.com/api/v1';
};

const authMiddleware = async (): Promise<void> => {
    const token = getCookie('token');
    if (!token) {
        // Optionally handle redirection or renewal here
    }
};


export function toQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;

        if (Array.isArray(value)) {
            value.forEach(v => {
                if (v !== undefined && v !== null && v !== '') {
                    searchParams.append(key, String(v));
                }
            });
        } else {
            searchParams.append(key, String(value));
        }
    });
    return searchParams.toString();
}


/**
 * Pour les fiches publiques (produit/service/annonce) : attache le token si l'utilisateur est
 * connecté, sinon un fingerprint d'appareil — utilisé côté backend pour dédupliquer les vues
 * boostées par utilisateur/appareil et par jour (voir boost.service.ts::recordView). Import
 * dynamique de visitTracking.ts pour éviter un cycle d'import statique (ce fichier lui importe
 * déjà getBaseUrl depuis api.ts).
 */
const getIdentityHeadersAndQuery = async (): Promise<{ headers: Record<string, string>; qs: string }> => {
    const token = getCookie('token');
    if (token) {
        return { headers: { Authorization: `Bearer ${token}` }, qs: '' };
    }
    try {
        const { getOrCreateFingerprint } = await import('@/lib/visitTracking');
        const fp = await getOrCreateFingerprint();
        return { headers: {}, qs: `?fp=${encodeURIComponent(fp)}` };
    } catch {
        return { headers: {}, qs: '' };
    }
};

// secureFetch: used only for protected routes
export const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    await authMiddleware();
    const token = getCookie('token') || '';
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
        Authorization: `Bearer ${token}`,
    };

    // Only set application/json if not already set and not FormData
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    // Intercepter l'erreur 401 (Non autorisé / Session expirée)
    if (response.status === 401) {
        const token = getCookie('token');
        if (token) {
            // Uniquement si on avait un token (session expirée)
            import('@/lib/auth').then(auth => auth.logout());
        }
    }

    return response;
};


// reverse-geocode

export const reverseGeocode = async (lat: number, lng: number): Promise<BaseResponse<ReverseGeocodeData>> => {
    const response = await fetch(`${getBaseUrl()}/auth/reverse-geocode?lat=${lat}&lng=${lng}`);
    return await response.json();
};


// =====================
// AUTH & USER
// =====================

export const register = async (data: any): Promise<BaseResponse<any>> => {
    const response = await fetch(`${getBaseUrl()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return await response.json();
};

// Catalogue public (non authentifié) des rôles ouverts à l'auto-inscription — pilote
// dynamiquement /register et RoleSelectionModal (source unique : RBAC backend).
export interface PublicRegisterRole {
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    isPublicActive: boolean;
    order: number;
}

export const getPublicRegisterRoles = async (): Promise<BaseResponse<PublicRegisterRole[]>> => {
    const response = await fetch(`${getBaseUrl()}/auth/register-roles`);
    return await response.json();
};

export const login = async (identifier: string, password: string): Promise<BaseResponse<any>> => {
    const response = await fetch(`${getBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
    });
    return await response.json();
};

export const getMe = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/auth/me`, {
        method: 'GET',
    });
    return await response.json();
};

export const requestRecovery = async (phone: string): Promise<BaseResponse<any>> => {
    const response = await fetch(`${getBaseUrl()}/auth/request-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
    });
    return await response.json();
};

export const forgotPassword = async (phone: string): Promise<BaseResponse<any>> => {
    const response = await fetch(`${getBaseUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
    });
    return await response.json();
};

export const verifyResetCode = async (phone: string, code: string): Promise<BaseResponse<any>> => {
    const response = await fetch(`${getBaseUrl()}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
    });
    return await response.json();
};

export const resetPassword = async (phone: string, code: string, newPassword: string): Promise<BaseResponse<any>> => {
    const response = await fetch(`${getBaseUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, newPassword }),
    });
    return await response.json();
};

export const logout = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/auth/logout`, {
        method: 'POST',
    });
    return await response.json();
};


export const getMySpace = async (params: any): Promise<BaseResponse<MySpaceResponse>> => {
    const response = await secureFetch(`${getBaseUrl()}/auth/my-space?${toQueryString(params)}`, {
        method: 'GET',
    });
    return await response.json();
};


export const getAllSearch = async (params: any): Promise<BaseResponse<MySpaceResponse>> => {
    const response = await secureFetch(`${getBaseUrl()}/auth/search?${toQueryString(params)}`, {
        method: 'GET',
    });
    return await response.json();
};


export const getOverview = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/auth/overview`, {
        method: 'GET',
    });
    return await response.json();
};


// =====================
// RBAC (Role / Authorization / Policy dynamiques)
// =====================

export const getMyRoles = async (): Promise<BaseResponse<MyAccess>> => {
    const response = await secureFetch(`${getBaseUrl()}/auth/me/roles`, { method: 'GET' });
    return await response.json();
};

export const getMyAuthorizations = async (): Promise<BaseResponse<AuthorizationNode[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/authorizations/my`, { method: 'GET' });
    return await response.json();
};

export const getAuthorizationsTree = async (): Promise<BaseResponse<AuthorizationNode[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/authorizations/tree`, { method: 'GET' });
    return await response.json();
};

export const getAuthorizations = async (params: any = {}): Promise<BaseResponse<Pagination<any>>> => {
    const response = await secureFetch(`${getBaseUrl()}/authorizations?${toQueryString(params)}`, { method: 'GET' });
    return await response.json();
};

export const createAuthorization = async (data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/authorizations`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updateAuthorization = async (id: string, data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/authorizations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteAuthorization = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/authorizations/${id}`, { method: 'DELETE' });
    return await response.json();
};

export const getRoles = async (params: any = {}): Promise<BaseResponse<Pagination<any>>> => {
    const response = await secureFetch(`${getBaseUrl()}/roles?${toQueryString(params)}`, { method: 'GET' });
    return await response.json();
};

export const getRole = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/roles/${id}`, { method: 'GET' });
    return await response.json();
};

export const createRole = async (data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/roles`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updateRole = async (id: string, data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/roles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteRole = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/roles/${id}`, { method: 'DELETE' });
    return await response.json();
};

export const assignPoliciesToRole = async (roleId: string, policyIds: string[]): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/roles/${roleId}/policies`, {
        method: 'POST',
        body: JSON.stringify({ policyIds }),
    });
    return await response.json();
};

export const getRoleUsers = async (roleId: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/roles/${roleId}/users`, { method: 'GET' });
    return await response.json();
};

export const getPolicies = async (params: any = {}): Promise<BaseResponse<Pagination<any>>> => {
    const response = await secureFetch(`${getBaseUrl()}/policies?${toQueryString(params)}`, { method: 'GET' });
    return await response.json();
};

export const createPolicy = async (data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/policies`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updatePolicy = async (id: string, data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/policies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deletePolicy = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/policies/${id}`, { method: 'DELETE' });
    return await response.json();
};

export const getUserDynamicRoles = async (userId: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/${userId}/roles`, { method: 'GET' });
    return await response.json();
};

export const assignRolesToUser = async (userId: string, roleIds: string[]): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleIds }),
    });
    return await response.json();
};


// =====================
// STORE
// =====================

export const updateStoreNameLogo = async (data: any): Promise<BaseResponse<any>> => {
    const isFormData = data instanceof FormData;
    const response = await secureFetch(`${getBaseUrl()}/users/update/store/name`, {
        method: 'PATCH',
        body: isFormData ? data : JSON.stringify(data),
    });
    return await response.json();
};

export const getStoreUserInfo = async (): Promise<BaseResponse<StoreUserInfo>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/get/store/info`, {
        method: 'GET',
    });
    return await response.json();
};

export const getStoreStats = async (): Promise<BaseResponse<StoreStats>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/get/store/stats`, {
        method: 'GET',
    });
    return await response.json();
};

export const resolveStoreByUserId = async (sellerId: string): Promise<BaseResponse<{ sellerId: string; storeName: string; slug: string }>> => {
    const response = await fetch(`${getBaseUrl()}/users/store/resolve/${sellerId}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getAllStores = async (params: { page?: number; limit?: number; storeName?: string } = {}): Promise<BaseResponse<Pagination<StoreUserInfo & { productCount: number }>>> => {
    const queryString = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();
    const response = await fetch(`${getBaseUrl()}/users/stores/all${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
    return await response.json();
};

export const getPublicStoreInfo = async (storeName: string): Promise<BaseResponse<StoreUserInfo & { productCount: number }>> => {
    const response = await fetch(`${getBaseUrl()}/users/store/${storeName}`, {
        method: 'GET',
    });
    return await response.json();
};

/** Liste paginée des boutiques (Admin) — réutilise UserService.getAllStores() via /admin/stores. */
export const adminGetStores = async (params: { page?: number; limit?: number; storeName?: string } = {}): Promise<BaseResponse<Pagination<StoreUserInfo & { productCount: number }>>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/stores?${toQueryString(params)}`, {
        method: 'GET',
    });
    return await response.json();
};

/** Produits d'une boutique (Admin). */
export const adminGetStoreProducts = async (storeName: string, params: { page?: number; limit?: number } = {}): Promise<BaseResponse<Pagination<Product>>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/stores/${storeName}/products?${toQueryString(params)}`, {
        method: 'GET',
    });
    return await response.json();
};

/** Commandes contenant des produits d'une boutique (Admin). */
export const adminGetStoreOrders = async (storeName: string, params: { page?: number; limit?: number } = {}): Promise<BaseResponse<Pagination<Order>>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/stores/${storeName}/orders?${toQueryString(params)}`, {
        method: 'GET',
    });
    return await response.json();
};

/** Notifications WebPush d'une boutique (Admin) — rejouables via adminReplayWebPushNotif. */
export const adminGetStoreNotifications = async (storeName: string, params: { page?: number; limit?: number; status?: WebPushNotifStatus } = {}): Promise<BaseResponse<WebPushNotifAdminListResponse>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/stores/${storeName}/notifications?${toQueryString(params)}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getPublicLogisticsInfo = async (companyName: string): Promise<BaseResponse<any>> => {
    const response = await fetch(`${getBaseUrl()}/users/logistics/${companyName}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getLogisticInfoDatas = async (): Promise<BaseResponse<LogisticProvider & { serviceCount: number }>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/get/logistic/info/datas`, {
        method: 'GET',
    });
    return await response.json();
};

export const getLogisticStats = async (): Promise<BaseResponse<LogisticStats>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/get/logistic/stats`, {
        method: 'GET',
    });
    return await response.json();
};

// =====================
// SERVICES
// =====================

export const getServices = async (params: { page?: number; limit?: number; categoryId?: string; search?: string; lat?: number; lng?: number; radiusKm?: number }): Promise<BaseResponse<Pagination<Service>>> => {
    // Map 'search' from frontend to 'query' expected by backend
    const apiParams = {
        ...params,
        query: params.search,
    };
    // remove search from params to avoid sending it as an extra parameter
    delete apiParams.search;

    const queryString = toQueryString(apiParams);
    const response = await fetch(`${getBaseUrl()}/services?${queryString}`);
    return response.json();
};

export const getServiceById = async (id: string): Promise<BaseResponse<any>> => {
    const { headers, qs } = await getIdentityHeadersAndQuery();
    const response = await fetch(`${getBaseUrl()}/services/${id}${qs}`, { headers });
    return await response.json();
};

export const createService = async (data: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/services`, {
        method: 'POST',
        body: data, // FormData ne doit pas être stringifié
        // Ne pas définir 'Content-Type', le navigateur le fait automatiquement
    });
    return await response.json();
};

export const updateService = async (id: string, data: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/services/${id}`, {
        method: 'PATCH',
        body: data,
    });
    return await response.json();
};

export const deleteService = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/services/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const getServiceStats = async (): Promise<BaseResponse<ServiceStats>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/get/service/stats`, {
        method: 'GET',
    });
    return await response.json();
};

export const getAnnonceStats = async (): Promise<BaseResponse<AnnonceStats>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/get/annonce/stats`, {
        method: 'GET',
    });
    return await response.json();
};

export const handleToggleActive = async (id: string, value: boolean): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/services/${id}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
    });
    return await response.json();
};

// =====================
// BOOKINGS
// =====================

// AllBookings
export const getAllBookings = async (params: { page: number; limit: number; category?: string; search?: string; type?: string }): Promise<BaseResponse<BookingsGroupedResponse>> => {
    const query = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
    });
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.type) query.append('type', params.type);

    const response = await secureFetch(`${getBaseUrl()}/bookings?${query.toString()}`, {
        method: 'GET',
    });
    return await response.json();
};

// MyBookings
export const getMyBookings = async (params: { page: number; limit: number; category?: string; search?: string; type?: string }): Promise<BaseResponse<BookingsGroupedResponse>> => {
    const query = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
    });
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.type) query.append('type', params.type);

    const response = await secureFetch(`${getBaseUrl()}/bookings/my?${query.toString()}`, {
        method: 'GET',
    });
    return await response.json();
};

// Create booking
export const createBooking = async (data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/bookings`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

// Get a single booking with full details (même niveau que les listes)
export const getBookingById = async (id: string): Promise<BaseResponse<Booking>> => {
    const response = await secureFetch(`${getBaseUrl()}/bookings/${id}`, {
        method: 'GET',
    });
    return await response.json();
};

// Update booking status
export const updateBookingStatus = async (id: string, status: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    return await response.json();
};

// Update full booking
export const updateBooking = async (id: string, data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

// Check annonce availability (résidence meublée / hôtel / véhicule)
export interface AvailabilityResult {
    available: boolean;
    mode: 'NONE' | 'DAY' | 'SLOT';
    message?: string;
    nextAvailableDate?: string;
    nextAvailableTime?: string;
}

export const checkAnnonceAvailability = async (
    annonceId: string,
    scheduledDate: string,
    scheduledTime: string,
    excludeBookingId?: string,
): Promise<BaseResponse<AvailabilityResult>> => {
    const query = new URLSearchParams({ annonceId, scheduledDate, scheduledTime });
    if (excludeBookingId) query.append('excludeBookingId', excludeBookingId);

    const response = await secureFetch(`${getBaseUrl()}/bookings/availability?${query.toString()}`, {
        method: 'GET',
    });
    return await response.json();
};

// Calendar
export const getBookingsCalendar = async (params?: { year?: number; month?: number }): Promise<BaseResponse<BookingsCalendar[]>> => {
    const query = new URLSearchParams();
    if (params?.year) query.append('year', params.year.toString());
    if (params?.month) query.append('month', params.month.toString());

    const response = await secureFetch(`${getBaseUrl()}/bookings/calendar?${query.toString()}`, {
        method: 'GET',
    });
    const res = await response.json();

    // Map the backend structure to Return only the array of bookings as requested
    return {
        ...res,
        data: res.data?.bookings || []
    };
};

// =====================
// SUBSCRIPTIONS
// =====================

export const getPlans = async (): Promise<BaseResponse<Pagination<SubscriptionPlan>>> => {
    const response = await fetch(`${getBaseUrl()}/subscriptions/plans`);
    return await response.json();
};

export const getMySubscription = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/subscriptions/me`, {
        method: 'GET',
    });
    return await response.json();
};

// =====================
// AI ANALYSIS
// =====================

export const analyzeImage = async (formData: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/ai/analyze`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

// =====================
// GET CATEGORIES
// =====================

export const getForSelectCategories = async (): Promise<BaseResponse<Category[]>> => {
    const response = await fetch(`${getBaseUrl()}/categories/for-select`);
    return await response.json();
};

export const searchServiceCategories = async (query: string): Promise<BaseResponse<Category[]>> => {
    const response = await fetch(`${getBaseUrl()}/categories/search?q=${encodeURIComponent(query)}`);
    return await response.json();
};


export const getCategories = async (): Promise<BaseResponse<Pagination<Category>>> => {
    const response = await fetch(`${getBaseUrl()}/categories`);
    return await response.json();
};

export const getCategoryById = async (id: string): Promise<BaseResponse<Category>> => {
    const response = await fetch(`${getBaseUrl()}/categories/${id}`);
    return await response.json();
};

export const createCategory = async (data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/categories`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updateCategory = async (id: string, data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteCategory = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/categories/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

/* =======================================================
   TYPE ANNONCE API
======================================================= */
export const getTypeAnnonces = async (params: { page?: number; limit?: number; query?: string }): Promise<BaseResponse<Pagination<any>>> => {
    const queryString = toQueryString(params);
    const response = await fetch(`${getBaseUrl()}/type-annonce?${queryString}`);
    return await response.json();
};

export const getForSelectTypeAnnonces = async (): Promise<BaseResponse<any[]>> => {
    const response = await fetch(`${getBaseUrl()}/type-annonce/select`);
    return await response.json();
};

export const getTypeAnnonceById = async (id: string): Promise<BaseResponse<any>> => {
    const response = await fetch(`${getBaseUrl()}/type-annonce/${id}`);
    return await response.json();
};

export const createTypeAnnonce = async (data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/type-annonce`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updateTypeAnnonce = async (id: string, data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/type-annonce/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteTypeAnnonce = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/type-annonce/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

/* =======================================================
   CATEGORIE ANNONCE API
======================================================= */
export const getCategorieAnnonces = async (params: { page?: number; limit?: number; query?: string }): Promise<BaseResponse<Pagination<any>>> => {
    const queryString = toQueryString(params);
    const response = await fetch(`${getBaseUrl()}/categorie-annonce?${queryString}`);
    return await response.json();
};

export const getForSelectCategorieAnnonces = async (): Promise<BaseResponse<any[]>> => {
    const response = await fetch(`${getBaseUrl()}/categorie-annonce/select`);
    return await response.json();
};

export const searchAnnonceCategories = async (query: string): Promise<BaseResponse<any[]>> => {
    const response = await fetch(`${getBaseUrl()}/categorie-annonce/searchByName?q=${encodeURIComponent(query)}`);
    return await response.json();
};

export const getCategorieAnnonceById = async (id: string): Promise<BaseResponse<any>> => {
    const response = await fetch(`${getBaseUrl()}/categorie-annonce/${id}`);
    return await response.json();
};

export const createCategorieAnnonce = async (formData: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/categorie-annonce`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const updateCategorieAnnonce = async (id: string, formData: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/categorie-annonce/${id}`, {
        method: 'PATCH',
        body: formData,
    });
    return await response.json();
};

export const deleteCategorieAnnonce = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/categorie-annonce/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

/* =======================================================
   ANNONCES API
======================================================= */
export const getAnnonces = async (params: { page?: number; limit?: number; query?: string; categorieId?: string; typeId?: string; lat?: number; lng?: number; radiusKm?: number }): Promise<BaseResponse<Pagination<Annonce>>> => {
    const queryString = toQueryString(params);
    const response = await fetch(`${getBaseUrl()}/annonces?${queryString}`);
    return await response.json();
};

export const getForSelectRealEstateOptions = async (): Promise<BaseResponse<any>> => {
    const response = await fetch(`${getBaseUrl()}/real-estate-option/select`);
    return await response.json();
};

export const getForSelectVehicleTypes = async (): Promise<BaseResponse<any[]>> => {
    const response = await fetch(`${getBaseUrl()}/vehicle-types/select`);
    return await response.json();
};

export const getForSelectEquipmentNames = async (): Promise<BaseResponse<any[]>> => {
    const response = await fetch(`${getBaseUrl()}/equipment-names/select`);
    return await response.json();
};

export const getAnnonceById = async (id: string): Promise<BaseResponse<any>> => {
    const { headers, qs } = await getIdentityHeadersAndQuery();
    const response = await fetch(`${getBaseUrl()}/annonces/${id}${qs}`, { headers });
    return await response.json();
};

export const createAnnonce = async (formData: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/annonces`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const updateAnnonce = async (id: string, formData: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/annonces/${id}`, {
        method: 'PATCH',
        body: formData,
    });
    return await response.json();
};

export const deleteAnnonce = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/annonces/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const handleToggleAnnonceActive = async (id: string, value: boolean): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/annonces/${id}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
    });
    return await response.json();
};

/* =======================================================
   ADMIN - REFERENCE DATA API
======================================================= */

// Equipment Names
export const adminGetEquipmentNames = async (): Promise<BaseResponse<any[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/equipment-names`, { method: 'GET' });
    return await response.json();
};

export const adminCreateEquipmentName = async (data: { name: string }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/equipment-names`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminUpdateEquipmentName = async (id: string, data: { name: string }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/equipment-names/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteEquipmentName = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/equipment-names/${id}`, { method: 'DELETE' });
    return await response.json();
};

// Vehicle Types (CRUD already exists in backend controller, adding frontend)
export const adminGetVehicleTypes = async (): Promise<BaseResponse<any[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/vehicle-types`, { method: 'GET' });
    return await response.json();
};

export const adminCreateVehicleType = async (data: { name: string }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/vehicle-types`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminUpdateVehicleType = async (id: string, data: { name: string }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/vehicle-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteVehicleType = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/vehicle-types/${id}`, { method: 'DELETE' });
    return await response.json();
};

// Real Estate Options
export const adminGetRealEstateOptions = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/real-estate-option`, { method: 'GET' });
    return await response.json();
};

export const adminCreateRealEstateOption = async (data: { name: string }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/real-estate-option`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminUpdateRealEstateOption = async (id: string, data: { name: string }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/real-estate-option/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteRealEstateOption = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/real-estate-option/${id}`, { method: 'DELETE' });
    return await response.json();
};

// Technical Sheet Defaults (NEWly created backend)
export const adminGetTechnicalSheetDefaults = async (): Promise<BaseResponse<any[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/technical-sheet-default`, { method: 'GET' });
    return await response.json();
};

export const adminCreateTechnicalSheetDefault = async (data: { key: string; category?: string }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/technical-sheet-default`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminUpdateTechnicalSheetDefault = async (id: string, data: { key?: string; category?: string }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/technical-sheet-default/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteTechnicalSheetDefault = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/technical-sheet-default/${id}`, { method: 'DELETE' });
    return await response.json();
};

/* =======================================================
   PAYMENTS API
======================================================= */
export const buyCredits = async (amount: number): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/payments/buy-credits`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
    });
    return await response.json();
};

/* =======================================================
   USERS API
======================================================= */
/* ═══════════════════════════════════════════════════
   BOOST API
═══════════════════════════════════════════════════ */

export const getBoostPricing = async (): Promise<BaseResponse<BoostPricing>> => {
    const response = await fetch(`${getBaseUrl()}/boosts/pricing`);
    return await response.json();
};

export const createBoost = async (data: {
    entityType: BoostEntityType;
    entityId: string;
    durationDays: number;
    paymentMethod: BoostPaymentMethod;
    proofUrl?: string;
    reference?: string;
}): Promise<BaseResponse<Boost>> => {
    const response = await secureFetch(`${getBaseUrl()}/boosts`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const uploadBoostProof = async (file: File): Promise<BaseResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await secureFetch(`${getBaseUrl()}/boosts/upload-proof`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const getMyBoosts = async (params?: {
    page?: number;
    limit?: number;
    entityType?: BoostEntityType;
}): Promise<BaseResponse<Pagination<Boost>>> => {
    const qs = params ? toQueryString(params) : '';
    const response = await secureFetch(`${getBaseUrl()}/boosts/my?${qs}`, { method: 'GET' });
    return await response.json();
};

export const adminGetBoosts = async (params?: any): Promise<BaseResponse<Pagination<Boost>>> => {
    const qs = params ? toQueryString(params) : '';
    const response = await secureFetch(`${getBaseUrl()}/boosts/admin/all?${qs}`, { method: 'GET' });
    return await response.json();
};

export const adminGetBoostStats = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/boosts/admin/stats`, { method: 'GET' });
    return await response.json();
};

export const adminValidateBoost = async (id: string): Promise<BaseResponse<Boost>> => {
    const response = await secureFetch(`${getBaseUrl()}/boosts/admin/${id}/validate`, { method: 'PATCH' });
    return await response.json();
};

export const adminRejectBoost = async (id: string): Promise<BaseResponse<Boost>> => {
    const response = await secureFetch(`${getBaseUrl()}/boosts/admin/${id}/reject`, { method: 'PATCH' });
    return await response.json();
};

export const adminCancelBoost = async (id: string): Promise<BaseResponse<Boost>> => {
    const response = await secureFetch(`${getBaseUrl()}/boosts/admin/${id}/cancel`, { method: 'PATCH' });
    return await response.json();
};

export const getDeliveryInfo = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/me/delivery-info`, { method: 'GET' });
    return await response.json();
};

export const updateDeliveryInfo = async (data: {
    deliveryFullName?: string;
    deliveryPhone?: string;
    usePersonalPhone?: boolean;
    deliveryAddress?: string;
    deliveryCity?: string;
    deliveryDistrict?: string;
    deliveryLandmark?: string;
    deliveryInstructions?: string;
}): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/me/delivery-info`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const getUserProfile = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/profile`, {
        method: 'GET',
    });
    return await response.json();
};

export const suspendMe = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/suspend-me`, {
        method: 'PATCH',
    });
    return await response.json();
};

export const updateUserProfile = async (data: any): Promise<BaseResponse<any>> => {
    const isFormData = data instanceof FormData;
    const url = isFormData ? `${getBaseUrl()}/users/profile/avatar` : `${getBaseUrl()}/users/profile`;
    const response = await secureFetch(url, {
        method: 'PATCH',
        body: isFormData ? data : JSON.stringify(data),
    });
    return await response.json();
};

export const getAllUsers = async (params: any): Promise<BaseResponse<Pagination<any>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/admin/users?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getSuspendedUsersAdmin = async (params: any): Promise<BaseResponse<Pagination<any>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/admin/users/suspended?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getRecoveryRequestsAdmin = async (params: any): Promise<BaseResponse<Pagination<any>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/admin/users/recovery-requests?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const suspendUserAdmin = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/users/${id}/suspend`, {
        method: 'POST',
    });
    return await response.json();
};

export const reactivateUserAdmin = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/users/${id}/reactivate`, {
        method: 'POST',
    });
    return await response.json();
};

export const searchUserByPhoneAdmin = async (phone: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/users/search?phone=${phone}`, {
        method: 'GET',
    });
    return await response.json();
};

export const deleteUserAdmin = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/users/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

/** Création d'un utilisateur par un admin (mêmes champs que /auth/register, voir RegisterDto). */
export const createUserAdmin = async (data: {
    email: string;
    indicatif?: string;
    phone: string;
    password: string;
    role?: string;
    fullName?: string;
    company?: string;
}): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/users`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updateUser = async (id: string, data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const uploadUserDocument = async (formData: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/profile/upload-doc`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

/* =======================================================
   ADMIN - SUBSCRIPTION PLANS API
======================================================= */
export const createSubscriptionPlanAdmin = async (data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/subscription-plans`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const getSubscriptionPlansAdmin = async (params: any): Promise<BaseResponse<Pagination<SubscriptionPlan>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/admin/subscription-plans?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getSubscriptionPlanByIdAdmin = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/subscription-plans/${id}`, {
        method: 'GET',
    });
    return await response.json();
};

export const updateSubscriptionPlanAdmin = async (id: string, data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/subscription-plans/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteSubscriptionPlanAdmin = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/subscription-plans/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

/* =======================================================
   SUBSCRIPTIONS API (EXTRA)
======================================================= */
export const subscribeToPlan = async (data: { planId: string; paymentMethod: string; paymentProof?: string }): Promise<BaseResponse<Subscription>> => {
    const response = await secureFetch(`${getBaseUrl()}/subscriptions/subscribe`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const renewSubscription = async (): Promise<BaseResponse<Subscription>> => {
    const response = await secureFetch(`${getBaseUrl()}/subscriptions/renew`, {
        method: 'POST',
    });
    return await response.json();
};

export const uploadSubscriptionProof = async (file: File): Promise<BaseResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await secureFetch(`${getBaseUrl()}/subscriptions/upload-proof`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const updateUserSubscriptionAdmin = async (userId: string, data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/subscriptions/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const checkUserSubscription = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/subscriptions/my-subscription`, {
        method: 'GET',
    });
    return await response.json();
};

export const getSubscriptionStatus = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/auth/subscription-status`, {
        method: 'GET',
    });
    return await response.json();
};

export const isSubscriptionSystemEnabled = async (): Promise<BaseResponse<boolean>> => {
    const response = await fetch(`${getBaseUrl()}/subscriptions/is-system-enabled`);
    return await response.json();
};

/* =======================================================
   DATABASE API
======================================================= */
export const seedDatabase = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/db/seed`, {
        method: 'POST',
    });
    return await response.json();
};

/* =======================================================
   APP API
======================================================= */
export const getApiRoot = async (): Promise<BaseResponse<string>> => {
    const response = await fetch(`${getBaseUrl()}/`);
    return await response.json();
};


/* =======================================================
   AI SERVICE API
======================================================= */
export const searchServiceIA = async (image: File): Promise<BaseResponse<any>> => {
    const formData = new FormData();
    formData.append('image', image);

    const response = await fetch(`${getBaseUrl()}/search-service-ia`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

/* =======================================================
   ADMIN - SUBSCRIPTION ENTITIES API
   ======================================================= */
export const adminGetPlanEntities = async (): Promise<BaseResponse<PlanEntity[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/subscription-plans/entities/all`, {
        method: 'GET',
    });
    return await response.json();
};

export const adminCreatePlanEntity = async (data: { entityName: string }): Promise<BaseResponse<PlanEntity>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/subscription-plans/entities`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminUpdatePlanEntity = async (id: string, data: { entityName: string }): Promise<BaseResponse<PlanEntity>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/subscription-plans/entities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeletePlanEntity = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/subscription-plans/entities/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

/* =======================================================
   ADMIN - USER SUBSCRIPTIONS API
   ======================================================= */
export const adminGetAllSubscriptions = async (params: AdminQueryParams): Promise<BaseResponse<Pagination<AdminUserSubscription>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/subscriptions/admin/all?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const adminAssignPlan = async (data: { userId: string, planId: string, paymentMethod: string }): Promise<BaseResponse<Subscription>> => {
    const response = await secureFetch(`${getBaseUrl()}/subscriptions/admin/assign-plan`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminValidatePayment = async (id: string, success: boolean): Promise<BaseResponse<Subscription>> => {
    const response = await secureFetch(`${getBaseUrl()}/subscriptions/admin/validate-payment/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ success }),
    });
    return await response.json();
};

export const resetFreePlanForUserAdmin = async (userId: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/subscriptions/reset-free-plan/${userId}`, {
        method: 'POST',
    });
    return await response.json();
};

export const resetFreePlanForAllUsersAdmin = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/subscriptions/reset-free-plan-all`, {
        method: 'POST',
    });
    return await response.json();
};

export const adminSetSystemStatus = async (isEnabled: boolean): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/subscription-plans/set-system-status`, {
        method: 'POST',
        body: JSON.stringify({ isEnabled }),
    });
    return await response.json();
};

/* =======================================================
   ADMIN - LOGS API
======================================================= */
export const getAdminLogs = async (params: { startDate?: string, endDate?: string, level?: string, page?: number, limit?: number }): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/admin/logs?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const deleteAdminLogs = async (dates: string[]): Promise<BaseResponse<any>> => {
    const query = new URLSearchParams();
    dates.forEach(date => query.append('dates', date));

    const response = await secureFetch(`${getBaseUrl()}/admin/logs?${query.toString()}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const purgeAdminLogs = async (params: { startDate?: string; endDate?: string }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/logs/purge`, {
        method: 'POST',
        body: JSON.stringify(params),
    });
    return await response.json();
};

export const getAdminLogFiles = async (): Promise<BaseResponse<string[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/logs/files`, {
        method: 'GET',
    });
    return await response.json();
};

/* =======================================================
   ADMIN - BACKUP API
======================================================= */
export const getAdminBackupFolders = async (): Promise<BaseResponse<{ name: string; fileCount: number }[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/backup/folders`, {
        method: 'GET',
    });
    return await response.json();
};

export const backupAdminFolder = async (folder: string): Promise<BaseResponse<{ zipUrl: string }>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/backup/${encodeURIComponent(folder)}`, {
        method: 'GET',
    });
    return await response.json();
};

/* =======================================================
   CHAT API
======================================================= */

export const verifyChatCode = async (code: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/chat/verify-code`, {
        method: 'POST',
        body: JSON.stringify({ code }),
    });
    return await response.json();
};

export const createChatConversation = async (data: { participant2Id: string; bookingId?: string }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/chat/conversation`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const getChatMessages = async (conversationId: string): Promise<BaseResponse<any[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/chat/messages/${conversationId}`, {
        method: 'GET',
    });
    return await response.json();
};

export const uploadChatFiles = async (formData: FormData): Promise<BaseResponse<any[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/chat/upload`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const getConversationsCount = async (): Promise<BaseResponse<number>> => {
    const response = await secureFetch(`${getBaseUrl()}/chat/unread-count`, {
        method: 'GET',
    });
    return await response.json();
};

export const getUserConversations = async (): Promise<BaseResponse<any[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/chat/conversations`, {
        method: 'GET',
    });
    return await response.json();
};

export const markChatAsRead = async (conversationId: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/chat/read/${conversationId}`, {
        method: 'POST',
    });
    return await response.json();
};

/* =======================================================
   NOTIFICATIONS API
======================================================= */
export const subscribePush = async (userId: string, subscription: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/notifications/subscribe`, {
        method: 'POST',
        body: JSON.stringify({ userId, subscription }),
    });
    return await response.json();
};

export const getPushSubscriptions = async (userId: string): Promise<BaseResponse<any[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/notifications/subscriptions/${userId}`, {
        method: 'GET',
    });
    return await response.json();
};

export const togglePushSubscription = async (endpoint: string, isActive: boolean): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/notifications/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ endpoint, isActive }),
    });
    return await response.json();
};

export const unsubscribePush = async (endpoint: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/notifications/unsubscribe`, {
        method: 'DELETE',
        body: JSON.stringify({ endpoint }),
    });
    return await response.json();
};

export const testWebPushNotification = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/notifications/test-push`, {
        method: 'POST',
    });
    return await response.json();
};

export const testWebSocketNotification = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/notifications/test-socket`, {
        method: 'POST',
    });
    return await response.json();
};

/** Notifications WebPush PENDING/SENT (non lues) de l'utilisateur connecté, avec leur nombre. */
export const getMyActiveWebPushNotifs = async (): Promise<BaseResponse<WebPushNotifActiveResponse>> => {
    const response = await secureFetch(`${getBaseUrl()}/notifications/webpush/me/active`, {
        method: 'GET',
    });
    return await response.json();
};

/** Marque une notification WebPush comme lue (appelé au clic sur la notification). */
export const markWebPushNotifAsRead = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/notifications/webpush/${id}/read`, {
        method: 'PUT',
    });
    return await response.json();
};

/** Vue admin : toutes les notifications WebPush, paginée, filtrable par statut. */
export const adminGetWebPushNotifs = async (params: { page?: number; limit?: number; status?: WebPushNotifStatus }): Promise<BaseResponse<WebPushNotifAdminListResponse>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/notifications/webpush/admin?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

/** Relance manuelle (admin) d'une notification READ ou FAILED. */
export const adminReplayWebPushNotif = async (id: string): Promise<BaseResponse<{ success: boolean }>> => {
    const response = await secureFetch(`${getBaseUrl()}/notifications/webpush/${id}/replay`, {
        method: 'PUT',
    });
    return await response.json();
};

/** Liste paginée des abonnements WebPush (Admin), avec recherche/filtre/tri. */
export const adminGetWebPushSubscriptions = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}): Promise<BaseResponse<NotificationSubscriptionListResponse>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/admin/webpush/subscriptions?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

/** Envoie une notification Push à un seul abonné (Admin). */
export const adminSendWebPushToUser = async (
    subscriptionId: string,
    notification: PushNotificationPayload,
    batchId?: string,
): Promise<BaseResponse<SendPushResult & { webPushNotifId: string | null }>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/webpush/send-user`, {
        method: 'POST',
        body: JSON.stringify({ subscriptionId, notification, batchId }),
    });
    return await response.json();
};

/** Envoie une notification Push à une sélection d'abonnés (Admin). */
export const adminSendWebPushToUsers = async (
    subscriptionIds: string[],
    notification: PushNotificationPayload,
    batchId?: string,
): Promise<BaseResponse<SendPushResult>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/webpush/send-users`, {
        method: 'POST',
        body: JSON.stringify({ subscriptionIds, notification, batchId }),
    });
    return await response.json();
};

/** Envoie une notification Push à tous les abonnés actifs (Admin). */
export const adminSendWebPushToAll = async (
    notification: PushNotificationPayload,
    batchId?: string,
): Promise<BaseResponse<SendPushResult>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/webpush/send-all`, {
        method: 'POST',
        body: JSON.stringify({ notification, batchId }),
    });
    return await response.json();
};

// test-whatsapp
export const testWhatsAppNotification = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/notifications/test-whatsapp`, {
        method: 'POST',
    });
    return await response.json();
};



export const updateChatMessage = async (id: string, content: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/chat/message/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
    });
    return await response.json();
};

export const deleteChatMessage = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/chat/message/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const reconnectUser = async (userId: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/auth/reconnect/${userId}`, {
        method: 'POST',
    });
    return await response.json();
};

/* =======================================================
   PRODUCTS & ORDERS API
======================================================= */

export const getProducts = async (params: { page?: number; limit?: number; query?: string; categoryId?: string; subCategoryId?: string; storeName?: string; typeVente?: string; minPrice?: number; maxPrice?: number }): Promise<BaseResponse<Pagination<Product>>> => {
    const queryString = toQueryString(params);
    const response = await fetch(`${getBaseUrl()}/products?${queryString}`);
    return await response.json();
};

export const getMyProducts = async (params: { page?: number; limit?: number; query?: string }): Promise<BaseResponse<Pagination<Product>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/products/my-products?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getProductById = async (id: string): Promise<BaseResponse<Product>> => {
    const { headers, qs } = await getIdentityHeadersAndQuery();
    const response = await fetch(`${getBaseUrl()}/products/${id}${qs}`, { headers });
    return await response.json();
};

export const getProductCategories = async (onlyActive: boolean = true): Promise<BaseResponse<CategoryProd[]>> => {
    const response = await fetch(`${getBaseUrl()}/products/categories?onlyActive=${onlyActive}`);
    return await response.json();
};

export const createProduct = async (formData: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/products`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const updateProduct = async (id: string, formData: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/products/${id}`, {
        method: 'PATCH',
        body: formData,
    });
    return await response.json();
};

export const deleteProduct = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/products/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const handleToggleProductActive = async (id: string, isActive: boolean): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/products/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
    });
    return await response.json();
};

export const createOrder = async (data: { items: { productId: string; quantity: number }[]; paymentMethod: string }): Promise<BaseResponse<Order>> => {
    const response = await secureFetch(`${getBaseUrl()}/orders`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const getMyOrders = async (params: { page?: number; limit?: number } = {}): Promise<BaseResponse<OrdersGroupedResponse>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/orders?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getOrderById = async (id: string): Promise<BaseResponse<Order>> => {
    const response = await secureFetch(`${getBaseUrl()}/orders/${id}`, {
        method: 'GET',
    });
    return await response.json();
};

export const updateOrderStatus = async (id: string, status: string): Promise<BaseResponse<Order>> => {
    const response = await secureFetch(`${getBaseUrl()}/orders/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
    });
    return await response.json();
};

export const getSubOrders = async (orderId: string): Promise<BaseResponse<SubOrder[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/orders/${orderId}/sub-orders`, {
        method: 'GET',
    });
    return await response.json();
};

export const updateSubOrderStatus = async (subOrderId: string, status: string): Promise<BaseResponse<SubOrder>> => {
    const response = await secureFetch(`${getBaseUrl()}/orders/sub-orders/${subOrderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
    });
    return await response.json();
};

export const removeSubOrderItems = async (subOrderId: string, orderItemIds: string[]): Promise<BaseResponse<SubOrder>> => {
    const response = await secureFetch(`${getBaseUrl()}/orders/sub-orders/${subOrderId}/remove-items`, {
        method: 'POST',
        body: JSON.stringify({ orderItemIds }),
    });
    return await response.json();
};

/* =======================================================
   ADMIN - NEW CRUD API
======================================================= */

// ADMIN - USERS
export const adminGetUsers = async (params: AdminQueryParams): Promise<BaseResponse<Pagination<User>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/admin/users?${queryString}`);
    return await response.json();
};

export const adminUpdateUser = async (id: string, data: AdminUserUpdateDto): Promise<BaseResponse<User>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

// ADMIN - PRODUCTS
export const adminGetProducts = async (params: AdminQueryParams): Promise<BaseResponse<Pagination<Product>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/admin/products?${queryString}`);
    return await response.json();
};

export const adminUpdateProduct = async (id: string, data: AdminProductUpdateDto | FormData): Promise<BaseResponse<Product>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/products/${id}`, {
        method: 'PATCH',
        body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteProduct = async (id: string): Promise<BaseResponse<Product>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/products/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

// ADMIN - CATEGORY PRODUCTS
export const adminGetCategoriesProduct = async (): Promise<BaseResponse<CategoryProd[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/category-products`);
    return await response.json();
};

export const adminCreateCategoryProduct = async (data: { name: string }): Promise<BaseResponse<CategoryProd>> => {
    const response = await secureFetch(`${getBaseUrl()}/category-products`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminUpdateCategoryProduct = async (id: string, data: { name: string }): Promise<BaseResponse<CategoryProd>> => {
    const response = await secureFetch(`${getBaseUrl()}/category-products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteCategoryProduct = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/category-products/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const adminToggleCategoryProductStatus = async (id: string, status: boolean): Promise<BaseResponse<CategoryProd>> => {
    const response = await secureFetch(`${getBaseUrl()}/category-products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    return await response.json();
};

// ADMIN - SUB-CATEGORY PRODUCTS
export const adminGetSubCategoriesProduct = async (): Promise<BaseResponse<SubCategoryProd[]>> => {
    const res = await adminGetCategoriesProduct();
    if (res.statusCode === 200 && res.data) {
        const allSubCategories = res.data.flatMap(cat => cat.subCategories || []);
        return { ...res, data: allSubCategories };
    }
    return res as any;
};

export const adminCreateSubCategoryProduct = async (data: any): Promise<BaseResponse<SubCategoryProd>> => {
    const response = await secureFetch(`${getBaseUrl()}/category-products/sub-categories`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminUpdateSubCategoryProduct = async (id: string, data: any): Promise<BaseResponse<SubCategoryProd>> => {
    const response = await secureFetch(`${getBaseUrl()}/category-products/sub-categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteSubCategoryProduct = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/category-products/sub-categories/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const adminToggleSubCategoryProductStatus = async (id: string, status: boolean): Promise<BaseResponse<SubCategoryProd>> => {
    const response = await secureFetch(`${getBaseUrl()}/category-products/sub-categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    return await response.json();
};

export const adminToggleProductStatus = async (id: string, isActive: boolean): Promise<BaseResponse<Product>> => {
    const response = await secureFetch(`${getBaseUrl()}/products/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
    });
    return await response.json();
};

// ADMIN - SERVICE CATEGORIES
export const adminGetCategories = async (params: { page?: number; limit?: number; query?: string }): Promise<BaseResponse<Pagination<Category>>> => {
    const queryString = toQueryString(params);
    const response = await fetch(`${getBaseUrl()}/categories?${queryString}`);
    return await response.json();
};

export const adminCreateCategory = async (formData: FormData): Promise<BaseResponse<Category>> => {
    const response = await secureFetch(`${getBaseUrl()}/categories`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const adminUpdateCategory = async (id: string, formData: FormData): Promise<BaseResponse<Category>> => {
    const response = await secureFetch(`${getBaseUrl()}/categories/${id}`, {
        method: 'PATCH',
        body: formData,
    });
    return await response.json();
};

export const adminDeleteCategory = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/categories/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

// ADMIN - SERVICES
export const adminGetServices = async (params: AdminQueryParams): Promise<BaseResponse<Pagination<Service>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/admin/services?${queryString}`);
    return await response.json();
};

export const adminUpdateService = async (id: string, data: AdminServiceUpdateDto | FormData): Promise<BaseResponse<Service>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/services/${id}`, {
        method: 'PATCH',
        body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteService = async (id: string): Promise<BaseResponse<Service>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/services/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const adminToggleServiceActive = async (id: string, value: boolean): Promise<BaseResponse<Service>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/services/${id}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
    });
    return await response.json();
};

// ADMIN - ANNONCES
export const adminGetAnnonces = async (params: AdminQueryParams): Promise<BaseResponse<Pagination<Annonce>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/admin/annonces?${queryString}`);
    return await response.json();
};

export const adminUpdateAnnonce = async (id: string, data: AdminAnnonceUpdateDto | FormData): Promise<BaseResponse<Annonce>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/annonces/${id}`, {
        method: 'PATCH',
        body: data instanceof FormData ? data : JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteAnnonce = async (id: string): Promise<BaseResponse<Annonce>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/annonces/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const adminToggleAnnonceActive = async (id: string, value: boolean): Promise<BaseResponse<Annonce>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/annonces/${id}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
    });
    return await response.json();
};

// ADMIN - CATEGORIE ANNONCES
export const adminGetCategorieAnnonces = async (params: { page?: number; limit?: number; query?: string }): Promise<BaseResponse<Pagination<CategorieAnnonce>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/categorie-annonce?${queryString}`);
    return await response.json();
};

export const adminCreateCategorieAnnonce = async (formData: FormData): Promise<BaseResponse<CategorieAnnonce>> => {
    const response = await secureFetch(`${getBaseUrl()}/categorie-annonce`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const adminUpdateCategorieAnnonce = async (id: string, formData: FormData): Promise<BaseResponse<CategorieAnnonce>> => {
    const response = await secureFetch(`${getBaseUrl()}/categorie-annonce/${id}`, {
        method: 'PATCH',
        body: formData,
    });
    return await response.json();
};

export const adminDeleteCategorieAnnonce = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/categorie-annonce/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

// ADMIN - TYPE ANNONCES
export const adminGetTypeAnnonces = async (params: { page?: number; limit?: number; query?: string }): Promise<BaseResponse<Pagination<TypeAnnonce>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/type-annonce?${queryString}`);
    return await response.json();
};

export const adminCreateTypeAnnonce = async (data: { label: string }): Promise<BaseResponse<TypeAnnonce>> => {
    const response = await secureFetch(`${getBaseUrl()}/type-annonce`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminUpdateTypeAnnonce = async (id: string, data: { label: string }): Promise<BaseResponse<TypeAnnonce>> => {
    const response = await secureFetch(`${getBaseUrl()}/type-annonce/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteTypeAnnonce = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/type-annonce/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const setSystemSubscriptionStatus = async (isEnabled: boolean): Promise<BaseResponse<boolean>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/subscription-plans/set-system-status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isEnabled }),
    });
    return await response.json();
};

/* =======================================================
   LOGISTICS API
======================================================= */

// --- Services ---
export const getLogisticServices = async (params: { query?: string; transportType?: string; companyName?: string; page?: number; limit?: number } = {}): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params);
    const response = await fetch(`${getBaseUrl()}/logistics/services?${queryString}`);
    return await response.json();
};

export const findAllPrestataire = async (params: { query?: string; transportType?: string; page?: number; limit?: number } = {}): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params);
    const response = await fetch(`${getBaseUrl()}/logistics/services/search/company?${queryString}`);
    return await response.json();
};


export const getMyLogisticServices = async (params: { query?: string; transportType?: string; page?: number; limit?: number } = {}): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/logistics/services/my-services?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getLogisticServiceById = async (id: string): Promise<BaseResponse<LogisticService>> => {
    const response = await fetch(`${getBaseUrl()}/logistics/services/${id}`);
    return await response.json();
};

export const createLogisticService = async (formData: FormData): Promise<BaseResponse<LogisticService>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/services`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const updateLogisticService = async (id: string, formData: FormData): Promise<BaseResponse<LogisticService>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/services/${id}`, {
        method: 'PATCH',
        body: formData,
    });
    return await response.json();
};

export const deleteLogisticService = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/services/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const patchLogisticServiceStatus = async (id: string, isActive: boolean): Promise<BaseResponse<LogisticService>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/services/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
    });
    return await response.json();
};

export const toggleLogisticStatus = async (isEnabled: boolean): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/services/toggle/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled }),
    });
    return await response.json();
};

// --- Quotes ---
export const createQuote = async (data: any): Promise<BaseResponse<Quote>> => {
    const isFormData = data instanceof FormData;
    const response = await secureFetch(`${getBaseUrl()}/logistics/quotes`, {
        method: 'POST',
        body: isFormData ? data : JSON.stringify(data),
    });
    return await response.json();
};

export const updateQuote = async (id: string, data: any): Promise<BaseResponse<Quote>> => {
    const isFormData = data instanceof FormData;
    const response = await secureFetch(`${getBaseUrl()}/logistics/quotes/${id}`, {
        method: 'PATCH',
        body: isFormData ? data : JSON.stringify(data),
    });
    return await response.json();
};

export const getSentQuotes = async (params?: { status?: QuoteStatus; page?: number; limit?: number }): Promise<BaseResponse<any>> => {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    let url = `${getBaseUrl()}/logistics/quotes/my/sent?page=${page}&limit=${limit}`;
    if (params?.status) url += `&status=${params.status}`;
    const response = await secureFetch(url, {
        method: 'GET',
    });
    return await response.json();
};

export const getReceivedQuotes = async (params?: { status?: QuoteStatus; page?: number; limit?: number }): Promise<BaseResponse<any>> => {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    let url = `${getBaseUrl()}/logistics/quotes/my/received?page=${page}&limit=${limit}`;
    if (params?.status) url += `&status=${params.status}`;
    const response = await secureFetch(url, {
        method: 'GET',
    });
    return await response.json();
};

export const getQuoteById = async (id: string): Promise<BaseResponse<Quote>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/quotes/${id}`, {
        method: 'GET',
    });
    return await response.json();
};

export const updateQuoteStatus = async (id: string, status: QuoteStatus, montantTransac?: number): Promise<BaseResponse<Quote>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/quotes/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, montantTransac }),
    });
    return await response.json();
};

export const searchLocation = async (query: string, countryCode?: string): Promise<BaseResponse<any[]>> => {
    let url = `${getBaseUrl()}/logistics/quotes/search/location?q=${encodeURIComponent(query)}`;
    if (countryCode) {
        url += `&countryCode=${countryCode}`;
    }
    const response = await fetch(url);
    return await response.json();
};

// --- Deliveries ---
export const createDeliveryFromQuote = async (quoteId: string): Promise<BaseResponse<Delivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/deliveries/from-quote/${quoteId}`, {
        method: 'POST',
    });
    return await response.json();
};

export const getDeliveries = async (params?: { status?: DeliveryStatus; page?: number; limit?: number }): Promise<BaseResponse<any>> => {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    let url = `${getBaseUrl()}/logistics/deliveries/my?page=${page}&limit=${limit}`;
    if (params?.status) url += `&status=${params.status}`;
    const response = await secureFetch(url, {
        method: 'GET',
    });
    return await response.json();
};

export const getMyDeliveries = async (params?: { status?: DeliveryStatus; page?: number; limit?: number }): Promise<BaseResponse<any>> => {
    return getDeliveries(params);
};

export const getDriverDeliveries = async (params?: { status?: DeliveryStatus; page?: number; limit?: number }): Promise<BaseResponse<any>> => {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    let url = `${getBaseUrl()}/logistics/deliveries/driver?page=${page}&limit=${limit}`;
    if (params?.status) url += `&status=${params.status}`;
    const response = await secureFetch(url, {
        method: 'GET',
    });
    return await response.json();
};

export const getDeliveryById = async (id: string): Promise<BaseResponse<Delivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/deliveries/${id}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getDeliveryDocumentData = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/deliveries/${id}/document-data`, {
        method: 'GET',
    });
    return await response.json();
};

export const updateDeliveryStatus = async (id: string, status: DeliveryStatus): Promise<BaseResponse<Delivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/deliveries/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    return await response.json();
};

// --- Tracking ---
export const createTrackingEvent = async (deliveryId: string, data: { status: DeliveryStatus, location: string, note?: string }): Promise<BaseResponse<DeliveryTracking>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/deliveries/${deliveryId}/tracking`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const getTrackingByDelivery = async (deliveryId: string, params?: { page?: number; limit?: number }): Promise<BaseResponse<any>> => {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const response = await secureFetch(`${getBaseUrl()}/logistics/deliveries/${deliveryId}/tracking?page=${page}&limit=${limit}`, {
        method: 'GET',
    });
    return await response.json();
};


/* =======================================================
   GAS DELIVERY API (recharge de gaz à domicile)
======================================================= */

// --- Marketplace public ---
export const getPublicGasBottles = async (params?: { page?: number; limit?: number; providerId?: string }): Promise<BaseResponse<Pagination<GasBottle>>> => {
    const response = await fetch(`${getBaseUrl()}/gas-delivery/bottles?${toQueryString(params || {})}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getPublicGasProviders = async (params: { page?: number; limit?: number; query?: string; lat?: number; lng?: number; radiusKm?: number }): Promise<BaseResponse<Pagination<GasProvider> & { isFallback?: boolean }>> => {
    const queryString = toQueryString(params);
    const response = await fetch(`${getBaseUrl()}/gas-delivery/providers?${queryString}`);
    return await response.json();
};

// --- Profil prestataire ---
export const upsertGasProvider = async (data: { companyName: string; whatsapp?: string; phone?: string; isAvailable?: boolean; address?: string; latitude?: number; longitude?: number; description?: string }): Promise<BaseResponse<GasProvider>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/providers/profile`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const getMyGasProvider = async (): Promise<BaseResponse<GasProvider>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/providers/profile`, {
        method: 'GET',
    });
    return await response.json();
};

export const getGasProviderStats = async (): Promise<BaseResponse<GasProviderStats>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/providers/stats`, {
        method: 'GET',
    });
    return await response.json();
};

// --- Catalogue de bouteilles (prestataire) ---
export const createGasBottle = async (data: { brand: string; format: GasBottleFormat; weight: number; price: number; isAvailable?: boolean }): Promise<BaseResponse<GasBottle>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/bottles`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updateGasBottle = async (id: string, data: { brand?: string; format?: GasBottleFormat; weight?: number; price?: number; isAvailable?: boolean }): Promise<BaseResponse<GasBottle>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/bottles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteGasBottle = async (id: string): Promise<BaseResponse<boolean>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/bottles/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const getMyGasBottles = async (params?: { page?: number; limit?: number }): Promise<BaseResponse<Pagination<GasBottle>>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/bottles/my?${toQueryString(params || {})}`, {
        method: 'GET',
    });
    return await response.json();
};

// --- Demandes de recharge (client) ---
export const createGasDelivery = async (data: { clientPhone: string; address: string; latitude: number; longitude: number; bottleId: string }): Promise<BaseResponse<GasDelivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/deliveries`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const getMyGasDeliveries = async (): Promise<BaseResponse<GasDelivery[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/deliveries/my`, {
        method: 'GET',
    });
    return await response.json();
};

export const cancelMyGasDelivery = async (id: string): Promise<BaseResponse<GasDelivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/deliveries/${id}/cancel`, {
        method: 'PATCH',
    });
    return await response.json();
};

// --- Gestion des demandes (prestataire) ---
export const getPendingGasDeliveries = async (): Promise<BaseResponse<GasDelivery[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/deliveries/pending`, {
        method: 'GET',
    });
    return await response.json();
};

export const getAssignedGasDeliveries = async (): Promise<BaseResponse<GasDelivery[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/deliveries/assigned`, {
        method: 'GET',
    });
    return await response.json();
};

export const acceptGasDelivery = async (id: string): Promise<BaseResponse<GasDelivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/deliveries/${id}/accept`, {
        method: 'PATCH',
    });
    return await response.json();
};

export const updateGasDeliveryStatus = async (id: string, status: GasDeliveryStatus): Promise<BaseResponse<GasDelivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/deliveries/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    return await response.json();
};

// --- Administration ---
export const adminGetGasOverview = async (): Promise<BaseResponse<GasAdminOverview>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/admin/overview`, {
        method: 'GET',
    });
    return await response.json();
};

export const adminGetGasProviders = async (params?: { page?: number; limit?: number; search?: string }): Promise<BaseResponse<Pagination<GasProviderAdminRow>>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/admin/providers?${toQueryString(params || {})}`, {
        method: 'GET',
    });
    return await response.json();
};

export const adminSetGasProviderAvailability = async (id: string, isAvailable: boolean): Promise<BaseResponse<GasProvider>> => {
    const response = await secureFetch(`${getBaseUrl()}/gas-delivery/admin/providers/${id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable }),
    });
    return await response.json();
};

/* =======================================================
   GARAGE API (Annuaire des Garages)
======================================================= */

// --- Recherche & fiche publiques ---
export const getPublicGarages = async (params: { page?: number; limit?: number; query?: string; lat?: number; lng?: number; radiusKm?: number }): Promise<BaseResponse<Pagination<Garage> & { isFallback?: boolean }>> => {
    const response = await fetch(`${getBaseUrl()}/garages?${toQueryString(params)}`);
    return await response.json();
};

export const getGarageById = async (id: string): Promise<BaseResponse<Garage>> => {
    const response = await fetch(`${getBaseUrl()}/garages/${id}`);
    return await response.json();
};

export const getGaragePieces = async (garageId: string): Promise<BaseResponse<GaragePieceCatalogue[]>> => {
    const response = await fetch(`${getBaseUrl()}/garages/${garageId}/pieces`);
    return await response.json();
};

// --- Mes garages (propriétaire) ---
export const getMyGarages = async (): Promise<BaseResponse<Garage[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/garages/my`, { method: 'GET' });
    return await response.json();
};

export const createGarage = async (formData: FormData): Promise<BaseResponse<Garage>> => {
    const response = await secureFetch(`${getBaseUrl()}/garages`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const updateGarage = async (id: string, formData: FormData): Promise<BaseResponse<Garage>> => {
    const response = await secureFetch(`${getBaseUrl()}/garages/${id}`, {
        method: 'PATCH',
        body: formData,
    });
    return await response.json();
};

export const deleteGarage = async (id: string): Promise<BaseResponse<boolean>> => {
    const response = await secureFetch(`${getBaseUrl()}/garages/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

// --- Catalogue de pièces d'un garage (propriétaire) ---
export const getMyGaragePieces = async (garageId: string): Promise<BaseResponse<GaragePieceCatalogue[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/garages/${garageId}/pieces/my`, { method: 'GET' });
    return await response.json();
};

export const createGaragePiece = async (garageId: string, formData: FormData): Promise<BaseResponse<GaragePieceCatalogue>> => {
    const response = await secureFetch(`${getBaseUrl()}/garages/${garageId}/pieces`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const updateGaragePiece = async (id: string, formData: FormData): Promise<BaseResponse<GaragePieceCatalogue>> => {
    const response = await secureFetch(`${getBaseUrl()}/garages/pieces/${id}`, {
        method: 'PATCH',
        body: formData,
    });
    return await response.json();
};

export const deleteGaragePiece = async (id: string): Promise<BaseResponse<boolean>> => {
    const response = await secureFetch(`${getBaseUrl()}/garages/pieces/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

/* =======================================================
   LOCATION LOG API
======================================================= */
export const upsertLocationLog = async (data: { lat: number; lng: number; context: 'login' | 'akwaba' }): Promise<BaseResponse<LocationLog>> => {
    const response = await secureFetch(`${getBaseUrl()}/location-log`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const getLocationLogByUserId = async (userId: string): Promise<BaseResponse<LocationLog>> => {
    const response = await secureFetch(`${getBaseUrl()}/location-log/${userId}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getAllLocationLogs = async (params: { page?: number; limit?: number; phone?: string }): Promise<BaseResponse<Pagination<LocationLog>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/location-log?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const deleteLocationLog = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/location-log/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

// --- Clients (Logistics) ---
export const getCompanyClients = async (params: { page?: number; limit?: number; type?: string } = {}): Promise<BaseResponse<Pagination<LogisticsClient>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/logistics/clients?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const createCompanyClient = async (data: any): Promise<BaseResponse<LogisticsClient>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/clients`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updateCompanyClient = async (id: string, data: any): Promise<BaseResponse<LogisticsClient>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteCompanyClient = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/clients/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

// --- Fleet Management ---
export const getFleet = async (params: { page?: number; limit?: number } = {}): Promise<BaseResponse<Pagination<any>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/logistics/fleet?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getActiveFleet = async (): Promise<BaseResponse<any[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/fleet/active`, {
        method: 'GET',
    });
    const res = await response.json();
    return res.data || [];
};

export const createFleetItem = async (data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/fleet`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updateFleetItem = async (id: string, data: any): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/fleet/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteFleetItem = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/fleet/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const toggleFleetStatus = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/fleet/${id}/toggle-status`, {
        method: 'PATCH',
    });
    return await response.json();
};

// --- Seed Administration ---
export interface SeedTableConfig {
    name: string;
    key: string;
    order: number;
    dependsOn?: string[];
    description?: string;
}

export const getSeedConfig = async (): Promise<BaseResponse<SeedTableConfig[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/seed`, {
        method: 'GET',
    });
    return await response.json();
};

export const runSeed = async (tables: string[]): Promise<BaseResponse<{ success: boolean; logs: string[] }>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/seed/run`, {
        method: 'POST',
        body: JSON.stringify({ tables }),
    });
    return await response.json();
};

export const runFullSeed = async (): Promise<BaseResponse<string[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/seed/full`, {
        method: 'POST',
    });
    return await response.json();
};

export const clearDatabase = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/seed/clear`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const assignToDelivery = async (deliveryId: string, data: { floteIds?: string[], driverIds?: string[] }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/deliveries/${deliveryId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const getVideos = async (): Promise<BaseResponse<Video[]>> => {
    const response = await fetch(`${getBaseUrl()}/videos`);
    return await response.json();
};

export const adminCreateVideo = async (data: any): Promise<BaseResponse<Video>> => {
    const response = await secureFetch(`${getBaseUrl()}/videos`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminUpdateVideo = async (id: string, data: any): Promise<BaseResponse<Video>> => {
    const response = await secureFetch(`${getBaseUrl()}/videos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteVideo = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/videos/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

/* =======================================================
   EASY DELIVERY API
======================================================= */

export const getMyDeliveryProfile = async (): Promise<BaseResponse<EasyDelivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/profile`, { method: 'GET' });
    return await response.json();
};

export const upsertDeliveryProfile = async (data: any): Promise<BaseResponse<EasyDelivery>> => {
    const isFormData = data instanceof FormData;
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/profile/upsert`, {
        method: 'POST',
        body: isFormData ? data : JSON.stringify(data),
    });
    return await response.json();
};

export const updateDeliveryProfile = async (data: any): Promise<BaseResponse<EasyDelivery>> => {
    const isFormData = data instanceof FormData;
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/profile`, {
        method: 'PATCH',
        body: isFormData ? data : JSON.stringify(data),
    });
    return await response.json();
};

export const getAvailableDrivers = async (params?: { page?: number; limit?: number }): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params || {});
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/drivers/available?${queryString}`, { method: 'GET' });
    return await response.json();
};

export const assignOrderToDriver = async (data: {
    driverId: string;
    orderId?: string;
    pickupLat?: number;
    pickupLng?: number;
    dropoffLat?: number;
    dropoffLng?: number;
    recipientName?: string;
    recipientPhone?: string;
    deliveryNotes?: string;
    deliveryPrice?: number;
}): Promise<BaseResponse<HistoryDelivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/assign`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const unassignDriver = async (deliveryId: string): Promise<BaseResponse<HistoryDelivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/unassign/${deliveryId}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const getDriverHistory = async (params?: { page?: number; limit?: number; status?: 'active' | 'history' }): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params || {});
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/history?${queryString}`, { method: 'GET' });
    return await response.json();
};

export const getDriverStats = async (): Promise<BaseResponse<DriverStats>> => {
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/stats`, { method: 'GET' });
    return await response.json();
};

export const updateEasyDeliveryLocation = async (deliveryId: string, data: { lat: number; lng: number }): Promise<BaseResponse<HistoryDelivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/tracking/${deliveryId}/location`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const updateEasyDeliveryStatus = async (deliveryId: string, status: EasyDeliveryStatus): Promise<BaseResponse<HistoryDelivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/tracking/${deliveryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    return await response.json();
};

export const getLiveTracking = async (deliveryId: string): Promise<BaseResponse<HistoryDelivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/tracking/${deliveryId}`, { method: 'GET' });
    return await response.json();
};

export const getDeliveriesByOrder = async (orderId: string): Promise<BaseResponse<HistoryDelivery[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/order/${orderId}`, { method: 'GET' });
    return await response.json();
};

export const adminGetDeliveryProfiles = async (params?: { page?: number; limit?: number; search?: string }): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params || {});
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/admin/profiles?${queryString}`, { method: 'GET' });
    return await response.json();
};

export const adminDeleteDeliveryProfile = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/admin/profiles/${id}`, { method: 'DELETE' });
    return await response.json();
};

export const adminUpsertDeliveryProfile = async (userId: string, data: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/easy-delivery/admin/profiles/${userId}`, {
        method: 'POST',
        body: data,
    });
    return await response.json();
};

// ===============================
// ADMIN LOGISTICS
// ===============================

export const adminGetLogisticsServices = async (params?: any): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params || {});
    const response = await secureFetch(`${getBaseUrl()}/logistics/services?${queryString}`, { method: 'GET' });
    return await response.json();
};

export const adminGetLogisticsQuotes = async (params?: any): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params || {});
    const response = await secureFetch(`${getBaseUrl()}/logistics/quotes/admin/all?${queryString}`, { method: 'GET' });
    return await response.json();
};

export const adminGetLogisticsDeliveries = async (params?: any): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params || {});
    const response = await secureFetch(`${getBaseUrl()}/logistics/deliveries/admin/all?${queryString}`, { method: 'GET' });
    return await response.json();
};

export const adminGetLogisticsFleet = async (params?: any): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params || {});
    const response = await secureFetch(`${getBaseUrl()}/logistics/fleet/admin/all?${queryString}`, { method: 'GET' });
    return await response.json();
};

/* =======================================================
   SLIDERS API
======================================================= */
export const getSliders = async (): Promise<BaseResponse<Slider[]>> => {
    const response = await fetch(`${getBaseUrl()}/sliders`);
    return await response.json();
};

export const getSlidersAdmin = async (): Promise<BaseResponse<Slider[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/sliders/admin`, {
        method: 'GET',
    });
    return await response.json();
};

export const createSlider = async (formData: FormData): Promise<BaseResponse<Slider>> => {
    const response = await secureFetch(`${getBaseUrl()}/sliders`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const updateSlider = async (id: string, formData: FormData): Promise<BaseResponse<Slider>> => {
    const response = await secureFetch(`${getBaseUrl()}/sliders/${id}`, {
        method: 'PATCH',
        body: formData,
    });
    return await response.json();
};

export const deleteSlider = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/sliders/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};

export const toggleSliderStatus = async (id: string, value: boolean): Promise<BaseResponse<Slider>> => {
    const response = await secureFetch(`${getBaseUrl()}/sliders/${id}/toggle-status`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
    });
    return await response.json();
};

export const toggleSliderActive = async (id: string, value: boolean): Promise<BaseResponse<Slider>> => {
    const response = await secureFetch(`${getBaseUrl()}/sliders/${id}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
    });
    return await response.json();
};

/* =======================================================
   REPORTS API
======================================================= */

export interface CreateReportDto {
    entityType: 'USER' | 'SERVICE' | 'ANNONCE' | 'PRODUCT' | 'LOGISTIC_SERVICE' | 'EASY_DELIVERY' | 'BOOKING';
    entityId: string;
    reason: 'SPAM' | 'INAPPROPRIATE_CONTENT' | 'FAKE_PROFILE' | 'FRAUD' | 'VIOLENCE' | 'HARASSMENT' | 'COPYRIGHT' | 'OTHER';
    description?: string;
}

export interface UpdateReportDto {
    status?: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'IGNORED' | 'ARCHIVED';
    adminAction?: 'NO_ACTION' | 'WARNING_SENT' | 'CONTENT_DISABLED' | 'CONTENT_DELETED' | 'USER_BANNED' | 'ARCHIVED';
    adminNote?: string;
}

export const createReport = async (data: CreateReportDto): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/reports`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const getReports = async (params: { status?: string; page?: number; limit?: number }): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/reports?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

export const getReportById = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/reports/${id}`, {
        method: 'GET',
    });
    return await response.json();
};

export const updateReport = async (id: string, data: UpdateReportDto): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const deleteReport = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/reports/${id}`, {
        method: 'DELETE',
    });
    return await response.json();
};


/* =======================================================
   LIVES / SHORTS
======================================================= */

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

/** Feed TikTok randomisé */
export const getLivesFeed = async (params: {
    page?: number;
    limit?: number;
    seed?: number;
    excludeIds?: string;
    entityType?: LiveEntityType;
}): Promise<BaseResponse<LiveFeedResponse>> => {
    const { page = 1, limit = 10, seed, excludeIds, entityType } = params;
    let url = `${getBaseUrl()}/lives/feed?page=${page}&limit=${limit}`;
    if (seed !== undefined) url += `&seed=${seed}`;
    if (excludeIds) url += `&excludeIds=${encodeURIComponent(excludeIds)}`;
    if (entityType) url += `&entityType=${entityType}`;
    const response = await fetch(url);
    return await response.json();
};

/** Liste publique avec filtres */
export const getLives = async (params: {
    page?: number;
    limit?: number;
    entityType?: LiveEntityType;
    entityId?: string;
    userId?: string;
    status?: LiveStatus;
}): Promise<BaseResponse<LiveListResponse>> => {
    const { page = 1, limit = 10, entityType, entityId, userId, status } = params;
    let url = `${getBaseUrl()}/lives?page=${page}&limit=${limit}`;
    if (entityType) url += `&entityType=${entityType}`;
    if (entityId) url += `&entityId=${entityId}`;
    if (userId) url += `&userId=${userId}`;
    if (status) url += `&status=${status}`;
    const response = await fetch(url);
    return await response.json();
};

/** Détail d'un Live */
export const getLiveById = async (id: string): Promise<BaseResponse<Live>> => {
    const response = await fetch(`${getBaseUrl()}/lives/${id}`);
    return await response.json();
};

/** Lives publiés d'un utilisateur */
export const getLivesByUser = async (userId: string, params?: { page?: number; limit?: number }): Promise<BaseResponse<LiveListResponse>> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const response = await fetch(`${getBaseUrl()}/lives/user/${userId}?page=${page}&limit=${limit}`);
    return await response.json();
};

/** Liker un Live */
export const likeLive = async (id: string): Promise<BaseResponse<Live>> => {
    const response = await fetch(`${getBaseUrl()}/lives/${id}/like`, { method: 'POST' });
    return await response.json();
};

/** Compter un partage */
export const shareLive = async (id: string): Promise<BaseResponse<Live>> => {
    const response = await fetch(`${getBaseUrl()}/lives/${id}/share`, { method: 'POST' });
    return await response.json();
};

// ─── AUTHENTIFIÉ ─────────────────────────────────────────────────────────────

/** Mes propres Lives */
export const getMyLives = async (params: {
    page?: number;
    limit?: number;
    status?: LiveStatus;
}): Promise<BaseResponse<LiveListResponse>> => {
    const { page = 1, limit = 10, status } = params;
    let url = `${getBaseUrl()}/lives/my?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    const response = await secureFetch(url, { method: 'GET' });
    return await response.json();
};

/** KPI de mes Lives (propriétaire) */
export const getMyLiveStats = async (): Promise<BaseResponse<LiveStats>> => {
    const response = await secureFetch(`${getBaseUrl()}/lives/my/stats`, { method: 'GET' });
    return await response.json();
};

/** Créer un Live */
export const createLive = async (data: {
    title: string;
    description?: string;
    videoLink: string;
    entityType?: LiveEntityType;
    entityId?: string;
}): Promise<BaseResponse<Live>> => {
    const response = await secureFetch(`${getBaseUrl()}/lives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return await response.json();
};

/** Modifier un Live */
export const updateLive = async (id: string, data: {
    title?: string;
    description?: string;
    videoLink?: string;
    entityType?: LiveEntityType;
    entityId?: string;
}): Promise<BaseResponse<Live>> => {
    const response = await secureFetch(`${getBaseUrl()}/lives/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return await response.json();
};

/** Supprimer un Live */
export const deleteLive = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/lives/${id}`, { method: 'DELETE' });
    return await response.json();
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const adminGetLives = async (params: { page?: number; limit?: number; status?: LiveStatus; userId?: string }): Promise<BaseResponse<LiveListResponse>> => {
    const { page = 1, limit = 20, status, userId } = params;
    let url = `${getBaseUrl()}/lives/admin/all?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (userId) url += `&userId=${userId}`;
    const response = await secureFetch(url, { method: 'GET' });
    return await response.json();
};

export const adminUpdateLive = async (id: string, data: { status?: LiveStatus; title?: string; description?: string }): Promise<BaseResponse<Live>> => {
    const response = await secureFetch(`${getBaseUrl()}/lives/admin/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminDeleteLive = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/lives/admin/${id}`, { method: 'DELETE' });
    return await response.json();
};

export const adminGetLiveStats = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/lives/admin/stats`, { method: 'GET' });
    return await response.json();
};

// ─── Product Returns / SAV ──────────────────────────────────────────────────

export const createProductReturn = async (formData: FormData): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/product-returns`, { method: 'POST', body: formData });
    return await response.json();
};

export const getMyProductReturns = async (params?: { status?: string; page?: number; limit?: number }): Promise<BaseResponse<any>> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const response = await secureFetch(`${getBaseUrl()}/product-returns?${query.toString()}`, { method: 'GET' });
    return await response.json();
};

export const getProductReturnById = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/product-returns/${id}`, { method: 'GET' });
    return await response.json();
};

export const updateProductReturnStatus = async (id: string, body: { status: string; sellerNote?: string }): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/product-returns/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return await response.json();
};

export const confirmReturnReception = async (id: string): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/product-returns/${id}/confirm-reception`, { method: 'PATCH' });
    return await response.json();
};

// =====================
// AI / MCP TOOLS
// =====================

export interface AiToolSummary {
    name: string;
    description: string;
    allowedRoles: string[] | 'ANY';
    inputSchema: Record<string, any>;
}

export const listAiTools = async (): Promise<BaseResponse<AiToolSummary[]>> => {
    const response = await secureFetch(`${getMcpBaseUrl()}/ai-mcp/tools`, { method: 'GET' });
    return await response.json();
};

export const executeAiTool = async (
    name: string,
    input: Record<string, any>,
): Promise<BaseResponse<{ result: any; durationMs: number }>> => {
    const response = await secureFetch(`${getMcpBaseUrl()}/ai-mcp/tools/${name}/execute`, {
        method: 'POST',
        body: JSON.stringify({ input }),
    });
    return await response.json();
};

// =====================
// AI / MCP CHAT
// =====================

export type AiChatRole = 'user' | 'assistant';

export interface AiChatHistoryMessage {
    role: AiChatRole;
    content: string | Record<string, any>[];
}

export interface AiChatResponse {
    reply: string;
    history: AiChatHistoryMessage[];
}

export const sendAiChatMessage = async (payload: {
    message: string;
    agentName?: string;
    history?: AiChatHistoryMessage[];
}): Promise<BaseResponse<AiChatResponse>> => {
    const response = await secureFetch(`${getMcpBaseUrl()}/ai-mcp/chat`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return await response.json();
};

// =====================
// WEBAUTHN / BIOMETRICS
// =====================

export const webAuthnGenerateRegistrationOptions = async (): Promise<any> => {
    const response = await secureFetch(`${getBaseUrl()}/webauthn/register/generate-options`, {
        method: 'POST',
    });
    return await response.json();
};

export const webAuthnVerifyRegistration = async (payload: {
    response: string;
    deviceName?: string;
}): Promise<BaseResponse<{ verified: boolean }>> => {
    const response = await secureFetch(`${getBaseUrl()}/webauthn/register/verify`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return await response.json();
};

export const webAuthnGenerateLoginOptions = async (identifier: string): Promise<any> => {
    const response = await fetch(`${getBaseUrl()}/webauthn/login/generate-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
    });
    return await response.json();
};

export const webAuthnVerifyLogin = async (payload: {
    identifier: string;
    response: string;
}): Promise<BaseResponse<{ accessToken: string; refreshToken: string; role: string }>> => {
    const response = await fetch(`${getBaseUrl()}/webauthn/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return await response.json();
};

export const webAuthnListCredentials = async (): Promise<BaseResponse<any[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/webauthn/credentials`, {
        method: 'GET',
    });
    return await response.json();
};

export const webAuthnDeleteCredential = async (credentialId: string): Promise<BaseResponse<{ deleted: boolean }>> => {
    const response = await secureFetch(`${getBaseUrl()}/webauthn/credentials/${credentialId}`, {
        method: 'DELETE',
    });
    return await response.json();
};

/* ─── Analytics ─────────────────────────────────────────────────────────────── */
export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year';

export interface AnalyticsQuery {
    period?: AnalyticsPeriod;
    module?: string;
    page?: number;
    limit?: number;
}

export const analyticsGetOverview = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/overview${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsGetTraffic = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/traffic${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsGetModules = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/modules${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsGetRoutes = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/routes${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsGetDevices = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/devices${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsGetTopUsers = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/users${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsGetRealtime = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/realtime${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsGetRevenue = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/revenue${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsGetTopProducts = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/top-products${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsGetTopSellers = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/top-sellers${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsGetTopServices = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/top-services${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsGetTopAnnonces = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/analytics/top-annonces${qs ? `?${qs}` : ''}`);
    return r.json();
};

/* ─── Analytics — Visites (site-visit) ─────────────────────────────────────── */

export const analyticsSiteVisitGetOverview = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/site-visit/overview${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsSiteVisitGetTrend = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/site-visit/trend${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsSiteVisitGetDevices = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/site-visit/devices${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const analyticsSiteVisitGetTopUsers = async (q: AnalyticsQuery = {}): Promise<BaseResponse<any>> => {
    const qs = new URLSearchParams(q as any).toString();
    const r = await secureFetch(`${getBaseUrl()}/site-visit/top-users${qs ? `?${qs}` : ''}`);
    return r.json();
};

// ─── Historique unifié (commandes / réservations / livraisons de gaz) ─────────

export type ActivityHistoryType = 'commandes' | 'booking' | 'gas-delivery';
export type ActivityHistoryBookingType = 'SERVICE' | 'ANNONCE';

export const getMyActivityHistory = async (params: { type: ActivityHistoryType; bookingType?: ActivityHistoryBookingType; page?: number; limit?: number }): Promise<BaseResponse<Pagination<Order | Booking | GasDelivery>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/activity-history?${queryString}`, {
        method: 'GET',
    });
    return await response.json();
};

/* ─── Marketing / Call Center ────────────────────────────────────────────────── */

export const marketingGetOverview = async (period: AnalyticsPeriod): Promise<BaseResponse<any>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/kpi/overview?period=${period}`);
    return r.json();
};

export const marketingGetModuleBreakdown = async (period: AnalyticsPeriod): Promise<BaseResponse<any>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/kpi/module-breakdown?period=${period}`);
    return r.json();
};

export const marketingGetTrend = async (period: AnalyticsPeriod): Promise<BaseResponse<any>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/kpi/trend?period=${period}`);
    return r.json();
};

export interface MarketingCallQuery {
    statut?: string;
    priorite?: string;
    module?: string;
    search?: string;
    clientId?: string;
    page?: number;
    limit?: number;
}

export const marketingGetCalls = async (query: MarketingCallQuery = {}): Promise<BaseResponse<any>> => {
    const qs = toQueryString(query as Record<string, any>);
    const r = await secureFetch(`${getBaseUrl()}/marketing/calls${qs ? `?${qs}` : ''}`);
    return r.json();
};

export const marketingGetCall = async (id: string): Promise<BaseResponse<any>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/calls/${id}`);
    return r.json();
};

export const marketingCreateCall = async (data: Record<string, any>): Promise<BaseResponse<any>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/calls`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return r.json();
};

export const marketingUpdateCall = async (id: string, data: Record<string, any>): Promise<BaseResponse<any>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/calls/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return r.json();
};

export const buildMarketingExportUrl = (format: 'csv' | 'xlsx', query: MarketingCallQuery = {}): string => {
    const qs = toQueryString({ ...query, format } as Record<string, any>);
    return `${getBaseUrl()}/marketing/calls/export?${qs}`;
};

export const marketingGetCampaigns = async (): Promise<BaseResponse<any[]>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/campaigns`);
    return r.json();
};

export const marketingLaunchCampaign = async (actionKey: string, payload?: { title?: string; body?: string }): Promise<BaseResponse<any>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/campaigns/${actionKey}/launch`, {
        method: 'POST',
        body: JSON.stringify(payload ?? {}),
    });
    return r.json();
};

export const adminSearchUserByPhone = async (phone: string): Promise<BaseResponse<User | null>> => {
    const r = await secureFetch(`${getBaseUrl()}/admin/users/search?phone=${encodeURIComponent(phone)}`);
    return r.json();
};

export interface MarketingMessageTemplate {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    updatedAt: string;
}

export const marketingGetMessageTemplates = async (): Promise<BaseResponse<MarketingMessageTemplate[]>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/message-templates`);
    return r.json();
};

export const marketingCreateMessageTemplate = async (data: { title: string; body: string }): Promise<BaseResponse<MarketingMessageTemplate>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/message-templates`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return r.json();
};

export const marketingUpdateMessageTemplate = async (id: string, data: { title?: string; body?: string }): Promise<BaseResponse<MarketingMessageTemplate>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/message-templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return r.json();
};

export const marketingArchiveMessageTemplate = async (id: string): Promise<BaseResponse<MarketingMessageTemplate>> => {
    const r = await secureFetch(`${getBaseUrl()}/marketing/message-templates/${id}/archive`, {
        method: 'POST',
    });
    return r.json();
};
