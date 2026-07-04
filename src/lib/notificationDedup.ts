// Le backend envoie chaque notification en parallèle via WebSocket (temps réel)
// ET Firebase Push (fiabilité hors-ligne/arrière-plan) — voir NotificationService.sendNotification.
// Quand l'onglet est ouvert, les deux canaux arrivent quasi simultanément et affichaient
// jusqu'ici deux toasts pour un seul évènement. On déduplique par contenu sur une courte fenêtre.
const recentKeys = new Map<string, number>();
const DEDUP_WINDOW_MS = 4000;

export function shouldDisplayNotification(key: string): boolean {
    const now = Date.now();
    for (const [k, t] of recentKeys) {
        if (now - t > DEDUP_WINDOW_MS) recentKeys.delete(k);
    }
    if (recentKeys.has(key)) return false;
    recentKeys.set(key, now);
    return true;
}
