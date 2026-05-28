const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const welcomeName = document.getElementById('welcome-name');
const userRoleLabel = document.getElementById('user-role');
const studentDashboard = document.getElementById('student-dashboard');
const teacherDashboard = document.getElementById('teacher-dashboard');
const menuSection = document.querySelector('.menu-section');
const showFormBtn = document.getElementById('show-form');
const showExercisesBtn = document.getElementById('show-exercises');
const showRecordsBtn = document.getElementById('show-records');
const exerciseSection = document.getElementById('exercise-section');
const formSection = document.getElementById('form-section');
const exerciseCards = document.querySelectorAll('.exercise-card');
const form = document.getElementById('amortizacion-form');
const nombreInput = document.getElementById('nombre');
const montoInput = document.getElementById('monto');
const tasaInput = document.getElementById('tasaAnual');
const plazoInput = document.getElementById('plazoAnios');
const pagosInput = document.getElementById('pagosAno');
const pagoPeriodoLabel = document.getElementById('pagoPeriodo');
const totalPagadoLabel = document.getElementById('totalPagado');
const totalInteresLabel = document.getElementById('totalInteres');
const studentRecordsBody = document.getElementById('records-body');
const teacherRecordsBody = document.getElementById('teacher-records-body');
const usersBody = document.getElementById('users-body');
const cancelarButton = document.getElementById('cancelar');
const modalResultado = document.getElementById('modal-resultado');
const modalIcon = document.getElementById('modal-icon');
const modalTitulo = document.getElementById('modal-titulo');
const modalMensaje = document.getElementById('modal-mensaje');
const modalBtn = document.getElementById('modal-btn');

let editingId = null;
let currentUser = null;

// Función para mostrar modal
function showModal(titulo, mensaje, isSuccess = true) {
  modalTitulo.textContent = titulo;
  modalMensaje.textContent = mensaje;
  modalIcon.className = `modal-icon ${isSuccess ? 'success' : 'error'}`;
  modalResultado.classList.remove('hidden');
}

// Función para cerrar modal
function closeModal() {
  modalResultado.classList.add('hidden');
}

// Cerrar modal al hacer clic en el botón
modalBtn.addEventListener('click', closeModal);

// Validar contraseña
function validatePassword(password) {
  if (!password || password.trim().length === 0) {
    return { valid: false, message: 'La contraseña es obligatoria.' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'La contraseña debe tener mínimo 6 caracteres.' };
  }
  return { valid: true };
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try {
    await postJson('/api/auth/login', { email, password });
    await loadUser();
  } catch (error) {
    alert(error.message);
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  // Validar contraseña
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    showModal('Error en el registro', passwordValidation.message, false);
    return;
  }

  // Validar nombre
  if (!name || name.length < 2) {
    showModal('Error en el registro', 'El nombre debe tener al menos 2 caracteres.', false);
    return;
  }

  try {
    await postJson('/api/auth/register', { name, email, password });
    showModal('¡Registro exitoso!', '¡Bienvenido! Tu cuenta ha sido creada correctamente.', true);
    
    // Limpiar formulario
    registerForm.reset();
    
    // Redirigir después de 2 segundos
    setTimeout(() => {
      closeModal();
      loadUser();
    }, 2000);
  } catch (error) {
    showModal('Error en el registro', error.message || 'Ocurrió un error al registrar tu cuenta.', false);
  }
});

logoutBtn.addEventListener('click', async () => {
  await postJson('/api/auth/logout', {});
  location.reload();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = getFormData();
  if (!data) return;

  const url = editingId ? `/api/amortizaciones/${editingId}` : '/api/amortizaciones';
  const method = editingId ? 'PUT' : 'POST';

  try {
    await fetchJson(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    editingId = null;
    form.reset();
    updateSummary({ pagoPeriodo: '-', totalPagado: '-', totalInteres: '-' });
    await loadRecords();
  } catch (error) {
    alert(error.message || 'Error al guardar la amortización');
  }
});

cancelarButton.addEventListener('click', () => {
  editingId = null;
  form.reset();
  updateSummary({ pagoPeriodo: '-', totalPagado: '-', totalInteres: '-' });
});

showFormBtn.addEventListener('click', () => {
  if (currentUser?.role !== 'student') return;
  setActiveMenu(showFormBtn);
  exerciseSection.classList.add('hidden');
  formSection.scrollIntoView({ behavior: 'smooth' });
});

showExercisesBtn.addEventListener('click', () => {
  if (currentUser?.role !== 'student') return;
  setActiveMenu(showExercisesBtn);
  exerciseSection.classList.remove('hidden');
  exerciseSection.scrollIntoView({ behavior: 'smooth' });
});

showRecordsBtn.addEventListener('click', () => {
  if (currentUser?.role !== 'student') return;
  setActiveMenu(showRecordsBtn);
  exerciseSection.classList.add('hidden');
  studentRecordsBody.closest('section').scrollIntoView({ behavior: 'smooth' });
});

exerciseCards.forEach((card) => {
  card.addEventListener('click', () => {
    nombreInput.value = card.dataset.nombre;
    montoInput.value = card.dataset.monto;
    tasaInput.value = card.dataset.tasa;
    plazoInput.value = card.dataset.plazo;
    pagosInput.value = card.dataset.pagos;
    updateSummary(computeValues(getFormData(true)));
    formSection.scrollIntoView({ behavior: 'smooth' });
  });
});

[ montoInput, tasaInput, plazoInput, pagosInput ].forEach((input) => {
  input.addEventListener('input', () => {
    const data = getFormData(true);
    if (data) {
      updateSummary(computeValues(data));
    }
  });
});

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || `Respuesta no JSON (${response.status})` };
  }
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(data.error || `Error en la petición (${response.status})`);
  }
  return data;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(data.error || `Error en la petición (${response.status})`);
  }
  return data;
}

