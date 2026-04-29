const API_URL = 'api.php';

// ==================== PRODUCTOS ====================
const productos = [
    { id: 1, nombre: 'PAN INTEGRAL', pesoUnitario: 450 },
    { id: 2, nombre: 'PAN C/ AJONJOLÍ', pesoUnitario: 450 },
    { id: 3, nombre: 'PAN BLANCO', pesoUnitario: 450 },
    { id: 4, nombre: 'PAN MIEL', pesoUnitario: 450 },
    { id: 5, nombre: 'PAN HAMBURGUESA', pesoUnitario: 100 },
    { id: 6, nombre: 'PAN PERRO CALIENTE', pesoUnitario: 80 },
    { id: 7, nombre: 'TOSTADAS', pesoUnitario: 250 }
];

// Productos de cereales con sus pesos
const productosCereales = [
    { nombre: 'CHOCO BOLITAS', pesoUnitario: 0.240 },
    { nombre: 'CHOKO CHISPYS', pesoUnitario: 0.240 },
    { nombre: 'AROS FRUTADOS', pesoUnitario: 0.240 },
    { nombre: 'AROS MIEL', pesoUnitario: 0.240 }
];

let comparativaChart = null;
let rendimientoChart = null;
let mermaChart = null;
let evolucionChart = null;
let variacionChart = null;
let vistaActual = 'mensual';
let fechaActual = new Date();
let mesesDisponibles = [];
let currentDataPan = [];       
let currentDataCereales = [];  
let currentDataSoya = [];       
let currentGraficoTipo = 'pan'; 

const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ==================== FUNCIONES DE CARGA ====================

async function cargarProduccionPan(mes, anio) {
    try {
        const url = `${API_URL}?action=get_panaderia&mes=${mes}&anio=${anio}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error en la petición: ' + response.status);
        return await response.json();
    } catch (error) {
        console.error('Error al cargar producción de pan:', error);
        return [];
    }
}

async function cargarProduccionCereales(mes, anio) {
    try {
        const url = `${API_URL}?action=get_cereales_produccion&mes=${mes}&anio=${anio}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error en la petición');
        return await response.json();
    } catch (error) {
        console.error('Error al cargar producción de cereales:', error);
        return [];
    }
}

