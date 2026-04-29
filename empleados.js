const API_URL = 'api.php';
let editandoIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    const btnAbrir = document.getElementById('btn-abrir-form');
    const btnCerrar = document.getElementById('btn-cerrar-form');
    const formOverlay = document.getElementById('form-overlay');
    const formContenedor = document.getElementById('form-contenedor');
    
    // Auto-cálculo de edad
    const fechaNacimiento = document.getElementById('emp-nacimiento');
    const campoEdad = document.getElementById('emp-edad');
    
    if (fechaNacimiento) {
        fechaNacimiento.addEventListener('change', function() {
            calcularEdad(this.value, campoEdad);
        });
    }
    
    // Modal
    if (btnAbrir) {
        btnAbrir.addEventListener('click', () => {
            formOverlay.classList.add('activo');
            formContenedor.classList.add('activo');
            btnAbrir.classList.add('activo');
            if (editandoIndex === null) limpiarFormulario();
        });
    }
    
    const cerrarFormulario = () => {
        formOverlay.classList.remove('activo');
        formContenedor.classList.remove('activo');
        if (btnAbrir) btnAbrir.classList.remove('activo');
    };
    
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarFormulario);
    if (formOverlay) formOverlay.addEventListener('click', cerrarFormulario);
    
    // Cargar empleados desde BD
    cargarEmpleados();
    
    // Botón guardar
    document.getElementById('btn-guardar-empleado').addEventListener('click', guardarEmpleado);
    
    // Buscador
    const buscador = document.getElementById('buscador-empleado');
    if (buscador) buscador.addEventListener('keyup', filtrarEmpleados);
    
    // ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (formContenedor?.classList.contains('activo')) cerrarFormulario();
            const modalExpediente = document.getElementById('expediente-modal');
            if (modalExpediente && modalExpediente.style.display === 'block') {
                modalExpediente.style.display = 'none';
            }
        }
    });
});

function calcularEdad(fechaNacimiento, campoEdad) {
    if (!fechaNacimiento) { if (campoEdad) campoEdad.value = ''; return; }
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    if (campoEdad && edad > 0 && edad < 120) campoEdad.value = edad;
    else if (campoEdad) campoEdad.value = '';
}

async function cargarEmpleados() {
    try {
        const response = await fetch(`${API_URL}?action=get_empleados`);
        const empleados = await response.json();
        
        if (document.getElementById('total-empleados')) actualizarContadores(empleados);
        
        const lista = document.getElementById('lista-empleados');
        lista.innerHTML = '';
        
        if (empleados.length === 0) {
            lista.innerHTML = `<tr><td colspan="3" style="padding:30px;text-align:center;color:#7f8c8d;">
                <i class="fas fa-users" style="font-size:40px;opacity:0.3;display:block;margin-bottom:10px;"></i>
                No hay empleados registrados. Haz clic en el botón <strong style="color:#b33939;">+</strong> para agregar.
            </td></tr>`;
            return;
        }
        
        empleados.forEach((emp, index) => {
            const tieneAlerta = (emp.condicion_medica && emp.condicion_medica.toLowerCase() !== 'ninguna') || 
                               (emp.alergias && emp.alergias.toLowerCase() !== 'ninguna');
            
            const fila = document.createElement('tr');
            fila.style.borderBottom = '1px solid #eee';
            
            fila.innerHTML = `
                <td style="padding:15px;font-weight:bold;color:#2c3e50;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <i class="fas fa-user-circle" style="font-size:24px;color:#b33939;"></i>
                        <div>
                            <div>${emp.nombre} ${emp.apellido}</div>
                            <div style="font-size:12px;color:#7f8c8d;font-weight:normal;">
                                V-${emp.cedula} 
                                ${tieneAlerta ? '<span style="color:#e74c3c;margin-left:5px;"><i class="fas fa-exclamation-circle"></i> Alerta médica</span>' : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td style="padding:15px;color:#34495e;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <i class="fas fa-heart" style="color:#e74c3c;font-size:14px;"></i>
                        <span>${emp.estado_civil || 'No registrado'}</span>
                        ${emp.hijos > 0 ? `<span style="background:#f0f0f0;padding:2px 8px;border-radius:12px;font-size:11px;margin-left:8px;">
                            <i class="fas fa-child"></i> ${emp.hijos}
                        </span>` : ''}
                    </div>
                </td>
                <td style="padding:15px;text-align:right;">
                    <div style="display:flex;gap:8px;justify-content:flex-end;">
                        <button onclick="verExpediente('${emp.cedula}')" 
                            style="background:#3498db;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;display:inline-flex;align-items:center;gap:5px;">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button onclick="prepararEdicion('${emp.cedula}')" 
                            style="background:#f39c12;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;display:inline-flex;align-items:center;gap:5px;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button onclick="eliminarEmpleado('${emp.cedula}')" 
                            style="background:#e74c3c;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px;display:inline-flex;align-items:center;gap:5px;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </td>
            `;
            lista.appendChild(fila);
        });
    } catch (error) {
        console.error('Error al cargar empleados:', error);
        mostrarNotificacion('Error al conectar con la base de datos', 'error');
    }
}

