const API_BASE = 'http://localhost:3000';

const $ = (id) => document.getElementById(id);

const els = {
  filterCurso: $('filter-curso'),
  btnRefresh: $('btn-refresh'),
  btnNew: $('btn-new'),
  resultCount: $('result-count'),
  loading: $('state-loading'),
  error: $('state-error'),
  empty: $('state-empty'),
  tableWrapper: $('table-wrapper'),
  tbody: $('alunos-tbody'),
  dialog: $('aluno-dialog'),
  dialogTitle: $('dialog-title'),
  form: $('aluno-form'),
  formError: $('aluno-form-error'),
  fNome: $('aluno-nome'),
  fApelido: $('aluno-apelido'),
  fCurso: $('aluno-curso'),
  fAno: $('aluno-ano'),
  fIdade: $('aluno-idade'),
  btnCancel: $('btn-cancel'),
};

let cursos = [];
let allAlunos = [];
let editingId = null;

async function req(path, options) {
  const init = { ...options };
  if (init.body !== undefined) init.headers = { 'Content-Type': 'application/json' };
  let res;
  try {
    res = await fetch(API_BASE + path, init);
  } catch {
    throw new Error('Não foi possível ligar à API. Verifique se está em execução.');
  }
  if (res.status === 204) return null;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error('Pedido falhou (HTTP ' + res.status + ').');
  return body;
}

function cursoName(id) {
  const found = cursos.find((c) => String(c.id) === String(id));
  return found ? found.nomeDoCurso : 'Curso ' + id;
}

function show(name) {
  els.loading.hidden = name !== 'loading';
  els.error.hidden = name !== 'error';
  els.empty.hidden = name !== 'empty';
  els.tableWrapper.hidden = name !== 'table';
}

async function load() {
  show('loading');
  try {
    const [cursosRes, alunosRes] = await Promise.all([req('/cursos'), req('/alunos')]);
    cursos = cursosRes;
    allAlunos = alunosRes;
    fillCursoOptions();
    render();
  } catch (err) {
    els.error.textContent = err.message;
    show('error');
  }
}

function fillCursoOptions() {
  const prevFilter = els.filterCurso.value;
  const prevForm = els.fCurso.value;
  els.filterCurso.innerHTML = '<option value="">Todos os cursos</option>';
  els.fCurso.innerHTML = '<option value="">Selecionar…</option>';
  for (const c of cursos) {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.nomeDoCurso;
    els.filterCurso.appendChild(opt);
    els.fCurso.appendChild(opt.cloneNode(true));
  }
  els.filterCurso.value = prevFilter;
  if (prevForm !== '') els.fCurso.value = prevForm;
}

function render() {
  const filter = els.filterCurso.value;
  const alunos = allAlunos.filter((a) => filter === '' || String(a.idCurso) === filter);
  els.tbody.innerHTML = '';
  for (const a of alunos) {
    const tr = document.createElement('tr');
    const cells = [a.nome, a.apelido, cursoName(a.idCurso), a.anoCurricular + '.º', a.idade ?? '—'];
    for (const value of cells) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    }
    const tdActions = document.createElement('td');
    tdActions.className = 'row-actions';
    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'btn btn-secondary btn-sm';
    btnEdit.textContent = 'Editar';
    btnEdit.dataset.editId = a.id;
    const btnDelete = document.createElement('button');
    btnDelete.type = 'button';
    btnDelete.className = 'btn btn-danger btn-sm';
    btnDelete.textContent = 'Apagar';
    btnDelete.dataset.deleteId = a.id;
    tdActions.append(btnEdit, btnDelete);
    tr.appendChild(tdActions);
    els.tbody.appendChild(tr);
  }
  els.resultCount.textContent = alunos.length + ' aluno' + (alunos.length === 1 ? ' encontrado' : 's encontrados');
  show(alunos.length ? 'table' : 'empty');
}

function openDialog(aluno) {
  editingId = aluno ? aluno.id : null;
  els.dialogTitle.textContent = aluno ? 'Editar aluno' : 'Novo aluno';
  els.formError.hidden = true;
  els.fNome.value = aluno ? aluno.nome : '';
  els.fApelido.value = aluno ? aluno.apelido : '';
  els.fCurso.value = aluno ? String(aluno.idCurso) : '';
  els.fAno.value = aluno ? String(aluno.anoCurricular) : '';
  els.fIdade.value = aluno && aluno.idade !== undefined ? aluno.idade : '';
  els.dialog.showModal();
  els.fNome.focus();
}

function toPayload() {
  const idCursoNum = Number(els.fCurso.value);
  const payload = {
    nome: els.fNome.value.trim(),
    apelido: els.fApelido.value.trim(),
    idCurso: els.fCurso.value !== '' && !Number.isNaN(idCursoNum) ? idCursoNum : els.fCurso.value,
    anoCurricular: Number(els.fAno.value),
  };
  if (els.fIdade.value !== '') payload.idade = Number(els.fIdade.value);
  return payload;
}

function valid(payload) {
  if (payload.nome.length < 2 || payload.apelido.length < 2) return 'Nome e apelido devem ter pelo menos 2 caracteres.';
  if (payload.idCurso === '') return 'Selecione um curso.';
  if (![1, 2, 3].includes(payload.anoCurricular)) return 'Ano curricular inválido.';
  if (payload.idade !== undefined && (Number.isNaN(payload.idade) || payload.idade < 0 || payload.idade > 120)) return 'Idade inválida.';
  return null;
}

async function handleSubmit(event) {
  event.preventDefault();
  const payload = toPayload();
  const error = valid(payload);
  if (error) {
    els.formError.textContent = error;
    els.formError.hidden = false;
    return;
  }
  try {
    if (editingId === null) {
      await req('/alunos', { method: 'POST', body: JSON.stringify(payload) });
    } else {
      await req('/alunos/' + encodeURIComponent(editingId), { method: 'PUT', body: JSON.stringify(payload) });
    }
    els.dialog.close();
    await load();
  } catch (err) {
    els.formError.textContent = err.message;
    els.formError.hidden = false;
  }
}

async function handleDelete(id) {
  const aluno = allAlunos.find((a) => String(a.id) === String(id));
  const label = aluno ? aluno.nome + ' ' + aluno.apelido : 'este aluno';
  if (!confirm('Apagar ' + label + '?')) return;
  try {
    await req('/alunos/' + encodeURIComponent(id), { method: 'DELETE' });
    await load();
  } catch (err) {
    alert(err.message);
  }
}

els.btnRefresh.addEventListener('click', load);
els.btnNew.addEventListener('click', () => openDialog(null));
els.filterCurso.addEventListener('change', render);
els.form.addEventListener('submit', handleSubmit);
els.btnCancel.addEventListener('click', () => els.dialog.close());
els.tbody.addEventListener('click', (event) => {
  const editId = event.target.closest('[data-edit-id]');
  const deleteId = event.target.closest('[data-delete-id]');
  if (editId) {
    const aluno = allAlunos.find((a) => String(a.id) === String(editId.dataset.editId));
    if (aluno) openDialog(aluno);
  } else if (deleteId) {
    handleDelete(deleteId.dataset.deleteId);
  }
});

load();
