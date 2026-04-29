const API_URL = 'api.php';

let editandoProduccionId = null;
let editandoDespachoId = null;
let mesActualSoya = new Date().getMonth() + 1;
let anioActualSoya = new Date().getFullYear();

// Mapeo de tipos de producto
const productosSoya = {
    12: 'Soya en Grano (Estándar)',
    13: 'Soya Proteica',
    14: 'Harina de Soya'
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    inicializarModales();
    inicializarMenuHamburguesa();
    inicializarBusqueda();
    inicializarSelectAnios();
    inicializarBotonesGuardar();
    inicializarEventosInput();
    inyectarEstilosNotificacion();
    inicializarPestanas();
    
    cargarTablasSoya(mesActualSoya, anioActualSoya);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModalProduccion();
            cerrarModalDespacho();
            cerrarModalBusquedaSoya();
            cerrarModalTablaSoya();
        }
    });
});

// ==================== PESTAÑAS ====================
function inicializarPestanas() {
    const tabProd = document.getElementById('tab-produccion-soya-btn');
    const tabDesp = document.getElementById('tab-despacho-soya-btn');
    const contProd = document.getElementById('contenedor-produccion-soya');
    const contDesp = document.getElementById('contenedor-despacho-soya');

    if (tabProd && tabDesp && contProd && contDesp) {
        tabProd.addEventListener('click', () => {
            tabProd.classList.add('active');
            tabDesp.classList.remove('active');
            contProd.style.display = 'block';
            contDesp.style.display = 'none';
        });
        tabDesp.addEventListener('click', () => {
            tabDesp.classList.add('active');
            tabProd.classList.remove('active');
            contProd.style.display = 'none';
            contDesp.style.display = 'block';
        });
    }
}

// ==================== FUNCIONES DE API ====================
async function cargarProduccionSoya(mes, anio) {
    try {
        const url = `${API_URL}?action=get_soya_produccion&mes=${mes}&anio=${anio}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error en la petición: ' + response.status);
        const data = await response.json();
        console.log('Producción Soya cargada:', data);
        return data;
    } catch (error) {
        console.error('Error al cargar producción:', error);
        mostrarNotificacion('Error al cargar datos de producción', 'error');
        return [];
    }
}

async function cargarDespachoSoya(mes, anio) {
    try {
        const url = `${API_URL}?action=get_soya_despacho&mes=${mes}&anio=${anio}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error en la petición: ' + response.status);
        const data = await response.json();
        console.log('Despacho Soya cargado:', data);
        return data;
    } catch (error) {
        console.error('Error al cargar despacho:', error);
        mostrarNotificacion('Error al cargar datos de despacho', 'error');
        return [];
    }
}

