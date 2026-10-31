const API = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? ''
  : 'https://sir-api-fn74.onrender.com';

const form = document.getElementById('aluno-form');
const inputNome = document.getElementById('nome');
const inputApelido = document.getElementById('apelido');
const inputCurso = document.getElementById('curso');
const inputAno = document.getElementById('ano');
const inputIdade = document.getElementById('idade');
const tbody = document.getElementById('alunos');
const mensagem = document.getElementById('mensagem');

const dialogoEdicao = document.getElementById('dialogo-edicao');
const formEdicao = document.getElementById('form-edicao');
const erroEdicao = document.getElementById('erro-edicao');
const editarNome = document.getElementById('editar-nome');
const editarApelido = document.getElementById('editar-apelido');
const editarCurso = document.getElementById('editar-curso');
const editarAno = document.getElementById('editar-ano');
const editarIdade = document.getElementById('editar-idade');
const cancelarEdicao = document.getElementById('cancelar-edicao');

let cursos = [];
let alunos = [];
let edicaoId = null;

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

function nomeCurso(idCurso) {
  const curso = cursos.find((c) => String(c.id) === String(idCurso));
  return curso ? curso.nomeDoCurso : '—';
}

function preencherSelect(select) {
  const selecionado = select.value;
  select.innerHTML = '<option value="">Selecionar…</option>';
  for (const curso of cursos) {
    const opcao = document.createElement('option');
    opcao.value = curso.id;
    opcao.textContent = curso.nomeDoCurso;
    select.appendChild(opcao);
  }
  select.value = selecionado;
}

function preencherCursos() {
  preencherSelect(inputCurso);
  preencherSelect(editarCurso);
}

function criarBotao(texto, acao, id) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.textContent = texto;
  botao.dataset.acao = acao;
  botao.dataset.id = id;
  return botao;
}

function desenharAlunos() {
  tbody.innerHTML = '';
  if (!alunos.length) {
    const linha = document.createElement('tr');
    const celula = document.createElement('td');
    celula.colSpan = 6;
    celula.textContent = 'Nenhum aluno registado.';
    linha.appendChild(celula);
    tbody.appendChild(linha);
    return;
  }

  for (const aluno of alunos) {
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

function editar(id) {
  const aluno = alunos.find((a) => String(a.id) === String(id));
  if (!aluno) return;

  edicaoId = aluno.id;
  editarNome.value = aluno.nome;
  editarApelido.value = aluno.apelido;
  editarCurso.value = aluno.idCurso;
  editarAno.value = aluno.anoCurricular;
  editarIdade.value = aluno.idade ?? '';
  erroEdicao.hidden = true;
  dialogoEdicao.showModal();
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

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = lerPayload(inputNome, inputApelido, inputCurso, inputAno, inputIdade);

  try {
    await pedir('/alunos', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    await carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
});

formEdicao.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (edicaoId === null) return;

  const payload = lerPayload(editarNome, editarApelido, editarCurso, editarAno, editarIdade);

  try {
    await pedir('/alunos/' + encodeURIComponent(edicaoId), { method: 'PUT', body: JSON.stringify(payload) });
    dialogoEdicao.close();
    await carregar();
  } catch (erro) {
    erroEdicao.textContent = erro.message;
    erroEdicao.hidden = false;
  }
});

dialogoEdicao.addEventListener('close', () => {
  edicaoId = null;
  formEdicao.reset();
});

dialogoEdicao.addEventListener('click', (event) => {
  if (event.target === dialogoEdicao) dialogoEdicao.close();
});

cancelarEdicao.addEventListener('click', () => dialogoEdicao.close());

tbody.addEventListener('click', (event) => {
  const botao = event.target.closest('button');
  if (!botao) return;
  if (botao.dataset.acao === 'editar') editar(botao.dataset.id);
  if (botao.dataset.acao === 'apagar') apagar(botao.dataset.id);
});

carregar();
