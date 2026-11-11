/**
 * Geocodificação de endereços brasileiros via Nominatim (OpenStreetMap), sem chave de API.
 *
 * Tenta do mais específico ao mais genérico (rua+número → rua → CEP → cidade) e informa a precisão
 * obtida, para que a tela avise quando o ponto caiu só no centro da cidade. Coordenadas corretas são
 * essenciais: o otimizador de rotas usa latitude/longitude, não o texto do endereço.
 */
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

const query = async (params) => {
  const url = `${NOMINATIM}?format=json&limit=1&countrycodes=br&${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
};

/**
 * @returns {Promise<{latitude: string, longitude: string, precision: 'endereco'|'rua'|'cep'|'cidade'} | null>}
 */
export const geocodeAddress = async ({ street, number, city, state, cep }) => {
  const st = (street || '').trim();
  const ct = (city || '').trim();
  const uf = (state || '').trim();
  const zip = (cep || '').replace(/\D/g, '');
  const attempts = [];
  if (st && ct) attempts.push([{ street: `${number ? number + ' ' : ''}${st}`, city: ct, state: uf, country: 'Brasil' }, number ? 'endereco' : 'rua']);
  if (st && ct && number) attempts.push([{ street: st, city: ct, state: uf, country: 'Brasil' }, 'rua']);
  if (zip.length === 8) attempts.push([{ postalcode: `${zip.slice(0, 5)}-${zip.slice(5)}`, country: 'Brasil' }, 'cep']);
  if (ct) attempts.push([{ city: ct, state: uf, country: 'Brasil' }, 'cidade']);

  for (const [params, precision] of attempts) {
    try {
      const hit = await query(params);
      if (hit) return { latitude: String(hit.lat), longitude: String(hit.lon), precision };
    } catch {
      // tenta o próximo nível
    }
  }
  return null;
};

export const PRECISION_LABEL = {
  endereco: 'endereço exato',
  rua: 'rua (sem número)',
  cep: 'CEP',
  cidade: 'centro da cidade'
};
