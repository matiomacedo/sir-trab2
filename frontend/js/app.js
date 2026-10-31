const API = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? ''
  : 'https://sir-api-fn74.onrender.com';

const dialogoAluno = document.getElementById('dialogo-aluno');
const formAluno = document.getElementById('form-aluno');
const tituloAluno = document.getElementById('titulo-aluno');
const erroAluno = document.getElementById('erro-aluno');
const campoNome = document.getElementById('aluno-nome');
const campoApelido = document.getElementById('aluno-apelido');
const campoCurso = document.getElementById('aluno-curso');
const campoAno = document.getElementById('aluno-ano');
const campoIdade = document.getElementById('aluno-idade');
const botaoGuardar = document.getElementById('guardar-aluno');
const botaoCancelar = document.getElementById('cancelar-aluno');
const botaoNovo = document.getElementById('novo-aluno');

const filtroCurso = document.getElementById('filtro-curso');
const filtroAno = document.getElementById('filtro-ano');
const filtroTexto = document.getElementById('filtro-texto');
const botaoLimparFiltros = document.getElementById('limpar-filtros');
const contagem = document.getElementById('contagem');

const thead = document.querySelector('thead');
const tbody = document.getElementById('alunos');
const mensagem = document.getElementById('mensagem');

let cursos = [];
let alunos = [];
let idEdicao = null;
let ordenacao = { campo: 'nome', direcao: 'asc' };

async function pedir(url, options = {}) {
  const init = { ...options };
  if (init.body) init.headers = { 'Content-Type': 'application/json' };
  const resposta = await fetch(API + url, init);
  if (!resposta.ok) throw new Error('Pedido falhou (HTTP ' + resposta.status + ').');
  return resposta.status === 204 ? null : resposta.json();
}

function mostrarErro(erro) {
  mensagem.textContent = erro.message;
  mensagem.hidden = false;
}

function normalizar(texto) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function nomeCurso(idCurso) {
  const curso = cursos.find((c) => String(c.id) === String(idCurso));
  return curso ? curso.nomeDoCurso : '—';
}

function preencherSelect(select, textoInicial) {
  const selecionado = select.value;
  select.innerHTML = '<option value="">' + textoInicial + '</option>';
  for (const curso of cursos) {
    const opcao = document.createElement('option');
    opcao.value = curso.id;
    opcao.textContent = curso.nomeDoCurso;
    select.appendChild(opcao);
  }
  select.value = selecionado;
}

function preencherCursos() {
  preencherSelect(filtroCurso, 'Todos');
  preencherSelect(campoCurso, 'Selecionar…');
}

function criarBotao(texto, acao, id) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.textContent = texto;
  botao.dataset.acao = acao;
  botao.dataset.id = id;
  return botao;
}

