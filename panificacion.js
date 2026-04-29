// ===== CONFIGURACIÓN =====
const API_URL = 'api.php';

// Mapeo de IDs de productos (deben coincidir con la BD)
const productosMap = {
    'integral': 1,
    'ajonjoli': 2,
    'blanco': 3,
    'miel': 4,
    'hamburguesa': 5,
    'perrocaliente': 6,
    'tostadas': 7
};

const productos = [
    { id: 'integral', nombre: 'PAN INTEGRAL', id_db: 1 },
    { id: 'ajonjoli', nombre: 'PAN C/ AJONJOLÍ', id_db: 2 },
    { id: 'blanco', nombre: 'PAN BLANCO', id_db: 3 },
    { id: 'miel', nombre: 'PAN MIEL', id_db: 4 },
    { id: 'hamburguesa', nombre: 'PAN HAMBURGUESA', id_db: 5 },
    { id: 'perrocaliente', nombre: 'PAN PERRO CALIENTE', id_db: 6 },
    { id: 'tostadas', nombre: 'TOSTADAS', id_db: 7 }
];

// ===== VARIABLES GLOBALES =====
let editandoRegistro = null;
let mesActual = new Date().getMonth() + 1;
let anioActual = new Date().getFullYear();

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    inicializarEventos();
    llenarSelectAnios();
    cargarDatosIniciales();
});

async function inicializarEventos() {
    // Elementos del DOM
    const btnAbrir = document.getElementById('btn-abrir-form-pan');
    const btnCerrar = document.getElementById('btn-cerrar-form-pan');
    const formOverlay = document.getElementById('form-overlay-pan');
    const formContenedor = document.getElementById('form-contenedor-pan');
    const menuHamburguesa = document.getElementById('menuHamburguesa');
    const menuDesplegable = document.getElementById('menuDesplegable');
    const lupa = document.querySelector('.fa-search');
    
    // Control del modal
    if (btnAbrir) btnAbrir.addEventListener('click', () => abrirModalFormulario());
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalFormulario);
    if (formOverlay) formOverlay.addEventListener('click', cerrarModalFormulario);
    
    // Menú hamburguesa
    if (menuHamburguesa && menuDesplegable) {
        menuHamburguesa.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDesplegable.classList.toggle('mostrar');
        });
        
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (item.getAttribute('data-seccion') === 'produccion') {
                    abrirModalFormulario();
                }
                menuDesplegable.classList.remove('mostrar');
            });
        });
    }
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (menuDesplegable && menuHamburguesa) {
            if (!menuDesplegable.contains(e.target) && !menuHamburguesa.contains(e.target)) {
                menuDesplegable.classList.remove('mostrar');
            }
        }
    });
    
    // Cálculo automático
    const inputMedida = document.getElementById('medida');
    const inputPaquetes = document.getElementById('paquetes');
    const inputUnidades = document.getElementById('unidades');
    
    if (inputMedida) inputMedida.addEventListener('input', calcularRendimientoAutomatico);
    if (inputPaquetes) inputPaquetes.addEventListener('input', calcularRendimientoAutomatico);
    if (inputUnidades) inputUnidades.addEventListener('input', calcularRendimientoAutomatico);
    
    // Validación de campos numéricos
    const camposNumericos = ['medida', 'paquetes', 'unidades', 'bd'];
    camposNumericos.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                validarNumeroPositivo(this);
                calcularRendimientoAutomatico();
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
            });
        }
    });
    
    // Botón guardar
    const btnGuardar = document.getElementById('btn-guardar-pan');
    if (btnGuardar) btnGuardar.addEventListener('click', guardarDatos);
    
    // Lupa (búsqueda)
    if (lupa) lupa.addEventListener('click', abrirModalBusqueda);
    
    // Cerrar con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (formContenedor?.classList.contains('activo')) cerrarModalFormulario();
            const modalBusqueda = document.getElementById('modal-busqueda-pan');
            if (modalBusqueda && modalBusqueda.style.display === 'block') cerrarModalBusqueda();
            const modalTabla = document.getElementById('modal-tabla');
            if (modalTabla && modalTabla.style.display === 'block') cerrarModalTabla();
        }
    });
}