async function loadUser() {
  try {
    const data = await fetchJson('/api/auth/me');
    if (data.user) {
      currentUser = data.user;
      showDashboard();
      return;
    }
  } catch (error) {
    console.error('Error cargando usuario:', error);
  }

  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
}

function showDashboard() {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  welcomeName.textContent = `Hola, ${currentUser.name}`;
  userRoleLabel.textContent = currentUser.role === 'teacher' ? 'GRADO: MAESTRO' : 'GRADO: ESTUDIANTE';

  if (currentUser.role === 'teacher') {
    studentDashboard.classList.add('hidden');
    teacherDashboard.classList.remove('hidden');
    menuSection.classList.add('hidden');
    loadTeacherData();
  } else {
    studentDashboard.classList.remove('hidden');
    teacherDashboard.classList.add('hidden');
    menuSection.classList.remove('hidden');
    setActiveMenu(showFormBtn);
    exerciseSection.classList.add('hidden');
    loadRecords();
  }
}

function getFormData(optional = false) {
  const monto = Number(montoInput.value);
  const tasaAnual = Number(tasaInput.value);
  const plazoAnios = Number(plazoInput.value);
  const pagosAno = Number(pagosInput.value);

  if (!optional && (!monto || !tasaAnual || !plazoAnios || !pagosAno)) {
    alert('Por favor completa todos los campos obligatorios.');
    return null;
  }

  return {
    nombre: nombreInput.value.trim() || 'Amortización',
    monto,
    tasaAnual,
    plazoAnios,
    pagosAno
  };
}

function computeValues({ monto, tasaAnual, plazoAnios, pagosAno }) {
  const tasaPeriodo = tasaAnual / 100 / pagosAno;
  const numeroPagos = plazoAnios * pagosAno;
  const pagoPeriodo = tasaPeriodo === 0
    ? monto / numeroPagos
    : (monto * tasaPeriodo) / (1 - Math.pow(1 + tasaPeriodo, -numeroPagos));
  const totalPagado = pagoPeriodo * numeroPagos;
  const totalInteres = totalPagado - monto;

  return {
    pagoPeriodo: pagoPeriodo.toFixed(2),
    totalPagado: totalPagado.toFixed(2),
    totalInteres: totalInteres.toFixed(2)
  };
}

function updateSummary({ pagoPeriodo, totalPagado, totalInteres }) {
  pagoPeriodoLabel.textContent = typeof pagoPeriodo === 'number' ? `$ ${pagoPeriodo.toFixed(2)}` : `$ ${pagoPeriodo}`;
  totalPagadoLabel.textContent = typeof totalPagado === 'number' ? `$ ${totalPagado.toFixed(2)}` : `$ ${totalPagado}`;
  totalInteresLabel.textContent = typeof totalInteres === 'number' ? `$ ${totalInteres.toFixed(2)}` : `$ ${totalInteres}`;
}

function setActiveMenu(button) {
  [showFormBtn, showExercisesBtn, showRecordsBtn].forEach((item) => {
    item.classList.toggle('active', item === button);
  });
}

