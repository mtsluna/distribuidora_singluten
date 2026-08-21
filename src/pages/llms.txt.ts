import type { APIRoute } from 'astro';
import { categories, totalProductos } from '../data/categories';

/**
 * /llms.txt generado desde el catálogo real.
 *
 * Antes era un archivo estático en public/ con "300 productos en 22 categorías"
 * escrito a mano, que quedaba desfasado en cuanto cambiaba el catálogo.
 */
const catalogo = categories.map(c => `${c.name} (${c.count})`).join(' · ');

const texto = `# Distribuidora Sin Gluten - Mayorista Sin gluten en Cuyo, Argentina

## Descripción
Distribuidora mayorista de productos sin gluten y sin gluten con más de 10 años de trayectoria.
Abastecemos dietéticas, almacenes, supermercados, restaurantes y gastronomía en Mendoza, San Juan y San Luis.
Todos los productos están certificados por ANMAT como libres de gluten.
"Sin gluten" es el término argentino que designa productos libres de Trigo, Avena, Cebada y Centeno.

## Contacto
- WhatsApp: +54 9 261 508-0439
- Email: singlutenmendoza@gmail.com
- Horario: Lunes a Viernes, 9 a 18hs

## Cobertura geográfica
- Mendoza: Gran Mendoza, Godoy Cruz, Luján de Cuyo, Maipú y San Rafael
- San Juan: Capital, Rawson, Rivadavia y alrededores
- San Luis: Capital y Villa Mercedes

## Catálogo
${totalProductos} productos en ${categories.length} categorías, todos con certificación ANMAT:
${catalogo}.

Cada categoría tiene su página con el listado completo de productos, marca y presentación:
${categories.map(c => `- ${c.name} sin gluten al por mayor: https://www.distribuidorasingluten.com.ar/categorias/${c.slug}/`).join('\n')}

## Condiciones de venta
Solo venta mayorista a comercios. No vendemos al público en general.
Pedido mínimo según tipo de comercio (dietéticas, almacenes, supermercados, gastronomía).

## Preguntas frecuentes
P: ¿Cuáles son los requisitos para convertirse en cliente mayorista?
R: Solo trabajamos con comercios: dietéticas, almacenes, supermercados, restaurantes y servicios de catering.

P: ¿Todos sus productos están certificados como libres de gluten por ANMAT?
R: Sí. Los ${totalProductos} productos del catálogo cuentan con certificación ANMAT como libres de gluten.

P: ¿Realizan envíos a toda Argentina o solo a Cuyo?
R: Distribución directa en Mendoza, San Juan y San Luis. Otras provincias se evalúan caso a caso.

## Sitio web
https://www.distribuidorasingluten.com.ar
`;

export const GET: APIRoute = () =>
  new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
