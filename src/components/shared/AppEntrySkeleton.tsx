// Visuel plein écran affiché à l'intérieur de <FullScreenOverlayPortal> pendant le
// chargement initial d'un écran (Home, Akwaba...) — rangée d'icônes de menu (pleine
// largeur, comme le mockup fourni) + blocs "carte" (image/titre/sous-titre), avec un
// effet shimmer (.skeleton-shimmer, voir globals.css) à la place d'un simple animate-pulse.
// Une carte supplémentaire est rendue partiellement coupée + estompée en bas (overflow-
// hidden + dégradé vers bg-background) pour reproduire l'indice de contenu scrollable
// visible dans le mockup, plutôt que de s'arrêter net sur la dernière carte complète.
export default function AppEntrySkeleton({ iconCount = 5, cardCount = 2 }: {
    iconCount?: number;
    cardCount?: number;
}) {
    return (
        <div className="relative w-full max-w-sm max-h-[92vh] overflow-hidden px-6">
            <div className="flex items-start justify-between gap-3">
                {Array.from({ length: iconCount }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 min-w-0">
                        <div className="w-full aspect-square max-w-16 sm:max-w-18 md:max-w-20 rounded-[1.75rem] skeleton-shimmer" />
                        <div className="h-2 sm:h-2.5 w-8 rounded-full skeleton-shimmer mt-3" />
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-6 mt-8">
                {Array.from({ length: cardCount + 1 }).map((_, i) => (
                    <div key={i} className="flex flex-col shrink-0">
                        <div className="w-full aspect-[16/10] rounded-3xl skeleton-shimmer" />
                        <div className="h-3.5 rounded-full skeleton-shimmer w-3/4 mt-4" />
                        <div className="h-2.5 rounded-full skeleton-shimmer w-2/5 mt-2.5" />
                    </div>
                ))}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-background" />
        </div>
    );
}
