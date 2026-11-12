// Conta e sincronização fora do claude.ai, via Supabase (login por e-mail e senha).
// Cada parte do estado é uma linha da tabela "progresso"; as regras RLS de supabase.sql
// garantem que cada usuário só lê e grava as próprias linhas.
import { SUPABASE } from './config.js';

const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
let cliente = null;

export const nuvemConfigurada = () => Boolean(SUPABASE.url && SUPABASE.anonKey);

/** Cliente Supabase, carregado sob demanda; null se a nuvem não estiver configurada. */
export async function clienteNuvem() {
  if (!nuvemConfigurada()) return null;
  if (!cliente) {
    const { createClient } = await import(CDN);
    cliente = createClient(SUPABASE.url, SUPABASE.anonKey);
  }
  return cliente;
}

export async function usuarioNuvem() {
  const c = await clienteNuvem();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  return data.session?.user || null;
}

/**
 * Referências no mesmo formato do banco do claude.ai, para o store tratar os dois igual:
 * get() → { exists, data() } e set(corpo).
 */
export function refsNuvem(c, uid, partes) {
  return Object.fromEntries(partes.map((parte) => [parte, {
    async get() {
      const { data, error } = await c.from('progresso').select('dados').eq('user_id', uid).eq('parte', parte).maybeSingle();
      if (error) throw error;
      return { exists: Boolean(data), data: () => data?.dados };
    },
    async set(dados) {
      const { error } = await c.from('progresso').upsert({ user_id: uid, parte, dados, atualizado: new Date().toISOString() });
      if (error) throw error;
    },
  }]));
}

const MENSAGENS = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'User already registered': 'Este e-mail já tem conta. Use "Entrar".',
  'Email not confirmed': 'Confirme o e-mail pelo link que foi enviado e tente de novo.',
  'Failed to fetch': 'Sem conexão com o servidor. Verifique a internet e tente de novo.',
};
const traduzir = (e) => MENSAGENS[e?.message] || e?.message || 'Não foi possível acessar a conta agora.';

/**
 * Entra ou cria a conta. Devolve { ok, msg }.
 * @param {boolean} criar  true = criar conta nova
 */
export async function entrar(email, senha, criar) {
  const c = await clienteNuvem();
  if (!c) return { ok: false, msg: 'A sincronização não está configurada neste site.' };
  const { data, error } = criar
    ? await c.auth.signUp({ email, password: senha })
    : await c.auth.signInWithPassword({ email, password: senha });
  if (error) return { ok: false, msg: traduzir(error) };
  if (!data.session) return { ok: false, msg: 'Conta criada. Confirme o e-mail pelo link enviado e depois entre.' };
  return { ok: true, msg: 'Conectado.' };
}

export async function sair() {
  const c = await clienteNuvem();
  if (c) await c.auth.signOut();
}
