import { getCookie } from '@/lib/cookies';
import { BaseResponse, Booking, Category, GlobalSearchResponse, Pagination, ReverseGeocodeData, Service, UserLocation, MySpaceResponse, Annonce, BookingsCalendar, Product, CategoryProd, Order, AdminQueryParams, AdminUserUpdateDto, AdminProductUpdateDto, AdminServiceUpdateDto, AdminAnnonceUpdateDto, AdminSubscriptionPlanDto, User, AdminLog, SubscriptionPlan, PlanEntity, AdminUserSubscription, Subscription, OrdersGroupedResponse, BookingsGroupedResponse, LogisticService, Quote, Delivery, DeliveryTracking, QuoteStatus, DeliveryStatus, TransportType, LocationLog, CategorieAnnonce, TypeAnnonce } from '@/types/interface';

export const getBaseUrl = (): string => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
};

export const useAuthMiddleware = async (): Promise<void> => {
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


// secureFetch: used only for protected routes
export const secureFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    await useAuthMiddleware();
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
    const response = await fetch(`${getBaseUrl()}/services/${id}`);
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

export const getAnnonceById = async (id: string): Promise<BaseResponse<any>> => {
    const response = await fetch(`${getBaseUrl()}/annonces/${id}`);
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
export const getUserProfile = async (): Promise<BaseResponse<any>> => {
    const response = await secureFetch(`${getBaseUrl()}/users/profile`, {
        method: 'GET',
    });
    return await response.json();
};

export const updateUserProfile = async (data: any): Promise<BaseResponse<any>> => {
    const isFormData = data instanceof FormData;
    // const url = isFormData ? `${getBaseUrl()}/users/profile/avatar` : `${getBaseUrl()}/users/profile`;
    const response = await secureFetch(`${getBaseUrl()}/users/profile/avatar`, {
        method: 'PATCH',
        body: isFormData ? data : JSON.stringify(data),
    });
    return await response.json();
};

export const getAllUsers = async (params: any): Promise<BaseResponse<Pagination<any>>> => {
    const queryString = toQueryString(params);
    const response = await secureFetch(`${getBaseUrl()}/users?${queryString}`, {
        method: 'GET',
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

export const getProducts = async (params: { page?: number; limit?: number; query?: string; categoryId?: string }): Promise<BaseResponse<Pagination<Product>>> => {
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
    const response = await fetch(`${getBaseUrl()}/products/${id}`);
    return await response.json();
};

export const getProductCategories = async (): Promise<BaseResponse<CategoryProd[]>> => {
    const response = await fetch(`${getBaseUrl()}/products/categories`);
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
export const getLogisticServices = async (params: { query?: string; transportType?: string; page?: number; limit?: number } = {}): Promise<BaseResponse<any>> => {
    const queryString = toQueryString(params);
    const response = await fetch(`${getBaseUrl()}/logistics/services?${queryString}`);
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
    const response = await secureFetch(`${getBaseUrl()}/logistics/quotes`, {
        method: 'POST',
        body: JSON.stringify(data),
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

export const getDeliveryById = async (id: string): Promise<BaseResponse<Delivery>> => {
    const response = await secureFetch(`${getBaseUrl()}/logistics/deliveries/${id}`, {
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
