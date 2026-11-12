// Tela de conta (#entrar): opcional. Sem conta o app funciona e guarda o progresso só neste aparelho.
import { entrar as entrarNuvem, nuvemConfigurada } from '../nuvem.js';
import { link } from '../ui.js';

export function entrar() {
  if (!nuvemConfigurada()) return `<p>A sincronização não está configurada neste site. ${link('infantil', 'Voltar ao início')}</p>`;
  return `<section class="tela-entrar">
    <header class="cab"><h1>Entrar ou criar conta</h1>
      <p class="sub">Opcional. Com uma conta, o progresso fica salvo nela e aparece no celular, no PC e em qualquer aparelho em que você entrar. ${link('infantil', 'Continuar sem conta')}</p></header>
    <form id="form-conta" class="form-sessao">
      <label class="campo largo"><span>E-mail</span><input id="c-email" name="email" type="email" autocomplete="email" required></label>
      <label class="campo largo"><span>Senha (mínimo 8 caracteres)</span><input id="c-senha" name="senha" type="password" minlength="8" autocomplete="current-password" required></label>
      <button class="btn primario" type="submit" data-modo="entrar">Entrar</button>
      <button class="btn" type="submit" data-modo="criar">Criar conta</button>
    </form>
    <p class="meta" id="conta-msg" aria-live="polite"></p></section>`;
}

/** @param {{ aoEntrar: () => Promise<void> }} ctx */
entrar.ligar = (root, ctx) => {
  root.querySelector('#form-conta')?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const msg = root.querySelector('#conta-msg');
    const botoes = ev.target.querySelectorAll('button');
    msg.textContent = 'Aguarde…';
    botoes.forEach((b) => { b.disabled = true; });
    try {
      const r = await entrarNuvem(String(fd.get('email')).trim(), String(fd.get('senha')), ev.submitter?.dataset.modo === 'criar');
      msg.textContent = r.msg;
      if (r.ok) await ctx.aoEntrar();
    } catch {
      msg.textContent = 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
    } finally {
      botoes.forEach((b) => { b.disabled = false; });
    }
  });
};
