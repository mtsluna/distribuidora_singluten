import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Contenido editorial de cada categoría.
 *
 * Un archivo YAML por slug en src/content/categorias/. El id de la entrada
 * es el nombre del archivo y tiene que coincidir con el `slug` de la
 * categoría en src/data/categories.ts.
 *
 * Los campos `marcas`, `presentaciones` y `minimoCompra` son datos que sólo
 * tiene el cliente. Mientras estén en null la sección no se renderiza: la
 * página no muestra huecos ni texto de relleno.
 */
const categorias = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/categorias' }),
  schema: z.object({
    /** 1-2 párrafos de apertura, propios de esta categoría. */
    intro: z.string().min(120),

    /** Secciones de cuerpo. Cada `titulo` se renderiza como <h2> real. */
    secciones: z
      .array(
        z.object({
          titulo: z.string(),
          /** Párrafos separados por una línea en blanco. */
          cuerpo: z.string(),
        })
      )
      .min(2),

    /**
     * Opcional: sobrescribe la lista de marcas. Si queda en null se deriva
     * automáticamente del catálogo (products.ts), que es lo habitual.
     */
    marcas: z.array(z.string()).nullable().default(null),

    /** TODO cliente: presentaciones, bultos y unidades por caja. */
    presentaciones: z.string().nullable().default(null),

    /** TODO cliente: mínimo de compra para esta categoría. */
    minimoCompra: z.string().nullable().default(null),

    /** Slugs de categorías relacionadas para el enlazado cruzado. */
    relacionadas: z.array(z.string()).min(3).max(6),
  }),
});

export const collections = { categorias };
