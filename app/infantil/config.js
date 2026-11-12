// Sincronização das tarefas da aba Infantil com a família (código da família + nuvem).
// false: a aba funciona só neste aparelho e não pede o código. Desativada enquanto o projeto não termina.
// Para reativar: defina um código novo no banco (ver supabase-infantil.sql, comentário sobre aci_config),
// troque para true e publique de novo.
export const FAMILIA_ATIVA = true;
