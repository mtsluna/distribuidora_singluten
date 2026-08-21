import { execFileSync } from 'node:child_process';
import { statSync, existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';

/**
 * Fecha de última modificación real de cada URL, para el <lastmod> del sitemap.
 *
 * Se toma la fecha del último commit que tocó los archivos de los que depende
 * esa página. Si git no está disponible (o el checkout es shallow y no tiene
 * historia del archivo) se cae al mtime del archivo.
 *
 * IMPORTANTE: el workflow de deploy usa `fetch-depth: 0` justamente para que
 * git tenga la historia completa acá. Con un checkout shallow el lastmod
 * degrada a la fecha de build, que es menos útil pero no rompe nada.
 */

function fechaGit(archivo) {
  try {
    const salida = execFileSync('git', ['log', '-1', '--format=%cI', '--', archivo], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return salida ? new Date(salida) : null;
  } catch {
    return null;
  }
}

function fechaArchivo(archivo) {
  if (!existsSync(archivo)) return null;
  return fechaGit(archivo) ?? statSync(archivo).mtime;
}

/** La más reciente de una lista de archivos. */
function masReciente(archivos) {
  const fechas = archivos.map(fechaArchivo).filter(Boolean);
  if (fechas.length === 0) return new Date();
  return new Date(Math.max(...fechas.map(f => f.getTime())));
}

const LAYOUT = 'src/layouts/Layout.astro';
const DATOS = 'src/data/categories.ts';
const PLANTILLA_CATEGORIA = 'src/pages/categorias/[slug].astro';

function componentesHome() {
  try {
    return readdirSync('src/components').map(f => `src/components/${f}`);
  } catch {
    return [];
  }
}

/** Devuelve un Map<pathname, Date> con el lastmod de cada URL del sitio. */
export function construirLastmod(slugs) {
  const mapa = new Map();

  mapa.set('/', masReciente(['src/pages/index.astro', DATOS, LAYOUT, ...componentesHome()]));

  for (const slug of slugs) {
    mapa.set(
      `/categorias/${slug}/`,
      masReciente([`src/content/categorias/${slug}.yaml`, DATOS, PLANTILLA_CATEGORIA, LAYOUT])
    );
  }

  return mapa;
}