async function cargarProduccionSoya(mes, anio) {
    try {
        const url = `${API_URL}?action=get_soya_produccion&mes=${mes}&anio=${anio}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error en la petición');
        return await response.json();
    } catch (error) {
        console.error('Error al cargar producción de soya:', error);
        return [];
    }
}

// ==================== FILTRADO ====================

function filtrarPorMes(datos, mes, anio) {
    return datos.filter(r => {
        if (!r.fecha) return false;
        const fecha = new Date(r.fecha);
        return fecha.getMonth() + 1 === mes && fecha.getFullYear() === anio;
    });
}

function filtrarPorAnio(datos, anio) {
    return datos.filter(r => {
        if (!r.fecha) return false;
        const fecha = new Date(r.fecha);
        return fecha.getFullYear() === anio;
    });
}

function filtrarPorSemana(datos, fechaReferencia = new Date()) {
    const hoy = new Date(fechaReferencia);
    const diaSemana = hoy.getDay();
    const inicioSemana = new Date(hoy);
    const diferencia = diaSemana === 0 ? 6 : diaSemana - 1;
    inicioSemana.setDate(hoy.getDate() - diferencia);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);
    
    return datos.filter(r => {
        if (!r.fecha) return false;
        const fecha = new Date(r.fecha);
        return fecha >= inicioSemana && fecha <= finSemana;
    });
}

function filtrarPorDia(datos, fechaReferencia = new Date()) {
    const hoy = new Date(fechaReferencia);
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    
    return datos.filter(r => {
        if (!r.fecha) return false;
        const fecha = new Date(r.fecha);
        return fecha >= hoy && fecha < manana;
    });
}

function obtenerRangoSemana() {
    const hoy = fechaActual;  
    const diaSemana = hoy.getDay();
    const inicioSemana = new Date(hoy);
    const diferencia = diaSemana === 0 ? 6 : diaSemana - 1;
    inicioSemana.setDate(hoy.getDate() - diferencia);
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    
    return `${inicioSemana.toLocaleDateString('es-ES')} - ${finSemana.toLocaleDateString('es-ES')}`;
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Resumen conectado a BD');
    actualizarVista(vistaActual);
    cargarMesesDisponibles();
});

// ==================== VISTAS ====================

function cambiarVista(vista) {
    // Si cambias a vista semanal o diaria, usar la fecha actual
    if (vista === 'semanal' || vista === 'diaria') {
        fechaActual = new Date();  // Resetear a hoy
    }
    
    vistaActual = vista;
    actualizarVista(vista);
    
    const menu = document.getElementById('menuDesplegable');
    if (menu) menu.classList.remove('mostrar');
    
    const tituloVista = document.getElementById('tituloVista');
    const subtituloVista = document.getElementById('subtituloVista');
    
    switch(vista) {
        case 'mensual':
            tituloVista.textContent = 'Resumen Mensual de Producción';
            subtituloVista.textContent = `Análisis del mes actual - ${nombresMeses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`;
            break;

        case 'semanal':
            tituloVista.textContent = 'Resumen Semanal de Producción';
            
            const hoy = new Date();
            const diaSemana = hoy.getDay();
            const diferencia = diaSemana === 0 ? 6 : diaSemana - 1;
            const inicioSemana = new Date(hoy);
            inicioSemana.setDate(hoy.getDate() - diferencia);
            const finSemana = new Date(inicioSemana);
            finSemana.setDate(inicioSemana.getDate() + 6);
            subtituloVista.textContent = `Semana del ${inicioSemana.toLocaleDateString('es-ES')} al ${finSemana.toLocaleDateString('es-ES')}`;
            break;

        case 'diaria':
            tituloVista.textContent = 'Resumen Diario de Producción';
            subtituloVista.textContent = `Análisis del día ${fechaActual.toLocaleDateString('es-ES')}`;
            break;

        case 'anual':
            tituloVista.textContent = 'Resumen Anual de Producción';
            subtituloVista.textContent = `Análisis del año ${fechaActual.getFullYear()}`;
            break;
    }
}

async function actualizarVista(vista) {
    const mes = fechaActual.getMonth() + 1;
    const anio = fechaActual.getFullYear();
    
    console.log('Actualizando vista:', vista, 'Mes:', mes, 'Año:', anio);
    
    // Mostrar loading
    const contenedor = document.getElementById('resumen');
    const contenedorCereales = document.getElementById('resumen-cereales');
    const contenedorSoya = document.getElementById('resumen-soya');
    
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="card" style="text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-pulse" style="font-size: 40px; color: var(--venepan-red);"></i>
                <p style="margin-top: 20px;">Cargando datos desde la base de datos...</p>
            </div>
        `;
    }
    
    let datosPan = [];
    let datosCereales = [];
    let datosSoya = [];
    let periodoInfo = '';
    
    switch(vista) {
        case 'mensual':
            datosPan = await cargarProduccionPan(mes, anio);
            datosCereales = await cargarProduccionCereales(mes, anio);
            datosSoya = await cargarProduccionSoya(mes, anio);
            periodoInfo = `${nombresMeses[mes-1]} ${anio}`;
            break;
            
        case 'semanal':
            console.log('=== VISTA SEMANAL ===');
            console.log('Fecha referencia:', fechaActual);
            console.log('Día de la semana:', fechaActual.getDay());
            
            const mesActual = fechaActual.getMonth() + 1;
            const anioActual = fechaActual.getFullYear();
            const fechaInicioSemana = new Date(fechaActual);
            const diaSemana = fechaActual.getDay();
            const diferencia = diaSemana === 0 ? 6 : diaSemana - 1;
            fechaInicioSemana.setDate(fechaActual.getDate() - diferencia);
            
            console.log('Inicio de semana (Lunes):', fechaInicioSemana);
            console.log('Fin de semana (Domingo):', new Date(fechaInicioSemana.getTime() + 6 * 24 * 60 * 60 * 1000));

            const fechaFinSemana = new Date(fechaInicioSemana);
            fechaFinSemana.setDate(fechaInicioSemana.getDate() + 6);
            const mesFin = fechaFinSemana.getMonth() + 1;
            const anioFin = fechaFinSemana.getFullYear();
            
            let mesesACargar = new Set();
            mesesACargar.add(mesActual);
            if (mesInicio !== mesActual) mesesACargar.add(mesInicio);
            if (mesFin !== mesActual && mesFin !== mesInicio) mesesACargar.add(mesFin);
            
            let todosPan = [], todosCereales = [], todosSoya = [];
            for (const m of mesesACargar) {
                const datosPanMes = await cargarProduccionPan(m, anioActual);
                const datosCerealesMes = await cargarProduccionCereales(m, anioActual);
                const datosSoyaMes = await cargarProduccionSoya(m, anioActual);
                todosPan = [...todosPan, ...datosPanMes];
                todosCereales = [...todosCereales, ...datosCerealesMes];
                todosSoya = [...todosSoya, ...datosSoyaMes];
            }
            
            datosPan = filtrarPorSemana(todosPan, fechaActual);
            datosCereales = filtrarPorSemana(todosCereales, fechaActual);
            datosSoya = filtrarPorSemana(todosSoya, fechaActual);
            periodoInfo = `Semana del ${obtenerRangoSemana()}`;
            break;
            
        case 'diaria':
            const mesDia = fechaActual.getMonth() + 1;
            const anioDia = fechaActual.getFullYear();
            const datosPanMesDia = await cargarProduccionPan(mesDia, anioDia);
            const datosCerealesMesDia = await cargarProduccionCereales(mesDia, anioDia);
            const datosSoyaMesDia = await cargarProduccionSoya(mesDia, anioDia);
            datosPan = filtrarPorDia(datosPanMesDia, fechaActual);
            datosCereales = filtrarPorDia(datosCerealesMesDia, fechaActual);
            datosSoya = filtrarPorDia(datosSoyaMesDia, fechaActual);
            periodoInfo = fechaActual.toLocaleDateString('es-ES');
            break;
            
        case 'anual':
            let todosPanAnual = [], todosCerealesAnual = [], todosSoyaAnual = [];
            for (let m = 1; m <= 12; m++) {
                const datosPanMes = await cargarProduccionPan(m, anio);
                const datosCerealesMes = await cargarProduccionCereales(m, anio);
                const datosSoyaMes = await cargarProduccionSoya(m, anio);
                todosPanAnual = [...todosPanAnual, ...datosPanMes];
                todosCerealesAnual = [...todosCerealesAnual, ...datosCerealesMes];
                todosSoyaAnual = [...todosSoyaAnual, ...datosSoyaMes];
            }
            datosPan = todosPanAnual;
            datosCereales = todosCerealesAnual;
            datosSoya = todosSoyaAnual;
            periodoInfo = `${anio}`;
            break;
    }
    
    console.log('Datos cargados - Pan:', datosPan.length, 'Cereales:', datosCereales.length, 'Soya:', datosSoya.length);
    
            currentDataPan = datosPan;
            currentDataCereales = datosCereales;
            currentDataSoya = datosSoya;
            actualizarGraficosSegunTipo();

    if (datosPan.length === 0 && datosCereales.length === 0 && datosSoya.length === 0) {
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="card" style="text-align: center; padding: 50px;">
                    <i class="fas fa-calendar-times" style="font-size: 60px; color: #ccc; margin-bottom: 20px;"></i>
                    <h3 style="color: #666;">No hay registros para ${periodoInfo}</h3>
                    <p style="color: #999; margin-top: 10px;">Agrega producción desde los módulos correspondientes.</p>
                </div>
            `;
        }
        if (contenedorCereales) contenedorCereales.innerHTML = '';
        if (contenedorSoya) contenedorSoya.innerHTML = '';
        mostrarGraficosVacios();
    } else {
        actualizarEstadisticasGenerales(datosPan);
        generarResumenPan(datosPan, periodoInfo);
        await generarResumenCereales(datosCereales, periodoInfo);
        await generarResumenSoya(datosSoya, periodoInfo);
    }
}

// ==================== ESTADÍSTICAS GENERALES ====================

function actualizarEstadisticasGenerales(datosFiltrados) {
    const diasUnicos = new Set();
    datosFiltrados.forEach(r => {
        if (r.fecha) diasUnicos.add(r.fecha);
    });
    
    let totalKilos = 0;
    datosFiltrados.forEach(r => {
        const producto = productos.find(p => p.id === r.id_producto);
        if (producto && r.unidades) {
            totalKilos += (r.unidades * producto.pesoUnitario) / 1000;
        }
    });
    
    let sumaRendimientos = 0;
    let conteoRendimientos = 0;
    datosFiltrados.forEach(r => {
        if (r.rendimiento) {
            sumaRendimientos += r.rendimiento;
            conteoRendimientos++;
        }
    });
    const rendimientoPromedio = conteoRendimientos > 0 ? (sumaRendimientos / conteoRendimientos).toFixed(1) : 0;
    
    // Actualizar elementos solo si existen
    const diasElement = document.getElementById('dias-registrados');
    if (diasElement) diasElement.textContent = diasUnicos.size;
    
    const totalKilosElement = document.getElementById('total-kilos');
    if (totalKilosElement) totalKilosElement.textContent = totalKilos.toFixed(2) + " kg";
    
    const rendimientoElement = document.getElementById('rendimiento-promedio');
    if (rendimientoElement) {
        rendimientoElement.textContent = rendimientoPromedio + "%";
        if (rendimientoPromedio >= 90) {
            rendimientoElement.style.color = "#27ae60";
        } else if (rendimientoPromedio >= 70) {
            rendimientoElement.style.color = "var(--venepan-red)";
        } else {
            rendimientoElement.style.color = "#1a1a1a";
        }
    }
    
}

// ==================== GENERAR RESUMEN PAN ====================

function generarResumenPan(datosFiltrados, periodoInfo) {
    const contenedor = document.getElementById('resumen');
    if (!contenedor) return;
    
    if (datosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div class="card" style="background: #fffbe6; border: 1px solid #e6dbac;">
                <div class="card-header" style="background: #fdf5d0; padding: 15px;">
                    <h3 style="color: #856404;"><i class="fas fa-chart-line"></i> Panadería: ${periodoInfo}</h3>
                </div>
                <div style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-bread-slice" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No hay registros de panadería para ${periodoInfo}
                </div>
            </div>
        `;
        return;
    }
    
    let granTotalMedida = 0;
    let granTotalUnidades = 0;
    let granTotalKilos = 0;
    let granTotalMerma = 0;
    let sumaRendimientos = 0;
    let productosConDatos = 0;
    
    const nombresProductos = [];
    const planificacionKg = [];
    const produccionRealKg = [];
    const rendimientos = [];
    const mermasKg = [];
    
    productos.forEach(p => {
        const registrosProducto = datosFiltrados.filter(r => r.id_producto === p.id);
        
        if (registrosProducto.length === 0) return;
        
        let planificacionMedida = 0;
        let totalUnidadesReales = 0;
        let totalRendimiento = 0;
        let totalBD = 0;
        let conteoDias = registrosProducto.length;
        
        registrosProducto.forEach(r => {
            planificacionMedida += parseFloat(r.medidas) || 0;
            totalUnidadesReales += parseInt(r.unidades) || 0;
            totalBD += parseFloat(r.bd) || 0;
            totalRendimiento += parseInt(r.rendimiento) || 0;
        });
        
        const prodRealKG = (totalUnidadesReales * p.pesoUnitario) / 1000;
        const planificacionKG = planificacionMedida;
        const mermaKG = (totalBD * p.pesoUnitario) / 1000;
        const promedioRend = conteoDias ? (totalRendimiento / conteoDias).toFixed(1) : 0;
        
        granTotalMedida += planificacionKG;
        granTotalUnidades += totalUnidadesReales;
        granTotalKilos += prodRealKG;
        granTotalMerma += mermaKG;
        sumaRendimientos += parseFloat(promedioRend);
        productosConDatos++;
        
        nombresProductos.push(p.nombre);
        planificacionKg.push(planificacionKG);
        produccionRealKg.push(prodRealKG);
        rendimientos.push(parseFloat(promedioRend));
        mermasKg.push(mermaKG);
    });
    
    let html = `
        <div class="card" style="background: #fffbe6; border: 1px solid #e6dbac;">
            <div class="card-header" style="background: #fdf5d0; border-bottom: 2px solid #e6dbac; padding: 15px;">
                <h3 style="color: #856404;">
                    <i class="fas fa-chart-line"></i> Reporte Consolidado Panadería: ${periodoInfo}
                </h3>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse: collapse; background: #fffbe6;">
                    <thead>
                        <tr style="background: #fdf5d0;">
                            <th style="padding: 12px; border: 1px solid #e6dbac;">Producto</th>
                            <th style="padding: 12px; border: 1px solid #e6dbac;">Planificación (Kg)</th>
                            <th style="padding: 12px; border: 1px solid #e6dbac;">Peso Unit.</th>
                            <th style="padding: 12px; border: 1px solid #e6dbac;">Prod. Real (Und)</th>
                            <th style="padding: 12px; border: 1px solid #e6dbac;">Prod. Real (Kg)</th>
                            <th style="padding: 12px; border: 1px solid #e6dbac;">Rendimiento</th>
                            <th style="padding: 12px; border: 1px solid #e6dbac;">Merma (Kg)</th>
                            <th style="padding: 12px; border: 1px solid #e6dbac;">Comparación</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    for (let i = 0; i < nombresProductos.length; i++) {
        const diferenciaKg = produccionRealKg[i] - planificacionKg[i];
        const comparacionTexto = diferenciaKg >= 0 
            ? `<span style="color: #27ae60;"><i class="fas fa-arrow-up"></i> +${diferenciaKg.toFixed(2)} kg</span>`
            : `<span style="color: #b33939;"><i class="fas fa-arrow-down"></i> ${diferenciaKg.toFixed(2)} kg</span>`;
        
        const productoActual = productos.find(p => p.nombre === nombresProductos[i]);
        const unidadesCalculadas = productoActual ? Math.round(produccionRealKg[i] * 1000 / productoActual.pesoUnitario) : 0;
        
        html += `
            <tr style="border-bottom: 1px solid #e6dbac;">
                <td style="padding: 10px; border: 1px solid #e6dbac; font-weight: bold;">${nombresProductos[i]}</td>
                <td style="padding: 10px; border: 1px solid #e6dbac; text-align: center;">${planificacionKg[i].toFixed(2)} kg</td>
                <td style="padding: 10px; border: 1px solid #e6dbac; text-align: center;">${productoActual?.pesoUnitario || 0}g</td>
                <td style="padding: 10px; border: 1px solid #e6dbac; text-align: center;">${unidadesCalculadas}</td>
                <td style="padding: 10px; border: 1px solid #e6dbac; text-align: center; font-weight:bold;">${produccionRealKg[i].toFixed(2)} kg</td>
                <td style="padding: 10px; border: 1px solid #e6dbac; text-align: center;">
                    <span style="background: ${rendimientos[i] >= 90 ? '#27ae60' : (rendimientos[i] >= 70 ? '#b33939' : '#1a1a1a')}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px;">
                        ${rendimientos[i]}%
                    </span>
                </td>
                <td style="padding: 10px; border: 1px solid #e6dbac; text-align: center; color: #b33939; font-weight:bold;">${mermasKg[i].toFixed(2)} kg</td>
                <td style="padding: 10px; border: 1px solid #e6dbac; text-align: center;">${comparacionTexto}</td>
              </tr>
        `;
    }
    
    const promRendGeneral = productosConDatos > 0 ? (sumaRendimientos / productosConDatos).toFixed(1) : 0;
    const diferenciaTotalKg = granTotalKilos - granTotalMedida;
    
    html += `
                    </tbody>
                    <tfoot>
                        <tr style="background: #fdf5d0; font-weight: bold;">
                            <td style="padding: 12px; border: 1px solid #e6dbac;">TOTAL GENERAL</td>
                            <td style="padding: 12px; border: 1px solid #e6dbac; text-align: center;">${granTotalMedida.toFixed(2)} kg</td>
                            <td style="padding: 12px; border: 1px solid #e6dbac; text-align: center;">-</td>
                            <td style="padding: 12px; border: 1px solid #e6dbac; text-align: center;">${granTotalUnidades}</td>
                            <td style="padding: 12px; border: 1px solid #e6dbac; text-align: center;">${granTotalKilos.toFixed(2)} kg</td>
                            <td style="padding: 12px; border: 1px solid #e6dbac; text-align: center;">${promRendGeneral}%</td>
                            <td style="padding: 12px; border: 1px solid #e6dbac; text-align: center;">${granTotalMerma.toFixed(2)} kg</td>
                            <td style="padding: 12px; border: 1px solid #e6dbac; text-align: center;">
                                ${diferenciaTotalKg >= 0 ? 
                                    `<span style="color: #27ae60;">+${diferenciaTotalKg.toFixed(2)} kg</span>` : 
                                    `<span style="color: #b33939;">${diferenciaTotalKg.toFixed(2)} kg</span>`}
                            </td>
                          </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
    
    contenedor.innerHTML = html;
    
    document.getElementById('planificacion-total-kg').textContent = granTotalMedida.toFixed(2) + " kg";
    document.getElementById('produccion-total-kg').textContent = granTotalKilos.toFixed(2) + " kg";
    document.getElementById('diferencia-total').textContent = (diferenciaTotalKg >= 0 ? "+" : "") + diferenciaTotalKg.toFixed(2) + " kg";
    document.getElementById('diferencia-total').style.color = diferenciaTotalKg >= 0 ? "#27ae60" : "#b33939";
    
    const rendimientoGeneralDiv = document.getElementById('rendimiento-general');
    if (rendimientoGeneralDiv) {
        rendimientoGeneralDiv.textContent = `Rendimiento General: ${promRendGeneral}%`;
        rendimientoGeneralDiv.style.background = promRendGeneral >= 90 ? "#27ae60" : (promRendGeneral >= 70 ? "#b33939" : "#1a1a1a");
    }
    
    if (nombresProductos.length > 0) {
        crearGraficoComparativa(nombresProductos, planificacionKg, produccionRealKg);
        crearGraficoRendimiento(nombresProductos, rendimientos);
        crearGraficoMerma(nombresProductos, mermasKg);
    } else {
        mostrarGraficosVacios();
    }
}

// ==================== RESUMEN CEREALES ====================

async function generarResumenCereales(datosCereales, periodoInfo) {
    const resumenDiv = document.getElementById('resumen-cereales');
    if (!resumenDiv) return;
    
    if (datosCereales.length === 0) {
        resumenDiv.innerHTML = `
            <div class="card" style="background: #e8f5e9; border: 1px solid #a5d6a7; margin-top: 20px;">
                <div class="card-header" style="background: #c8e6c9; border-bottom: 2px solid #a5d6a7; padding: 15px;">
                    <h3 style="color: #2e7d32;">
                        <i class="fas fa-seedling"></i> Resumen de Producción - Cereales (${periodoInfo})
                    </h3>
                </div>
                <div style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No hay registros de cereales para ${periodoInfo}
                </div>
            </div>
        `;
        return;
    }
    
    // Agrupar por tipo de cereal
    const grupos = {};
    datosCereales.forEach(item => {
        const tipo = item.tipo_cereal;
        if (!grupos[tipo]) {
            grupos[tipo] = {
                total_producido: 0,
                primera: 0,
                segunda: 0,
                merma: 0,
                medida_base: 0,
                medida_jarabe: 0,
                prod_teorica: 0,
                count: 0
            };
        }
        grupos[tipo].total_producido += parseFloat(item.total_producido) || 0;
        grupos[tipo].primera += parseFloat(item.primera) || 0;
        grupos[tipo].segunda += parseFloat(item.segunda) || 0;
        grupos[tipo].merma += parseFloat(item.merma) || 0;
        grupos[tipo].medida_base += parseFloat(item.medida_base) || 0;
        grupos[tipo].medida_jarabe += parseFloat(item.medida_jarabe) || 0;
        grupos[tipo].prod_teorica += parseFloat(item.prod_teorica) || 0;
        grupos[tipo].count++;
    });
    
    let html = `
        <div class="card" style="background: #e8f5e9; border: 1px solid #a5d6a7; margin-top: 20px;">
            <div class="card-header" style="background: #c8e6c9; border-bottom: 2px solid #a5d6a7; padding: 15px;">
                <h3 style="color: #2e7d32;">
                    <i class="fas fa-seedling"></i> Resumen de Producción - Cereales (${periodoInfo})
                </h3>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse: collapse; background: #e8f5e9;">
                    <thead>
                        <tr style="background: #a5d6a7;">
                            <th style="padding: 10px; border: 1px solid #81c784;">Producto</th>
                            <th style="padding: 10px; border: 1px solid #81c784;">Peso (kg)</th>
                            <th style="padding: 10px; border: 1px solid #81c784;">Prod. Real (Und)</th>
                            <th style="padding: 10px; border: 1px solid #81c784;">Prod. Real (Kg)</th>
                            <th style="padding: 10px; border: 1px solid #81c784;">Rendimiento</th>
                            <th style="padding: 10px; border: 1px solid #81c784;">Medidas Realizadas</th>
                            <th style="padding: 10px; border: 1px solid #81c784;">Merma (Kg)</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    let totalKgGeneral = 0;
    let totalMedidas = 0;
    let totalMerma = 0;
    let sumaRendimientos = 0;
    let totalProductos = 0;
    
    const pesosPorCereal = {
        'CHOCO BOLITAS': 0.240,
        'CHOKO CHISPYS': 0.240,
        'AROS FRUTADOS': 0.240,
        'AROS MIEL': 0.240
    };
    
    for (const [tipo, datos] of Object.entries(grupos)) {
        const pesoUnitario = pesosPorCereal[tipo] || 0.240;
        const totalUnidades = datos.total_producido > 0 ? Math.round(datos.total_producido / pesoUnitario) : 0;
        const rendimientoPromedio = datos.count > 0 ? (datos.prod_teorica / datos.count).toFixed(1) : 0;
        const medidasRealizadas = datos.medida_base + datos.medida_jarabe;
        
        totalKgGeneral += datos.total_producido;
        totalMedidas += medidasRealizadas;
        totalMerma += datos.merma;
        sumaRendimientos += parseFloat(rendimientoPromedio);
        totalProductos++;
        
        let rendColor = '#e74c3c';
        if (rendimientoPromedio >= 90) rendColor = '#27ae60';
        else if (rendimientoPromedio >= 70) rendColor = '#f39c12';
        
        html += `
            <tr style="border-bottom: 1px solid #c8e6c9;">
                <td style="padding: 10px; border: 1px solid #c8e6c9; font-weight: bold;">${tipo}</td>
                <td style="padding: 10px; border: 1px solid #c8e6c9; text-align: center;">${pesoUnitario.toFixed(3)} kg</td>
                <td style="padding: 10px; border: 1px solid #c8e6c9; text-align: center;">${totalUnidades.toLocaleString()} uds</td>
                <td style="padding: 10px; border: 1px solid #c8e6c9; text-align: center; font-weight: bold;">${datos.total_producido.toFixed(2)} kg</td>
                <td style="padding: 10px; border: 1px solid #c8e6c9; text-align: center;">
                    <span style="background: ${rendColor}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px;">
                        ${rendimientoPromedio}%
                    </span>
                </td>
                <td style="padding: 10px; border: 1px solid #c8e6c9; text-align: center;">${medidasRealizadas.toFixed(2)} kg</td>
                <td style="padding: 10px; border: 1px solid #c8e6c9; text-align: center; color: #e74c3c; font-weight: bold;">${datos.merma.toFixed(2)} kg</td>
              </tr>
        `;
    }
    
    const rendimientoGeneral = totalProductos > 0 ? (sumaRendimientos / totalProductos).toFixed(1) : 0;
    
    html += `
                    </tbody>
                    <tfoot style="background: #a5d6a7; font-weight: bold;">
                        <tr>
                            <td style="padding: 10px; border: 1px solid #81c784;">TOTAL GENERAL</td>
                            <td style="padding: 10px; border: 1px solid #81c784; text-align: center;">-</td>
                            <td style="padding: 10px; border: 1px solid #81c784; text-align: center;">-</td
                            <td style="padding: 10px; border: 1px solid #81c784; text-align: center;">${totalKgGeneral.toFixed(2)} kg</td
                            <td style="padding: 10px; border: 1px solid #81c784; text-align: center;">${rendimientoGeneral}%</td
                            <td style="padding: 10px; border: 1px solid #81c784; text-align: center;">${totalMedidas.toFixed(2)} kg</td
                            <td style="padding: 10px; border: 1px solid #81c784; text-align: center;">${totalMerma.toFixed(2)} kg</td
                          </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
    
    resumenDiv.innerHTML = html;
}

// ==================== RESUMEN SOYA ====================

async function generarResumenSoya(datosSoya, periodoInfo) {
    const resumenDiv = document.getElementById('resumen-soya');
    if (!resumenDiv) return;
    
    if (datosSoya.length === 0) {
        resumenDiv.innerHTML = `
            <div class="card" style="background: #fff3e0; border: 1px solid #ffcc80; margin-top: 20px;">
                <div class="card-header" style="background: #ffe0b2; border-bottom: 2px solid #ffcc80; padding: 15px;">
                    <h3 style="color: #e65100;">
                        <i class="fas fa-leaf"></i> Resumen de Producción - Soya (${periodoInfo})
                    </h3>
                </div>
                <div style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-seedling" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No hay registros de soya para ${periodoInfo}
                </div>
            </div>
        `;
        return;
    }
    
    // Agrupar por lote/producto
    let totalPrimera = 0;
    let totalDesechos = 0;
    let totalProduccion = 0;
    let totalMedidas = 0;
    let totalDesgranada = 0;
    let totalAzufre = 0;
    let conteoRegistros = datosSoya.length;
    
    datosSoya.forEach(item => {
        totalPrimera += parseFloat(item.primera) || 0;
        totalDesechos += (parseFloat(item.desecho_humedo) || 0) + (parseFloat(item.desecho_seco) || 0);
        totalProduccion += parseFloat(item.total_producido) || 0;
        totalMedidas += parseInt(item.medidas) || 0;
        totalDesgranada += parseFloat(item.soya_desgranada) || 0;
        totalAzufre += parseFloat(item.azufre) || 0;
    });
    
    const rendimientoPromedio = totalProduccion > 0 ? (totalPrimera / totalProduccion * 100).toFixed(1) : 0;
    const porcentajeDesecho = totalProduccion > 0 ? (totalDesechos / totalProduccion * 100).toFixed(1) : 0;
    
    let rendColor = '#e74c3c';
    if (rendimientoPromedio >= 85) rendColor = '#27ae60';
    else if (rendimientoPromedio >= 70) rendColor = '#f39c12';
    
    let html = `
        <div class="card" style="background: #fff3e0; border: 1px solid #ffcc80; margin-top: 20px;">
            <div class="card-header" style="background: #ffe0b2; border-bottom: 2px solid #ffcc80; padding: 15px;">
                <h3 style="color: #e65100;">
                    <i class="fas fa-leaf"></i> Resumen de Producción - Soya (${periodoInfo})
                </h3>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse: collapse; background: #fff3e0;">
                    <thead>
                        <tr style="background: #ffe0b2;">
                            <th style="padding: 10px; border: 1px solid #ffcc80;">Indicador</th>
                            <th style="padding: 10px; border: 1px solid #ffcc80;">Valor</th>
                            <th style="padding: 10px; border: 1px solid #ffcc80;">Unidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style="padding: 10px; border: 1px solid #ffcc80;">N° de Lotes/Registros</td><td style="padding: 10px; border: 1px solid #ffcc80; font-weight: bold;">${conteoRegistros}</td><td style="padding: 10px; border: 1px solid #ffcc80;">lotes</td></tr>
                        <tr><td style="padding: 10px; border: 1px solid #ffcc80;">Total Medidas</td><td style="padding: 10px; border: 1px solid #ffcc80; font-weight: bold;">${totalMedidas}</td><td style="padding: 10px; border: 1px solid #ffcc80;">unidades</td></tr>
                        <tr><td style="padding: 10px; border: 1px solid #ffcc80;">Soya Desgranada</td><td style="padding: 10px; border: 1px solid #ffcc80; font-weight: bold;">${totalDesgranada.toFixed(2)}</td><td style="padding: 10px; border: 1px solid #ffcc80;">kg</td></tr>
                        <tr><td style="padding: 10px; border: 1px solid #ffcc80;">Azufre Utilizado</td><td style="padding: 10px; border: 1px solid #ffcc80; font-weight: bold;">${totalAzufre.toFixed(2)}</td><td style="padding: 10px; border: 1px solid #ffcc80;">kg</td></tr>
                        <tr><td style="padding: 10px; border: 1px solid #ffcc80;">Producción 1ra Calidad</td><td style="padding: 10px; border: 1px solid #ffcc80; font-weight: bold;">${totalPrimera.toFixed(2)}</td><td style="padding: 10px; border: 1px solid #ffcc80;">kg</td></tr>
                        <tr><td style="padding: 10px; border: 1px solid #ffcc80;">Total Desechos</td><td style="padding: 10px; border: 1px solid #ffcc80; font-weight: bold;">${totalDesechos.toFixed(2)}</td><td style="padding: 10px; border: 1px solid #ffcc80;">kg</td></tr>
                        <tr><td style="padding: 10px; border: 1px solid #ffcc80;">Total Producción</td><td style="padding: 10px; border: 1px solid #ffcc80; font-weight: bold;">${totalProduccion.toFixed(2)}</td><td style="padding: 10px; border: 1px solid #ffcc80;">kg</td></tr>
                        <tr><td style="padding: 10px; border: 1px solid #ffcc80;">Rendimiento</td><td style="padding: 10px; border: 1px solid #ffcc80; font-weight: bold;">
                            <span style="background: ${rendColor}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px;">${rendimientoPromedio}%</span>
                        </td><td style="padding: 10px; border: 1px solid #ffcc80;">eficiencia</td></tr>
                        <tr><td style="padding: 10px; border: 1px solid #ffcc80;">Porcentaje de Desecho</td><td style="padding: 10px; border: 1px solid #ffcc80; font-weight: bold; color: #e74c3c;">${porcentajeDesecho}%</td><td style="padding: 10px; border: 1px solid #ffcc80;">del total</td></tr>
                    </tbody>
                    <tfoot style="background: #ffe0b2;">
                        <tr><td colspan="3" style="padding: 10px; text-align: center; color: #e65100;"><i class="fas fa-chart-line"></i> Resumen consolidado del período</td></tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
    
    resumenDiv.innerHTML = html;
}

// ==================== GRÁFICOS ====================

function crearGraficoComparativa(labels, planificacion, produccion) {
    const ctx = document.getElementById('comparativaChart');
    if (!ctx) return;
    if (comparativaChart) comparativaChart.destroy();
    
    comparativaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Planificación (Kg)', data: planificacion, backgroundColor: 'rgba(179, 57, 57, 0.7)', borderColor: '#b33939', borderWidth: 1, borderRadius: 6 },
                { label: 'Producción Real (Kg)', data: produccion, backgroundColor: 'rgba(133, 100, 4, 0.7)', borderColor: '#856404', borderWidth: 1, borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toFixed(2)} kg` } } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Kilogramos (kg)' } }, x: { ticks: { maxRotation: 45, minRotation: 45 } } }
        }
    });
}

