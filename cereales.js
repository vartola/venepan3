let editandoProduccionId = null;
let editandoDespachoId = null;
let mesActualCereales = new Date().getMonth() + 1;
let anioActualCereales = new Date().getFullYear();

const API_URL = 'api.php';

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {

    inicializarBusqueda();
    llenarSelectAniosCereales();
    llenarSelectMesesCereales();
    inicializarMenuHamburguesa();
    inicializarModal();
    inicializarPestanas(); 
    inicializarBotonesGuardar();
    cargarTablasCereales();

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModalFormulario();
            cerrarModalBusquedaCereales();
        }
    });
});

// ==================== CARGA PRINCIPAL ====================
async function cargarTablasCereales() {
    await cargarTablasCerealesPorPeriodo(mesActualCereales, anioActualCereales);
}

async function cargarTablasCerealesPorPeriodo(mes, anio) {
    try {
        const prodResponse = await fetch(`${API_URL}?action=get_cereales_produccion&mes=${mes}&anio=${anio}`);
        const produccion = await prodResponse.json();
        const despResponse = await fetch(`${API_URL}?action=get_cereales_despacho&mes=${mes}&anio=${anio}`);
        const despacho = await despResponse.json();

        // Actualizar tarjetas rojas
        actualizarNotificacionesCereales(produccion, despacho);

        // ----- TABLA DE PRODUCCIÓN: UNA TABLA POR TIPO DE CEREAL -----
        const contenedorProd = document.getElementById('contenedor-produccion');
        if (!contenedorProd) return;

        if (!produccion || produccion.length === 0) {
            contenedorProd.innerHTML = `
                <div class="card" style="text-align:center; padding:50px;">
                    <i class="fas fa-box-open" style="font-size:60px; color:#ccc;"></i>
                    <h3>No hay registros de producción para ${getNombreMes(mes)} ${anio}</h3>
                </div>
            `;
            return;
        }

        // 1. Agrupar por tipo_cereal (manejar valores nulos)
        const grupos = {};
        produccion.forEach(item => {
            let tipo = item.tipo_cereal?.trim();
            if (!tipo) tipo = "SIN CLASIFICAR";
            if (!grupos[tipo]) grupos[tipo] = [];
            grupos[tipo].push(item);
        });

        // 2. Generar HTML: un bloque por cada tipo
        let htmlTotal = '';
        for (const [tipo, registros] of Object.entries(grupos)) {
            // Ordenar por fecha ascendente
            registros.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            // Calcular totales del grupo (igual que antes)
            let totalMedidaBase = 0, totalMedidaJarabe = 0, totalBaseReproceso = 0, totalJarabeReproceso = 0;
            let totalMedidas = 0, totalSobranteSeco = 0, totalSobranteJarabe = 0;
            let totalMezclaProcesada = 0, totalMedidasProcesadas = 0, totalPrimera = 0, totalSegunda = 0;
            let totalDesechoMezcla = 0, totalDesechoMarmita = 0, totalDesechoEmpaque = 0;
            let totalEmpaqueDanado = 0, totalProducido = 0, totalMerma = 0, totalSinDesecho = 0;
            let totalUniTeorica = 0, totalProdTeorica = 0;

            registros.forEach(r => {
                totalMedidaBase += parseFloat(r.medida_base) || 0;
                totalMedidaJarabe += parseFloat(r.medida_jarabe) || 0;
                totalBaseReproceso += parseFloat(r.base_reproceso) || 0;
                totalJarabeReproceso += parseFloat(r.jarabe_reproceso) || 0;
                totalMedidas += parseFloat(r.total_medidas) || 0;
                totalSobranteSeco += parseFloat(r.sobrante_seca) || 0;
                totalSobranteJarabe += parseFloat(r.sobrante_jarabe) || 0;
                totalMezclaProcesada += parseFloat(r.total_mezcla_procesada) || 0;
                totalMedidasProcesadas += parseFloat(r.medidas_procesadas) || 0;
                totalPrimera += parseFloat(r.primera) || 0;
                totalSegunda += parseFloat(r.segunda) || 0;
                totalDesechoMezcla += parseFloat(r.desecho_mezcla) || 0;
                totalDesechoMarmita += parseFloat(r.desecho_marmita) || 0;
                totalDesechoEmpaque += parseFloat(r.desecho_empaque) || 0;
                totalEmpaqueDanado += parseInt(r.empaque_danado) || 0;
                totalProducido += parseFloat(r.total_producido) || 0;
                totalMerma += parseFloat(r.merma) || 0;
                totalSinDesecho += parseFloat(r.total_sin_desecho) || 0;
                totalUniTeorica += parseFloat(r.uni_teorica) || 0;
                totalProdTeorica += parseFloat(r.prod_teorica) || 0;
            });

            // ID único para la tabla (sin espacios)
            const tablaId = `tabla-${tipo.replace(/\s/g, '')}-${mes}-${anio}`;

            htmlTotal += `
                <div class="tabla-producto card" style="background:#fffbe6; margin-bottom:20px; border:1px solid #e6dbac;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#fdf5d0;">
                        <h3 style="color:#856404;">${tipo} – ${getNombreMes(mes)} ${anio}</h3>
                        <button class="btn-expand" onclick="expandirTablaCereal('${tablaId}')" 
                            style="background:#b33939; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                            ⛶ Expandir
                        </button>
                    </div>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; font-size:11px;" id="${tablaId}">
                            <thead style="background:#fdf5d0;">
                                <tr>
                                    <th>Fecha</th><th>Medida Base</th><th>Medida Jarabe</th><th>Base Reproceso</th>
                                    <th>Jarabe Reproceso</th><th>Total Medidas</th><th>Sobrante Seco</th><th>Sobrante Jarabe</th>
                                    <th>Total Mezcla</th><th>Medidas Proc.</th><th>Bobina</th><th>1ra (kg)</th><th>2da (kg)</th>
                                    <th>Desecho Mezcla</th><th>Desecho Marmita</th><th>Desecho Empaque</th><th>Empaque Dañado</th>
                                    <th>Total Producido</th><th>Merma</th><th>Total s/Desecho</th><th>Medida Base En</th>
                                    <th>Medida Jarabe En</th><th>Unid. Teóricas</th><th>Prod. Teórica (%)</th><th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            // Filas de cada registro
            registros.forEach(r => {
                htmlTotal += `
                    <tr>
                        <td>${r.fecha || ''}</td>
                        <td>${parseFloat(r.medida_base || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.medida_jarabe || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.base_reproceso || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.jarabe_reproceso || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.total_medidas || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.sobrante_seca || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.sobrante_jarabe || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.total_mezcla_procesada || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.medidas_procesadas || 0).toFixed(2)}</td>
                        <td>${r.bobina || ''}</td>
                        <td>${parseFloat(r.primera || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.segunda || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.desecho_mezcla || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.desecho_marmita || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.desecho_empaque || 0).toFixed(2)}</td>
                        <td>${r.empaque_danado || 0}</td>
                        <td>${parseFloat(r.total_producido || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.merma || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.total_sin_desecho || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.medida_base_en || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.medida_jarabe_en || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.uni_teorica || 0).toFixed(2)}</td>
                        <td>${parseFloat(r.prod_teorica || 0).toFixed(2)}%</td>
                        <td>
                            <button onclick="editarProduccion(${r.id})" style="color:#3498db; border:none;"><i class="fas fa-edit"></i></button>
                            <button onclick="eliminarProduccion(${r.id})" style="color:red; border:none;"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            });

            // Fila de totales del grupo (similar a panificación)
            htmlTotal += `
                            <tr style="font-weight:bold; background:#fdf5d0;">
                                <td><strong>TOTALES</strong></td>
                                <td>${totalMedidaBase.toFixed(2)}</td>
                                <td>${totalMedidaJarabe.toFixed(2)}</td>
                                <td>${totalBaseReproceso.toFixed(2)}</td>
                                <td>${totalJarabeReproceso.toFixed(2)}</td>
                                <td>${totalMedidas.toFixed(2)}</td>
                                <td>${totalSobranteSeco.toFixed(2)}</td>
                                <td>${totalSobranteJarabe.toFixed(2)}</td>
                                <td>${totalMezclaProcesada.toFixed(2)}</td>
                                <td>${totalMedidasProcesadas.toFixed(2)}</td>
                                <td>-</td>
                                <td>${totalPrimera.toFixed(2)}</td>
                                <td>${totalSegunda.toFixed(2)}</td>
                                <td>${totalDesechoMezcla.toFixed(2)}</td>
                                <td>${totalDesechoMarmita.toFixed(2)}</td>
                                <td>${totalDesechoEmpaque.toFixed(2)}</td>
                                <td>${totalEmpaqueDanado}</td>
                                <td>${totalProducido.toFixed(2)}</td>
                                <td>${totalMerma.toFixed(2)}</td>
                                <td>${totalSinDesecho.toFixed(2)}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>${totalUniTeorica.toFixed(2)}</td>
                                <td>${totalProdTeorica.toFixed(2)}%</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            `;
        }

        contenedorProd.innerHTML = htmlTotal;

        // ----- TABLA DE DESPACHO (sin cambios, se mantiene igual) -----
        const contenedorDesp = document.getElementById('contenedor-despacho');
        if (contenedorDesp) {
            if (!despacho || despacho.length === 0) {
                contenedorDesp.innerHTML = `
                    <div class="card" style="text-align:center; padding:50px;">
                        <i class="fas fa-truck" style="font-size:60px; color:#ccc;"></i>
                        <h3>No hay registros de despacho para ${getNombreMes(mes)} ${anio}</h3>
                    </div>
                `;
            } else {
                // Mantenemos tu código actual de despacho (no lo modificamos)
                let htmlDesp = `
                    <div class="card tabla-producto" style="background:#fffbe6; border:1px solid #a5d6a7;">
                        <div class="card-header" style="background:#fdf5d0;">
                            <h3 style="color:#856404;"><i class="fas fa-clipboard-check"></i> Despacho de Cereales – ${getNombreMes(mes)} ${anio}</h3>
                        </div>
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse; font-size:12px;">
                                <thead style="background:#fdf5d0;">
                                    <tr>
                                        <th>ID</th><th>Lote</th><th>Fecha</th><th>Unid 12</th><th>Unid 8</th><th>Unid Lunch</th>
                                        <th>Bulto 12</th><th>Bulto 8</th><th>Bulto Lunch</th><th>Total kg</th>
                                        <th>2da</th><th>Viruta</th><th>Desecho</th><th>Rend (%)</th><th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                despacho.forEach(item => {
                    htmlDesp += `
                        <tr>
                            <td>${item.id}</td>
                            <td>${item.lote || ''}</td>
                            <td>${item.fecha || ''}</td>
                            <td>${item.u12 || 0}</td>
                            <td>${item.u8 || 0}</td>
                            <td>${item.uL || 0}</td>
                            <td>${item.b12 || 0}</td>
                            <td>${item.b8 || 0}</td>
                            <td>${item.bL || 0}</td>
                            <td>${parseFloat(item.kg || 0).toFixed(2)}</td>
                            <td>${item.u2da || 0}</td>
                            <td>${item.viruta || 0}</td>
                            <td>${item.desecho || 0}</td>
                            <td>${parseFloat(item.rend || 0).toFixed(2)}%</td>
                            <td>
                                <button onclick="editarDespacho(${item.id})" style="color:#3498db; border:none;"><i class="fas fa-edit"></i></button>
                                <button onclick="eliminarDespacho(${item.id})" style="color:red; border:none;"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `;
                });
                htmlDesp += `
                                </tbody>
                                <tfoot style="background:#fdf5d0;">
                                    <tr style="font-weight:bold;">
                                        <td colspan="2">TOTALES</td>
                                        <td>-</td>
                                        <td>${despacho.reduce((s,i)=>s+(i.u12||0),0)}</td>
                                        <td>${despacho.reduce((s,i)=>s+(i.u8||0),0)}</td>
                                        <td>${despacho.reduce((s,i)=>s+(i.uL||0),0)}</td>
                                        <td>${despacho.reduce((s,i)=>s+(i.b12||0),0)}</td>
                                        <td>${despacho.reduce((s,i)=>s+(i.b8||0),0)}</td>
                                        <td>${despacho.reduce((s,i)=>s+(i.bL||0),0)}</td>
                                        <td>${despacho.reduce((s,i)=>s+(parseFloat(i.kg)||0),0).toFixed(2)}</td>
                                        <td>${despacho.reduce((s,i)=>s+(i.u2da||0),0)}</td>
                                        <td>${despacho.reduce((s,i)=>s+(i.viruta||0),0)}</td>
                                        <td>${despacho.reduce((s,i)=>s+(i.desecho||0),0)}</td>
                                        <td>${(despacho.reduce((s,i)=>s+(parseFloat(i.rend)||0),0)/despacho.length).toFixed(2)}%</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                `;
                contenedorDesp.innerHTML = htmlDesp;
            }
        }

    } catch (error) {
        console.error('Error al cargar datos de cereales:', error);
        mostrarNotificacion('Error al conectar con la base de datos', 'error');
    }
}

// ==================== CRUD PRODUCCIÓN ====================
window.guardarProduccion = async function() {
    const tipoCereal = document.getElementById('tipo-cereal')?.value;
    const fecha = document.getElementById('fecha-produccion')?.value;

    if (!tipoCereal || !fecha) {
        mostrarNotificacion('⚠️ Complete el Tipo de Cereal y la Fecha', 'error');
        return;
    }

    const registro = {
        id: editandoProduccionId || null,
        tipo_cereal: tipoCereal,
        fecha: fecha,
        medida_base: parseFloat(document.getElementById('medida-base')?.value) || 0,
        medida_jarabe: parseFloat(document.getElementById('medida-jarabe')?.value) || 0,
        base_reproceso: parseFloat(document.getElementById('base-reproceso')?.value) || 0,
        jarabe_reproceso: parseFloat(document.getElementById('jarabe-reproceso')?.value) || 0,
        total_medidas: parseFloat(document.getElementById('total-medidas')?.value) || 0,
        sobrante_seca: parseFloat(document.getElementById('sobrante-seca')?.value) || 0,
        sobrante_jarabe: parseFloat(document.getElementById('sobrante-jarabe')?.value) || 0,
        total_mezcla_procesada: parseFloat(document.getElementById('total-mezcla-procesada')?.value) || 0,
        medidas_procesadas: parseFloat(document.getElementById('medidas-procesadas')?.value) || 0,
        bobina: document.getElementById('bobina-entregada')?.value || '',
        primera: parseFloat(document.getElementById('prod-1ra')?.value) || 0,
        segunda: parseFloat(document.getElementById('prod-2da')?.value) || 0,
        desecho_mezcla: parseFloat(document.getElementById('desecho-mezcla')?.value) || 0,
        desecho_marmita: parseFloat(document.getElementById('desecho-marmita')?.value) || 0,
        desecho_empaque: parseFloat(document.getElementById('desecho-empaque')?.value) || 0,
        empaque_danado: parseInt(document.getElementById('empaque-danado')?.value) || 0,
        total_producido: parseFloat(document.getElementById('total-producido')?.value) || 0,
        merma: parseFloat(document.getElementById('merma')?.value) || 0,
        total_sin_desecho: parseFloat(document.getElementById('total-sin-desecho')?.value) || 0,
        medida_base_en: parseFloat(document.getElementById('medida-base-en')?.value) || 0,
        medida_jarabe_en: parseFloat(document.getElementById('medida-jarabe-en')?.value) || 0,
        uni_teorica: parseFloat(document.getElementById('unidad-teorica')?.value) || 0,
        prod_teorica: parseFloat(document.getElementById('prod-teorica')?.value) || 0
    };

    try {
        const response = await fetch(`${API_URL}?action=save_cereales_produccion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registro)
        });
        const result = await response.json();
        if (result.success) {
            mostrarNotificacion(result.message || 'Producción guardada correctamente', 'exito');
            editandoProduccionId = null;
            await cargarTablasCereales();
            cerrarModalFormulario();
        } else {
            mostrarNotificacion(result.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión con el servidor', 'error');
    }
};

