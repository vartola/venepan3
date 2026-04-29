// ==================== VARIABLES GLOBALES ====================
let editandoIndex = null;
let tipoMovimientoActual = "";
let tipoActual = 'materia_prima';
let filtroMovimiento = 'todos';

const API_URL = 'api.php';

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    inicializarModales();
    inicializarMenuHamburguesa();
    inicializarBusqueda();
    inicializarSelectAnios();
    inicializarSelectMeses();
    inicializarValidaciones();
    inicializarBotones();
    inicializarPestanasMateria();  // <-- Versión corregida
    inicializarFiltrosHistorial();
    inicializarModalEdicionLote();

    cargarMateria();
    cargarHistorial();

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModalCrear();
            cerrarModalMovimiento();
            cerrarModalBusquedaMateria();
            cerrarModalEdicionLote();
        }
    });
});

// ==================== LLENAR SELECT DE MESES ====================
function inicializarSelectMeses() {
    const selectMes = document.getElementById('buscar-mes-materia');
    if (!selectMes) return;
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    selectMes.innerHTML = '';
    meses.forEach((nombre, idx) => {
        const option = document.createElement('option');
        option.value = idx + 1;
        option.textContent = nombre;
        if (idx + 1 === new Date().getMonth() + 1) option.selected = true;
        selectMes.appendChild(option);
    });
}

// ==================== MODAL EDICIÓN DE LOTE ====================
function inicializarModalEdicionLote() {
    const modal = document.getElementById('modal-editar-lote');
    const overlay = document.getElementById('form-overlay-materia');
    const cerrar = modal?.querySelector('.cerrar-modal-editar');
    if (cerrar) cerrar.addEventListener('click', cerrarModalEdicionLote);
    if (overlay) overlay.addEventListener('click', cerrarModalEdicionLote);
    const btnGuardar = document.getElementById('btn-guardar-edicion-lote');
    if (btnGuardar) btnGuardar.addEventListener('click', guardarEdicionLote);
}

function abrirModalEdicionLote(id_lote, cantidad, fecha_elab, fecha_venc) {
    const modal = document.getElementById('modal-editar-lote');
    const overlay = document.getElementById('form-overlay-materia');
    if (modal && overlay) {
        document.getElementById('edit-lote-id').value = id_lote;
        document.getElementById('edit-cantidad').value = cantidad;
        document.getElementById('edit-fecha-elab').value = fecha_elab || '';
        document.getElementById('edit-fecha-venc').value = fecha_venc || '';
        overlay.classList.add('activo');
        modal.classList.add('activo');
    }
}

function cerrarModalEdicionLote() {
    const modal = document.getElementById('modal-editar-lote');
    const overlay = document.getElementById('form-overlay-materia');
    if (modal) modal.classList.remove('activo');
    if (overlay) overlay.classList.remove('activo');
}