function crearGraficoRendimiento(labels, rendimientos) {
    const ctx = document.getElementById('rendimientoChart');
    if (!ctx) return;
    if (rendimientoChart) rendimientoChart.destroy();
    
    const colores = rendimientos.map(rend => {
        if (rend >= 90) return 'rgba(39, 174, 96, 0.8)';
        if (rend >= 70) return 'rgba(179, 57, 57, 0.8)';
        return 'rgba(26, 26, 26, 0.8)';
    });

    rendimientoChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: rendimientos, backgroundColor: colores, borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right' }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw.toFixed(1)}%` } } } }
    });
}

function crearGraficoMerma(labels, mermas) {
    const ctx = document.getElementById('mermaChart');
    if (!ctx) return;
    if (mermaChart) mermaChart.destroy();
    
    mermaChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ label: 'Merma (Kg)', data: mermas, backgroundColor: 'rgba(179, 57, 57, 0.7)', borderColor: '#b33939', borderWidth: 1, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: true, indexAxis: 'y', plugins: { legend: { position: 'top' } }, scales: { x: { title: { display: true, text: 'Kilogramos (kg)' }, beginAtZero: true } } }
    });
}

function mostrarGraficosVacios() {
    const ctxComparativa = document.getElementById('comparativaChart')?.getContext('2d');
    const ctxRendimiento = document.getElementById('rendimientoChart')?.getContext('2d');
    const ctxMerma = document.getElementById('mermaChart')?.getContext('2d');
    
    if (ctxComparativa) {
        if (comparativaChart) comparativaChart.destroy();
        comparativaChart = new Chart(ctxComparativa, { type: 'bar', data: { labels: ['Sin datos'], datasets: [{ label: 'No hay registros', data: [0] }] }, options: { plugins: { legend: { display: false } } } });
    }
    if (ctxRendimiento) {
        if (rendimientoChart) rendimientoChart.destroy();
        rendimientoChart = new Chart(ctxRendimiento, { type: 'doughnut', data: { labels: ['Sin datos'], datasets: [{ data: [1], backgroundColor: ['#ccc'] }] }, options: { plugins: { legend: { display: false } } } });
    }
    if (ctxMerma) {
        if (mermaChart) mermaChart.destroy();
        mermaChart = new Chart(ctxMerma, { type: 'bar', data: { labels: ['Sin datos'], datasets: [{ label: 'Merma', data: [0] }] }, options: { plugins: { legend: { display: false } } } });
    }
}

