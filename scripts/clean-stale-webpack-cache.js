/**
 * Purge .next/cache/webpack si elle porte une trace de corruption.
 *
 * Le cache persistant de webpack écrit ses .pack.gz via un remplacement
 * atomique (nouveau fichier -> ancien renommé en .old -> bascule). Si le
 * process `next dev` est tué brutalement (kill -9, fermeture de terminal,
 * crash) pendant cette écriture, un fichier *.pack.gz.old orphelin reste sur
 * disque : c'est le signe que la dernière écriture n'a pas pu se terminer
 * proprement, et que le cache peut référencer des modules qui ne
 * correspondent plus au code source actuel — symptôme observé : webpack sert
 * une "ancienne version" du code, ou lève `Cannot read properties of
 * undefined (reading 'call')` au chargement d'un Client Component.
 *
 * Ce script tourne avant chaque `next dev` (cf. script "predev") et ne
 * supprime QUE si une trace de corruption est détectée, pour ne pas perdre
 * le bénéfice du cache (rebuilds plus rapides) à chaque démarrage normal.
 */
const fs = require('fs');
const path = require('path');

const webpackCacheDir = path.join(__dirname, '..', '.next', 'cache', 'webpack');

function hasStaleCacheFiles(dir) {
  if (!fs.existsSync(dir)) return false;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (hasStaleCacheFiles(full)) return true;
    } else if (entry.name.endsWith('.old')) {
      return true;
    }
  }
  return false;
}

if (hasStaleCacheFiles(webpackCacheDir)) {
  console.warn(
    '[predev] Cache webpack potentiellement corrompu (fichier .old détecté) — purge de .next avant de démarrer.',
  );
  fs.rmSync(path.join(__dirname, '..', '.next'), { recursive: true, force: true });
}