async function loadRecords() {
  const records = await fetchJson('/api/amortizaciones');
  studentRecordsBody.innerHTML = '';

  if (!records.length) {
    studentRecordsBody.innerHTML = '<tr><td colspan="9">No hay registros guardados.</td></tr>';
    return;
  }

  records.forEach((record) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.id}</td>
      <td>${record.nombre}</td>
      <td>$ ${Number(record.monto).toFixed(2)}</td>
      <td>${Number(record.tasaAnual).toFixed(2)}%</td>
      <td>${record.plazoAnios} años</td>
      <td>$ ${Number(record.pagoPeriodo).toFixed(2)}</td>
      <td>${record.status || 'pendiente'}</td>
      <td>${record.reviewComment || '-'}</td>
      <td class="action-btn">
        <button class="download-pdf" data-id="${record.id}" title="Descargar PDF">PDF</button>
        <button class="edit" data-id="${record.id}">Editar</button>
        <button class="delete" data-id="${record.id}">Eliminar</button>
      </td>
    `;

    row.querySelector('.download-pdf').addEventListener('click', () => downloadPDF(record.id));
    row.querySelector('.edit').addEventListener('click', () => editRecord(record));
    row.querySelector('.delete').addEventListener('click', () => deleteRecord(record.id));
    studentRecordsBody.appendChild(row);
  });
}

function downloadPDF(id) {
  const link = document.createElement('a');
  link.href = `/api/amortizaciones/${id}/export-pdf`;
  link.download = `amortizacion_${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function editRecord(record) {
  editingId = record.id;
  nombreInput.value = record.nombre;
  montoInput.value = record.monto;
  tasaInput.value = record.tasaAnual;
  plazoInput.value = record.plazoAnios;
  pagosInput.value = record.pagosAno;
  updateSummary({ pagoPeriodo: record.pagoPeriodo.toFixed(2), totalPagado: record.totalPagado.toFixed(2), totalInteres: record.totalInteres.toFixed(2) });
}

async function deleteRecord(id) {
  if (!confirm('¿Eliminar este registro?')) return;
  await fetchJson(`/api/amortizaciones/${id}`, { method: 'DELETE' });
  await loadRecords();
}

async function loadTeacherData() {
  const [records, users] = await Promise.all([
    fetchJson('/api/amortizaciones'),
    fetchJson('/api/users')
  ]);

  teacherRecordsBody.innerHTML = '';
  usersBody.innerHTML = '';

  if (!records.length) {
    teacherRecordsBody.innerHTML = '<tr><td colspan="10">No hay envíos de alumnos.</td></tr>';
  } else {
    records.forEach((record) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.id}</td>
        <td>${record.studentName}</td>
        <td>${record.nombre}</td>
        <td>$ ${Number(record.monto).toFixed(2)}</td>
        <td>${Number(record.tasaAnual).toFixed(2)}%</td>
        <td>${record.plazoAnios} años</td>
        <td>$ ${Number(record.pagoPeriodo).toFixed(2)}</td>
        <td>${record.status || 'pendiente'}</td>
        <td>${record.reviewComment || '-'}</td>
        <td class="action-btn">
          <button class="download-pdf" data-id="${record.id}" title="Descargar PDF">PDF</button>
          <button class="review" data-id="${record.id}">Revisar</button>
          <button class="delete" data-id="${record.id}">Eliminar</button>
        </td>
      `;
      row.querySelector('.download-pdf').addEventListener('click', () => downloadPDF(record.id));
      row.querySelector('.review').addEventListener('click', () => reviewRecord(record.id));
      row.querySelector('.delete').addEventListener('click', () => deleteRecord(record.id));
      teacherRecordsBody.appendChild(row);
    });
  }

  if (!users.length) {
    usersBody.innerHTML = '<tr><td colspan="5">No hay estudiantes registrados.</td></tr>';
  } else {
    users.forEach((user) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td class="action-btn">
          <button class="edit-user" data-id="${user.id}" data-name="${user.name}" data-email="${user.email}">Editar</button>
          <button class="delete-user" data-id="${user.id}">Eliminar</button>
        </td>
      `;
      row.querySelector('.edit-user').addEventListener('click', (e) => editUser(e.target.dataset));
      row.querySelector('.delete-user').addEventListener('click', () => deleteUser(user.id));
      usersBody.appendChild(row);
    });
  }
}

async function reviewRecord(id) {
  const status = prompt('Estado de revisión: pendiente, revisado o rechazado', 'revisado');
  if (!status) return;
  const comment = prompt('Comentario para el estudiante:', '');

  await fetchJson(`/api/amortizaciones/${id}/review`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, comment })
  });
  await loadTeacherData();
}

async function editUser({ id, name, email }) {
  const newName = prompt('Nuevo nombre:', name);
  if (!newName) return;
  const newEmail = prompt('Nuevo correo:', email);
  if (!newEmail) return;

  await fetchJson(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName, email: newEmail })
  });
  await loadTeacherData();
}

async function deleteUser(id) {
  if (!confirm('¿Eliminar este estudiante?')) return;
  await fetchJson(`/api/users/${id}`, { method: 'DELETE' });
  await loadTeacherData();
}

loadUser();