function actualizarContadores(empleados) {
    const total = empleados.length;
    const estudiantes = empleados.filter(emp => emp.estudiante == 1).length;
    const alertasMedicas = empleados.filter(emp => {
        const tieneEnfermedad = emp.condicion_medica && emp.condicion_medica.toLowerCase() !== 'ninguna';
        const tieneAlergia = emp.alergias && emp.alergias.toLowerCase() !== 'ninguna';
        return tieneEnfermedad || tieneAlergia;
    }).length;
    
    const elTotal = document.getElementById('total-empleados');
    const elEstudiantes = document.getElementById('cant-estudiantes');
    const elMedico = document.getElementById('cant-medico');
    
    if (elTotal) { elTotal.innerText = total; elTotal.style.color = total > 10 ? '#27ae60' : 'white'; }
    if (elEstudiantes) elEstudiantes.innerText = estudiantes;
    if (elMedico) {
        elMedico.innerText = alertasMedicas;
        elMedico.style.color = alertasMedicas > 0 ? '#ff6b6b' : 'white';
    }
}

async function guardarEmpleado() {
    const empleado = {
        cedula: document.getElementById('emp-cedula').value.trim(),
        nombre: document.getElementById('emp-nombre').value.trim(),
        apellido: document.getElementById('emp-apellido').value.trim(),
        fecha_nac: document.getElementById('emp-nacimiento').value,
        fecha_ingreso: document.getElementById('emp-ingreso').value,
        telefono: document.getElementById('emp-telefono').value.trim(),
        correo: document.getElementById('emp-correo').value.trim(),
        direccion: document.getElementById('emp-direccion').value.trim(),
        hijos: parseInt(document.getElementById('emp-hijos').value) || 0,
        estudiante: document.getElementById('emp-estudiante').value === 'Si' ? 1 : 0,
        talla_camisa: document.getElementById('emp-talla-camisa').value,
        talla_zapato: document.getElementById('emp-talla-zapatos').value,
        talla_pantalon: document.getElementById('emp-talla-pantalon').value,
        condicion_medica: document.getElementById('emp-enfermedad').value.trim() || 'Ninguna',
        alergias: document.getElementById('emp-alergia').value.trim() || 'Ninguna',
        religion: document.getElementById('emp-religion').value,
        estado_civil: document.getElementById('emp-estado-civil').value,
        cargo: document.getElementById('emp-cargo')?.value || '',
        salario: parseFloat(document.getElementById('emp-salario')?.value) || 0,
        editando: editandoIndex !== null
    };
    
    if (!empleado.nombre || !empleado.apellido || !empleado.cedula) {
        alert("⚠️ Nombre, Apellido y Cédula son obligatorios.");
        return;
    }
    
    const btnGuardar = document.getElementById('btn-guardar-empleado');
    const textoOriginal = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> GUARDANDO...';
    btnGuardar.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}?action=save_empleado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empleado)
        });
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            cerrarModalFormulario();
            limpiarFormulario();
            await cargarEmpleados();
        } else {
            alert('Error: ' + (result.message || 'No se pudo guardar'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión con el servidor');
    } finally {
        btnGuardar.innerHTML = textoOriginal;
        btnGuardar.disabled = false;
    }
}

async function eliminarEmpleado(cedula) {
    if (!confirm("¿Está seguro de eliminar permanentemente este expediente?")) return;
    
    try {
        const response = await fetch(`${API_URL}?action=delete_empleado`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula: cedula })
        });
        const result = await response.json();
        
        if (result.success) {
            alert('Empleado eliminado correctamente');
            await cargarEmpleados();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

async function prepararEdicion(cedula) {
    const response = await fetch(`${API_URL}?action=get_empleados`);
    const empleados = await response.json();
    const emp = empleados.find(e => e.cedula === cedula);
    
    if (emp) {
        document.getElementById('emp-nombre').value = emp.nombre || '';
        document.getElementById('emp-apellido').value = emp.apellido || '';
        document.getElementById('emp-cedula').value = emp.cedula || '';
        document.getElementById('emp-edad').value = emp.edad || '';
        document.getElementById('emp-estado-civil').value = emp.estado_civil || 'Soltero(a)';
        document.getElementById('emp-hijos').value = emp.hijos || '0';
        document.getElementById('emp-nacimiento').value = emp.fecha_nac || '';
        document.getElementById('emp-ingreso').value = emp.fecha_ingreso || '';
        document.getElementById('emp-telefono').value = emp.telefono || '';
        document.getElementById('emp-correo').value = emp.correo || '';
        document.getElementById('emp-direccion').value = emp.direccion || '';
        document.getElementById('emp-talla-camisa').value = emp.talla_camisa || 'M';
        document.getElementById('emp-talla-pantalon').value = emp.talla_pantalon || '';
        document.getElementById('emp-talla-zapatos').value = emp.talla_zapato || '';
        document.getElementById('emp-lateralidad').value = emp.lateralidad || 'Derecho';
        document.getElementById('emp-educacion').value = emp.educacion || 'Bachiller';
        document.getElementById('emp-estudiante').value = emp.estudiante == 1 ? 'Si' : 'No';
        document.getElementById('emp-enfermedad').value = emp.condicion_medica || '';
        document.getElementById('emp-alergia').value = emp.alergias || '';
        document.getElementById('emp-religion').value = emp.religion || 'Ninguna';
    }
    
    editandoIndex = cedula;
    document.getElementById('btn-guardar-empleado').innerHTML = '<i class="fas fa-sync"></i> Actualizar Registro';
    
    const formOverlay = document.getElementById('form-overlay');
    const formContenedor = document.getElementById('form-contenedor');
    const btnAbrir = document.getElementById('btn-abrir-form');
    if (formOverlay && formContenedor) {
        formOverlay.classList.add('activo');
        formContenedor.classList.add('activo');
        if (btnAbrir) btnAbrir.classList.add('activo');
    }
}

async function verExpediente(cedula) {
    const response = await fetch(`${API_URL}?action=get_empleados`);
    const empleados = await response.json();
    const emp = empleados.find(e => e.cedula === cedula);
    
    let modal = document.getElementById('expediente-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'expediente-modal';
        modal.className = 'expediente-modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="expediente-contenido">
            <div class="expediente-header">
                <h2><i class="fas fa-user-circle"></i> ${emp.nombre} ${emp.apellido}</h2>
                <button class="cerrar-expediente" onclick="document.getElementById('expediente-modal').style.display='none'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="expediente-body">
                <div class="expediente-grid">
                    <div class="expediente-seccion">
                        <h3><i class="fas fa-user"></i> Datos Personales</h3>
                        <div class="expediente-info">
                            <span class="label">Cédula:</span><span class="valor">${emp.cedula || 'No registrada'}</span>
                            <span class="label">Edad:</span><span class="valor">${calcularEdadDesdeFecha(emp.fecha_nac)} años</span>
                            <span class="label">Fecha Nac.:</span><span class="valor">${emp.fecha_nac || 'No registrada'}</span>
                            <span class="label">Estado Civil:</span><span class="valor">${emp.estado_civil || 'No registrado'}</span>
                            <span class="label">Hijos:</span><span class="valor">${emp.hijos || '0'}</span>
                            <span class="label">Religión:</span><span class="valor">${emp.religion || 'No registrada'}</span>
                        </div>
                    </div>
                    <div class="expediente-seccion">
                        <h3><i class="fas fa-briefcase"></i> Datos Laborales</h3>
                        <div class="expediente-info">
                            <span class="label">Fecha Ingreso:</span><span class="valor">${emp.fecha_ingreso || 'No registrada'}</span>
                            <span class="label">Cargo:</span><span class="valor">${emp.cargo || 'No registrado'}</span>
                            <span class="label">Salario:</span><span class="valor">${emp.salario ? 'Bs. ' + emp.salario : 'No registrado'}</span>
                        </div>
                    </div>
                    <div class="expediente-seccion">
                        <h3><i class="fas fa-address-book"></i> Contacto</h3>
                        <div class="expediente-info">
                            <span class="label">Teléfono:</span><span class="valor">${emp.telefono || 'No registrado'}</span>
                            <span class="label">Correo:</span><span class="valor">${emp.correo || 'No registrado'}</span>
                            <span class="label">Dirección:</span><span class="valor">${emp.direccion || 'No registrada'}</span>
                        </div>
                    </div>
                    <div class="expediente-seccion">
                        <h3><i class="fas fa-tshirt"></i> Tallas de Uniforme</h3>
                        <div class="expediente-info">
                            <span class="label">Camisa:</span><span class="valor">${emp.talla_camisa || 'No registrada'}</span>
                            <span class="label">Pantalón:</span><span class="valor">${emp.talla_pantalon || 'No registrada'}</span>
                            <span class="label">Zapatos:</span><span class="valor">${emp.talla_zapato || 'No registrada'}</span>
                        </div>
                    </div>
                    <div class="expediente-seccion" style="grid-column: span 2;">
                        <h3><i class="fas fa-heartbeat"></i> Información Médica</h3>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                            <div class="expediente-info">
                                <span class="label">Enfermedades:</span>
                                <span class="valor">${emp.condicion_medica || 'Ninguna'}</span>
                            </div>
                            <div class="expediente-info">
                                <span class="label">Alergias:</span>
                                <span class="valor">${emp.alergias || 'Ninguna'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="expediente-footer">
                <button class="btn-cerrar" onclick="document.getElementById('expediente-modal').style.display='none'"><i class="fas fa-times"></i> Cerrar</button>
                <button class="btn-imprimir" onclick="imprimirExpedienteBD('${emp.cedula}')"><i class="fas fa-print"></i> Imprimir Expediente</button>
            </div>
        </div>
    `;
    modal.style.display = 'block';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

function calcularEdadDesdeFecha(fechaNacimiento) {
    if (!fechaNacimiento) return '?';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
}

async function imprimirExpedienteBD(cedula) {
    const response = await fetch(`${API_URL}?action=get_empleados`);
    const empleados = await response.json();
    const emp = empleados.find(e => e.cedula === cedula);
    
    const ventanaImpresion = window.open('', '_blank');
    ventanaImpresion.document.write(/* mismo HTML de impresión que tenías, usando emp */);
    ventanaImpresion.document.close();
}

function cerrarModalFormulario() {
    const formOverlay = document.getElementById('form-overlay');
    const formContenedor = document.getElementById('form-contenedor');
    const btnAbrir = document.getElementById('btn-abrir-form');
    if (formOverlay) formOverlay.classList.remove('activo');
    if (formContenedor) formContenedor.classList.remove('activo');
    if (btnAbrir) btnAbrir.classList.remove('activo');
    editandoIndex = null;
    document.getElementById('btn-guardar-empleado').innerHTML = '<i class="fas fa-save"></i> Guardar Ficha';
}

function limpiarFormulario() {
    document.querySelectorAll('#form-contenedor input, #form-contenedor select').forEach(i => {
        if (i.type !== 'button' && i.type !== 'submit') i.value = '';
    });
    document.getElementById('emp-estado-civil').selectedIndex = 0;
    document.getElementById('emp-lateralidad').selectedIndex = 0;
    document.getElementById('emp-educacion').selectedIndex = 0;
    document.getElementById('emp-estudiante').selectedIndex = 0;
    document.getElementById('emp-talla-camisa').selectedIndex = 0;
    document.getElementById('emp-religion').selectedIndex = 7;
    editandoIndex = null;
}

function filtrarEmpleados() {
    const filtro = document.getElementById("buscador-empleado").value.toLowerCase();
    const filas = document.querySelectorAll("#lista-empleados tr");
    filas.forEach(fila => {
        const texto = fila.innerText.toLowerCase();
        fila.style.display = texto.includes(filtro) ? "" : "none";
    });
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${mensaje}`;
    notificacion.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; padding: 12px 20px;
        background: ${tipo === 'success' ? '#27ae60' : '#e74c3c'}; color: white;
        border-radius: 8px; z-index: 10001; animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.remove(), 3000);
}