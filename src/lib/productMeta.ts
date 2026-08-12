import { ProductMeta } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_PREFIX = 'pedifacil_product_meta_';

export function loadProductMeta(productId: string): ProductMeta | undefined {
  if (!productId) return undefined;
  const saved = localStorage.getItem(`${STORAGE_PREFIX}${productId}`);
  if (!saved) return undefined;
  try {
    return JSON.parse(saved) as ProductMeta;
  } catch {
    return undefined;
  }
}

export async function saveProductMeta(productId: string, meta: ProductMeta): Promise<void> {
  if (!productId) return;
  const metaJson = JSON.stringify(meta);
  localStorage.setItem(`${STORAGE_PREFIX}${productId}`, metaJson);

  // Atualiza fallback local de produto para manter sku sincronizado em todos os locais
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }

    keys.forEach((key) => {
      if (key === 'pedifacil_db_products' || key.startsWith('pedifacil_local_products_')) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return;
          const list = JSON.parse(raw);
          if (!Array.isArray(list)) return;
          let changed = false;
          const updated = list.map((item: any) => {
            if (item && item.id === productId) {
              changed = true;
              return { ...item, sku: metaJson };
            }
            return item;
          });
          if (changed) {
            localStorage.setItem(key, JSON.stringify(updated));
          }
        } catch {
          // ignore malformed local storage values
        }
      }
    });
  } catch {
    // ignore localStorage enumeration issues
  }

  // Sincronizar com Supabase na coluna sku da tabela produtos para celular
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { error } = await supabase.from('produtos').upsert([{ id: productId, sku: metaJson }], { onConflict: 'id' });
      if (!error) return;
      console.warn(`Tentativa ${attempt} - aviso ao sincronizar meta com Supabase (upsert):`, error);
    } catch (err) {
      console.warn(`Tentativa ${attempt} - erro ao sincronizar meta com Supabase:`, err);
    }
    await new Promise(res => setTimeout(res, 500));
  }

  console.warn('Falha ao sincronizar meta com Supabase após múltiplas tentativas.');
}

export function deleteProductMeta(productId: string): void {
  if (!productId) return;
  localStorage.removeItem(`${STORAGE_PREFIX}${productId}`);
}