function cambiarTipoGrafico(tipo) {
    currentGraficoTipo = tipo;
    // Actualizar clases activas en los botones
    document.querySelectorAll('.btn-tipo-grafico').forEach(btn => {
        if (btn.getAttribute('data-tipo') === tipo) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    actualizarGraficosSegunTipo();
}

function actualizarGraficosSegunTipo() {
    if (currentGraficoTipo === 'pan') {
        actualizarGraficosPan();
    } else if (currentGraficoTipo === 'cereales') {
        actualizarGraficosCereales();
    } else if (currentGraficoTipo === 'soya') {
        actualizarGraficosSoya();
    }
}

function actualizarGraficosPan() {
    // Mostrar stats de pan, ocultar los otros
    document.getElementById('stats-mini-pan').style.display = 'flex';
    document.getElementById('stats-mini-cereales').style.display = 'none';
    document.getElementById('stats-mini-soya').style.display = 'none';

    // Cambiar títulos
    document.getElementById('grafico1-titulo').innerText = 'Comparativa por Producto';
    document.getElementById('grafico1-subtitulo').innerText = 'Planificación vs Producción Real (Kg)';
    document.getElementById('grafico2-titulo').innerText = 'Rendimiento por Producto';
    document.getElementById('grafico2-subtitulo').innerText = 'Porcentaje de eficiencia (%)';
    document.getElementById('grafico3-titulo').innerText = 'Merma por Producto';
    document.getElementById('grafico3-subtitulo').innerText = 'Pérdidas en kilogramos';

    // Reutilizar la lógica existente de pan (los datos ya están en currentDataPan)
    // Pero necesitamos extraer nombres, planificación, producción real, rendimientos, mermas
    const nombresProductos = [];
    const planificacionKg = [];
    const produccionRealKg = [];
    const rendimientos = [];
    const mermasKg = [];

    productos.forEach(p => {
        const registros = currentDataPan.filter(r => r.id_producto === p.id);
        if (registros.length === 0) return;

        let planificacionMedida = 0;
        let totalUnidadesReales = 0;
        let totalRendimiento = 0;
        let totalBD = 0;
        let conteoDias = registros.length;

        registros.forEach(r => {
            planificacionMedida += parseFloat(r.medidas) || 0;
            totalUnidadesReales += parseInt(r.unidades) || 0;
            totalBD += parseFloat(r.bd) || 0;
            totalRendimiento += parseInt(r.rendimiento) || 0;
        });

        const prodRealKG = (totalUnidadesReales * p.pesoUnitario) / 1000;
        const planificacionKG = planificacionMedida;
        const mermaKG = (totalBD * p.pesoUnitario) / 1000;
        const promedioRend = conteoDias ? (totalRendimiento / conteoDias).toFixed(1) : 0;

        nombresProductos.push(p.nombre);
        planificacionKg.push(planificacionKG);
        produccionRealKg.push(prodRealKG);
        rendimientos.push(parseFloat(promedioRend));
        mermasKg.push(mermaKG);
    });

    if (nombresProductos.length > 0) {
        crearGraficoComparativa(nombresProductos, planificacionKg, produccionRealKg);
        crearGraficoRendimiento(nombresProductos, rendimientos);
        crearGraficoMerma(nombresProductos, mermasKg);
        // Actualizar stats mini
        const totalPlan = planificacionKg.reduce((a,b)=>a+b,0);
        const totalProd = produccionRealKg.reduce((a,b)=>a+b,0);
        document.getElementById('planificacion-total-kg').textContent = totalPlan.toFixed(2) + ' kg';
        document.getElementById('produccion-total-kg').textContent = totalProd.toFixed(2) + ' kg';
        const diff = totalProd - totalPlan;
        document.getElementById('diferencia-total').textContent = (diff >= 0 ? '+' : '') + diff.toFixed(2) + ' kg';
        document.getElementById('diferencia-total').style.color = diff >= 0 ? '#27ae60' : '#b33939';
        // Actualizar badge rendimiento general
        const rendGeneral = rendimientos.length ? (rendimientos.reduce((a,b)=>a+b,0)/rendimientos.length).toFixed(1) : 0;
        const rendBadge = document.getElementById('rendimiento-general');
        rendBadge.textContent = `Rendimiento General: ${rendGeneral}%`;
        rendBadge.style.background = rendGeneral >= 90 ? '#27ae60' : (rendGeneral >= 70 ? '#b33939' : '#1a1a1a');
    } else {
        mostrarGraficosVacios();
    }
}

function actualizarGraficosCereales() {
    // Ocultar stats de pan, mostrar stats de cereales
    document.getElementById('stats-mini-pan').style.display = 'none';
    document.getElementById('stats-mini-cereales').style.display = 'flex';
    document.getElementById('stats-mini-soya').style.display = 'none';

    // Cambiar títulos
    document.getElementById('grafico1-titulo').innerText = 'Producción por Tipo de Cereal';
    document.getElementById('grafico1-subtitulo').innerText = 'Total producido (Kg)';
    document.getElementById('grafico2-titulo').innerText = 'Rendimiento por Tipo';
    document.getElementById('grafico2-subtitulo').innerText = 'Productividad teórica (%)';
    document.getElementById('grafico3-titulo').innerText = 'Merma por Tipo';
    document.getElementById('grafico3-subtitulo').innerText = 'Pérdidas en kilogramos';

    // Agrupar datos de cereales
    const grupos = {};
    currentDataCereales.forEach(item => {
        const tipo = item.tipo_cereal;
        if (!grupos[tipo]) {
            grupos[tipo] = { total: 0, merma: 0, rendimiento: 0, count: 0 };
        }
        grupos[tipo].total += parseFloat(item.total_producido) || 0;
        grupos[tipo].merma += parseFloat(item.merma) || 0;
        grupos[tipo].rendimiento += parseFloat(item.prod_teorica) || 0;
        grupos[tipo].count++;
    });

    const tipos = Object.keys(grupos);
    const totales = tipos.map(t => grupos[t].total);
    const mermas = tipos.map(t => grupos[t].merma);
    const rendimientos = tipos.map(t => grupos[t].count ? (grupos[t].rendimiento / grupos[t].count) : 0);

    if (tipos.length > 0) {
        // Para gráfico de barras comparativo, mostramos solo producción total (podríamos poner planificación vs real? No hay planificación en cereales)
        // Usaremos el mismo gráfico pero con un solo dataset.
        if (comparativaChart) comparativaChart.destroy();
        const ctx = document.getElementById('comparativaChart').getContext('2d');
        comparativaChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: tipos,
                datasets: [{ label: 'Producción Total (Kg)', data: totales, backgroundColor: 'rgba(179, 57, 57, 0.7)', borderRadius: 6 }]
            },
            options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Kg' } } } }
        });

        crearGraficoRendimiento(tipos, rendimientos);
        crearGraficoMerma(tipos, mermas);

        // Actualizar stats mini de cereales
        const totalGeneral = totales.reduce((a,b)=>a+b,0);
        const mermaTotal = mermas.reduce((a,b)=>a+b,0);
        const rendPromedio = rendimientos.length ? (rendimientos.reduce((a,b)=>a+b,0)/rendimientos.length).toFixed(1) : 0;
        document.getElementById('cereales-total-kg').textContent = totalGeneral.toFixed(2) + ' kg';
        document.getElementById('cereales-merma-kg').textContent = mermaTotal.toFixed(2) + ' kg';
        document.getElementById('cereales-rendimiento').textContent = rendPromedio + '%';
        // Badge rendimiento general
        const rendBadge = document.getElementById('rendimiento-general');
        rendBadge.textContent = `Rendimiento General: ${rendPromedio}%`;
        rendBadge.style.background = rendPromedio >= 90 ? '#27ae60' : (rendPromedio >= 70 ? '#b33939' : '#1a1a1a');
    } else {
        mostrarGraficosVacios();
    }
}

