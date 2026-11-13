// Clima do mapa pela cidade da família (aprovado em DECISOES_JORNADA.md). Sem geolocalização do aparelho: o responsável
// digita a cidade na Sala do Guia. Só o nome da cidade (busca) e as coordenadas arredondadas (previsão) saem do aparelho,
// para o Open-Meteo, e nenhum dado da criança vai junto. A cidade fica só em localStorage. Falhou? O clima é "limpo".

export const CLIMAS = ['limpo', 'nublado', 'chuva', 'vento', 'neblina'];
export const CHAVE_CIDADE = 'aci-cidade';
const CHAVE_CACHE = 'aci-clima-cache';
const CACHE_MS = 60 * 60 * 1000;
const VENTO_KMH = 30;

/** Código do tempo do Open-Meteo (WMO) para um dos cinco climas. Trovoada vira chuva; neve vira nublado. */
export function climaDoCodigo(codigo, ventoKmh = 0) {
  const c = Number(codigo);
  let clima = 'limpo';
  if (c === 45 || c === 48) clima = 'neblina';
  else if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95) clima = 'chuva';
  else if (c === 2 || c === 3 || (c >= 71 && c <= 77) || c === 85 || c === 86) clima = 'nublado';
  if ((clima === 'limpo' || clima === 'nublado') && Number(ventoKmh) >= VENTO_KMH) clima = 'vento';
  return clima;
}

/** Arredonda a cerca de 10 km (0,1 grau) para que o lugar exato da casa nunca saia do aparelho. */
export const arredondar = (n) => Math.round(Number(n) * 10) / 10;

const guardado = (chave) => { try { return JSON.parse(localStorage.getItem(chave)); } catch { return null; } };
const gravar = (chave, v) => { try { localStorage.setItem(chave, JSON.stringify(v)); } catch { /* sem armazenamento: vale só nesta página */ } };

export const cidadeGuardada = () => {
  const c = guardado(CHAVE_CIDADE);
  return c && typeof c.nome === 'string' && Number.isFinite(c.lat) && Number.isFinite(c.lon) ? c : null;
};
export const esquecerCidade = () => { try { localStorage.removeItem(CHAVE_CIDADE); localStorage.removeItem(CHAVE_CACHE); } catch { /* nada a limpar */ } };

/** Procura a cidade pelo nome e guarda só o nome e as coordenadas arredondadas. Devolve a cidade ou lança erro legível. */
export async function escolherCidade(nome, buscar = fetch) {
  const termo = String(nome ?? '').trim().slice(0, 80);
  if (termo.length < 2) throw new Error('Escreva o nome da cidade.');
  const r = await buscar(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(termo)}&count=1&language=pt&format=json`);
  if (!r.ok) throw new Error('Não foi possível buscar a cidade agora.');
  const achada = (await r.json()).results?.[0];
  if (!achada) throw new Error('Cidade não encontrada.');
  const cidade = { nome: String(achada.name), lat: arredondar(achada.latitude), lon: arredondar(achada.longitude) };
  gravar(CHAVE_CIDADE, cidade);
  try { localStorage.removeItem(CHAVE_CACHE); } catch { /* o cache expira sozinho */ }
  return cidade;
}

/** Clima de agora: do cache (até 1 hora) ou da previsão. Qualquer falha devolve "limpo". */
export async function climaDeHoje(buscar = fetch, agora = Date.now()) {
  const cidade = cidadeGuardada();
  if (!cidade) return 'limpo';
  const cache = guardado(CHAVE_CACHE);
  if (cache && cache.lat === cidade.lat && cache.lon === cidade.lon && agora - cache.em < CACHE_MS && CLIMAS.includes(cache.clima)) return cache.clima;
  try {
    const r = await buscar(`https://api.open-meteo.com/v1/forecast?latitude=${cidade.lat}&longitude=${cidade.lon}&current=weather_code,wind_speed_10m`);
    if (!r.ok) return 'limpo';
    const atual = (await r.json()).current;
    const clima = climaDoCodigo(atual?.weather_code, atual?.wind_speed_10m);
    gravar(CHAVE_CACHE, { lat: cidade.lat, lon: cidade.lon, clima, em: agora });
    return clima;
  } catch { return 'limpo'; }
}