async function guardarEdicionLote() {
    const id_lote = document.getElementById('edit-lote-id').value;
    const cantidad = parseFloat(document.getElementById('edit-cantidad').value);
    const fecha_elab = document.getElementById('edit-fecha-elab').value;
    const fecha_venc = document.getElementById('edit-fecha-venc').value;
    if (isNaN(cantidad) || cantidad < 0) {
        mostrarNotificacion('Cantidad no válida', 'error');
        return;
    }
    try {
        const response = await fetch(`${API_URL}?action=update_lote_materia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_lote, cantidad_disponible: cantidad, fecha_elaboracion: fecha_elab, fecha_vencimiento: fecha_venc })
        });
        const result = await response.json();
        if (result.success) {
            mostrarNotificacion('Lote actualizado', 'success');
            cerrarModalEdicionLote();
            cargarMateria();
        } else {
            mostrarNotificacion('Error al actualizar', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

// ==================== ELIMINAR LOTE ====================
async function eliminarInsumo(id_lote) {
    if (!confirm('¿Eliminar este lote permanentemente? Se borrarán también sus movimientos.')) return;
    try {
        const response = await fetch(`${API_URL}?action=delete_lote_materia`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_lote })
        });
        const result = await response.json();
        if (result.success) {
            mostrarNotificacion('Lote eliminado', 'success');
            cargarMateria();
            cargarHistorial();
        } else {
            mostrarNotificacion('Error al eliminar', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

// ==================== BORRAR HISTORIAL ====================
async function borrarHistorial() {
    if (!confirm('⚠️ Esta acción eliminará TODOS los registros de movimientos. ¿Estás seguro?')) return;
    try {
        const response = await fetch(`${API_URL}?action=clear_historial_materia`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
            mostrarNotificacion('Historial limpiado correctamente', 'success');
            cargarHistorial();
        } else {
            mostrarNotificacion('Error al limpiar historial', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

// ==================== CARGAR ====================
async function cargarMateria() {
    try {
        const response = await fetch(`${API_URL}?action=get_inventario_materia&tipo=${tipoActual}`);
        const inventario = await response.json();
        const lista = document.getElementById('lista-materia');
        if (!lista) return;
        let contadorBajo = 0, contadorSin = 0;
        if (!inventario.length) {
            lista.innerHTML = `<tr><td colspan="9">No hay productos registrados para ${tipoActual === 'materia_prima' ? 'Materia Prima' : 'Empaques'}. Usa el menú hamburguesa para crear uno.</td></tr>`;
        } else {
            lista.innerHTML = inventario.map(item => {
                const stock = parseFloat(item.cantidad_disponible) || 0;
                const colorStock = stock <= 0 ? '#e74c3c' : stock < 10 ? '#f39c12' : '#27ae60';
                if (stock <= 0) contadorSin++;
                else if (stock < 10) contadorBajo++;
                
                const fechaElab = item.fecha_elaboracion ? item.fecha_elaboracion.split('-').reverse().join('/') : 'N/A';
                const fechaVenc = item.fecha_vencimiento ? item.fecha_vencimiento.split('-').reverse().join('/') : 'N/A';
                const pesoPresentacion = item.peso_presentacion ? parseFloat(item.peso_presentacion).toFixed(2) : 'N/A';
                
                return `
                    <tr style="border-bottom: 1px solid #e6dbac;">
                        <td style="padding: 10px; border: 1px solid #e6dbac;"><small>${item.id_lote}</small></td>
                        <td style="padding: 10px; border: 1px solid #e6dbac;"><strong>${item.producto}</strong></td>
                        <td style="padding: 10px; border: 1px solid #e6dbac;">${item.numero_lote}</td>
                        <td style="padding: 10px; border: 1px solid #e6dbac;">${item.proveedor || 'N/A'}</td>
                        <td style="padding: 10px; border: 1px solid #e6dbac; font-weight: bold; color: ${colorStock};">${stock.toFixed(2)} kg</td>
                        <td style="padding: 10px; border: 1px solid #e6dbac;">${pesoPresentacion}</td>
                        <td style="padding: 10px; border: 1px solid #e6dbac;">${fechaElab}</td>
                        <td style="padding: 10px; border: 1px solid #e6dbac;">${fechaVenc}</td>
                        <td style="padding: 10px; border: 1px solid #e6dbac;">
                            <button onclick="abrirModalEdicionLote(${item.id_lote}, ${stock}, '${item.fecha_elaboracion || ''}', '${item.fecha_vencimiento || ''}')" style="color:#3498db; border:none; background:none;"><i class="fas fa-edit"></i></button>
                            <button onclick="eliminarInsumo(${item.id_lote})" style="color:#e74c3c; border:none; background:none;"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        document.getElementById('total-insumos').innerText = inventario.length;
        document.getElementById('cant-bajo').innerText = contadorBajo;
        document.getElementById('cant-sin').innerText = contadorSin;
    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error al cargar inventario', 'error');
    }
}

async function cargarHistorial(filtroMes = null, filtroAnio = null) {
    try {
        let url = `${API_URL}?action=get_historial_materia&tipo_movimiento=${filtroMovimiento}`;
        if (filtroMes && filtroAnio) url += `&mes=${filtroMes}&anio=${filtroAnio}`;
        const response = await fetch(url);
        const historial = await response.json();

        const tbody = document.getElementById('lista-historial');
        if (!tbody) return;

        if (historial.error) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#e74c3c;">Error: ${historial.error}</td></tr>`;
            mostrarNotificacion(historial.error, 'error');
            return;
        }

        if (!Array.isArray(historial) || historial.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:#999;">📭 No hay movimientos registrados</td></tr>`;
        } else {
            tbody.innerHTML = historial.map(reg => {
                let cantidad = parseFloat(reg.cantidad) || 0;
                const fechaFormateada = new Date(reg.fecha).toLocaleString();
                const tipoSpan = reg.tipo === 'entrada' 
                    ? '<span style="background:#27ae60; color:white; padding:4px 10px; border-radius:15px; font-size:12px;"><i class="fas fa-arrow-down"></i> ENTRADA</span>'
                    : '<span style="background:#e67e22; color:white; padding:4px 10px; border-radius:15px; font-size:12px;"><i class="fas fa-arrow-up"></i> SALIDA</span>';
                return `
                    <tr style="border-bottom: 1px solid #e6dbac;">
                        <td style="padding: 10px; border: 1px solid #e6dbac;"><small>${fechaFormateada}</small></td>
                        <td style="padding: 10px; border: 1px solid #e6dbac;"><strong>${reg.producto || 'N/A'}</strong></td>
                        <td style="padding: 10px; border: 1px solid #e6dbac; text-align:center;">${tipoSpan}</td>
                        <td style="padding: 10px; border: 1px solid #e6dbac; font-weight:bold; text-align:right;">${cantidad.toFixed(2)} kg</td>
                        <td style="padding: 10px; border: 1px solid #e6dbac;"><small>${reg.detalle || ''}</small></td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error al cargar historial: ' + error.message, 'error');
        const tbody = document.getElementById('lista-historial');
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#e74c3c;">Error de conexión o datos</td></tr>`;
    }
}

// ==================== PESTAÑAS====================
function inicializarPestanasMateria() {
    const tabMp = document.getElementById('tab-materia-prima-btn');
    const tabEmp = document.getElementById('tab-empaques-btn');
    const tabHist = document.getElementById('tab-historial-btn');
    const inventarioDiv = document.getElementById('inventario-container');
    const historialDiv = document.getElementById('historial-container');

    if (!tabMp || !tabEmp || !tabHist) {
        console.error('No se encontraron las pestañas');
        return;
    }
    if (!inventarioDiv || !historialDiv) {
        console.error('No se encontraron los contenedores');
        return;
    }

    const mostrarInventario = (tipo) => {
        tipoActual = tipo;
        inventarioDiv.style.display = 'block';
        historialDiv.style.display = 'none';
        tabMp.classList.remove('active');
        tabEmp.classList.remove('active');
        tabHist.classList.remove('active');
        if (tipo === 'materia_prima') {
            tabMp.classList.add('active');
        } else {
            tabEmp.classList.add('active');
        }
        cargarMateria();
    };

    const mostrarHistorial = () => {
        console.log('Mostrando historial');
        inventarioDiv.style.display = 'none';
        historialDiv.style.display = 'block';
        tabMp.classList.remove('active');
        tabEmp.classList.remove('active');
        tabHist.classList.add('active');
        cargarHistorial(); 
    };

    tabMp.addEventListener('click', () => mostrarInventario('materia_prima'));
    tabEmp.addEventListener('click', () => mostrarInventario('empaque'));
    tabHist.addEventListener('click', mostrarHistorial);

    mostrarInventario('materia_prima');
}

// ==================== FILTROS DE HISTORIAL ====================
function inicializarFiltrosHistorial() {
    const btnTodos = document.getElementById('filtro-todos');
    const btnEntradas = document.getElementById('filtro-entradas');
    const btnSalidas = document.getElementById('filtro-salidas');
    if (!btnTodos) return;
    const setActive = (active) => {
        [btnTodos, btnEntradas, btnSalidas].forEach(btn => btn.classList.remove('active'));
        active.classList.add('active');
    };
    btnTodos.addEventListener('click', () => {
        filtroMovimiento = 'todos';
        setActive(btnTodos);
        cargarHistorial();
    });
    btnEntradas.addEventListener('click', () => {
        filtroMovimiento = 'entrada';
        setActive(btnEntradas);
        cargarHistorial();
    });
    btnSalidas.addEventListener('click', () => {
        filtroMovimiento = 'salida';
        setActive(btnSalidas);
        cargarHistorial();
    });
}

// ==================== GUARDAR NUEVA ENTRADA ====================
async function guardarProducto() {
    const fecha = document.getElementById('materia-fecha-ingreso').value;
    const tipo = document.getElementById('tipo-producto')?.value || tipoActual;
    const producto = document.getElementById('materia-nombre').value.trim();
    const peso_presentacion = parseFloat(document.getElementById('materia-peso')?.value) || null;
    const proveedor = document.getElementById('materia-proveedor').value.trim();
    const n_factura = document.getElementById('materia-factura')?.value.trim() || null;
    const tobos = parseInt(document.getElementById('materia-tobos')?.value) || 0;
    const cajas = parseInt(document.getElementById('materia-cajas')?.value) || 0;
    const bultos = parseInt(document.getElementById('materia-bultos')?.value) || 0;
    const tambores = parseInt(document.getElementById('materia-tambores')?.value) || 0;
    const observaciones = document.getElementById('materia-observaciones')?.value.trim() || null;
    const lote_numero = document.getElementById('materia-lote').value.trim() || `LOTE-${Date.now()}`;
    const cantidad = parseFloat(document.getElementById('materia-kilos').value) || 0;
    const fecha_elaboracion = document.getElementById('materia-fecha-elaboracion')?.value || null;
    const fecha_vencimiento = document.getElementById('materia-fecha-vencimiento')?.value || null;

    if (!fecha || !producto || cantidad <= 0) {
        mostrarNotificacion('Complete todos los campos obligatorios', 'error');
        return;
    }
    const data = {
        fecha, tipo, producto, peso_presentacion, proveedor, n_factura,
        tobos, cajas, bultos, tambores, observaciones,
        lotes: [{ numero_lote: lote_numero, cantidad, fecha_elaboracion, fecha_vencimiento }]
    };
    try {
        const response = await fetch(`${API_URL}?action=registrar_entrada_materia`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            mostrarNotificacion('Entrada registrada correctamente', 'success');
            limpiarCampos();
            cargarMateria();
            cargarHistorial();
            cerrarModalCrear();
        } else {
            mostrarNotificacion(result.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

// ==================== REGISTRAR SALIDA (FIFO) ====================
async function confirmarMovimiento() {
    const nombreProducto = document.getElementById('mov-nombre-seleccionado').value;
    const kilos = parseFloat(document.getElementById('mov-kilos').value);
    const detalle = document.getElementById('mov-detalle').value.trim();
    if (!nombreProducto || isNaN(kilos) || kilos <= 0) {
        mostrarNotificacion('Seleccione un producto y cantidad válida', 'error');
        return;
    }
    if (tipoMovimientoActual === 'SALIDA') {
        try {
            const response = await fetch(`${API_URL}?action=registrar_salida_materia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    producto: nombreProducto,
                    cantidad: kilos,
                    detalle: detalle || 'Consumo manual',
                    modulo_origen: 'inventario',
                    tipo: tipoActual   // Envía materia_prima o empaque
                })
            });
            const result = await response.json();
            if (result.success) {
                mostrarNotificacion('Salida registrada correctamente (FIFO)', 'success');
                cargarMateria();
                cargarHistorial();
                cerrarModalMovimiento();
            } else {
                mostrarNotificacion(result.message, 'error');
            }
        } catch (error) {
            console.error(error);
            mostrarNotificacion('Error al registrar salida', 'error');
        }
    } else {
        mostrarNotificacion('La entrada debe hacerse desde el formulario de nuevo producto', 'error');
    }
}

// ==================== BÚSQUEDA PRODUCTOS PARA MOVIMIENTO ====================
async function buscarParaMovimiento() {
    const busqueda = document.getElementById('mov-buscador').value.toLowerCase().trim();
    const sugerenciasDiv = document.getElementById('sugerencias-mov');
    if (busqueda.length < 1) {
        sugerenciasDiv.innerHTML = '';
        return;
    }
    try {
        const response = await fetch(`${API_URL}?action=get_inventario_materia&tipo=${tipoActual}`);
        const inventario = await response.json();
        const productosMap = new Map();
        inventario.forEach(lote => {
            const nom = lote.producto;
            if (!productosMap.has(nom)) productosMap.set(nom, { nombre: nom, stock: 0, lotes: [] });
            const prod = productosMap.get(nom);
            prod.stock += lote.cantidad_disponible;
            prod.lotes.push(lote);
        });
        const filtrados = Array.from(productosMap.values()).filter(p => p.nombre.toLowerCase().includes(busqueda));
        sugerenciasDiv.innerHTML = filtrados.map(p => {
            const stockColor = p.stock <= 0 ? '#e74c3c' : p.stock < 10 ? '#f39c12' : '#27ae60';
            const lotesInfo = p.lotes.map(l => `Lote: ${l.numero_lote} (${l.cantidad_disponible}kg)`).join('<br>');
            return `
                <div onclick="seleccionarProductoMov('${p.nombre}')" 
                     style="padding:10px; cursor:pointer; border-bottom:1px solid #eee; background:white;"
                     onmouseover="this.style.background='#f5f5f5'"
                     onmouseout="this.style.background='white'"
                     title="${lotesInfo}">
                    <strong>${p.nombre}</strong>
                    <small style="color:${stockColor};"> (Stock total: ${p.stock.toFixed(2)} kg)</small>
                    <br><small>${p.lotes.length} lote(s)</small>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error(error);
    }
}

function seleccionarProductoMov(nombre) {
    document.getElementById('mov-nombre-seleccionado').value = nombre;
    document.getElementById('mov-buscador').value = nombre;
    document.getElementById('sugerencias-mov').innerHTML = '';
    document.getElementById('mov-kilos').focus();
}

// ==================== MODALES ====================
function inicializarModales() {
    const btnCerrarCrear = document.getElementById('btn-cerrar-crear');
    const btnCerrarMov = document.getElementById('btn-cerrar-movimiento');
    const overlay = document.getElementById('form-overlay-materia');

    if (btnCerrarCrear) btnCerrarCrear.addEventListener('click', cerrarModalCrear);
    if (btnCerrarMov) btnCerrarMov.addEventListener('click', cerrarModalMovimiento);
    if (overlay) overlay.addEventListener('click', () => {
        cerrarModalCrear();
        cerrarModalMovimiento();
        cerrarModalEdicionLote();
    });
}

function abrirModalCrear() {
    const overlay = document.getElementById('form-overlay-materia');
    const modal = document.getElementById('modal-crear-producto');
    if (overlay && modal) {
        overlay.classList.add('activo');
        modal.classList.add('activo');
        if (editandoIndex === null) {
            limpiarCampos();
            document.getElementById('materia-fecha-ingreso').value = new Date().toISOString().split('T')[0];
            document.getElementById('tipo-producto').value = tipoActual;
        } else {
            document.getElementById('materia-kilos').disabled = true;
            document.getElementById('materia-fecha-ingreso').disabled = true;
        }
    }
}

function cerrarModalCrear() {
    const overlay = document.getElementById('form-overlay-materia');
    const modal = document.getElementById('modal-crear-producto');
    if (overlay) overlay.classList.remove('activo');
    if (modal) modal.classList.remove('activo');
    document.getElementById('materia-kilos').disabled = false;
    document.getElementById('materia-fecha-ingreso').disabled = false;
    if (editandoIndex !== null) {
        editandoIndex = null;
        const btn = document.getElementById('btn-guardar-materia');
        if (btn) btn.innerHTML = '<i class="fas fa-save"></i> GUARDAR PRODUCTO';
    }
}

function abrirModalMovimiento(tipo) {
    tipoMovimientoActual = tipo;
    const overlay = document.getElementById('form-overlay-materia');
    const modal = document.getElementById('modal-movimiento');
    const titulo = document.getElementById('titulo-movimiento');
    if (overlay && modal) {
        titulo.innerHTML = tipo === 'ENTRADA' 
            ? '<i class="fas fa-arrow-down"></i> Registrar Entrada'
            : '<i class="fas fa-arrow-up"></i> Registrar Salida (FIFO)';
        overlay.classList.add('activo');
        modal.classList.add('activo');
        document.getElementById('mov-buscador').value = '';
        document.getElementById('mov-kilos').value = '';
        document.getElementById('mov-detalle').value = '';
        document.getElementById('mov-nombre-seleccionado').value = '';
        document.getElementById('sugerencias-mov').innerHTML = '';
        document.getElementById('mov-buscador').focus();
    }
}

function cerrarModalMovimiento() {
    const overlay = document.getElementById('form-overlay-materia');
    const modal = document.getElementById('modal-movimiento');
    if (overlay) overlay.classList.remove('activo');
    if (modal) modal.classList.remove('activo');
}

function limpiarCampos() {
    document.querySelectorAll('#modal-crear-producto input, #modal-crear-producto select, #modal-crear-producto textarea').forEach(i => {
        if (i.type !== 'button' && i.type !== 'submit') i.value = '';
    });
    editandoIndex = null;
    const btn = document.getElementById('btn-guardar-materia');
    if (btn) btn.innerHTML = '<i class="fas fa-save"></i> GUARDAR PRODUCTO';
}

// ==================== VALIDACIONES ====================
function inicializarValidaciones() {
    document.querySelectorAll('.campo-numerico').forEach(input => validarCampoNumerico(input));
}

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
    input.addEventListener('blur', () => { if (input.value === '') input.value = 0; });
}

function inicializarBotones() {
    document.getElementById('btn-guardar-materia')?.addEventListener('click', guardarProducto);
    document.getElementById('btn-confirmar-mov')?.addEventListener('click', confirmarMovimiento);
}

// ==================== MENÚ HAMBURGUESA ====================
function inicializarMenuHamburguesa() {
    const menuHamburguesa = document.getElementById('menuHamburguesa');
    const menuDesplegable = document.getElementById('menuDesplegable');
    const menuItems = document.querySelectorAll('.menu-item');
    if (menuHamburguesa && menuDesplegable) {
        menuHamburguesa.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDesplegable.classList.toggle('mostrar');
        });
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const seccionId = item.getAttribute('data-seccion');
                if (seccionId === 'entrada') abrirModalMovimiento('ENTRADA');
                else if (seccionId === 'salida') abrirModalMovimiento('SALIDA');
                else if (seccionId === 'crear') abrirModalCrear();
                menuItems.forEach(mi => mi.classList.remove('activo'));
                item.classList.add('activo');
                menuDesplegable.classList.remove('mostrar');
            });
        });
    }
    document.addEventListener('click', (e) => {
        if (menuDesplegable && menuHamburguesa && !menuDesplegable.contains(e.target) && !menuHamburguesa.contains(e.target)) {
            menuDesplegable.classList.remove('mostrar');
        }
    });
}

// ==================== BÚSQUEDA Y PERÍODOS ====================
function inicializarBusqueda() {
    document.getElementById('lupa-busqueda')?.addEventListener('click', abrirModalBusquedaMateria);
}

function inicializarSelectAnios() {
    const selectAnio = document.getElementById('buscar-anio-materia');
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

function abrirModalBusquedaMateria() {
    const modal = document.getElementById('modal-busqueda-materia');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModalBusquedaMateria() {
    const modal = document.getElementById('modal-busqueda-materia');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function buscarHistorialPorMesAnio() {
    const mes = parseInt(document.getElementById('buscar-mes-materia').value);
    const anio = parseInt(document.getElementById('buscar-anio-materia').value);
    cargarHistorial(mes, anio);
    cerrarModalBusquedaMateria();
    mostrarNotificacion(`Filtrando historial de ${getNombreMes(mes)} ${anio}`, 'success');
}

function getNombreMes(mes) {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return meses[mes-1];
}

// ==================== NOTIFICACIONES ====================
function mostrarNotificacion(mensaje, tipo) {
    document.querySelectorAll('.notificacion-venepan').forEach(n => n.remove());
    const notif = document.createElement('div');
    notif.className = 'notificacion-venepan';
    notif.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${mensaje}</span>`;
    notif.style.cssText = `position: fixed; bottom: 30px; right: 30px; padding: 12px 20px; border-radius: 8px; color: white; font-weight: bold; z-index: 99999; display: flex; align-items: center; gap: 10px; background: ${tipo === 'success' ? '#27ae60' : '#e74c3c'}; box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;`;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 500);
    }, 3000);
}