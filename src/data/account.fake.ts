import {
    UserProfile,
    Service,
    Booking,
    Annonce,
    Role,
    AnnonceStatus,
    SubscriptionStatus,
    BookingStatus,
    ServiceStatus,
    ServiceType,
    InterventionType
} from "@/types/interface";

// ================= USER =================
export const fakeUser: UserProfile = {
    id: "u1",
    email: "jean@test.com",
    phone: "0700000000",
    fullName: "Jean Kouassi",
    companyName: "JK Services",
    role: Role.PRESTATAIRE,
    isPremium: true,
    credits: 45,
    servicesCount: 3,
    annoncesCount: 2,
    bookingsCount: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscription: {
        id: "sub1",
        userId: "u1",
        planId: "p1",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 20 * 86400000).toISOString(),
        status: SubscriptionStatus.ACTIVE,
        plan: {
            id: "p1",
            name: "Premium Pro",
            price: 15000,
            serviceLimit: 50,
            durationDays: 30,
            isActive: true
        }
    }
};

// ================= SERVICES =================
export const fakeServices: Service[] = [
    {
        id: "s1",
        code: "s1",
        title: "Réparation climatiseur",
        description: "Installation & dépannage",
        type: ServiceType.DEPANNAGE,
        status: ServiceStatus.AVAILABLE,
        price: 15000,
        reduction: 10,
        tags: ["clim", "réparation"],
        location: "Abidjan",
        latitude: 5.34,
        longitude: -4.02,
        imageUrls: ["/img/service1.jpg"],
        files: [],
        userId: "u1",
        categoryId: "c1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// ================= BOOKINGS =================
export const fakeBookings: Booking[] = [
    {
        id: "b1",
        code: "b1",
        clientId: "c1",
        providerId: "u1",
        serviceId: "s1",
        status: BookingStatus.COMPLETED,
        price: 15000,
        rating: 5,
        interventionType: InterventionType.RDV,
        scheduledDate: "2026-02-10",
        scheduledTime: "10:00",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// ================= ANNONCES =================
export const fakeAnnonces: Annonce[] = [
    {
        id: "a1",
        code: "a1",
        title: "Vente moto neuve",
        description: "Très bon état",
        price: 500000,
        images: ["/img/moto.jpg"],
        imageUrls: ["/img/moto.jpg"],
        files: [],
        status: AnnonceStatus.ACTIVE,
        userId: "u1",
        typeId: "t1",
        categorieId: "cat1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