window.eliminarProduccion = async function(id) {
    if (!confirm('¿Está seguro de eliminar este registro de producción?')) return;
    try {
        const response = await fetch(`${API_URL}?action=delete_cereales_produccion`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await response.json();
        if (result.success) {
            mostrarNotificacion('Producción eliminada correctamente', 'exito');
            await cargarTablasCereales();
        } else {
            mostrarNotificacion('Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
};

window.editarProduccion = async function(id) {
    editandoProduccionId = id;
    try {
        const response = await fetch(`${API_URL}?action=get_cereales_produccion_by_id&id=${id}`);
        const item = await response.json();
        if (item && !item.error && item.id) {
            abrirModalFormulario('produccion');
            setTimeout(() => {
                document.getElementById('tipo-cereal').value = item.tipo_cereal || '';
                document.getElementById('fecha-produccion').value = item.fecha || '';
                document.getElementById('medida-base').value = item.medida_base || 0;
                document.getElementById('medida-jarabe').value = item.medida_jarabe || 0;
                document.getElementById('base-reproceso').value = item.base_reproceso || 0;
                document.getElementById('jarabe-reproceso').value = item.jarabe_reproceso || 0;
                document.getElementById('sobrante-seca').value = item.sobrante_seca || 0;
                document.getElementById('sobrante-jarabe').value = item.sobrante_jarabe || 0;
                document.getElementById('medidas-procesadas').value = item.medidas_procesadas || 0;
                document.getElementById('bobina-entregada').value = item.bobina || '';
                document.getElementById('prod-1ra').value = item.primera || 0;
                document.getElementById('prod-2da').value = item.segunda || 0;
                document.getElementById('desecho-mezcla').value = item.desecho_mezcla || 0;
                document.getElementById('desecho-marmita').value = item.desecho_marmita || 0;
                document.getElementById('desecho-empaque').value = item.desecho_empaque || 0;
                document.getElementById('empaque-danado').value = item.empaque_danado || 0;
                document.getElementById('medida-base-en').value = item.medida_base_en || 0;
                document.getElementById('medida-jarabe-en').value = item.medida_jarabe_en || 0;
                document.getElementById('unidad-teorica').value = item.uni_teorica || 0;
                calcularTotalesCereales();
                const btnGuardar = document.getElementById('btn-guardar-cereal');
                if (btnGuardar) btnGuardar.innerHTML = '<i class="fas fa-sync"></i> ACTUALIZAR PRODUCCIÓN';
            }, 100);
        } else {
            mostrarNotificacion('Error al cargar los datos del registro', 'error');
        }
    } catch (error) {
        console.error('Error en editarProduccion:', error);
        mostrarNotificacion('Error de conexión al cargar el registro', 'error');
    }
};

// ==================== CRUD DESPACHO ====================
window.guardarDespacho = async function() {
    const lote = document.getElementById('desp-lote')?.value;
    const fecha = document.getElementById('fecha-despacho')?.value;
    if (!lote || !fecha) {
        mostrarNotificacion('⚠️ Complete el Lote y la Fecha de despacho', 'error');
        return;
    }
    const registro = {
        id: editandoDespachoId || null,
        lote: lote,
        fecha: fecha,
        u12: parseInt(document.getElementById('u12')?.value) || 0,
        u8: parseInt(document.getElementById('u8')?.value) || 0,
        uL: parseInt(document.getElementById('uLunch')?.value) || 0,
        b12: parseInt(document.getElementById('b12')?.value) || 0,
        b8: parseInt(document.getElementById('b8')?.value) || 0,
        bL: parseInt(document.getElementById('bLunch')?.value) || 0,
        kg: parseFloat(document.getElementById('desp-kg')?.value) || 0,
        u2da: parseInt(document.getElementById('u2da')?.value) || 0,
        viruta: parseInt(document.getElementById('uViruta')?.value) || 0,
        desecho: parseInt(document.getElementById('uDesecho')?.value) || 0,
        rend: parseFloat(document.getElementById('pReal')?.value) || 0
    };
    try {
        const response = await fetch(`${API_URL}?action=save_cereales_despacho`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registro)
        });
        const result = await response.json();
        if (result.success) {
            mostrarNotificacion(result.message || 'Despacho guardado', 'exito');
            editandoDespachoId = null;
            await cargarTablasCereales();
            cerrarModalFormulario();
        } else {
            mostrarNotificacion(result.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
};

window.eliminarDespacho = async function(id) {
    if (!confirm('¿Está seguro de eliminar este registro de despacho?')) return;
    try {
        const response = await fetch(`${API_URL}?action=delete_cereales_despacho`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await response.json();
        if (result.success) {
            mostrarNotificacion('Despacho eliminado correctamente', 'exito');
            await cargarTablasCereales();
        } else {
            mostrarNotificacion('Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
};

window.editarDespacho = async function(id) {
    editandoDespachoId = id;
    try {
        const response = await fetch(`${API_URL}?action=get_cereales_despacho_by_id&id=${id}`);
        const item = await response.json();
        if (item && !item.error && item.id) {
            abrirModalFormulario('despacho');
            setTimeout(() => {
                document.getElementById('desp-lote').value = item.lote || '';
                document.getElementById('fecha-despacho').value = item.fecha || '';
                document.getElementById('u12').value = item.u12 || 0;
                document.getElementById('u8').value = item.u8 || 0;
                document.getElementById('uLunch').value = item.uL || 0;
                document.getElementById('b12').value = item.b12 || 0;
                document.getElementById('b8').value = item.b8 || 0;
                document.getElementById('bLunch').value = item.bL || 0;
                document.getElementById('desp-kg').value = item.kg || 0;
                document.getElementById('u2da').value = item.u2da || 0;
                document.getElementById('uViruta').value = item.viruta || 0;
                document.getElementById('uDesecho').value = item.desecho || 0;
                document.getElementById('pReal').value = item.rend || 0;
                const btnGuardar = document.getElementById('btn-guardar-despacho');
                if (btnGuardar) btnGuardar.innerHTML = '<i class="fas fa-sync"></i> ACTUALIZAR DESPACHO';
            }, 100);
        } else {
            mostrarNotificacion('Registro no encontrado', 'error');
        }
    } catch (error) {
        console.error('Error en editarDespacho:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
};

// ==================== FUNCIONES DE APOYO (MODALES, CÁLCULOS, ETC) ====================
function validarNumeroPositivo(input) {
    if (input.value < 0) {
        input.value = 0;
        mostrarNotificacion("No se permiten números negativos", "error");
    }
}

function validarCampoNumerico(input) {
    input.addEventListener('keydown', function(e) {
        if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
    });
    input.addEventListener('input', function() { validarNumeroPositivo(this); });
    input.addEventListener('blur', function() { if (this.value === '' || this.value === null) this.value = 0; });
}

function inicializarModal() {
    const btnCerrar = document.getElementById('btn-cerrar-form');
    const formOverlay = document.getElementById('form-overlay');
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalFormulario);
    if (formOverlay) formOverlay.addEventListener('click', cerrarModalFormulario);
}

function inicializarPestanas() {
    const tabProd = document.getElementById('tab-produccion-btn');
    const tabDesp = document.getElementById('tab-despacho-btn');
    const contProd = document.getElementById('contenedor-produccion');
    const contDesp = document.getElementById('contenedor-despacho');
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

function abrirModalFormulario(tipo) {
    const overlay = document.getElementById('form-overlay');
    const modal = document.getElementById('form-contenedor');
    const titulo = document.getElementById('titulo-formulario');
    const formBody = document.getElementById('form-body-cereales');
    if (!overlay || !modal || !titulo || !formBody) return;
    formBody.innerHTML = '';
    if (tipo === 'produccion') {
        titulo.innerHTML = '<i class="fas fa-industry"></i> Registro de Producción';
        formBody.innerHTML = obtenerHTMLFormularioProduccion();
        setTimeout(() => asignarEventosCalculo(), 100);
    } else if (tipo === 'despacho') {
        titulo.innerHTML = '<i class="fas fa-truck-loading"></i> Entrega a Despacho';
        formBody.innerHTML = obtenerHTMLFormularioDespacho();
        setTimeout(() => {
            const camposDespacho = document.querySelectorAll('.campo-numerico-despacho');
            camposDespacho.forEach(input => validarCampoNumerico(input));
        }, 100);
    }
    overlay.classList.add('activo');
    modal.classList.add('activo');
}

function cerrarModalFormulario() {
    const overlay = document.getElementById('form-overlay');
    const modal = document.getElementById('form-contenedor');
    if (overlay) overlay.classList.remove('activo');
    if (modal) modal.classList.remove('activo');
    editandoProduccionId = null;
    editandoDespachoId = null;
}

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
            const seccionId = item.getAttribute('data-seccion');
            abrirModalFormulario(seccionId);
            menuItems.forEach(mi => mi.classList.remove('activo'));
            item.classList.add('activo');
            menuDesplegable.classList.remove('mostrar');
        });
    });
    document.addEventListener('click', (e) => {
        if (!menuDesplegable.contains(e.target) && !menuHamburguesa.contains(e.target)) {
            menuDesplegable.classList.remove('mostrar');
        }
    });
}

function inicializarBusqueda() {
    const lupa = document.getElementById('lupa-busqueda');
    if (lupa) lupa.addEventListener('click', abrirModalBusquedaCereales);
}

function llenarSelectAniosCereales() {
    const selectAnio = document.getElementById('buscar-anio-cereales');
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

function abrirModalBusquedaCereales() {
    const modal = document.getElementById('modal-busqueda-cereales');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        const hoy = new Date();
        document.getElementById('buscar-mes-cereales').value = hoy.getMonth() + 1;
        document.getElementById('buscar-anio-cereales').value = hoy.getFullYear();
    }
}
// ==================== LLENAR SELECT DE MESES ====================
function llenarSelectMesesCereales() {
    const selectMes = document.getElementById('buscar-mes-cereales');
    if (!selectMes) return;
    
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    
    selectMes.innerHTML = '';
    meses.forEach((nombre, index) => {
        const option = document.createElement('option');
        option.value = index + 1;  // 1 = Enero, 2 = Febrero, etc.
        option.textContent = nombre;
        if (index + 1 === new Date().getMonth() + 1) {
            option.selected = true;  // selecciona el mes actual por defecto
        }
        selectMes.appendChild(option);
    });
}

function cerrarModalBusquedaCereales() {
    const modal = document.getElementById('modal-busqueda-cereales');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function buscarPorMesAnioCereales() {
    const mes = parseInt(document.getElementById('buscar-mes-cereales').value);
    const anio = parseInt(document.getElementById('buscar-anio-cereales').value);
    mesActualCereales = mes;
    anioActualCereales = anio;
    cargarTablasCerealesPorPeriodo(mes, anio);
    cerrarModalBusquedaCereales();
    mostrarNotificacion(`Mostrando datos de ${getNombreMes(mes)} ${anio}`, 'exito');
}

function getNombreMes(mes) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1];
}

function inicializarBotonesGuardar() {
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'btn-guardar-cereal') {
            e.preventDefault();
            e.stopPropagation();
            guardarProduccion();
        }
        if (e.target && e.target.id === 'btn-guardar-despacho') {
            e.preventDefault();
            e.stopPropagation();
            guardarDespacho();
        }
    });
}

function obtenerHTMLFormularioProduccion() {
    return `
        <div class="grid-form">
            <div class="input-group" style="grid-column: span 2;">
                <label class="campo-obligatorio">Tipo de Cereal</label>
                <select id="tipo-cereal">
                    <option value="">Seleccione un cereal...</option>
                    <option value="CHOCO BOLITAS">CHOCO BOLITAS</option>
                    <option value="CHOKO CHISPYS">CHOKO CHISPYS</option>
                    <option value="AROS FRUTADOS">AROS FRUTADOS</option>
                    <option value="AROS MIEL">AROS MIEL</option>
                </select>
            </div>
            <div class="input-group">
                <label class="campo-obligatorio">Fecha de producción</label>
                <input type="date" id="fecha-produccion">
            </div>
            <div class="input-group">
                <label>Medida base (kg)</label>
                <input type="number" id="medida-base" step="0.01" class="calculo-produccion">
            </div>
            <div class="input-group">
                <label>Medida Jarabe (kg)</label>
                <input type="number" id="medida-jarabe" step="0.01" class="calculo-produccion">
            </div>
            <div class="input-group">
                <label>Base Reproceso (kg)</label>
                <input type="number" id="base-reproceso" step="0.01">
            </div>
            <div class="input-group">
                <label>Jarabe Reproceso (kg)</label>
                <input type="number" id="jarabe-reproceso" step="0.01">
            </div>
            <div class="input-group" style="grid-column: span 2;">
                <label>Total medidas (kg)</label>
                <input type="number" id="total-medidas" step="0.01" readonly class="readonly-input">
            </div>
            <div class="input-group">
                <label>Sobrante Seco (kg)</label>
                <input type="number" id="sobrante-seca" step="0.01" class="calculo-produccion">
            </div>
            <div class="input-group">
                <label>Sobrante Jarabe (kg)</label>
                <input type="number" id="sobrante-jarabe" step="0.01" class="calculo-produccion">
            </div>
            <div class="input-group" style="grid-column: span 2;">
                <label>Total mezcla procesada (kg)</label>
                <input type="number" id="total-mezcla-procesada" step="0.01" readonly class="readonly-input">
            </div>
            <div class="input-group" style="grid-column: span 2;">
                <label>Medidas procesadas (kg)</label>
                <input type="number" id="medidas-procesadas" step="0.01">
            </div>
            <div class="input-group" style="grid-column: span 2;">
                <label>Bobina Entregada</label>
                <input type="text" id="bobina-entregada" placeholder="N° bobina">
            </div>
            <div class="input-group">
                <label>Producción 1ra (kg)</label>
                <input type="number" id="prod-1ra" step="0.01" class="calculo-produccion">
            </div>
            <div class="input-group">
                <label>Producción 2da (kg)</label>
                <input type="number" id="prod-2da" step="0.01" class="calculo-produccion">
            </div>
            <div class="input-group">
                <label>Desecho mezcla (kg)</label>
                <input type="number" id="desecho-mezcla" step="0.01" class="calculo-produccion">
            </div>
            <div class="input-group">
                <label>Desecho marmita (kg)</label>
                <input type="number" id="desecho-marmita" step="0.01" class="calculo-produccion">
            </div>
            <div class="input-group">
                <label>Desecho Empaque (kg)</label>
                <input type="number" id="desecho-empaque" step="0.01" class="calculo-produccion">
            </div>
            <div class="input-group">
                <label>Empaque dañado (uds)</label>
                <input type="number" id="empaque-danado">
            </div>
            <div class="input-group">
                <label>Total producido (kg)</label>
                <input type="number" id="total-producido" step="0.01" readonly class="readonly-input">
            </div>
            <div class="input-group">
                <label>Merma (kg)</label>
                <input type="number" id="merma" step="0.01" readonly class="readonly-input">
            </div>
            <div class="input-group">
                <label>Total prod. s/Desecho (kg)</label>
                <input type="number" id="total-sin-desecho" step="0.01" readonly class="readonly-input">
            </div>
            <div class="input-group">
                <label>Medida Base en (kg)</label>
                <input type="number" id="medida-base-en" step="0.01">
            </div>
            <div class="input-group">
                <label>Medida Jarabe en (kg)</label>
                <input type="number" id="medida-jarabe-en" step="0.01">
            </div>
            <div class="input-group">
                <label>Unidades Teóricas</label>
                <input type="number" id="unidad-teorica" class="calculo-produccion">
            </div>
            <div class="input-group">
                <label>Productividad Teórica (%)</label>
                <input type="number" id="prod-teorica" step="0.1" readonly class="readonly-input">
            </div>
        </div>
        <button id="btn-guardar-cereal" class="btn-primary">
            <i class="fas fa-save"></i> GUARDAR PRODUCCIÓN
        </button>
    `;
}

function obtenerHTMLFormularioDespacho() {
    return `
        <div class="grid-form">
            <div class="input-group" style="grid-column: span 2;">
                <label class="campo-obligatorio">Cereal / Lote</label>
                <input type="text" id="desp-lote" placeholder="Ej: Lote-001">
            </div>
            <div class="input-group" style="grid-column: span 2;">
                <label class="campo-obligatorio">Fecha de Despacho</label>
                <input type="date" id="fecha-despacho">
            </div>
            <div class="input-group"><label>Unid. 12</label><input type="number" id="u12" class="campo-numerico-despacho"></div>
            <div class="input-group"><label>Unid. 8</label><input type="number" id="u8" class="campo-numerico-despacho"></div>
            <div class="input-group"><label>Unid. Lunch</label><input type="number" id="uLunch" class="campo-numerico-despacho"></div>
            <div class="input-group"><label>Bulto 12</label><input type="number" id="b12" class="campo-numerico-despacho"></div>
            <div class="input-group"><label>Bulto 8</label><input type="number" id="b8" class="campo-numerico-despacho"></div>
            <div class="input-group"><label>Bulto Lunch</label><input type="number" id="bLunch" class="campo-numerico-despacho"></div>
            <div class="input-group"><label>Total Kg</label><input type="number" id="desp-kg" step="0.01" class="campo-numerico-despacho"></div>
            <div class="input-group"><label>Unid. 2da</label><input type="number" id="u2da" class="campo-numerico-despacho"></div>
            <div class="input-group"><label>Virutas</label><input type="number" id="uViruta" class="campo-numerico-despacho"></div>
            <div class="input-group"><label>Desecho</label><input type="number" id="uDesecho" class="campo-numerico-despacho"></div>
            <div class="input-group"><label>Prod. Real (%)</label><input type="number" id="pReal" step="0.01" class="campo-numerico-despacho"></div>
        </div>
        <button id="btn-guardar-despacho" class="btn-primary">
            <i class="fas fa-shipping-fast"></i> GUARDAR DESPACHO
        </button>
    `;
}

function asignarEventosCalculo() {
    const inputsCalculo = document.querySelectorAll('.calculo-produccion');
    inputsCalculo.forEach(input => {
        input.removeEventListener('input', calcularTotalesCereales);
        input.addEventListener('input', calcularTotalesCereales);
        validarCampoNumerico(input);
    });
    const otrosNumericos = document.querySelectorAll('#medidas-procesadas, #empaque-danado, #medida-base-en, #medida-jarabe-en');
    otrosNumericos.forEach(input => validarCampoNumerico(input));
}

function calcularTotalesCereales() {
    const medidaBase = parseFloat(document.getElementById('medida-base')?.value) || 0;
    const medidaJarabe = parseFloat(document.getElementById('medida-jarabe')?.value) || 0;
    const sobranteSeca = parseFloat(document.getElementById('sobrante-seca')?.value) || 0;
    const sobranteJarabe = parseFloat(document.getElementById('sobrante-jarabe')?.value) || 0;
    const prod1ra = parseFloat(document.getElementById('prod-1ra')?.value) || 0;
    const prod2da = parseFloat(document.getElementById('prod-2da')?.value) || 0;
    const desechoMezcla = parseFloat(document.getElementById('desecho-mezcla')?.value) || 0;
    const desechoMarmita = parseFloat(document.getElementById('desecho-marmita')?.value) || 0;
    const desechoEmpaque = parseFloat(document.getElementById('desecho-empaque')?.value) || 0;
    const unidadTeorica = parseFloat(document.getElementById('unidad-teorica')?.value) || 0;

    const totalMedidas = medidaBase + medidaJarabe;
    const totalMedidasEl = document.getElementById('total-medidas');
    if (totalMedidasEl) totalMedidasEl.value = totalMedidas.toFixed(2);

    const totalMezclaProcesada = totalMedidas - (sobranteSeca + sobranteJarabe);
    const mezclaProcEl = document.getElementById('total-mezcla-procesada');
    if (mezclaProcEl) mezclaProcEl.value = totalMezclaProcesada.toFixed(2);

    const totalProducido = prod1ra + prod2da + desechoMezcla + desechoMarmita + desechoEmpaque;
    const totalProdEl = document.getElementById('total-producido');
    if (totalProdEl) totalProdEl.value = totalProducido.toFixed(2);

    const totalSinDesecho = prod1ra + prod2da;
    const totalSinDesechoEl = document.getElementById('total-sin-desecho');
    if (totalSinDesechoEl) totalSinDesechoEl.value = totalSinDesecho.toFixed(2);

    const merma = totalMezclaProcesada - totalProducido;
    const mermaEl = document.getElementById('merma');
    if (mermaEl) mermaEl.value = merma.toFixed(2);

    const prodTeoricaEl = document.getElementById('prod-teorica');
    if (prodTeoricaEl) {
        if (totalProducido > 0 && unidadTeorica > 0) {
            const productividad = (unidadTeorica / totalProducido) * 100;
            prodTeoricaEl.value = productividad.toFixed(2);
        } else {
            prodTeoricaEl.value = "0";
        }
    }
}

function expandirTablaCereal(idTabla) {
    const tabla = document.getElementById(idTabla);
    const modal = document.getElementById('modal-tabla');
    if (!modal) {
        console.warn('Modal no encontrado');
        return;
    }
    const contenido = document.getElementById('contenido-modal-tabla');
    if (!tabla || !contenido) return;
    const clon = tabla.cloneNode(true);
    const btn = clon.querySelector('.btn-expand');
    if (btn) btn.remove();
    contenido.innerHTML = '';
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

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.innerHTML = `<i class="fas ${tipo === 'exito' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${mensaje}</span>`;
    notificacion.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 25px;
        background: ${tipo === 'exito' ? '#4CAF50' : '#f44336'}; color: white;
        border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001; animation: slideIn 0.3s ease; display: flex; align-items: center; gap: 10px;
    `;
    document.body.appendChild(notificacion);
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => { if (document.body.contains(notificacion)) document.body.removeChild(notificacion); }, 300);
    }, 3000);
}

function actualizarNotificacionesCereales(produccion, despacho) {
    let totalKg = 0;
    if (produccion && produccion.length) {
        totalKg = produccion.reduce((sum, item) => sum + (parseFloat(item.total_producido) || 0), 0);
    }
    document.getElementById('total-produccion-mes').innerText = totalKg.toFixed(2);

    let rendProm = 0;
    if (despacho && despacho.length) {
        const sumaRend = despacho.reduce((sum, item) => sum + (parseFloat(item.rend) || 0), 0);
        rendProm = sumaRend / despacho.length;
    }
    document.getElementById('rendimiento-promedio-pan').innerText = rendProm.toFixed(2) + '%';

    let totalUnidades = 0;
    if (despacho && despacho.length) {
        totalUnidades = despacho.reduce((sum, item) => sum + (parseInt(item.u12) || 0) + (parseInt(item.u8) || 0) + (parseInt(item.uL) || 0), 0);
    }
    document.getElementById('total-panes-producidos').innerText = totalUnidades;
}

// Exponer funciones globales necesarias
window.expandirTablaCereal = expandirTablaCereal;
window.cerrarModalTabla = cerrarModalTabla;
window.buscarPorMesAnioCereales = buscarPorMesAnioCereales;
window.cerrarModalBusquedaCereales = cerrarModalBusquedaCereales;
window.editarProduccion = editarProduccion;
window.eliminarProduccion = eliminarProduccion;
window.editarDespacho = editarDespacho;
window.eliminarDespacho = eliminarDespacho;