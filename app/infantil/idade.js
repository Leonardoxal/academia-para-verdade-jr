// Idade em anos e meses, a partir da data de nascimento (AAAA-MM-DD). Devolve '' se a data não existir ou for futura.
export function idade(nascimento, hoje = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nascimento ?? '');
  if (!m) return '';
  const [, a, mes, dia] = m.map(Number);
  let meses = (hoje.getFullYear() - a) * 12 + (hoje.getMonth() + 1 - mes);
  if (hoje.getDate() < dia) meses -= 1;
  if (meses < 0) return '';
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const partes = [];
  if (anos) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
  if (resto || !anos) partes.push(`${resto} ${resto === 1 ? 'mês' : 'meses'}`);
  return partes.join(' e ');
}

/** Próximo código livre (f1, f2, …) entre os já usados. */
export function proximoCodigo(usados) {
  const maior = Math.max(0, ...[...usados].map((c) => Number(/^f(\d+)$/.exec(c)?.[1] ?? 0)));
  return `f${maior + 1}`;
}