// ===== FUNCIONES DE API =====

async function cargarDatosIniciales() {
    await actualizarTablas();
}

async function cargarProduccion(mes, anio) {
    try {
        const response = await fetch(`${API_URL}?action=get_panaderia&mes=${mes}&anio=${anio}`);
        if (!response.ok) throw new Error('Error en la petición');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al cargar producción:', error);
        mostrarNotificacion('Error al cargar los datos', 'error');
        return [];
    }
}

async function guardarProduccion(registro) {
    try {
        const response = await fetch(`${API_URL}?action=save_panaderia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registro)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error al guardar:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

// ===== FUNCIONES DEL MODAL =====

function abrirModalFormulario() {
    const formOverlay = document.getElementById('form-overlay-pan');
    const formContenedor = document.getElementById('form-contenedor-pan');
    const btnAbrir = document.getElementById('btn-abrir-form-pan');
    
    if (formOverlay && formContenedor) {
        formOverlay.classList.add('activo');
        formContenedor.classList.add('activo');
        if (btnAbrir) btnAbrir.classList.add('activo');
        
        if (editandoRegistro === null) {
            limpiarFormulario();
        }
    }
}

function cerrarModalFormulario() {
    const formOverlay = document.getElementById('form-overlay-pan');
    const formContenedor = document.getElementById('form-contenedor-pan');
    const btnAbrir = document.getElementById('btn-abrir-form-pan');
    
    if (formOverlay && formContenedor) {
        formOverlay.classList.remove('activo');
        formContenedor.classList.remove('activo');
        if (btnAbrir) btnAbrir.classList.remove('activo');
        
        if (editandoRegistro !== null) {
            editandoRegistro = null;
            const btnGuardar = document.getElementById('btn-guardar-pan');
            if (btnGuardar) btnGuardar.innerHTML = '<i class="fas fa-save"></i> GUARDAR REGISTRO';
        }
    }
}

// ===== FUNCIÓN DE CÁLCULO =====

function calcularRendimientoAutomatico() {
    const medida = Math.max(0, parseFloat(document.getElementById('medida').value) || 0);
    const paquetes = Math.max(0, parseFloat(document.getElementById('paquetes').value) || 0);
    const unidades = Math.max(0, parseFloat(document.getElementById('unidades').value) || 0);
    const campoRendimiento = document.getElementById('rendimiento');

    if (medida > 0) {
        const resultado = (paquetes + (unidades / 8)) / medida;
        campoRendimiento.value = Math.round(resultado);
    } else {
        campoRendimiento.value = "0";
    }
}

// ===== VALIDAR CAMPOS =====

function validarNumeroPositivo(input) {
    if (input.value < 0) {
        input.value = 0;
        mostrarNotificacion("No se permiten números negativos", "error");
    }
}

// ===== GUARDAR DATOS (USANDO API) =====

async function guardarDatos() {
    const panId = document.getElementById('tipo-pan').value;
    const fechaSeleccionada = document.getElementById('fecha-manual').value;
    const medida = Math.max(0, parseFloat(document.getElementById('medida').value) || 0);
    const paquetes = Math.max(0, parseFloat(document.getElementById('paquetes').value) || 0);
    const unidades = Math.max(0, parseFloat(document.getElementById('unidades').value) || 0);
    const bd = Math.max(0, parseFloat(document.getElementById('bd').value) || 0);
    const rendimiento = parseInt(document.getElementById('rendimiento').value) || 0;

    if (!panId || !fechaSeleccionada || medida <= 0) {
        mostrarNotificacion("Faltan datos: Seleccione Pan, Fecha y Medida", "error");
        return;
    }

    const producto = productos.find(p => p.id === panId);
    if (!producto) {
        mostrarNotificacion("Producto no válido", "error");
        return;
    }

    const btnGuardar = document.getElementById('btn-guardar-pan');
    const textoOriginal = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> GUARDANDO...';
    btnGuardar.disabled = true;

    let result;
    
    if (editandoRegistro !== null) {
        // UPDATE - Editar registro existente
        const registro = {
            id: editandoRegistro,
            id_producto: producto.id_db,
            fecha: fechaSeleccionada,
            medidas: medida,
            paquetes: paquetes,
            unidades: unidades,
            bd: bd,
            rendimiento: rendimiento,
            observaciones: null
        };
        
        const response = await fetch(`${API_URL}?action=update_panaderia`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registro)
        });
        result = await response.json();
    } else {
        // INSERT - Nuevo registro
        const registro = {
            id_producto: producto.id_db,
            fecha: fechaSeleccionada,
            medidas: medida,
            paquetes: paquetes,
            unidades: unidades,
            bd: bd,
            rendimiento: rendimiento,
            observaciones: null
        };
        result = await guardarProduccion(registro);
    }

    btnGuardar.innerHTML = textoOriginal;
    btnGuardar.disabled = false;

if (result.success) {
    mostrarNotificacion(editandoRegistro !== null ? "Registro actualizado correctamente" : "Registro guardado correctamente", "success");

    if (editandoRegistro === null) {
        const idProduccion = result.id_produccion; 
        const idProducto = producto.id_db;
        const medidaKg = parseFloat(document.getElementById('medida').value) || 0;

        try {
            const recetaResp = await fetch(`${API_URL}?action=get_receta&id_producto=${idProducto}&tipo=pan`);
            const receta = await recetaResp.json();
            if (receta.length > 0) {
                const insumos = {};
                receta.forEach(item => {
                    insumos[item.nombre_insumo] = item.cantidad_kg * medidaKg;
                });
                const consumoResp = await fetch(`${API_URL}?action=descontar_insumos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_produccion: idProduccion,
                        modulo: 'panificacion',
                        insumos: insumos
                    })
                });
                const consumoResult = await consumoResp.json();
                if (!consumoResult.success) {
                    mostrarNotificacion('Producción guardada, pero error al descontar materia prima: ' + consumoResult.message, 'error');
                } else {
                    mostrarNotificacion('Producción guardada y materiales descontados', 'success');
                }
            } else {
                console.log('No hay receta para este producto');
            }
        } catch (error) {
            console.error(error);
            mostrarNotificacion('Error al conectar con recetas', 'error');
        }
    }

    limpiarFormulario();
    editandoRegistro = null;
    await actualizarTablasPorPeriodo(mesActual, anioActual);
    cerrarModalFormulario();
}
}

