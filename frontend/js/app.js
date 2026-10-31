const API = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? ''
  : 'https://sir-api-fn74.onrender.com';

const form = document.getElementById('aluno-form');
const formTitle = document.getElementById('form-title');
const inputNome = document.getElementById('nome');
const inputApelido = document.getElementById('apelido');
const inputCurso = document.getElementById('curso');
const inputAno = document.getElementById('ano');
const inputIdade = document.getElementById('idade');
const botaoGuardar = document.getElementById('guardar');
const botaoCancelar = document.getElementById('cancelar');
const tbody = document.getElementById('alunos');
const mensagem = document.getElementById('mensagem');

let cursos = [];
let alunos = [];
let editId = null;

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

function preencherCursos() {
  const selecionado = inputCurso.value;
  inputCurso.innerHTML = '<option value="">Selecionar…</option>';
  for (const curso of cursos) {
    const opcao = document.createElement('option');
    opcao.value = curso.id;
    opcao.textContent = curso.nomeDoCurso;
    inputCurso.appendChild(opcao);
  }
  inputCurso.value = selecionado;
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

function limparFormulario() {
  editId = null;
  form.reset();
  formTitle.textContent = 'Novo aluno';
  botaoGuardar.textContent = 'Adicionar';
  botaoCancelar.hidden = true;
}

function editar(id) {
  const aluno = alunos.find((a) => String(a.id) === String(id));
  if (!aluno) return;

  editId = aluno.id;
  inputNome.value = aluno.nome;
  inputApelido.value = aluno.apelido;
  inputCurso.value = aluno.idCurso;
  inputAno.value = aluno.anoCurricular;
  inputIdade.value = aluno.idade ?? '';
  formTitle.textContent = 'Editar aluno';
  botaoGuardar.textContent = 'Atualizar';
  botaoCancelar.hidden = false;
  inputNome.focus();
}

async function apagar(id) {
  const aluno = alunos.find((a) => String(a.id) === String(id));
  const nome = aluno ? aluno.nome + ' ' + aluno.apelido : 'este aluno';
  if (!confirm('Apagar ' + nome + '?')) return;

  try {
    await pedir('/alunos/' + encodeURIComponent(id), { method: 'DELETE' });
    if (editId === id) limparFormulario();
    await carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    nome: inputNome.value.trim(),
    apelido: inputApelido.value.trim(),
    idCurso: inputCurso.value,
    anoCurricular: Number(inputAno.value),
  };
  if (inputIdade.value !== '') payload.idade = Number(inputIdade.value);

  try {
    if (editId === null) {
      await pedir('/alunos', { method: 'POST', body: JSON.stringify(payload) });
    } else {
      await pedir('/alunos/' + encodeURIComponent(editId), { method: 'PUT', body: JSON.stringify(payload) });
    }
    limparFormulario();
    await carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
});

tbody.addEventListener('click', (event) => {
  const botao = event.target.closest('button');
  if (!botao) return;
  if (botao.dataset.acao === 'editar') editar(botao.dataset.id);
  if (botao.dataset.acao === 'apagar') apagar(botao.dataset.id);
});

botaoCancelar.addEventListener('click', limparFormulario);

carregar();
