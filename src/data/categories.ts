import { products, categoryImages, type Product } from './products';

export type { Product };

export interface Category {
  slug: string;
  name: string;
  /** Imagen de portada de la categoría. */
  imageUrl: string;
  /** Cantidad de productos, derivada del catálogo. */
  count: number;
  productos: Product[];
}

/**
 * Mapeo entre la taxonomía del backoffice y las URLs del sitio.
 *
 * `slug` y `name` son la parte estable: los slugs ya están indexados por Google
 * y los títulos vienen posicionando, así que NO deben cambiar aunque el
 * backoffice renombre una categoría. Cuando eso pasa, se actualiza sólo
 * `csvCategoria`, que es la clave de join con products.ts.
 */
const registro: { slug: string; name: string; csvCategoria: string }[] = [
  { slug: "galletas",                        name: "Galletas",                         csvCategoria: "Galletas" },
  { slug: "fideos-y-pastas",                 name: "Fideos y Pastas",                  csvCategoria: "Fideos y Pastas" },
  { slug: "snacks",                          name: "Snacks",                           csvCategoria: "Snacks" },
  { slug: "harinas-y-premezclas",            name: "Harinas y Premezclas",             csvCategoria: "Harinas y Premezclas" },
  { slug: "condimentos",                     name: "Condimentos",                      csvCategoria: "Condimentos" },
  { slug: "alfajores",                       name: "Alfajores",                        csvCategoria: "Alfajores / Bocadito" },
  { slug: "barras-de-cereal-proteicas",      name: "Barras de Cereal Proteicas",       csvCategoria: "Barras de Cereal / Proteicas" },
  { slug: "chocolates",                      name: "Chocolates",                       csvCategoria: "Chocolates / Bocaditos" },
  { slug: "tostadas",                        name: "Tostadas",                         csvCategoria: "Tostadas" },
  { slug: "budines",                         name: "Budines",                          csvCategoria: "Budines" },
  { slug: "palmeritas-grisines-y-rosquitas", name: "Palmeritas, Grisines y Rosquitas", csvCategoria: "Palmeritas, Grisines y Rosquitas" },
  { slug: "rebozador",                       name: "Rebozador",                        csvCategoria: "Rebozador" },
  { slug: "dulces-y-mermeladas",             name: "Dulces y Mermeladas",              csvCategoria: "Dulces y Mermeladas" },
  { slug: "cervezas",                        name: "Cervezas",                         csvCategoria: "Cervezas" },
  { slug: "membrillos",                      name: "Membrillos",                       csvCategoria: "Membrillos" },
  { slug: "pan-rallado",                     name: "Pan Rallado",                      csvCategoria: "Pan rallado" },
  { slug: "avenas",                          name: "Avenas",                           csvCategoria: "Avenas" },
  { slug: "panes-bio",                       name: "Panes Bio",                        csvCategoria: "Panes Bio / Nutrisa" },
  { slug: "tapas-de-alfajor",                name: "Tapas de Alfajor",                 csvCategoria: "Tapas de Alfajor" },
  { slug: "granolas",                        name: "Granolas",                         csvCategoria: "Granolas" },
  { slug: "leches",                          name: "Leches",                           csvCategoria: "Leches" },
  { slug: "pochoclos",                       name: "Pochoclos",                        csvCategoria: "Pochoclos" },
  { slug: "vainillas-y-masas-secas",         name: "Vainillas y Masas Secas",          csvCategoria: "Vainillas y masas secas" },
  { slug: "tortillas",                       name: "Tortillas",                        csvCategoria: "Tortillas" },
];

const porCategoria = new Map<string, Product[]>();
for (const p of products) {
  const lista = porCategoria.get(p.categoria);
  if (lista) lista.push(p);
  else porCategoria.set(p.categoria, [p]);
}

/** Categorías con su catálogo, ordenadas de mayor a menor cantidad de productos. */
export const categories: Category[] = registro
  .map(({ slug, name, csvCategoria }) => {
    const productos = porCategoria.get(csvCategoria) ?? [];
    return {
      slug,
      name,
      imageUrl: categoryImages[csvCategoria] ?? productos[0]?.imagen ?? "",
      count: productos.length,
      productos,
    };
  })
  .filter(c => c.count > 0)
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'));

/** Total de productos del catálogo. */
export const totalProductos = categories.reduce((n, c) => n + c.count, 0);

/**
 * Texto visible de un producto: marca primero, que es por lo que la gente busca.
 * "Doninas · Galletas Chocolate y Maní"
 */
export function etiqueta(p: Product): string {
  return p.marca ? `${p.marca} · ${p.nombre}` : p.nombre;
}

/**
 * Alt descriptivo y único: nombre, marca, "sin gluten" y presentación.
 * "Galletas Chocolate y Maní Doninas sin gluten 200 gr"
 */
export function textoAlternativo(p: Product): string {
  return [p.nombre, p.marca, 'sin gluten', p.presentacion].filter(Boolean).join(' ');
}

/** Nombre completo para el JSON-LD, con la misma información que se ve en pantalla. */
export function nombreCompleto(p: Product): string {
  return [p.nombre, p.presentacion].filter(Boolean).join(' ');
}

/** Categorías sin productos en el último export, para no publicar páginas vacías. */
export const categoriasVacias = registro
  .filter(r => (porCategoria.get(r.csvCategoria) ?? []).length === 0)
  .map(r => r.slug);

/** Categorías del backoffice que todavía no tienen slug en el sitio. */
export const categoriasSinMapear = [...porCategoria.keys()]
  .filter(c => !registro.some(r => r.csvCategoria === c));