// ===== LIMPIAR FORMULARIO =====

function limpiarFormulario() {
    document.querySelectorAll('#form-contenedor-pan input').forEach(i => i.value = '');
    const select = document.getElementById('tipo-pan');
    if (select) select.value = '';
    
    editandoRegistro = null;
    
    const btnGuardar = document.getElementById('btn-guardar-pan');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> GUARDAR REGISTRO';
    }
}

// ===== ACTUALIZAR TABLAS =====

async function actualizarTablas() {
    await actualizarTablasPorPeriodo(mesActual, anioActual);
}

async function actualizarTablasPorPeriodo(mes, anio) {
    const contenedor = document.getElementById('tablas-abajo');
    if (!contenedor) return;

    // Mostrar loading
    contenedor.innerHTML = `
        <div class="card" style="text-align: center; padding: 50px;">
            <i class="fas fa-spinner fa-pulse" style="font-size: 40px; color: var(--venepan-red);"></i>
            <p style="margin-top: 20px;">Cargando datos...</p>
        </div>
    `;

    try {
        const datos = await cargarProduccion(mes, anio);
        
        console.log('Datos recibidos:', datos);

        // ✅ ACTUALIZAR TARJETAS ARRIBA (aunque no haya datos, se ponen en cero)
        actualizarNotificacionesPan(datos);

        if (!datos || datos.length === 0) {
            contenedor.innerHTML = `
                <div class="card" style="text-align: center; padding: 50px;">
                    <i class="fas fa-calendar-times" style="font-size: 60px; color: #ccc; margin-bottom: 20px;"></i>
                    <h3 style="color: #666;">No hay registros para ${getNombreMes(mes)} ${anio}</h3>
                    <p style="color: #999; margin-top: 10px;">Selecciona otro período o agrega nuevos registros.</p>
                </div>
            `;
            return;
        }

        // Agrupar datos por producto
        const datosPorProducto = {};
        datos.forEach(registro => {
            const producto = productos.find(p => p.id_db === registro.id_producto);
            const nombreProducto = producto ? producto.nombre : 'Producto Desconocido';
            if (!datosPorProducto[nombreProducto]) {
                datosPorProducto[nombreProducto] = [];
            }
            datosPorProducto[nombreProducto].push(registro);
        });

        contenedor.innerHTML = '';

        for (const [nombreProducto, registros] of Object.entries(datosPorProducto)) {
            // Ordenar por fecha
            registros.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            
            let html = `
            <div class="tabla-producto card" style="background:#fffbe6;margin-bottom:20px;border-radius:6px;border:1px solid #ddd">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#fdf5d0">
                    <h3 style="color:#856404">${nombreProducto} – ${getNombreMes(mes)} ${anio}</h3>
                    <button class="btn-expand" onclick="expandirTabla('tabla-${nombreProducto.replace(/\s/g, '')}')" 
                        style="background:#c0392b;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer">
                        ⛶ Expandir
                    </button>
                </div>
                <div style="overflow-x:auto">
                    <table style="width:100%;border-collapse:collapse;font-size:13px">
                        <thead style="background:#fdf5d0">
                            <tr>
                                <th>Fecha</th>
                                <th>Medida (kg)</th>
                                <th>Paq.</th>
                                <th>Unid.</th>
                                <th>BD (Merma)</th>
                                <th>Rendimiento</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            let totalMedida = 0;
            let totalPaquetes = 0;
            let totalUnidades = 0;
            let totalBD = 0;
            let totalRendimiento = 0;

            registros.forEach(r => {
                const fechaObj = new Date(r.fecha);
                const dia = fechaObj.getDate();
                
                totalMedida += parseFloat(r.medidas) || 0;
                totalPaquetes += parseInt(r.paquetes) || 0;
                totalUnidades += parseInt(r.unidades) || 0;
                totalBD += parseFloat(r.bd) || 0;
                totalRendimiento += parseInt(r.rendimiento) || 0;

                html += `
                <tr>
                    <td><strong>${dia}/${fechaObj.getMonth()+1}/${fechaObj.getFullYear()}</strong></td>
                    <td>${parseFloat(r.medidas).toFixed(2)} kg</td>
                    <td>${r.paquetes || 0}</td>
                    <td>${r.unidades || 0}</td>
                    <td style="color:red">${parseFloat(r.bd).toFixed(2)}</td>
                    <td>${r.rendimiento || 0}%</td>
                    <td>
                        <div style="display: flex; gap: 5px; justify-content: center;">
                            <button onclick="editarRegistroBD(${r.id_produccion})" 
                                style="border:none;background:none;cursor:pointer;color:#3498db;"
                                title="Editar registro">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="eliminarRegistroBD(${r.id_produccion})" 
                                style="border:none;background:none;cursor:pointer;color:#e74c3c;"
                                title="Eliminar registro">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
                `;
            });

            const promedioRend = registros.length ? (totalRendimiento / registros.length).toFixed(2) : 0;

            html += `
                        <tr style="font-weight:bold;background:#f0f0f0">
                            <td>TOTAL</td>
                            <td>${totalMedida.toFixed(2)} kg</td>
                            <td>${totalPaquetes}</td>
                            <td>${totalUnidades}</td>
                            <td style="color:red">${totalBD.toFixed(2)}</td>
                            <td>${promedioRend}%</td>
                            <td></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            `;

            contenedor.innerHTML += html;
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        contenedor.innerHTML = `
            <div class="card" style="text-align: center; padding: 50px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 60px; color: #e74c3c; margin-bottom: 20px;"></i>
                <h3 style="color: #666;">Error al cargar los datos</h3>
                <p style="color: #999; margin-top: 10px;">Verifica la consola para más detalles.</p>
            </div>
        `;
    }
}


// ===== FUNCIONES DE EDICIÓN Y ELIMINACIÓN =====

async function editarRegistroBD(id) {
    console.log('Editando registro con ID:', id);
    editandoRegistro = id;
    
    try {
        // Obtener los datos del registro por ID
        const response = await fetch(`${API_URL}?action=get_panaderia_by_id&id=${id}`);
        const item = await response.json();
        console.log('Datos recibidos:', item);
        
        if (item && !item.error && item.id_produccion) {
            // Abrir el modal
            abrirModalFormulario();
            
            // Esperar a que el modal se abra y luego llenar los campos
            setTimeout(() => {
                // Encontrar el ID del producto en el select
                const productoEncontrado = productos.find(p => p.id_db === item.id_producto);
                if (productoEncontrado) {
                    document.getElementById('tipo-pan').value = productoEncontrado.id;
                }
                document.getElementById('fecha-manual').value = item.fecha || '';
                document.getElementById('medida').value = item.medidas || 0;
                document.getElementById('paquetes').value = item.paquetes || 0;
                document.getElementById('unidades').value = item.unidades || 0;
                document.getElementById('bd').value = item.bd || 0;
                
                // Recalcular rendimiento
                calcularRendimientoAutomatico();
                
                // Cambiar texto del botón guardar
                const btnGuardar = document.getElementById('btn-guardar-pan');
                if (btnGuardar) {
                    btnGuardar.innerHTML = '<i class="fas fa-sync"></i> ACTUALIZAR REGISTRO';
                }
            }, 100);
        } else {
            mostrarNotificacion('Registro no encontrado', 'error');
        }
    } catch (error) {
        console.error('Error en editarRegistroBD:', error);
        mostrarNotificacion('Error al cargar el registro', 'error');
    }
}

async function eliminarRegistroBD(id) {
    if (!confirm("¿Eliminar registro permanentemente?")) return;
    
    try {
        const response = await fetch(`${API_URL}?action=delete_panaderia`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarNotificacion('Registro eliminado correctamente', 'success');
            await actualizarTablasPorPeriodo(mesActual, anioActual);
        } else {
            mostrarNotificacion('Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

// ===== FUNCIONES DE BÚSQUEDA =====

function llenarSelectAnios() {
    const selectAnio = document.getElementById('buscar-anio');
    if (!selectAnio) return;
    
    const anioActual = new Date().getFullYear();
    selectAnio.innerHTML = '';
    
    for (let i = anioActual - 2; i <= anioActual + 1; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === anioActual) option.selected = true;
        selectAnio.appendChild(option);
    }
}

function abrirModalBusqueda() {
    const modal = document.getElementById('modal-busqueda-pan');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        const hoy = new Date();
        document.getElementById('buscar-mes').value = hoy.getMonth() + 1;
        document.getElementById('buscar-anio').value = hoy.getFullYear();
    }
}

function cerrarModalBusqueda() {
    const modal = document.getElementById('modal-busqueda-pan');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

async function buscarPorMesAnio() {
    const mes = parseInt(document.getElementById('buscar-mes').value);
    const anio = parseInt(document.getElementById('buscar-anio').value);
    
    mesActual = mes;
    anioActual = anio;
    
    await actualizarTablasPorPeriodo(mes, anio);
    cerrarModalBusqueda();
    mostrarNotificacion(`Mostrando datos de ${getNombreMes(mes)} ${anio}`, 'success');
}

function getNombreMes(mes) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1];
}

// ===== FUNCIONES DE TABLA EXPANDIDA =====

function expandirTabla(idTabla) {
    const tabla = document.getElementById(idTabla);
    const modal = document.getElementById('modal-tabla');
    const contenido = document.getElementById('contenido-modal-tabla');

    if (!tabla || !modal || !contenido) return;

    const clon = tabla.cloneNode(true);
    const btn = clon.querySelector('.btn-expand');
    if (btn) btn.remove();

    contenido.innerHTML = "";
    contenido.appendChild(clon);

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function cerrarModalTabla() {
    const modal = document.getElementById('modal-tabla');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ===== NOTIFICACIONES =====

function mostrarNotificacion(msg, tipo) {
    const previas = document.querySelectorAll('.notificacion-venepan');
    previas.forEach(n => n.remove());

    const div = document.createElement('div');
    div.className = 'notificacion-venepan';
    
    let bgColor = '#27ae60'; // success
    let icono = '✅';
    
    if (tipo === 'error') {
        bgColor = '#e74c3c';
        icono = '❌';
    } else if (tipo === 'info') {
        bgColor = '#3498db';
        icono = 'ℹ️';
    }
    
    div.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 99999;
        background: ${bgColor};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    div.innerHTML = `${icono} ${msg}`;
    document.body.appendChild(div);

    setTimeout(() => {
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

function actualizarNotificacionesPan(registros) {
    console.log('📊 Actualizando notificaciones con', registros.length, 'registros');

    const tiposSet = new Set();
    let totalKilos = 0;
    const sumaPorTipo = {};

    registros.forEach(r => {
        // Buscar el producto por id_db
        const producto = productos.find(p => p.id_db === r.id_producto);
        const nombreTipo = producto ? producto.nombre : `ID_${r.id_producto}`;
        
        console.log(`Registro: id_producto=${r.id_producto}, nombre=${nombreTipo}, kg=${r.medidas}`);
        
        tiposSet.add(nombreTipo);
        const kilos = parseFloat(r.medidas) || 0;
        totalKilos += kilos;
        sumaPorTipo[nombreTipo] = (sumaPorTipo[nombreTipo] || 0) + kilos;
    });

    // Actualizar DOM
    document.getElementById('total-tipos-pan').innerText = tiposSet.size;
    document.getElementById('total-kilos-mes').innerText = totalKilos.toFixed(2);

    const promedio = tiposSet.size > 0 ? (totalKilos / tiposSet.size).toFixed(2) : 0;
    document.getElementById('promedio-kg-tipo').innerText = promedio;

    // Pan más producido
    let topTipo = null;
    let maxKg = 0;
    for (const [tipo, kg] of Object.entries(sumaPorTipo)) {
        if (kg > maxKg) {
            maxKg = kg;
            topTipo = tipo;
        }
    }
    
    const topPanElement = document.getElementById('top-pan');
    if (topPanElement) {
        if (topTipo) {
            topPanElement.innerHTML = `${topTipo}<br><small style="font-size:0.7rem;">${maxKg.toFixed(2)} kg</small>`;
        } else {
            topPanElement.innerHTML = '—';
        }
    } else {
        console.error('❌ Elemento #top-pan no encontrado en el DOM');
    }
    
    console.log('✅ Pan más producido:', topTipo, maxKg.toFixed(2), 'kg');
}
window.editarRegistroBD = editarRegistroBD;
window.eliminarRegistroBD = eliminarRegistroBD;
window.expandirTabla = expandirTabla;
window.cerrarModalTabla = cerrarModalTabla;
window.buscarPorMesAnio = buscarPorMesAnio;
window.cerrarModalBusqueda = cerrarModalBusqueda;