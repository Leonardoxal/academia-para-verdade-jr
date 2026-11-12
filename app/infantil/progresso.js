// Progresso da aba Infantil: a próxima aula ainda não feita por cada filho, como o "continuar estudando" do curso adulto.
// aulas: AULAS_INFANTIL; registros: [{ aula, filho, feita }]. A marcação "aula feita" é por filho.
export function proximaPorFilho(aulas, registros) {
  const filhos = [...new Set(aulas.map((a) => a.filho).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'pt-BR', { numeric: true }));
  return filhos.map((filho) => {
    const suas = aulas.filter((a) => a.filho === filho).sort((x, y) => x.data.localeCompare(y.data));
    const feita = (a) => registros.some((r) => r.aula === a.data && r.filho === filho && r.feita);
    return { filho, para: suas[0].para || filho, total: suas.length, feitas: suas.filter(feita).length, proxima: suas.find((a) => !feita(a)) ?? null };
  });
}