function actualizarGraficosSoya() {
    document.getElementById('stats-mini-pan').style.display = 'none';
    document.getElementById('stats-mini-cereales').style.display = 'none';
    document.getElementById('stats-mini-soya').style.display = 'flex';

    document.getElementById('grafico1-titulo').innerText = 'Producción de Soya';
    document.getElementById('grafico1-subtitulo').innerText = 'Totales por lote (Kg)';
    document.getElementById('grafico2-titulo').innerText = 'Calidad de Producción';
    document.getElementById('grafico2-subtitulo').innerText = 'Primera vs Desechos';
    document.getElementById('grafico3-titulo').innerText = 'Rendimiento por Lote';
    document.getElementById('grafico3-subtitulo').innerText = 'Porcentaje de eficiencia';

    // Calcular totales por lote (o simplemente agregados)
    let totalPrimera = 0, totalDesechos = 0, totalProduccion = 0;
    const lotes = [];
    const rendimientosLote = [];

    currentDataSoya.forEach(item => {
        const primera = parseFloat(item.primera) || 0;
        const desechoH = parseFloat(item.desecho_humedo) || 0;
        const desechoS = parseFloat(item.desecho_seco) || 0;
        const desechos = desechoH + desechoS;
        const total = primera + desechos;
        totalPrimera += primera;
        totalDesechos += desechos;
        totalProduccion += total;
        const rend = total > 0 ? (primera / total * 100) : 0;
        lotes.push(item.lote || `Lote ${item.id_soya}`);
        rendimientosLote.push(rend);
    });

    if (lotes.length > 0) {
        // Gráfico 1: producción total por lote (barras)
        const produccionPorLote = currentDataSoya.map(item => parseFloat(item.total_producido) || 0);
        if (comparativaChart) comparativaChart.destroy();
        const ctx1 = document.getElementById('comparativaChart').getContext('2d');
        comparativaChart = new Chart(ctx1, {
            type: 'bar',
            data: { labels: lotes, datasets: [{ label: 'Total Producido (Kg)', data: produccionPorLote, backgroundColor: 'rgba(179, 57, 57, 0.7)' }] },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });

        // Gráfico 2: primera calidad vs desechos (pastel)
        if (rendimientoChart) rendimientoChart.destroy();
        const ctx2 = document.getElementById('rendimientoChart').getContext('2d');
        rendimientoChart = new Chart(ctx2, {
            type: 'doughnut',
            data: { labels: ['Primera Calidad', 'Desechos'], datasets: [{ data: [totalPrimera, totalDesechos], backgroundColor: ['#27ae60', '#e74c3c'] }] },
            options: { responsive: true, plugins: { legend: { position: 'top' } } }
        });

        // Gráfico 3: rendimiento por lote (barras)
        if (mermaChart) mermaChart.destroy();
        const ctx3 = document.getElementById('mermaChart').getContext('2d');
        mermaChart = new Chart(ctx3, {
            type: 'bar',
            data: { labels: lotes, datasets: [{ label: 'Rendimiento (%)', data: rendimientosLote, backgroundColor: '#f39c12' }] },
            options: { responsive: true, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: '%' } } } }
        });

        // Stats mini soya
        const rendimientoGeneral = totalProduccion > 0 ? (totalPrimera / totalProduccion * 100).toFixed(1) : 0;
        document.getElementById('soya-total-kg').textContent = totalProduccion.toFixed(2) + ' kg';
        document.getElementById('soya-primera-kg').textContent = totalPrimera.toFixed(2) + ' kg';
        document.getElementById('soya-rendimiento').textContent = rendimientoGeneral + '%';
        const rendBadge = document.getElementById('rendimiento-general');
        rendBadge.textContent = `Rendimiento General: ${rendimientoGeneral}%`;
        rendBadge.style.background = rendimientoGeneral >= 85 ? '#27ae60' : (rendimientoGeneral >= 70 ? '#b33939' : '#1a1a1a');
    } else {
        mostrarGraficosVacios();
    }
}

