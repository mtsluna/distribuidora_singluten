#!/usr/bin/env node
/**
 * Genera src/data/products.ts a partir del export CSV del backoffice.
 *
 *   node scripts/generar-catalogo.mjs [ruta-al-csv]   (default: ./catalogo.csv)
 *
 * El CSV no trae encabezado y sus columnas son:
 *   0 id del producto
 *   1 nombre completo   -> "<producto> - <marca> x <presentación>"
 *   2 imágenes          -> array de Postgres: {url1,url2}
 *   3 nombre de categoría
 *   4 id de categoría
 *   5 imagen de categoría
 *
 * Marca y presentación no vienen en columnas propias: están embebidas en el
 * nombre con un formato bastante regular pero de espaciado irregular, así que
 * se parsean de derecha a izquierda (primero la presentación, después la marca).
 *
 * El mapeo de categoría del CSV a slug del sitio vive en src/data/categories.ts
 * y es deliberadamente manual: los slugs ya están indexados por Google y no
 * deben cambiar aunque el backoffice renombre una categoría.
 */
import fs from 'node:fs';
import path from 'node:path';

const CSV = process.argv[2] ?? 'catalogo.csv';
const SALIDA = 'src/data/products.ts';

// ---------------------------------------------------------------- CSV

function parseCSV(texto) {
  const filas = [];
  let fila = [], campo = '', enComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; }
        else enComillas = false;
      } else campo += c;
    } else if (c === '"') enComillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n') {
      fila.push(campo); campo = '';
      if (fila.some(x => x !== '')) filas.push(fila);
      fila = [];
    } else if (c !== '\r') campo += c;
  }
  if (campo !== '' || fila.length) {
    fila.push(campo);
    if (fila.some(x => x !== '')) filas.push(fila);
  }
  return filas;
}

// ------------------------------------------------- nombre / marca / presentación

const UNIDADES = 'gr?s?|kgs?|ml|lts?|l|cc|un?i?d?a?d?e?s?|u';
const RE_PRESENTACION = new RegExp(`\\s*[x×]?\\s*([\\d]+(?:[.,]\\d+)?)\\s*(${UNIDADES})\\.?\\s*$`, 'i');
const RE_PRESENTACION_CON_X = new RegExp(`\\s*[x×]\\s*([\\d]+(?:[.,]\\d+)?)\\s*(${UNIDADES})\\.?\\s*$`, 'i');

function normalizarUnidad(u) {
  const l = u.toLowerCase();
  if (/^k/.test(l)) return 'kg';
  if (/^ml$/.test(l)) return 'ml';
  if (/^cc$/.test(l)) return 'cc';
  if (/^lt?s?$/.test(l)) return 'L';
  if (/^g/.test(l)) return 'gr';
  return 'u';
}

function limpiar(s) {
  return s.replace(/\s+/g, ' ').replace(/[\s\-–,]+$/, '').replace(/^[\s\-–,]+/, '').trim();
}

function formatearPresentacion(cantidad, unidad) {
  return `${cantidad.replace(',', '.')} ${normalizarUnidad(unidad)}`;
}

export function parseNombre(crudo) {
  let resto = crudo.trim().replace(/\s+/g, ' ');
  let presentacion = null;

  const m = resto.match(RE_PRESENTACION_CON_X);
  if (m) {
    presentacion = formatearPresentacion(m[1], m[2]);
    resto = resto.slice(0, m.index).trim();
  }

  let marca = null;
  let nombre = resto;
  const corte = resto.lastIndexOf('-');
  if (corte > 0) {
    const izq = resto.slice(0, corte).trim();
    const der = resto.slice(corte + 1).trim();
    if (izq.length >= 3 && der.length >= 2 && !/^\d/.test(der)) {
      nombre = izq;
      marca = der;
    }
  }

  // Algunos registros escriben la presentación pegada a la marca y sin la "x"
  // ("... - Julicroc 90gr"). Se recupera desde el final de la marca.
  if (marca && !presentacion) {
    const mm = marca.match(RE_PRESENTACION);
    if (mm && mm.index > 0) {
      presentacion = formatearPresentacion(mm[1], mm[2]);
      marca = limpiar(marca.slice(0, mm.index));
    }
  }

  return { nombre: limpiar(nombre), marca: marca ? limpiar(marca) : null, presentacion };
}

// ---------------------------------------------------------------- generación

function main() {
  if (!fs.existsSync(CSV)) {
    console.error(`No encuentro el CSV en ${CSV}`);
    console.error('Uso: node scripts/generar-catalogo.mjs [ruta-al-csv]');
    process.exit(1);
  }

  const filas = parseCSV(fs.readFileSync(CSV, 'utf8'));
  const productos = filas.map(f => {
    const imagenes = f[2].replace(/^\{|\}$/g, '').split(',')
      .map(s => s.trim().replace(/^"|"$/g, ''))
      .filter(Boolean);
    return {
      id: f[0].trim(),
      ...parseNombre(f[1]),
      imagen: imagenes[0] ?? null,
      categoria: f[3].trim().replace(/\s+/g, ' '),
      categoriaImagen: f[5].trim(),
    };
  }).filter(p => p.imagen);

  // Orden estable: por categoría y después por nombre, para que el diff del
  // archivo generado sea legible entre exports sucesivos.
  productos.sort((a, b) =>
    a.categoria.localeCompare(b.categoria, 'es') || a.nombre.localeCompare(b.nombre, 'es'));

  const imagenesDeCategoria = new Map();
  for (const p of productos) {
    if (!imagenesDeCategoria.has(p.categoria)) imagenesDeCategoria.set(p.categoria, p.categoriaImagen);
  }

  const ts = `// ARCHIVO GENERADO — no editar a mano.
// Se regenera con: node scripts/generar-catalogo.mjs [ruta-al-csv]
// Fuente: export CSV del backoffice (${path.basename(CSV)}).

export interface Product {
  id: string;
  /** Nombre del producto sin marca ni presentación. */
  nombre: string;
  /** Marca comercial, o null si el nombre no la separa. */
  marca: string | null;
  /** Presentación normalizada, p. ej. "200 gr", "473 ml", "12 u". */
  presentacion: string | null;
  imagen: string;
  /** Nombre de la categoría tal como viene del backoffice. */
  categoria: string;
}

export const products: Product[] = ${JSON.stringify(
    productos.map(({ categoriaImagen, ...p }) => p), null, 2
  )};

/** Imagen de portada de cada categoría, según el backoffice. */
export const categoryImages: Record<string, string> = ${JSON.stringify(
    Object.fromEntries(imagenesDeCategoria), null, 2
  )};
`;

  fs.writeFileSync(SALIDA, ts);

  const porCategoria = {};
  for (const p of productos) porCategoria[p.categoria] = (porCategoria[p.categoria] ?? 0) + 1;

  console.log(`${SALIDA}: ${productos.length} productos en ${Object.keys(porCategoria).length} categorías`);
  console.log(`  con marca: ${productos.filter(p => p.marca).length}`);
  console.log(`  con presentación: ${productos.filter(p => p.presentacion).length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
