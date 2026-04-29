const API_URL = 'api.php';
let tendenciaChart = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarEstadisticas();
    cargarActividadReciente();
    cargarAlertasStock();
    cargarAlertasMedicas();
    cargarResumenContadores();
    cargarTendenciaPan();
    mostrarFecha();
});

// Fecha actual en el top-bar (opcional)
function mostrarFecha() {
    const hoy = new Date();
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    const fechaSpan = document.getElementById('fecha-actual-icon');
    if (fechaSpan) fechaSpan.title = hoy.toLocaleDateString('es-ES', opciones);
}

// Tarjetas KPI usando get_stats
async function cargarEstadisticas() {
    try {
        const resp = await fetch(`${API_URL}?action=get_stats`);
        const stats = await resp.json();
        document.getElementById('total-produccion-mes').innerText = (stats.produccion_mes || 0).toFixed(2);
        document.getElementById('total-empleados').innerText = stats.total_empleados || 0;
        document.getElementById('stock-bajo').innerText = stats.bajo_stock || 0;
        document.getElementById('total-productos').innerText = stats.total_productos || 0;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Últimos 10 registros combinados (pan, cereales, soya) del mes actual
async function cargarActividadReciente() {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();
    try {
        const [pan, cereales, soya] = await Promise.all([
            fetch(`${API_URL}?action=get_panaderia&mes=${mes}&anio=${anio}`).then(r => r.json()),
            fetch(`${API_URL}?action=get_cereales_produccion&mes=${mes}&anio=${anio}`).then(r => r.json()),
            fetch(`${API_URL}?action=get_soya_produccion&mes=${mes}&anio=${anio}`).then(r => r.json())
        ]);

        let items = [];

        if (Array.isArray(pan)) {
            pan.forEach(p => {
                items.push({
                    fecha: p.fecha,
                    descripcion: obtenerNombreProducto(p.id_producto),
                    cantidad: parseFloat(p.medidas) || 0,
                    unidad: 'kg',
                    modulo: 'Panificación'
                });
            });
        }
        if (Array.isArray(cereales)) {
            cereales.forEach(c => {
                items.push({
                    fecha: c.fecha,
                    descripcion: c.tipo_cereal || 'Cereal',
                    cantidad: parseFloat(c.total_producido) || 0,
                    unidad: 'kg',
                    modulo: 'Cereales'
                });
            });
        }
        if (Array.isArray(soya)) {
            soya.forEach(s => {
                items.push({
                    fecha: s.fecha,
                    descripcion: `Lote ${s.lote || 'N/A'} (${obtenerNombreSoya(s.id_producto)})`,
                    cantidad: parseFloat(s.total_producido) || 0,
                    unidad: 'kg',
                    modulo: 'Soya'
                });
            });
        }

        items.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
        const ultimos = items.slice(0, 10);
        const tbody = document.getElementById('tabla-actividad-reciente');
        if (!ultimos.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay registros este mes</td></tr>';
            return;
        }
        tbody.innerHTML = ultimos.map(item => `
            <tr style="border-bottom:1px solid #e6dbac;">
                <td style="padding:8px;">${formatearFecha(item.fecha)}</td>
                <td style="padding:8px;"><strong>${item.descripcion}</strong></td>
                <td style="padding:8px;">${item.cantidad.toFixed(2)} ${item.unidad}</td>
                <td style="padding:8px;"><span style="background:#fdf5d0; padding:2px 8px; border-radius:12px;">${item.modulo}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error(error);
        document.getElementById('tabla-actividad-reciente').innerHTML = '<tr><td colspan="4">Error al cargar actividad</td></tr>';
    }
}

// Materia prima con stock < 10 kg
async function cargarAlertasStock() {
    try {
        const resp = await fetch(`${API_URL}?action=get_inventario_materia&tipo=materia_prima`);
        const inventario = await resp.json();
        const bajos = inventario.filter(item => parseFloat(item.cantidad_disponible) < 10 && parseFloat(item.cantidad_disponible) > 0);
        const sinStock = inventario.filter(item => parseFloat(item.cantidad_disponible) <= 0);
        const tbody = document.getElementById('lista-bajo-stock');
        if (!bajos.length && !sinStock.length) {
            tbody.innerHTML = '<tr><td style="text-align:center;">Todos los insumos con stock suficiente</td></tr>';
            return;
        }
        let html = '';
        bajos.slice(0, 6).forEach(lote => {
            html += `<tr><td style="padding:6px;"><i class="fas fa-exclamation-triangle" style="color:#f39c12;"></i> <strong>${lote.producto}</strong> - ${parseFloat(lote.cantidad_disponible).toFixed(2)} kg (bajo)</td></tr>`;
        });
        if (sinStock.length) {
            html += `<tr><td style="padding:6px;"><i class="fas fa-times-circle" style="color:#e74c3c;"></i> Sin stock: ${sinStock.map(s => s.producto).slice(0,3).join(', ')}${sinStock.length > 3 ? ' ...' : ''}</td></tr>`;
        }
        tbody.innerHTML = html;
    } catch (error) {
        console.error(error);
        document.getElementById('lista-bajo-stock').innerHTML = '<tr><td>Error al cargar inventario</td></tr>';
    }
}

// Empleados con condiciones médicas o alergias
async function cargarAlertasMedicas() {
    try {
        const resp = await fetch(`${API_URL}?action=get_empleados`);
        const empleados = await resp.json();
        const alertas = empleados.filter(emp => {
            const tieneEnf = emp.condicion_medica && emp.condicion_medica.toLowerCase() !== 'ninguna' && emp.condicion_medica.trim() !== '';
            const tieneAlg = emp.alergias && emp.alergias.toLowerCase() !== 'ninguna' && emp.alergias.trim() !== '';
            return tieneEnf || tieneAlg;
        });
        const tbody = document.getElementById('lista-alertas-medicas');
        if (!alertas.length) {
            tbody.innerHTML = '<tr><td style="text-align:center;">No hay condiciones médicas registradas</td></tr>';
            return;
        }
        const items = alertas.slice(0, 5).map(emp => {
            let motivo = [];
            if (emp.condicion_medica && emp.condicion_medica !== 'Ninguna') motivo.push(emp.condicion_medica);
            if (emp.alergias && emp.alergias !== 'Ninguna') motivo.push(`Alergia: ${emp.alergias}`);
            return `<tr><td style="padding:6px;"><i class="fas fa-notes-medical"></i> <strong>${emp.nombre} ${emp.apellido}</strong><br><small style="color:#b33939;">${motivo.join(', ')}</small></td></tr>`;
        }).join('');
        tbody.innerHTML = items;
        if (alertas.length > 5) tbody.innerHTML += `<tr><td style="padding:6px;"><i class="fas fa-ellipsis-h"></i> +${alertas.length-5} empleado(s) más</td></tr>`;
    } catch (error) {
        console.error(error);
        document.getElementById('lista-alertas-medicas').innerHTML = '<tr><td>Error al cargar personal</td></tr>';
    }
}

// Contadores por módulo (solo cantidad de registros del mes actual)
async function cargarResumenContadores() {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();
    try {
        const [pan, cereales, soya] = await Promise.all([
            fetch(`${API_URL}?action=get_panaderia&mes=${mes}&anio=${anio}`).then(r => r.json()),
            fetch(`${API_URL}?action=get_cereales_produccion&mes=${mes}&anio=${anio}`).then(r => r.json()),
            fetch(`${API_URL}?action=get_soya_produccion&mes=${mes}&anio=${anio}`).then(r => r.json())
        ]);
        document.getElementById('res-pan-count').innerText = (pan && pan.length) || 0;
        document.getElementById('res-cereal-count').innerText = (cereales && cereales.length) || 0;
        document.getElementById('res-soya-count').innerText = (soya && soya.length) || 0;
    } catch(e) { console.warn(e); }
}

// Gráfico de tendencia (panadería últimos 7 días)
async function cargarTendenciaPan() {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();
    try {
        const dataPan = await fetch(`${API_URL}?action=get_panaderia&mes=${mes}&anio=${anio}`).then(r => r.json());
        if (!Array.isArray(dataPan)) return;

        const ultimos7 = [];
        for (let i = 6; i >= 0; i--) {
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() - i);
            const yyyy = fecha.getFullYear();
            const mm = String(fecha.getMonth() + 1).padStart(2,'0');
            const dd = String(fecha.getDate()).padStart(2,'0');
            ultimos7.push(`${yyyy}-${mm}-${dd}`);
        }

        const kgPorDia = ultimos7.map(dia => {
            const produccionDia = dataPan.filter(p => p.fecha === dia);
            let totalKg = 0;
            produccionDia.forEach(p => {
                const unidades = parseInt(p.unidades) || 0;
                const peso = obtenerPesoPorProducto(p.id_producto);
                totalKg += (unidades * peso) / 1000;
            });
            return totalKg;
        });

        const ctx = document.getElementById('tendenciaChart').getContext('2d');
        if (tendenciaChart) tendenciaChart.destroy();
        tendenciaChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ultimos7.map(d => d.slice(5)),
                datasets: [{
                    label: 'Producción (kg)',
                    data: kgPorDia,
                    borderColor: '#b33939',
                    backgroundColor: 'rgba(179, 57, 57, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#b33939'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Kilogramos' } } }
            }
        });
    } catch (error) {
        console.error('Error en gráfico tendencia:', error);
    }
}

// Funciones auxiliares (sin emojis)
function obtenerNombreProducto(id) {
    const mapa = {
        1: 'PAN INTEGRAL', 2: 'PAN C/AJONJOLÍ', 3: 'PAN BLANCO', 4: 'PAN MIEL',
        5: 'PAN HAMBURGUESA', 6: 'PAN PERRO CALIENTE', 7: 'TOSTADAS'
    };
    return mapa[id] || `Producto ${id}`;
}

function obtenerNombreSoya(id) {
    if (id == 12) return 'Soya Estándar';
    if (id == 13) return 'Soya Proteica';
    return 'Soya';
}

function obtenerPesoPorProducto(id) {
    const pesos = {1:450,2:450,3:450,4:450,5:100,6:80,7:250};
    return pesos[id] || 450;
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return fechaStr;
}