// ==================== COMPARACIÓN DE MESES ====================

function verMesActual() {
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();
    if (vistaActual !== 'mensual') cambiarVista('mensual');
    
    const selectMesBase = document.getElementById('mesBase');
    const selectMesComparacion = document.getElementById('mesComparacion');
    if (selectMesBase && selectMesComparacion) {
        const mesActualKey = `${anio}-${mes}`;
        selectMesBase.value = mesActualKey;
        selectMesComparacion.value = mesActualKey;
    }
    actualizarVista('mensual');
}

async function compararMeses() {
    const mesBaseVal = document.getElementById('mesBase').value;
    const mesComparacionVal = document.getElementById('mesComparacion').value;
    if (!mesBaseVal || !mesComparacionVal) {
        alert('Por favor selecciona ambos meses para comparar');
        return;
    }
    const [anio1, mes1] = mesBaseVal.split('-').map(Number);
    const [anio2, mes2] = mesComparacionVal.split('-').map(Number);
    await generarComparacionMeses(mes1, anio1, mes2, anio2);
}

async function generarComparacionMeses(mes1, anio1, mes2, anio2) {
    const datosMes1 = await cargarProduccionPan(mes1, anio1);
    const datosMes2 = await cargarProduccionPan(mes2, anio2);
    
    const produccionMes1 = {};
    const produccionMes2 = {};
    
    productos.forEach(p => {
        const registros1 = datosMes1.filter(r => r.id_producto === p.id);
        const registros2 = datosMes2.filter(r => r.id_producto === p.id);
        let totalUnidades1 = 0, totalUnidades2 = 0;
        registros1.forEach(r => totalUnidades1 += r.unidades || 0);
        registros2.forEach(r => totalUnidades2 += r.unidades || 0);
        produccionMes1[p.nombre] = (totalUnidades1 * p.pesoUnitario) / 1000;
        produccionMes2[p.nombre] = (totalUnidades2 * p.pesoUnitario) / 1000;
    });
    
    const totalMes1 = Object.values(produccionMes1).reduce((a, b) => a + b, 0);
    const totalMes2 = Object.values(produccionMes2).reduce((a, b) => a + b, 0);
    const variacionTotal = totalMes1 > 0 ? ((totalMes2 - totalMes1) / totalMes1 * 100).toFixed(1) : (totalMes2 > 0 ? 100 : 0);
    
    const comparacionResumen = document.getElementById('comparacionResumen');
    if (comparacionResumen) {
        comparacionResumen.style.display = 'block';
        comparacionResumen.innerHTML = `
            <div class="comparacion-resumen">
                <div class="comparacion-card">
                    <div class="mes-nombre">${nombresMeses[mes1-1]} ${anio1}</div>
                    <div class="valor">${totalMes1.toFixed(2)} kg</div>
                    <div class="diferencia">Producción Total</div>
                </div>
                <div class="comparacion-card">
                    <div class="mes-nombre">${nombresMeses[mes2-1]} ${anio2}</div>
                    <div class="valor">${totalMes2.toFixed(2)} kg</div>
                    <div class="diferencia">Producción Total</div>
                </div>
                <div class="comparacion-card">
                    <div class="mes-nombre">Variación</div>
                    <div class="valor ${variacionTotal >= 0 ? 'diferencia-positiva' : 'diferencia-negativa'}">
                        ${variacionTotal >= 0 ? '+' : ''}${variacionTotal}%
                    </div>
                    <div class="diferencia">${(totalMes2 - totalMes1).toFixed(2)} kg</div>
                </div>
            </div>
        `;
    }
    
    const tbody = document.getElementById('tbodyComparativa');
    const thMes1 = document.getElementById('thMes1');
    const thMes2 = document.getElementById('thMes2');
    if (thMes1) thMes1.textContent = `${nombresMeses[mes1-1]} ${anio1} (Kg)`;
    if (thMes2) thMes2.textContent = `${nombresMeses[mes2-1]} ${anio2} (Kg)`;
    
    if (tbody) {
        tbody.innerHTML = '';
        productos.forEach(p => {
            const prod1 = produccionMes1[p.nombre] || 0;
            const prod2 = produccionMes2[p.nombre] || 0;
            const variacion = prod2 - prod1;
            const variacionPorcentual = prod1 > 0 ? ((variacion / prod1) * 100).toFixed(1) : (prod2 > 0 ? 100 : 0);
            const tendencia = variacion > 0 ? 
                `<span class="comparacion-positiva"><i class="fas fa-arrow-up"></i> +${variacionPorcentual}%</span>` :
                variacion < 0 ? 
                `<span class="comparacion-negativa"><i class="fas fa-arrow-down"></i> ${variacionPorcentual}%</span>` :
                `<span><i class="fas fa-minus"></i> 0%</span>`;
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px; font-weight: bold;">${p.nombre}</td>
                    <td style="text-align:center;">${prod1.toFixed(2)} kg</td
                    <td style="text-align:center;">${prod2.toFixed(2)} kg</td
                    <td style="text-align:center;">${variacion >= 0 ? '+' : ''}${variacion.toFixed(2)} kg</td
                    <td style="text-align:center;">${tendencia}</td
                </tr>
            `;
        });
    }
    
    crearGraficoEvolucion(
        productos.map(p => p.nombre),
        productos.map(p => produccionMes1[p.nombre] || 0),
        productos.map(p => produccionMes2[p.nombre] || 0),
        `${nombresMeses[mes1-1]} ${anio1}`,
        `${nombresMeses[mes2-1]} ${anio2}`
    );
    
    crearGraficoVariacion(
        productos.map(p => p.nombre),
        productos.map(p => {
            const prod1 = produccionMes1[p.nombre] || 0;
            const prod2 = produccionMes2[p.nombre] || 0;
            return prod1 > 0 ? ((prod2 - prod1) / prod1 * 100) : (prod2 > 0 ? 100 : 0);
        })
    );
}

function crearGraficoEvolucion(labels, datosMes1, datosMes2, nombreMes1, nombreMes2) {
    const ctx = document.getElementById('evolucionChart');
    if (!ctx) return;
    if (evolucionChart) evolucionChart.destroy();
    
    evolucionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: nombreMes1, data: datosMes1, backgroundColor: 'rgba(179, 57, 57, 0.7)', borderColor: '#b33939', borderWidth: 1, borderRadius: 6 },
                { label: nombreMes2, data: datosMes2, backgroundColor: 'rgba(133, 100, 4, 0.7)', borderColor: '#856404', borderWidth: 1, borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toFixed(2)} kg` } } },
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Kilogramos (kg)' } }, x: { ticks: { maxRotation: 45, minRotation: 45 } } }
        }
    });
}