function alunosVisiveis() {
  const texto = normalizar(filtroTexto.value.trim());
  const visiveis = alunos.filter((aluno) => {
    if (filtroCurso.value && String(aluno.idCurso) !== filtroCurso.value) return false;
    if (filtroAno.value && String(aluno.anoCurricular) !== filtroAno.value) return false;
    if (!texto) return true;
    return normalizar(aluno.nome + ' ' + aluno.apelido).includes(texto);
  });

  const fator = ordenacao.direcao === 'asc' ? 1 : -1;
  return visiveis.sort((a, b) => {
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

function desenharAlunos() {
  const visiveis = alunosVisiveis();
  tbody.innerHTML = '';

  contagem.textContent = visiveis.length === alunos.length
    ? alunos.length + ' alunos'
    : visiveis.length + ' de ' + alunos.length + ' alunos';

  if (!visiveis.length) {
    const linha = document.createElement('tr');
    const celula = document.createElement('td');
    celula.colSpan = 6;
    celula.textContent = alunos.length
      ? 'Nenhum aluno corresponde aos filtros.'
      : 'Nenhum aluno registado.';
    linha.appendChild(celula);
    tbody.appendChild(linha);
    return;
  }

  for (const aluno of visiveis) {
    const linha = document.createElement('tr');
    const valores = [aluno.nome, aluno.apelido, nomeCurso(aluno.idCurso), aluno.anoCurricular + '.º', aluno.idade ?? '—'];
    for (const valor of valores) {
      const celula = document.createElement('td');
      celula.textContent = valor;
      linha.appendChild(celula);
    }

    const acoes = document.createElement('td');
    acoes.append(criarBotao('Editar', 'editar', aluno.id), criarBotao('Apagar', 'apagar', aluno.id));
    linha.appendChild(acoes);
    tbody.appendChild(linha);
  }
}

function atualizarOrdenacao() {
  for (const th of thead.querySelectorAll('th[data-campo]')) {
    if (th.dataset.campo === ordenacao.campo) {
      th.setAttribute('aria-sort', ordenacao.direcao === 'asc' ? 'ascending' : 'descending');
    } else {
      th.setAttribute('aria-sort', 'none');
    }
  }
}

async function carregar() {
  mensagem.hidden = true;
  try {
    [cursos, alunos] = await Promise.all([pedir('/cursos'), pedir('/alunos')]);
    preencherCursos();
    desenharAlunos();
  } catch (erro) {
    mostrarErro(erro);
  }
}

function abrirModal(aluno = null) {
  idEdicao = aluno ? aluno.id : null;

  if (aluno) {
    campoNome.value = aluno.nome;
    campoApelido.value = aluno.apelido;
    campoCurso.value = aluno.idCurso;
    campoAno.value = aluno.anoCurricular;
    campoIdade.value = aluno.idade ?? '';
    tituloAluno.textContent = 'Editar aluno';
    botaoGuardar.textContent = 'Guardar';
  } else {
    formAluno.reset();
    tituloAluno.textContent = 'Novo aluno';
    botaoGuardar.textContent = 'Adicionar';
  }

  erroAluno.hidden = true;
  dialogoAluno.showModal();
}

async function apagar(id) {
  const aluno = alunos.find((a) => String(a.id) === String(id));
  const nome = aluno ? aluno.nome + ' ' + aluno.apelido : 'este aluno';
  if (!confirm('Apagar ' + nome + '?')) return;

  try {
    await pedir('/alunos/' + encodeURIComponent(id), { method: 'DELETE' });
    await carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

function lerPayload(nome, apelido, curso, ano, idade) {
  const payload = {
    nome: nome.value.trim(),
    apelido: apelido.value.trim(),
    idCurso: curso.value,
    anoCurricular: Number(ano.value),
  };
  if (idade.value !== '') payload.idade = Number(idade.value);
  return payload;
}

formAluno.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = lerPayload(campoNome, campoApelido, campoCurso, campoAno, campoIdade);

  try {
    if (idEdicao !== null) {
      await pedir('/alunos/' + encodeURIComponent(idEdicao), { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await pedir('/alunos', { method: 'POST', body: JSON.stringify(payload) });
    }
    dialogoAluno.close();
    await carregar();
  } catch (erro) {
    erroAluno.textContent = erro.message;
    erroAluno.hidden = false;
  }
});

dialogoAluno.addEventListener('close', () => {
  idEdicao = null;
  formAluno.reset();
});

dialogoAluno.addEventListener('click', (event) => {
  if (event.target === dialogoAluno) dialogoAluno.close();
});

botaoCancelar.addEventListener('click', () => dialogoAluno.close());
botaoNovo.addEventListener('click', () => abrirModal());

filtroCurso.addEventListener('change', desenharAlunos);
filtroAno.addEventListener('change', desenharAlunos);
filtroTexto.addEventListener('input', desenharAlunos);

botaoLimparFiltros.addEventListener('click', () => {
  filtroCurso.value = '';
  filtroAno.value = '';
  filtroTexto.value = '';
  desenharAlunos();
});

thead.addEventListener('click', (event) => {
  const th = event.target.closest('th[data-campo]');
  if (!th) return;

  const campo = th.dataset.campo;
  if (ordenacao.campo === campo) {
    ordenacao.direcao = ordenacao.direcao === 'asc' ? 'desc' : 'asc';
  } else {
    ordenacao = { campo, direcao: 'asc' };
  }

  atualizarOrdenacao();
  desenharAlunos();
});

tbody.addEventListener('click', (event) => {
  const botao = event.target.closest('button');
  if (!botao) return;
  if (botao.dataset.acao === 'editar') {
    const aluno = alunos.find((a) => String(a.id) === String(botao.dataset.id));
    if (aluno) abrirModal(aluno);
  }
  if (botao.dataset.acao === 'apagar') apagar(botao.dataset.id);
});

atualizarOrdenacao();
carregar();
