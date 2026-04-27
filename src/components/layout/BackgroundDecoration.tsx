"use client";

/**
 * BackgroundDecoration component
 * Displays a perfectly centered watermark logo.
 * Using SVG for maximum clarity and high z-index for guaranteed visibility. banniere4.png logo.svg
 */
export default function BackgroundDecoration() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-[999] flex items-center justify-center select-none">
      <div className="relative opacity-4 dark:opacity-4 transition-all duration-1000">
        <img src="/logo.svg" alt="Djamko Watermark" width={800} height={800} className="object-contain w-[50vw] max-w-[750px] h-auto" />
      </div>
    </div>
  );
}