function crearGraficoVariacion(labels, variaciones) {
    const ctx = document.getElementById('variacionChart');
    if (!ctx) return;
    if (variacionChart) variacionChart.destroy();
    
    const colores = variaciones.map(v => v >= 0 ? 'rgba(133, 100, 4, 0.7)' : 'rgba(179, 57, 57, 0.7)');
    
    variacionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Variación Porcentual (%)',
                data: variaciones,
                backgroundColor: colores,
                borderColor: '#856404',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const valor = context.raw;
                            return `Variación: ${valor >= 0 ? '+' : ''}${valor.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Variación (%)' },
                    ticks: { callback: function(value) { return value + '%'; } }
                },
                x: { ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } } }
            }
        }
    });
}

async function cargarMesesDisponibles() {
    try {
        const anioActual = new Date().getFullYear();
        // Definir años a consultar (por ejemplo, desde 2024 hasta el próximo año)
        const años = [anioActual - 2, anioActual - 1, anioActual, anioActual + 1];
        const mesesSet = new Set();

        // Función auxiliar para procesar datos de una API
        async function procesarAPI(action, añosArray) {
            for (let anio of añosArray) {
                // Consultamos solo un mes cualquiera (ej. enero) para obtener registros
                // pero necesitamos extraer los meses reales de cada registro
                const url = `${API_URL}?action=${action}&mes=1&anio=${anio}`;
                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        data.forEach(r => {
                            if (r.fecha) {
                                const fecha = new Date(r.fecha);
                                if (!isNaN(fecha.getTime())) {
                                    mesesSet.add(`${fecha.getFullYear()}-${fecha.getMonth() + 1}`);
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.warn(`Error consultando ${action} para año ${anio}:`, e);
                }
            }
        }

        // Consultar las tres tablas
        await procesarAPI('get_panaderia', años);
        await procesarAPI('get_cereales_produccion', años);
        await procesarAPI('get_soya_produccion', años);

        // Convertir a array y ordenar
        let mesesDisponibles = Array.from(mesesSet).sort().map(key => {
            const [anio, mes] = key.split('-');
            return { anio: parseInt(anio), mes: parseInt(mes), nombre: `${nombresMeses[parseInt(mes)-1]} ${anio}` };
        });

        // Si no hay meses, mostrar al menos el actual
        if (mesesDisponibles.length === 0) {
            const hoy = new Date();
            mesesDisponibles = [{ anio: hoy.getFullYear(), mes: hoy.getMonth()+1, nombre: `${nombresMeses[hoy.getMonth()]} ${hoy.getFullYear()}` }];
        }

        const selectMesBase = document.getElementById('mesBase');
        const selectMesComparacion = document.getElementById('mesComparacion');

        if (selectMesBase && selectMesComparacion) {
            selectMesBase.innerHTML = '<option value="">Seleccionar mes</option>';
            selectMesComparacion.innerHTML = '<option value="">Seleccionar mes</option>';

            mesesDisponibles.forEach((m) => {
                const option1 = document.createElement('option');
                option1.value = `${m.anio}-${m.mes}`;
                option1.textContent = m.nombre;
                selectMesBase.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = `${m.anio}-${m.mes}`;
                option2.textContent = m.nombre;
                selectMesComparacion.appendChild(option2);
            });
        }
    } catch (error) {
        console.error('Error al cargar meses disponibles:', error);
    }
}

function toggleMenu() {
    const menu = document.getElementById('menuDesplegable');
    if (menu) {
        menu.classList.toggle('mostrar');
    }
}


function cambiarTab(tab) {
    const tabMensual = document.getElementById('tabMensual');
    const tabComparativa = document.getElementById('tabComparativa');
    const btns = document.querySelectorAll('.tab-btn');
    
    btns.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'mensual') {
        tabMensual.classList.add('active');
        tabComparativa.classList.remove('active');
        if (event && event.target) event.target.classList.add('active');
        actualizarVista(vistaActual);
    } else {
        tabMensual.classList.remove('active');
        tabComparativa.classList.add('active');
        if (event && event.target) event.target.classList.add('active');
        if (mesesDisponibles.length === 0) {
            cargarMesesDisponibles();
        }
    }
}

document.addEventListener('click', function(event) {
    const menuContainer = document.querySelector('.menu-desplegable-container');
    const menu = document.getElementById('menuDesplegable');
    
    if (menuContainer && menu && !menuContainer.contains(event.target)) {
        menu.classList.remove('mostrar');
    }
});