<script>
  const API = ['localhost', '127.0.0.1'].includes(location.hostname)
    ? ''
    : 'https://sir-api-fn74.onrender.com';

  const colunas = [
    { campo: 'nome', titulo: 'Nome' },
    { campo: 'apelido', titulo: 'Apelido' },
    { campo: 'curso', titulo: 'Curso' },
    { campo: 'anoCurricular', titulo: 'Ano' },
    { campo: 'idade', titulo: 'Idade' },
  ];

  const formVazio = () => ({ nome: '', apelido: '', idCurso: '', anoCurricular: '', idade: null });
  const filtrosVazios = () => ({ curso: '', ano: '', texto: '' });

  let cursos = $state([]);
  let alunos = $state([]);
  let mensagem = $state('');
  let erroAluno = $state('');
  let idEdicao = $state(null);
  let ordenacao = $state({ campo: 'nome', direcao: 'asc' });
  let filtros = $state(filtrosVazios());
  let form = $state(formVazio());
  let dialogo;

  const visiveis = $derived(alunosVisiveis());
  const contagem = $derived(
    visiveis.length === alunos.length
      ? alunos.length + ' alunos'
      : visiveis.length + ' de ' + alunos.length + ' alunos'
  );

  async function pedir(url, options = {}) {
    const init = { ...options };
    if (init.body) init.headers = { 'Content-Type': 'application/json' };
    const resposta = await fetch(API + url, init);
    if (!resposta.ok) throw new Error('Pedido falhou (HTTP ' + resposta.status + ').');
    return resposta.status === 204 ? null : resposta.json();
  }

  function normalizar(texto) {
    return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  }

  function nomeCurso(idCurso) {
    const curso = cursos.find((c) => String(c.id) === String(idCurso));
    return curso ? curso.nomeDoCurso : '—';
  }

  function alunosVisiveis() {
    const texto = normalizar(filtros.texto.trim());
    const filtrados = alunos.filter((aluno) => {
      if (filtros.curso && String(aluno.idCurso) !== filtros.curso) return false;
      if (filtros.ano && String(aluno.anoCurricular) !== filtros.ano) return false;
      if (!texto) return true;
      return normalizar(aluno.nome + ' ' + aluno.apelido).includes(texto);
    });

    const fator = ordenacao.direcao === 'asc' ? 1 : -1;
    return filtrados.sort((a, b) => {
      let comparacao;
      if (ordenacao.campo === 'curso') {
        comparacao = nomeCurso(a.idCurso).localeCompare(nomeCurso(b.idCurso), 'pt');
      } else if (ordenacao.campo === 'anoCurricular') {
        comparacao = a.anoCurricular - b.anoCurricular;
      } else if (ordenacao.campo === 'idade') {
        comparacao = (a.idade ?? -1) - (b.idade ?? -1);
      } else {
        comparacao = String(a[ordenacao.campo]).localeCompare(String(b[ordenacao.campo]), 'pt');
      }
      return comparacao * fator;
    });
  }

  function ordenar(campo) {
    if (ordenacao.campo === campo) {
      ordenacao.direcao = ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    } else {
      ordenacao = { campo, direcao: 'asc' };
    }
  }

  function ariaSort(campo) {
    if (ordenacao.campo !== campo) return 'none';
    return ordenacao.direcao === 'asc' ? 'ascending' : 'descending';
  }

  async function carregar() {
    mensagem = '';
    try {
      [cursos, alunos] = await Promise.all([pedir('/cursos'), pedir('/alunos')]);
    } catch (erro) {
      mensagem = erro.message;
    }
  }

  function abrirModal(aluno = null) {
    idEdicao = aluno ? aluno.id : null;
    form = aluno
      ? {
          nome: aluno.nome,
          apelido: aluno.apelido,
          idCurso: String(aluno.idCurso),
          anoCurricular: String(aluno.anoCurricular),
          idade: aluno.idade ?? null,
        }
      : formVazio();
    erroAluno = '';
    dialogo.showModal();
  }

  function aoFecharModal() {
    idEdicao = null;
    form = formVazio();
  }

  async function apagar(aluno) {
    if (!confirm('Apagar ' + aluno.nome + ' ' + aluno.apelido + '?')) return;

    try {
      await pedir('/alunos/' + encodeURIComponent(aluno.id), { method: 'DELETE' });
      await carregar();
    } catch (erro) {
      mensagem = erro.message;
    }
  }

  function lerPayload() {
    const payload = {
      nome: form.nome.trim(),
      apelido: form.apelido.trim(),
      idCurso: form.idCurso,
      anoCurricular: Number(form.anoCurricular),
    };
    if (form.idade != null) payload.idade = form.idade;
    return payload;
  }

  async function guardar(event) {
    event.preventDefault();
    const payload = lerPayload();

    try {
      if (idEdicao !== null) {
        await pedir('/alunos/' + encodeURIComponent(idEdicao), { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await pedir('/alunos', { method: 'POST', body: JSON.stringify(payload) });
      }
      dialogo.close();
      await carregar();
    } catch (erro) {
      erroAluno = erro.message;
    }
  }

  carregar();
</script>

<main class="mx-auto max-w-[1000px] px-4 py-8">
  <header class="mb-4 flex flex-wrap items-center justify-between gap-4">
    <h1 class="text-[1.6rem] font-bold">Gestão de Alunos</h1>
    <button type="button" class="btn btn-secondary" onclick={() => abrirModal()}>Novo aluno</button>
  </header>

  <p role="alert" class="my-4 text-danger" hidden={!mensagem}>{mensagem}</p>

  <div class="mb-4 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] items-end gap-3 rounded-lg border border-border bg-surface p-4">
    <label class="rotulo">
      Curso
      <select class="campo" bind:value={filtros.curso}>
        <option value="">Todos</option>
        {#each cursos as curso (curso.id)}
          <option value={String(curso.id)}>{curso.nomeDoCurso}</option>
        {/each}
      </select>
    </label>
    <label class="rotulo">
      Ano curricular
      <select class="campo" bind:value={filtros.ano}>
        <option value="">Todos</option>
        <option value="1">1.º ano</option>
        <option value="2">2.º ano</option>
        <option value="3">3.º ano</option>
      </select>
    </label>
    <label class="rotulo">
      Pesquisar
      <input class="campo" type="search" placeholder="Nome ou apelido" bind:value={filtros.texto} />
    </label>
    <button type="button" class="btn btn-secondary justify-self-start" onclick={() => (filtros = filtrosVazios())}>
      Limpar filtros
    </button>
  </div>

  <p class="mb-3 text-sm text-muted">{contagem}</p>

  <div class="mb-4 overflow-x-auto rounded-lg border border-border bg-surface">
    <table class="w-full border-collapse text-[0.95rem]">
      <thead>
        <tr>
          {#each colunas as coluna (coluna.campo)}
            <th scope="col" class="border-b border-border p-0 text-muted" aria-sort={ariaSort(coluna.campo)}>
              <button
                type="button"
                class="w-full cursor-pointer px-[0.7rem] py-[0.6rem] text-left font-semibold hover:bg-slate-100"
                onclick={() => ordenar(coluna.campo)}
              >
                {coluna.titulo}{#if ordenacao.campo === coluna.campo}{ordenacao.direcao === 'asc' ? ' ▲' : ' ▼'}{/if}
              </button>
            </th>
          {/each}
          <th scope="col" class="celula font-semibold text-muted">Ações</th>
        </tr>
      </thead>
      <tbody class="[&>tr:last-child>td]:border-b-0">
        {#each visiveis as aluno (aluno.id)}
          <tr class="hover:bg-slate-100">
            <td class="celula">{aluno.nome}</td>
            <td class="celula">{aluno.apelido}</td>
            <td class="celula">{nomeCurso(aluno.idCurso)}</td>
            <td class="celula">{aluno.anoCurricular}.º</td>
            <td class="celula">{aluno.idade ?? '—'}</td>
            <td class="celula whitespace-nowrap">
              <button type="button" class="btn btn-sm btn-secondary" onclick={() => abrirModal(aluno)}>Editar</button>
              <button type="button" class="btn btn-sm btn-danger" onclick={() => apagar(aluno)}>Apagar</button>
            </td>
          </tr>
        {:else}
          <tr>
            <td class="celula" colspan="6">
              {alunos.length ? 'Nenhum aluno corresponde aos filtros.' : 'Nenhum aluno registado.'}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</main>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialogo}
  aria-labelledby="titulo-aluno"
  class="m-auto max-h-[90vh] w-[min(90vw,520px)] overflow-auto rounded-lg border border-border bg-surface text-text backdrop:bg-slate-900/45"
  onclose={aoFecharModal}
  onclick={(event) => {
    if (event.target === dialogo) dialogo.close();
  }}
>
  <form class="p-5" onsubmit={guardar}>
    <h2 id="titulo-aluno" class="mb-4 text-[1.1rem] font-bold">{idEdicao !== null ? 'Editar aluno' : 'Novo aluno'}</h2>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
      <label class="rotulo">
        Nome
        <input class="campo" type="text" required minlength="2" maxlength="60" autocomplete="given-name" bind:value={form.nome} />
      </label>
      <label class="rotulo">
        Apelido
        <input class="campo" type="text" required minlength="2" maxlength="60" autocomplete="family-name" bind:value={form.apelido} />
      </label>
      <label class="rotulo">
        Curso
        <select class="campo" required bind:value={form.idCurso}>
          <option value="">Selecionar…</option>
          {#each cursos as curso (curso.id)}
            <option value={String(curso.id)}>{curso.nomeDoCurso}</option>
          {/each}
        </select>
      </label>
      <label class="rotulo">
        Ano curricular
        <select class="campo" required bind:value={form.anoCurricular}>
          <option value="">Selecionar…</option>
          <option value="1">1.º ano</option>
          <option value="2">2.º ano</option>
          <option value="3">3.º ano</option>
        </select>
      </label>
      <label class="rotulo">
        Idade
        <input class="campo" type="number" min="0" max="120" bind:value={form.idade} />
      </label>
    </div>
    <p role="alert" class="mt-3 text-danger" hidden={!erroAluno}>{erroAluno}</p>
    <div class="mt-4 flex gap-2">
      <button type="submit" class="btn btn-primary">{idEdicao !== null ? 'Guardar' : 'Adicionar'}</button>
      <button type="button" class="btn btn-secondary" onclick={() => dialogo.close()}>Cancelar</button>
    </div>
  </form>
</dialog>