async function guardarProduccionAPI(registro) {
    try {
        const response = await fetch(`${API_URL}?action=save_soya_produccion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registro)
        });
        return await response.json();
    } catch (error) {
        console.error('Error en API guardar producción:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

async function guardarDespachoAPI(registro) {
    try {
        const response = await fetch(`${API_URL}?action=save_soya_despacho`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registro)
        });
        return await response.json();
    } catch (error) {
        console.error('Error en API guardar despacho:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

async function eliminarProduccionAPI(id) {
    try {
        const response = await fetch(`${API_URL}?action=delete_soya_produccion`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        return await response.json();
    } catch (error) {
        console.error('Error en API eliminar producción:', error);
        return { success: false };
    }
}

async function eliminarDespachoAPI(id) {
    try {
        const response = await fetch(`${API_URL}?action=delete_soya_despacho`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        return await response.json();
    } catch (error) {
        console.error('Error en API eliminar despacho:', error);
        return { success: false };
    }
}

// ==================== ACTUALIZAR ESTADÍSTICAS (TARJETAS ROJAS) ====================
function actualizarStatsSoya(produccion) {
    if (!produccion || !Array.isArray(produccion)) {
        document.getElementById('total-produccion-soya-mes').innerText = '0';
        document.getElementById('rendimiento-promedio-soya').innerText = '0%';
        document.getElementById('total-lotes-soya').innerText = '0';
        return;
    }

    // Total kg producidos (suma de total_producido)
    let totalKg = 0;
    let sumaRendimiento = 0;
    let conteoRend = 0;

    produccion.forEach(item => {
        const producido = parseFloat(item.total_producido) || 0;
        totalKg += producido;

        // Rendimiento = (primera calidad / total_producido) * 100
        const primera = parseFloat(item.primera) || 0;
        if (producido > 0) {
            const rend = (primera / producido) * 100;
            sumaRendimiento += rend;
            conteoRend++;
        }
    });

    const promedioRend = conteoRend > 0 ? (sumaRendimiento / conteoRend).toFixed(1) : 0;

    document.getElementById('total-produccion-soya-mes').innerText = totalKg.toFixed(2);
    document.getElementById('rendimiento-promedio-soya').innerText = promedioRend + '%';
    document.getElementById('total-lotes-soya').innerText = produccion.length;
}

// ==================== CARGAR TABLAS (AGRUPADAS POR PRODUCTO) ====================
async function cargarTablasSoya(mes, anio) {
    console.log(`Cargando tablas de soya para ${mes}/${anio}`);
    const produccion = await cargarProduccionSoya(mes, anio);
    const despacho = await cargarDespachoSoya(mes, anio);

    // Actualizar estadísticas
    actualizarStatsSoya(produccion);

    // --- PRODUCCIÓN: agrupada por id_producto ---
    const contenedorProd = document.getElementById('contenedor-produccion-soya');
    if (!contenedorProd) return;

    if (!produccion || produccion.length === 0) {
        contenedorProd.innerHTML = `
            <div class="card" style="text-align:center; padding:50px;">
                <i class="fas fa-box-open" style="font-size:60px; color:#ccc;"></i>
                <h3>No hay registros de producción para ${getNombreMes(mes)} ${anio}</h3>
            </div>
        `;
    } else {
        const grupos = {};
        produccion.forEach(item => {
            const idProd = item.id_producto;
            if (!grupos[idProd]) grupos[idProd] = [];
            grupos[idProd].push(item);
        });

        let htmlTotal = '';
        for (const [idProd, registros] of Object.entries(grupos)) {
            const nombreProducto = productosSoya[idProd] || `Producto ID ${idProd}`;
            registros.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            // Calcular totales del grupo
            let totalMedidas = 0, totalDesgranada = 0, totalAzufre = 0, totalPrimera = 0;
            let totalDesechoH = 0, totalDesechoS = 0, totalProducido = 0;

            registros.forEach(r => {
                totalMedidas += parseInt(r.medidas) || 0;
                totalDesgranada += parseFloat(r.soya_desgranada) || 0;
                totalAzufre += parseFloat(r.azufre) || 0;
                totalPrimera += parseFloat(r.primera) || 0;
                totalDesechoH += parseFloat(r.desecho_humedo) || 0;
                totalDesechoS += parseFloat(r.desecho_seco) || 0;
                totalProducido += parseFloat(r.total_producido) || 0;
            });

            const tablaId = `tabla-soya-${idProd}-${mes}-${anio}`;
            htmlTotal += `
                <div class="card tabla-producto" style="background:#fffbe6; margin-bottom:20px; border:1px solid #e6dbac;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#fdf5d0;">
                        <h3 style="color:#856404;">${nombreProducto} – ${getNombreMes(mes)} ${anio}</h3>
                        <button class="btn-expand" onclick="expandirTablaSoya('${tablaId}')" 
                            style="background:#b33939; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                            ⛶ Expandir
                        </button>
                    </div>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; font-size:12px;" id="${tablaId}">
                            <thead style="background:#fdf5d0;">
                                <tr>
                                    <th>Fecha</th><th>Lote</th><th>Medidas (uds)</th>
                                    <th>Soya Desg. (kg)</th><th>Azufre (kg)</th><th>Humedad (%)</th>
                                    <th>1ra (kg)</th><th>Desecho Húm. (kg)</th><th>Desecho Seco (kg)</th>
                                    <th>Total Prod. (kg)</th><th>Proveedor</th><th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            registros.forEach(r => {
                const fechaFormateada = r.fecha ? r.fecha.split('-').reverse().join('/') : 'Sin fecha';
                htmlTotal += `
                    <tr>
                        <td>${fechaFormateada}</td>
                        <td>${r.lote || 'N/A'}</td>
                        <td>${r.medidas || 0}</td>
                        <td>${parseFloat(r.soya_desgranada || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.azufre || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.humedad || 0).toFixed(2)}%</td>
                        <td><strong>${parseFloat(r.primera || 0).toFixed(2)}</strong></td>
                        <td>${parseFloat(r.desecho_humedo || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.desecho_seco || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.total_producido || 0).toFixed(2)}</td>
                        <td>${r.id_proveedor || 'N/A'}</td>
                        <td>
                            <button onclick="editarProduccionSoya(${r.id_soya})" style="color:#3498db; border:none;"><i class="fas fa-edit"></i></button>
                            <button onclick="eliminarProduccionSoya(${r.id_soya})" style="color:red; border:none;"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });

            htmlTotal += `
                            <tr style="font-weight:bold; background:#fdf5d0;">
                                <td><strong>TOTALES</strong></td>
                                <td>-</td
                                <td>${totalMedidas}</td
                                <td>${totalDesgranada.toFixed(2)}</td
                                <td>${totalAzufre.toFixed(2)}</td
                                <td>-</td
                                <td>${totalPrimera.toFixed(2)}</td
                                <td>${totalDesechoH.toFixed(2)}</td
                                <td>${totalDesechoS.toFixed(2)}</td
                                <td>${totalProducido.toFixed(2)}</td
                                <td>-</td
                                <td></td
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            `;
        }
        contenedorProd.innerHTML = htmlTotal;
    }

    // --- DESPACHO: tabla única ---
    const tablaDesp = document.getElementById('lista-soya-despacho');
    if (tablaDesp) {
        if (!despacho || despacho.length === 0) {
            tablaDesp.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:#999;">
                <i class="fas fa-truck" style="font-size:40px;display:block;margin-bottom:10px;"></i>
                No hay registros de despacho para ${getNombreMes(mes)} ${anio}
             </td></tr>`;
        } else {
            let htmlDesp = '';
            despacho.forEach(item => {
                const fechaFormateada = item.fecha ? item.fecha.split('-').reverse().join('/') : 'Sin fecha';
                htmlDesp += `
                    <tr>
                        <td><strong>${item.lote || 'N/A'}</strong><br><small>${fechaFormateada}</small></td>
                        <td>125g: ${item.u125g || 0} | 250g: ${item.u250g || 0}<br>8Kg: ${item.u8kg || 0} | 12Kg: ${item.u12kg || 0}</td>
                        <td><strong>${parseFloat(item.total_kg || 0).toFixed(2)} Kg</strong></td>
                        <td>
                            <button onclick="editarDespachoSoya(${item.id_despacho})" style="color:#3498db;border:none;background:none;cursor:pointer;"><i class="fas fa-edit"></i></button>
                            <button onclick="eliminarDespachoSoya(${item.id_despacho})" style="color:red;border:none;background:none;cursor:pointer;"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
            tablaDesp.innerHTML = htmlDesp;
        }
    }
}

// ==================== CRUD PRODUCCIÓN ====================
async function guardarProduccion() {
    const fecha = document.getElementById('soya-fecha').value;
    const lote = document.getElementById('soya-lote').value.trim();
    if (!fecha || !lote) {
        mostrarNotificacion('⚠️ Complete la Fecha y el Lote', 'error');
        return;
    }

    const registro = {
        id_soya: editandoProduccionId || null,
        id_producto: parseInt(document.getElementById('soya-tipo-producto').value) || 12,
        fecha: fecha,
        lote: lote,
        medidas: parseInt(document.getElementById('soya-medidas').value) || 0,
        soya_desgranada: parseFloat(document.getElementById('soya-desgranada').value) || 0,
        azufre: parseFloat(document.getElementById('soya-azufre').value) || 0,
        humedad: parseFloat(document.getElementById('soya-humedad').value) || 0,
        primera: parseFloat(document.getElementById('soya-primera').value) || 0,
        desecho_humedo: parseFloat(document.getElementById('soya-desecho-h').value) || 0,
        desecho_seco: parseFloat(document.getElementById('soya-desecho-s').value) || 0,
        total_producido: parseFloat(document.getElementById('soya-total').value) || 0,
        id_proveedor: document.getElementById('soya-proveedor').value.trim() || null
    };

    const btn = document.getElementById('btn-guardar-produccion');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> GUARDANDO...';
    btn.disabled = true;

    const result = await guardarProduccionAPI(registro);

    btn.innerHTML = originalText;
    btn.disabled = false;

    if (result.success) {
        mostrarNotificacion(result.message || 'Producción guardada', 'success');
        editandoProduccionId = null;
        limpiarFormularioProduccion();
        await cargarTablasSoya(mesActualSoya, anioActualSoya);
        cerrarModalProduccion();
        document.getElementById('btn-guardar-produccion').innerHTML = '<i class="fas fa-save"></i> GUARDAR REGISTRO';
    } else {
        mostrarNotificacion(result.message || 'Error al guardar', 'error');
    }
}

async function eliminarProduccionSoya(id) {
    if (!confirm('¿Eliminar este registro de producción?')) return;
    const result = await eliminarProduccionAPI(id);
    if (result.success) {
        mostrarNotificacion('Producción eliminada', 'success');
        await cargarTablasSoya(mesActualSoya, anioActualSoya);
    } else {
        mostrarNotificacion('Error al eliminar', 'error');
    }
}

async function editarProduccionSoya(id) {
    editandoProduccionId = id;
    const produccion = await cargarProduccionSoya(mesActualSoya, anioActualSoya);
    const item = produccion.find(p => p.id_soya === id);
    if (item) {
        document.getElementById('soya-fecha').value = item.fecha || '';
        document.getElementById('soya-lote').value = item.lote || '';
        document.getElementById('soya-tipo-producto').value = item.id_producto || 12;
        document.getElementById('soya-medidas').value = item.medidas || 0;
        document.getElementById('soya-desgranada').value = item.soya_desgranada || 0;
        document.getElementById('soya-azufre').value = item.azufre || 0;
        document.getElementById('soya-humedad').value = item.humedad || 0;
        document.getElementById('soya-primera').value = item.primera || 0;
        document.getElementById('soya-desecho-h').value = item.desecho_humedo || 0;
        document.getElementById('soya-desecho-s').value = item.desecho_seco || 0;
        document.getElementById('soya-proveedor').value = item.id_proveedor || '';
        calcularProduccion();
    }
    const btn = document.getElementById('btn-guardar-produccion');
    if (btn) btn.innerHTML = '<i class="fas fa-sync"></i> ACTUALIZAR REGISTRO';
    abrirModalProduccion();
}

// ==================== CRUD DESPACHO ====================
async function guardarDespacho() {
    const fecha = document.getElementById('soya-fecha-despacho').value;
    const lote = document.getElementById('despacho-lote').value.trim();
    if (!fecha || !lote) {
        mostrarNotificacion('⚠️ Complete la Fecha y el Lote', 'error');
        return;
    }

    const registro = {
        id_despacho: editandoDespachoId || null,
        lote: lote,
        fecha: fecha,
        u125g: parseInt(document.getElementById('soya-125g').value) || 0,
        u250g: parseInt(document.getElementById('soya-250g').value) || 0,
        u8kg: parseInt(document.getElementById('soya-8kg').value) || 0,
        u12kg: parseInt(document.getElementById('soya-12kg').value) || 0,
        total_kg: parseFloat(document.getElementById('soya-kg-despacho').value) || 0
    };

    const btn = document.getElementById('btn-guardar-despacho');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> GUARDANDO...';
    btn.disabled = true;

    const result = await guardarDespachoAPI(registro);

    btn.innerHTML = originalText;
    btn.disabled = false;

    if (result.success) {
        mostrarNotificacion(result.message || 'Despacho guardado', 'success');
        editandoDespachoId = null;
        limpiarFormularioDespacho();
        await cargarTablasSoya(mesActualSoya, anioActualSoya);
        cerrarModalDespacho();
        document.getElementById('btn-guardar-despacho').innerHTML = '<i class="fas fa-shipping-fast"></i> REGISTRAR ENTREGA';
    } else {
        mostrarNotificacion(result.message || 'Error al guardar', 'error');
    }
}

async function eliminarDespachoSoya(id) {
    if (!confirm('¿Eliminar este registro de despacho?')) return;
    const result = await eliminarDespachoAPI(id);
    if (result.success) {
        mostrarNotificacion('Despacho eliminado', 'success');
        await cargarTablasSoya(mesActualSoya, anioActualSoya);
    } else {
        mostrarNotificacion('Error al eliminar', 'error');
    }
}

async function editarDespachoSoya(id) {
    editandoDespachoId = id;
    const despacho = await cargarDespachoSoya(mesActualSoya, anioActualSoya);
    const item = despacho.find(d => d.id_despacho === id);
    if (item) {
        document.getElementById('soya-fecha-despacho').value = item.fecha || '';
        document.getElementById('despacho-lote').value = item.lote || '';
        document.getElementById('soya-125g').value = item.u125g || 0;
        document.getElementById('soya-250g').value = item.u250g || 0;
        document.getElementById('soya-8kg').value = item.u8kg || 0;
        document.getElementById('soya-12kg').value = item.u12kg || 0;
        calcularDespacho();
    }
    const btn = document.getElementById('btn-guardar-despacho');
    if (btn) btn.innerHTML = '<i class="fas fa-sync"></i> ACTUALIZAR REGISTRO';
    abrirModalDespacho();
}

// ==================== CÁLCULOS AUTOMÁTICOS ====================
function calcularProduccion() {
    const p1 = parseFloat(document.getElementById('soya-primera').value) || 0;
    const dh = parseFloat(document.getElementById('soya-desecho-h').value) || 0;
    const ds = parseFloat(document.getElementById('soya-desecho-s').value) || 0;
    document.getElementById('soya-total').value = (p1 + dh + ds).toFixed(2);
    document.getElementById('soya-total-sin').value = p1.toFixed(2);
}

function calcularDespacho() {
    const t = (parseFloat(document.getElementById('soya-125g').value) || 0) * 0.125 +
              (parseFloat(document.getElementById('soya-250g').value) || 0) * 0.250 +
              (parseFloat(document.getElementById('soya-8kg').value) || 0) * 8 +
              (parseFloat(document.getElementById('soya-12kg').value) || 0) * 12;
    document.getElementById('soya-kg-despacho').value = t.toFixed(2);
}

// ==================== VALIDACIONES ====================
function validarNumeroPositivo(input) {
    if (input.value < 0) {
        input.value = 0;
        mostrarNotificacion("No se permiten números negativos", "error");
    }
}

function validarCampoNumerico(input) {
    input.addEventListener('keydown', (e) => {
        if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
    });
    input.addEventListener('input', () => validarNumeroPositivo(input));
    input.addEventListener('blur', () => { if (input.value === '' || input.value === null) input.value = 0; });
}

function inicializarEventosInput() {
    document.querySelectorAll('.campo-numerico').forEach(input => validarCampoNumerico(input));
    document.querySelectorAll('.calculo-produccion').forEach(input => input.addEventListener('input', calcularProduccion));
    document.querySelectorAll('.calculo-despacho').forEach(input => input.addEventListener('input', calcularDespacho));
}

// ==================== LIMPIAR FORMULARIOS ====================
function limpiarFormularioProduccion() {
    const inputs = document.querySelectorAll('#form-contenedor-produccion input, #form-contenedor-produccion select');
    inputs.forEach(i => {
        if (i.type !== 'button' && i.type !== 'submit') i.value = '';
    });
    calcularProduccion();
}

function limpiarFormularioDespacho() {
    const inputs = document.querySelectorAll('#form-contenedor-despacho input');
    inputs.forEach(i => {
        if (i.type !== 'button' && i.type !== 'submit') i.value = '';
    });
    calcularDespacho();
}

// ==================== MODALES ====================
function inicializarModales() {
    const btnAbrir = document.getElementById('btn-abrir-form-soya');
    if (btnAbrir) {
        btnAbrir.addEventListener('click', () => {
            editandoProduccionId = null;
            limpiarFormularioProduccion();
            abrirModalProduccion();
        });
    }

    const btnCerrarProd = document.getElementById('btn-cerrar-produccion');
    const btnCerrarDesp = document.getElementById('btn-cerrar-despacho');
    const overlay = document.getElementById('form-overlay-soya');

    if (btnCerrarProd) btnCerrarProd.addEventListener('click', cerrarModalProduccion);
    if (btnCerrarDesp) btnCerrarDesp.addEventListener('click', cerrarModalDespacho);
    if (overlay) overlay.addEventListener('click', () => { cerrarModalProduccion(); cerrarModalDespacho(); });
}

function abrirModalProduccion() {
    const overlay = document.getElementById('form-overlay-soya');
    const modal = document.getElementById('form-contenedor-produccion');
    if (overlay && modal) {
        overlay.classList.add('activo');
        modal.classList.add('activo');
    }
}

function cerrarModalProduccion() {
    const overlay = document.getElementById('form-overlay-soya');
    const modal = document.getElementById('form-contenedor-produccion');
    if (overlay) overlay.classList.remove('activo');
    if (modal) modal.classList.remove('activo');
    if (editandoProduccionId !== null) {
        editandoProduccionId = null;
        const btn = document.getElementById('btn-guardar-produccion');
        if (btn) btn.innerHTML = '<i class="fas fa-save"></i> GUARDAR REGISTRO';
    }
}

function abrirModalDespacho() {
    const overlay = document.getElementById('form-overlay-soya');
    const modal = document.getElementById('form-contenedor-despacho');
    if (overlay && modal) {
        overlay.classList.add('activo');
        modal.classList.add('activo');
    }
}

function cerrarModalDespacho() {
    const overlay = document.getElementById('form-overlay-soya');
    const modal = document.getElementById('form-contenedor-despacho');
    if (overlay) overlay.classList.remove('activo');
    if (modal) modal.classList.remove('activo');
    if (editandoDespachoId !== null) {
        editandoDespachoId = null;
        const btn = document.getElementById('btn-guardar-despacho');
        if (btn) btn.innerHTML = '<i class="fas fa-shipping-fast"></i> REGISTRAR ENTREGA';
    }
}

// ==================== MENÚ HAMBURGUESA ====================
function inicializarMenuHamburguesa() {
    const menuHamburguesa = document.getElementById('menuHamburguesa');
    const menuDesplegable = document.getElementById('menuDesplegable');
    if (!menuHamburguesa || !menuDesplegable) return;

    menuHamburguesa.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDesplegable.classList.toggle('mostrar');
    });

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const seccion = item.getAttribute('data-seccion');
            if (seccion === 'produccion') {
                editandoProduccionId = null;
                limpiarFormularioProduccion();
                abrirModalProduccion();
            } else if (seccion === 'despacho') {
                editandoDespachoId = null;
                limpiarFormularioDespacho();
                abrirModalDespacho();
            }
            menuDesplegable.classList.remove('mostrar');
        });
    });

    document.addEventListener('click', (e) => {
        if (!menuDesplegable.contains(e.target) && !menuHamburguesa.contains(e.target)) {
            menuDesplegable.classList.remove('mostrar');
        }
    });
}

function inicializarBotonesGuardar() {
    const btnProd = document.getElementById('btn-guardar-produccion');
    const btnDesp = document.getElementById('btn-guardar-despacho');
    if (btnProd) {
        btnProd.removeEventListener('click', guardarProduccion);
        btnProd.addEventListener('click', guardarProduccion);
    }
    if (btnDesp) {
        btnDesp.removeEventListener('click', guardarDespacho);
        btnDesp.addEventListener('click', guardarDespacho);
    }
}

// ==================== BÚSQUEDA ====================
function inicializarBusqueda() {
    const lupa = document.getElementById('lupa-busqueda');
    if (lupa) lupa.addEventListener('click', abrirModalBusquedaSoya);
}

function inicializarSelectAnios() {
    const selectAnio = document.getElementById('buscar-anio-soya');
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

function abrirModalBusquedaSoya() {
    const modal = document.getElementById('modal-busqueda-soya');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        const hoy = new Date();
        document.getElementById('buscar-mes-soya').value = hoy.getMonth() + 1;
        document.getElementById('buscar-anio-soya').value = hoy.getFullYear();
    }
}

function cerrarModalBusquedaSoya() {
    const modal = document.getElementById('modal-busqueda-soya');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function buscarPorMesAnioSoya() {
    const mes = parseInt(document.getElementById('buscar-mes-soya').value);
    const anio = parseInt(document.getElementById('buscar-anio-soya').value);
    mesActualSoya = mes;
    anioActualSoya = anio;
    cargarTablasSoya(mes, anio);
    cerrarModalBusquedaSoya();
    mostrarNotificacion(`Mostrando datos de ${getNombreMes(mes)} ${anio}`, 'success');
}

function getNombreMes(mes) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1];
}

// ==================== EXPANDIR TABLAS ====================
function expandirTablaSoya(idTabla) {
    const tabla = document.getElementById(idTabla);
    const modal = document.getElementById('modal-tabla-soya');
    const contenido = document.getElementById('contenido-modal-tabla-soya');
    if (!tabla || !modal || !contenido) return;
    const clon = tabla.cloneNode(true);
    contenido.innerHTML = '';
    contenido.appendChild(clon);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function cerrarModalTablaSoya() {
    const modal = document.getElementById('modal-tabla-soya');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ==================== NOTIFICACIONES ====================
function mostrarNotificacion(mensaje, tipo) {
    const notificacionesPrevias = document.querySelectorAll('.notificacion-venepan');
    notificacionesPrevias.forEach(n => n.remove());

    const notificacion = document.createElement('div');
    notificacion.className = `notificacion-venepan ${tipo}`;
    notificacion.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${mensaje}</span>`;
    notificacion.style.cssText = `
        position: fixed; bottom: 30px; right: 30px; padding: 12px 20px; border-radius: 8px;
        color: white; font-weight: bold; z-index: 99999; display: flex; align-items: center;
        gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;
        background: ${tipo === 'success' ? '#27ae60' : '#e74c3c'};
    `;
    document.body.appendChild(notificacion);
    setTimeout(() => {
        notificacion.style.opacity = '0';
        setTimeout(() => notificacion.remove(), 500);
    }, 3000);
}

function inyectarEstilosNotificacion() {
    if (document.getElementById('estilos-soya')) return;
    const style = document.createElement('style');
    style.id = 'estilos-soya';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .btn-expand:hover { background: #8e2d2d !important; transform: scale(1.05); transition: all 0.3s; }
    `;
    document.head.appendChild(style);
}

// Exponer funciones globales
window.editarProduccionSoya = editarProduccionSoya;
window.editarDespachoSoya = editarDespachoSoya;
window.eliminarProduccionSoya = eliminarProduccionSoya;
window.eliminarDespachoSoya = eliminarDespachoSoya;
window.expandirTablaSoya = expandirTablaSoya;
window.cerrarModalTablaSoya = cerrarModalTablaSoya;
window.buscarPorMesAnioSoya = buscarPorMesAnioSoya;
window.cerrarModalBusquedaSoya = cerrarModalBusquedaSoya;