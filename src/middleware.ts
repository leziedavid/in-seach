import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes qui nécessitent d'être authentifié
const protectedRoutes = ['/akwaba', '/chat-ia', '/dashboard'];

// Helper pour décoder le JWT dans l'environnement Edge de Next.js
function decodeJWTPayload(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    let userRole = null;
    if (token) {
        const payload = decodeJWTPayload(token);
        userRole = payload?.role;
    }

    // Vérifier si la route actuelle est protégée
    const isProtected = protectedRoutes.some((route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isProtected && !token) {
        // Rediriger vers login si pas de token
        const url = new URL('/login', request.url);
        // On peut ajouter la page de redirection pour revenir après le login
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// Configurer les matchers pour optimiser les performances
export const config = {
    matcher: [
        '/akwaba/:path*',
        '/chat-ia/:path*',
        '/dashboard/:path*',
    ],
};
