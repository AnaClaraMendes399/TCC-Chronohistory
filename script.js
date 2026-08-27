// ============================================
// API Configuration
// ============================================
const API_URL = 'https://backendtcccronohistory.vercel.app/periodos';

// ============================================
// Estado Global
// ============================================
let todosPeriodos = [];
let todosEventos = [];
let eventosFiltrados = [];
let currentPage = 1;
let isLoading = false;
let currentMap = null;
let itemsPerLoad = 8;
let todosEventosCarregados = false;
let totalEventosCarregados = 0;

// ============================================
// Inicialização
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    setupEventListeners();
});

// ============================================
// Carregar Dados da API
// ============================================
async function carregarDados() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            todosPeriodos = data;
        } else if (data && typeof data === 'object') {
            if (data.periodos && Array.isArray(data.periodos)) {
                todosPeriodos = data.periodos;
            } else if (data.data && Array.isArray(data.data)) {
                todosPeriodos = data.data;
            } else {
                todosPeriodos = [data];
            }
        }

        if (todosPeriodos.length === 0) {
            mostrarErro('Nenhum dado histórico encontrado na API.');
            return;
        }

        processarEventos();
        preencherFiltros();
        aplicarFiltros();

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarErro(`Não foi possível carregar os dados históricos: ${error.message}`);
    }
}

// ============================================
// Funções de Conversão de Datas
// ============================================
function converterAnoParaNumero(anoStr) {
    if (!anoStr || anoStr === 'Data desconhecida' || anoStr === 'Data não especificada') {
        return 9999;
    }

    let anoLimpo = anoStr.toString().trim();

    const isBC = anoLimpo.includes('a.C.') ||
                 anoLimpo.includes('AC') ||
                 anoLimpo.includes('aC') ||
                 anoLimpo.includes('antes de Cristo');

    let numeros = anoLimpo.match(/\d+/g);

    if (!numeros) {
        return 9999;
    }

    let ano = parseInt(numeros[0]);

    if (isBC) {
        ano = -ano;
    }

    return ano;
}

function formatarAno(anoStr) {
    if (!anoStr) return 'Data desconhecida';

    if (anoStr.includes('a.C.') || anoStr.includes('d.C.') || anoStr.includes('século')) {
        return anoStr;
    }

    const numeros = anoStr.match(/\d+/g);
    if (numeros) {
        const ano = parseInt(numeros[0]);
        if (ano < 0) {
            return `${Math.abs(ano)} a.C.`;
        } else if (ano > 0) {
            return `${ano} d.C.`;
        }
    }

    return anoStr;
}

// Usada só para a "tag" extra que mostra o ano em número puro
// (ex: "9600 a.C.") ao lado das outras etiquetas do card.
// ANTES tinha um "º" (ordinal) grudado no número, o que não faz
// sentido nenhum para uma data — foi removido.
function formatarAnoNumericoTag(anoNumerico) {
    if (anoNumerico === 9999) return null;
    return anoNumerico < 0
        ? `${Math.abs(anoNumerico)} a.C.`
        : `${anoNumerico} d.C.`;
}

// ============================================
// Processar Eventos
// ============================================
function processarEventos() {
    todosEventos = [];

    todosPeriodos.forEach((periodo, periodoIndex) => {
        const periodoNome = periodo.nome || `Período ${periodoIndex + 1}`;

        if (periodo.acontecimentos && Array.isArray(periodo.acontecimentos)) {
            periodo.acontecimentos.forEach((evento, eventoIndex) => {
                const anoOriginal = evento.ano || 'Data desconhecida';
                const nomeEvento = evento.nome || `Evento ${eventoIndex + 1}`;
                const lugarEvento = evento.lugar || 'Regiões diversas';
                const descricaoEvento = evento.oque_aconteceu || 'Descrição disponível no "Saber Mais"';
                const mudouEvento = evento.oque_mudou || 'Este evento trouxe transformações significativas.';
                const figurasPrincipais = evento.figuras_principais || [];

                const anoNumerico = converterAnoParaNumero(anoOriginal);
                const anoFormatado = formatarAno(anoOriginal);

                const globalId = `periodo_${periodo.id || periodoIndex}_evento_${evento.id || eventoIndex}`;

                todosEventos.push({
                    id: evento.id || `${periodoIndex}_${eventoIndex}`,
                    nome: nomeEvento,
                    ano: anoFormatado,
                    anoOriginal: anoOriginal,
                    anoNumerico: anoNumerico,
                    lugar: lugarEvento,
                    oque_aconteceu: descricaoEvento,
                    oque_mudou: mudouEvento,
                    periodoNome: periodoNome,
                    periodoId: periodo.id || periodoIndex,
                    periodoResumo: periodo.resumo || '',
                    caracteristicas_principais: evento.caracteristicas_principais || periodo.caracteristicas_principais || [],
                    legado: evento.legado || periodo.legado || '',
                    curiosidades: evento.curiosidades || periodo.curiosidades || [],
                    figuras_principais: figurasPrincipais,
                    informacoes_adicionais: evento.informacoes_adicionais || '',
                    globalId: globalId,
                    periodoOriginal: periodo
                });
            });
        }
    });

    todosEventos.sort(ordenarPorAno);
}

function ordenarPorAno(a, b) {
    if (a.anoNumerico === 9999 && b.anoNumerico === 9999) return 0;
    if (a.anoNumerico === 9999) return 1;
    if (b.anoNumerico === 9999) return -1;
    return a.anoNumerico - b.anoNumerico;
}

// ============================================
// Filtros
// ============================================
function preencherFiltros() {
    const lugares = [...new Set(todosEventos.map(e => e.lugar).filter(l => l && l !== 'Regiões diversas' && l !== 'Local não especificado'))];
    const lugarOptions = document.getElementById('lugarOptions');
    lugarOptions.innerHTML = '';
    lugares.sort().forEach(lugar => {
        const option = document.createElement('option');
        option.value = lugar;
        lugarOptions.appendChild(option);
    });

    const periodos = [...new Set(todosEventos.map(e => e.periodoNome).filter(p => p))];
    const periodoSelect = document.getElementById('periodoFilter');
    periodoSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todos os períodos';
    periodoSelect.appendChild(defaultOption);

    periodos.forEach(periodo => {
        const option = document.createElement('option');
        option.value = periodo;
        option.textContent = periodo;
        periodoSelect.appendChild(option);
    });
}

function aplicarFiltros() {
    const lugar = document.getElementById('lugarFilter').value.toLowerCase();
    const ano = document.getElementById('anoFilter').value.toLowerCase();
    const periodo = document.getElementById('periodoFilter').value;

    eventosFiltrados = todosEventos.filter(evento => {
        let match = true;

        if (lugar) {
            const lugarEvento = evento.lugar ? evento.lugar.toLowerCase() : '';
            if (!lugarEvento.includes(lugar)) match = false;
        }

        if (periodo && evento.periodoNome !== periodo) match = false;

        if (ano) {
            const anoEvento = evento.ano ? evento.ano.toLowerCase() : '';
            const anoOriginal = evento.anoOriginal ? evento.anoOriginal.toLowerCase() : '';
            if (!anoEvento.includes(ano) && !anoOriginal.includes(ano)) match = false;
        }

        return match;
    });

    eventosFiltrados.sort(ordenarPorAno);

    currentPage = 1;
    totalEventosCarregados = 0;
    todosEventosCarregados = false;
    renderTimeline();
}

// ============================================
// Renderizar Timeline
// ============================================
function renderTimeline() {
    const container = document.getElementById('timelineItems');
    const loadingIndicator = document.getElementById('loadingIndicator');

    const start = totalEventosCarregados;
    const end = Math.min(start + itemsPerLoad, eventosFiltrados.length);
    const eventosToShow = eventosFiltrados.slice(start, end);

    if (currentPage === 1) {
        container.innerHTML = '';
        totalEventosCarregados = 0;
    }

    if (eventosFiltrados.length === 0) {
        // ANTES: "bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl" — glassmorphism
        // solto no meio do JS. Usa a mesma "casca" sólida já definida em
        // #timelineItems .text-center no CSS (sem blur, sem transparência de vidro).
        container.innerHTML = `
            <div class="text-center py-16">
                <p>Nenhum evento encontrado com os filtros selecionados.</p>
                <p style="margin-top: 0.75rem; opacity: 0.75;">Tente ajustar seus filtros para descobrir mais histórias.</p>
            </div>
        `;
        loadingIndicator.classList.add('hidden');
        return;
    }

    eventosToShow.forEach((evento, index) => {
        adicionarEventoTimeline(evento, container, totalEventosCarregados + index);
    });

    totalEventosCarregados += eventosToShow.length;

    const allEventsShown = totalEventosCarregados >= eventosFiltrados.length;

    if (allEventsShown) {
        loadingIndicator.classList.add('hidden');
        todosEventosCarregados = true;
    } else {
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.innerHTML = `
            <div class="loading-spinner mx-auto mb-4"></div>
            <p>Carregando mais eventos históricos...</p>
            <p style="opacity: 0.65; font-size: 0.85rem; margin-top: 0.35rem;">
                ${totalEventosCarregados} de ${eventosFiltrados.length} eventos · ${Math.round((totalEventosCarregados / eventosFiltrados.length) * 100)}%
            </p>
        `;
        todosEventosCarregados = false;

        const oldObserver = loadingIndicator._observer;
        if (oldObserver) {
            oldObserver.disconnect();
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isLoading && !todosEventosCarregados) {
                carregarMaisEventos();
            }
        }, { threshold: 0.1 });

        loadingIndicator._observer = observer;
        observer.observe(loadingIndicator);
    }

    observeTimelineItems();
}

// ANTES: cada card misturava a classe custom (.timeline-card, .year-badge,
// .tag-text, .action-btn-saber) com uma pilha de utilitários Tailwind
// (rounded-full, rounded-xl, shadow-md, bg-gradient-to-r...) por cima —
// o que sobrescrevia o visual "papel/tinta" plano que o CSS já define e
// devolvia o efeito "cartão de app genérico". Agora o HTML usa só as
// classes do próprio design system, sem gradiente e sem pill-shape.
function adicionarEventoTimeline(evento, container, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'timeline-item';
    itemDiv.setAttribute('data-event-id', evento.id);
    itemDiv.setAttribute('data-ano', evento.anoNumerico);
    itemDiv.setAttribute('data-periodo', evento.periodoNome);

    const nome = evento.nome || 'Evento Histórico';
    const ano = evento.ano || 'Data desconhecida';
    const lugar = evento.lugar || 'Regiões diversas';
    const descricao = evento.oque_aconteceu || 'Descrição disponível no "Saber Mais"';
    const periodoNome = evento.periodoNome || 'Período histórico';

    const anoNumericoTag = formatarAnoNumericoTag(evento.anoNumerico);

    let figurasHtml = '';
    if (evento.figuras_principais && evento.figuras_principais.length > 0) {
        const nomesFiguras = evento.figuras_principais.map(f => f.nome || f).join(', ');
        figurasHtml = `<span class="tag-text">${escapeHtml(nomesFiguras)}</span>`;
    }

    let infoAdicionalHtml = '';
    if (evento.informacoes_adicionais) {
        infoAdicionalHtml = `<span class="tag-text">${escapeHtml(evento.informacoes_adicionais)}</span>`;
    }

    itemDiv.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-card">
            <div class="flex justify-between items-start gap-3 mb-4 flex-wrap">
                <h3>${escapeHtml(nome)}</h3>
                <span class="year-badge">${escapeHtml(ano)}</span>
            </div>

            <p class="mb-4">${escapeHtml(descricao)}</p>

            <div class="flex flex-wrap gap-2 mb-5">
                <span class="tag-text">${escapeHtml(lugar)}</span>
                <span class="tag-text">${escapeHtml(periodoNome)}</span>
                ${anoNumericoTag ? `<span class="tag-text">${anoNumericoTag}</span>` : ''}
                ${figurasHtml}
                ${infoAdicionalHtml}
            </div>

            <div class="flex gap-3 flex-wrap">
                <button onclick="abrirSaberMais('${evento.globalId}')" class="action-btn-saber">
                    Saber Mais
                </button>
                <button onclick="mostrarMapa('${escapeHtml(lugar)}', '${escapeHtml(nome)}')" class="action-btn-mapa">
                    Ver Mapa
                </button>
                <a href="galeria.html?evento=${encodeURIComponent(evento.globalId)}" class="action-btn-mapa">
                    Ver Imagens
                </a>
            </div>
        </div>
    `;

    container.appendChild(itemDiv);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Função Saber Mais
// ============================================
async function abrirSaberMais(globalId) {
    const evento = todosEventos.find(e => e.globalId === globalId);
    if (!evento) {
        console.error('Evento não encontrado com globalId:', globalId);
        return;
    }

    const modal = document.getElementById('saberMaisModal');
    const modalContent = document.getElementById('modalContent');

    modalContent.innerHTML = `
        <div class="text-center py-8">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p>Buscando informações sobre ${escapeHtml(evento.nome)}...</p>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ periodo: evento.periodoNome })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        let informacoes = null;

        if (data.informações) {
            informacoes = data.informações.periodo_unico || data.informações;
        } else if (data.periodo_unico) {
            informacoes = data.periodo_unico;
        } else if (data.data) {
            informacoes = data.data;
        } else if (data.periodo) {
            informacoes = data.periodo;
        }

        if (!informacoes && typeof data === 'object') {
            informacoes = data;
        }

        if (informacoes && Object.keys(informacoes).length > 0) {
            const caracteristicas = informacoes.caracteristicas_principais ||
                                   informacoes.caracteristicas ||
                                   informacoes.características || [];

            const curiosidades = informacoes.curiosidades ||
                                informacoes.curiosidade ||
                                informacoes.curiosidades_historicas || [];

            const legado = informacoes.legado ||
                          informacoes.legado_historico ||
                          informacoes.legado_histórico || '';

            modalContent.innerHTML = renderConteudoModal(evento, {
                caracteristicas, curiosidades, legado
            });
        } else {
            modalContent.innerHTML = renderConteudoModal(evento, {
                caracteristicas: [], curiosidades: [], legado: ''
            });
        }
    } catch (error) {
        console.error('Erro ao buscar informações:', error);
        modalContent.innerHTML = `
            <div class="text-center py-8">
                <p>Erro ao carregar informações detalhadas.</p>
                <p style="opacity: 0.7; font-size: 0.9rem; margin-top: 0.5rem;">Tente novamente mais tarde.</p>
                <div class="modal-secao" style="text-align: left; margin-top: 1.25rem;">
                    <p><strong>${escapeHtml(evento.nome)}</strong></p>
                    ${evento.oque_aconteceu ? `<p style="margin-top: 0.5rem;">${escapeHtml(evento.oque_aconteceu)}</p>` : ''}
                </div>
            </div>
        `;
    }
}

// ANTES: cada bloco do modal usava "bg-[#F5F0E6] p-5 rounded-xl" ou
// "bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] p-6 rounded-xl" — mais
// gradiente e bordas muito arredondadas. Trocado por ".modal-secao",
// um bloco sólido e reto, coerente com o resto do site.
function renderConteudoModal(evento, { caracteristicas, curiosidades, legado }) {
    return `
        <div>
            <div class="modal-header-info" style="border-bottom: 1px solid var(--line); padding-bottom: 1rem; margin-bottom: 1.25rem;">
                <h4>${escapeHtml(evento.nome)}</h4>
                <p style="opacity: 0.7; margin-top: 0.35rem;">${escapeHtml(evento.ano)} · ${escapeHtml(evento.lugar)}</p>
                <p style="opacity: 0.55; font-size: 0.85rem; margin-top: 0.15rem;">${escapeHtml(evento.periodoNome)}</p>
            </div>

            ${evento.oque_aconteceu ? `
                <div class="modal-secao">
                    <h5 class="modal-secao-titulo">O que aconteceu</h5>
                    <p>${escapeHtml(evento.oque_aconteceu)}</p>
                </div>
            ` : ''}

            ${evento.oque_mudou ? `
                <div class="modal-secao">
                    <h5 class="modal-secao-titulo">O que mudou</h5>
                    <p>${escapeHtml(evento.oque_mudou)}</p>
                </div>
            ` : ''}

            ${legado ? `
                <div class="modal-secao">
                    <h5 class="modal-secao-titulo">Legado</h5>
                    <p>${escapeHtml(legado)}</p>
                </div>
            ` : ''}

            ${caracteristicas.length > 0 ? `
                <div class="modal-secao">
                    <h5 class="modal-secao-titulo">Características principais</h5>
                    <ul style="padding-left: 1.1rem;">
                        ${caracteristicas.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${evento.figuras_principais && evento.figuras_principais.length > 0 ? `
                <div class="modal-secao">
                    <h5 class="modal-secao-titulo">Figuras principais</h5>
                    <ul style="padding-left: 1.1rem;">
                        ${evento.figuras_principais.map(f => `<li>${escapeHtml(f.nome || f)}${f.papel ? ` — ${escapeHtml(f.papel)}` : ''}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${evento.informacoes_adicionais ? `
                <div class="modal-secao">
                    <h5 class="modal-secao-titulo">Informações adicionais</h5>
                    <p>${escapeHtml(evento.informacoes_adicionais)}</p>
                </div>
            ` : ''}

            ${curiosidades.length > 0 ? `
                <div class="modal-secao">
                    <h5 class="modal-secao-titulo">Curiosidades históricas</h5>
                    <ul class="modal-curiosidades-lista">
                        ${curiosidades.slice(0, 3).map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================
// FUNÇÕES DO MAPA
// ============================================
function obterCoordenadas(lugar) {
    if (!lugar) return { lat: 0, lng: 0 };

    const lugarLower = lugar.toLowerCase().trim();

    const coordenadas = {
        'brasil': { lat: -14.2350, lng: -51.9253 },
        'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
        'são paulo': { lat: -23.5505, lng: -46.6333 },
        'brasilia': { lat: -15.7975, lng: -47.8919 },
        'salvador': { lat: -12.9777, lng: -38.5016 },
        'recife': { lat: -8.0476, lng: -34.8770 },
        'fortaleza': { lat: -3.7327, lng: -38.5270 },
        'belo horizonte': { lat: -19.9191, lng: -43.9386 },
        'porto alegre': { lat: -30.0346, lng: -51.2177 },
        'curitiba': { lat: -25.4296, lng: -49.2713 },
        'manaus': { lat: -3.1190, lng: -60.0217 },
        'paris': { lat: 48.8566, lng: 2.3522 },
        'roma': { lat: 41.9028, lng: 12.4964 },
        'londres': { lat: 51.5074, lng: -0.1278 },
        'lisboa': { lat: 38.7223, lng: -9.1393 },
        'madrid': { lat: 40.4168, lng: -3.7038 },
        'berlim': { lat: 52.5200, lng: 13.4050 },
        'atenas': { lat: 37.9838, lng: 23.7275 },
        'nova york': { lat: 40.7128, lng: -74.0060 },
        'los angeles': { lat: 34.0522, lng: -118.2437 },
        'miami': { lat: 25.7617, lng: -80.1918 },
        'buenos aires': { lat: -34.6037, lng: -58.3816 },
        'santiago': { lat: -33.4489, lng: -70.6693 },
        'lima': { lat: -12.0464, lng: -77.0428 },
        'bogotá': { lat: 4.7110, lng: -74.0721 },
        'pequim': { lat: 39.9042, lng: 116.4074 },
        'toquio': { lat: 35.6762, lng: 139.6503 },
        'cairo': { lat: 30.0444, lng: 31.2357 },
        'alexandria': { lat: 31.2001, lng: 29.9187 },
        'sydney': { lat: -33.8688, lng: 151.2093 },
        'mesopotâmia': { lat: 33.2232, lng: 43.6793 },
        'egito antigo': { lat: 26.8206, lng: 30.8025 },
        'grécia antiga': { lat: 39.0742, lng: 21.8243 },
        'roma antiga': { lat: 41.9028, lng: 12.4964 },
        'constantinopla': { lat: 41.0082, lng: 28.9784 }
    };

    for (const [key, coords] of Object.entries(coordenadas)) {
        if (lugarLower === key || lugarLower.includes(key)) {
            return coords;
        }
    }

    return { lat: 0, lng: 0 };
}

function buscarCoordenadasPorNome(lugar, nomeEvento) {
    const coordsCache = obterCoordenadas(lugar);
    if (coordsCache.lat !== 0 || coordsCache.lng !== 0) {
        criarMapaComCoordenadas(coordsCache.lat, coordsCache.lng, lugar, nomeEvento);
        return;
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(lugar)}&format=json&limit=1&accept-language=pt`;

    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p>Buscando localização...</p>
                </div>
            </div>
        `;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                const displayName = data[0].display_name || lugar;
                criarMapaComCoordenadas(lat, lng, displayName, nomeEvento);
            } else {
                criarMapaComCoordenadas(0, 0, lugar, nomeEvento);
            }
        })
        .catch(() => {
            criarMapaComCoordenadas(0, 0, lugar, nomeEvento);
        });
}

function criarMapaComCoordenadas(lat, lng, lugar, nomeEvento) {
    try {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        if (currentMap) {
            currentMap.remove();
            currentMap = null;
        }

        mapContainer.innerHTML = '';

        const zoom = (lat === 0 && lng === 0) ? 2 : 6;
        const viewLat = (lat === 0 && lng === 0) ? 20 : lat;
        const viewLng = (lat === 0 && lng === 0) ? 0 : lng;

        currentMap = L.map('map', {
            center: [viewLat, viewLng],
            zoom: zoom,
            zoomControl: true
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(currentMap);

        // ANTES: marcador em círculo perfeito com sombra difusa (visual
        // "pin de app de mapa genérico"). Trocado por um selo quadrado com
        // cantos levemente cortados, coerente com a estética de selo de
        // cera / documento do restante do site.
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: #8B2E2E; width: 22px; height: 22px; border: 2px solid #F7F3EA; transform: rotate(45deg); box-shadow: 0 2px 4px rgba(0,0,0,0.35);"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });

        if (lat !== 0 || lng !== 0) {
            L.marker([lat, lng], { icon: customIcon })
                .bindPopup(`
                    <div style="font-family: 'Inter', sans-serif; text-align: center; min-width: 180px;">
                        <strong style="color: #1C1712; font-size: 1rem; display: block; margin-bottom: 4px;">${escapeHtml(nomeEvento)}</strong>
                        <span style="color: #3A3229; font-size: 0.9rem;">${escapeHtml(lugar)}</span>
                    </div>
                `)
                .openPopup();

            L.circle([lat, lng], {
                color: '#8B2E2E',
                fillColor: '#B99A5B',
                fillOpacity: 0.15,
                radius: 50000
            }).addTo(currentMap);
        } else {
            L.popup()
                .setLatLng([20, 0])
                .setContent(`
                    <div style="text-align: center; padding: 10px;">
                        <p style="color: #1C1712; font-weight: bold; margin-top: 6px;">Localização não encontrada</p>
                        <p style="color: #3A3229; font-size: 0.9rem;">${escapeHtml(lugar)}</p>
                    </div>
                `)
                .openOn(currentMap);
        }

        setTimeout(() => {
            if (currentMap) {
                currentMap.invalidateSize();
            }
        }, 300);

    } catch (error) {
        console.error('Erro ao criar mapa:', error);
    }
}

function mostrarMapa(lugar, nomeEvento) {
    const modal = document.getElementById('mapModal');
    const mapContainer = document.getElementById('map');

    if (!modal || !mapContainer) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    mapContainer.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="text-center">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p>Carregando mapa...</p>
            </div>
        </div>
    `;

    setTimeout(() => {
        buscarCoordenadasPorNome(lugar, nomeEvento);
    }, 300);
}

// ============================================
// Scroll Infinito
// ============================================
function carregarMaisEventos() {
    if (isLoading || todosEventosCarregados) return;
    isLoading = true;

    setTimeout(() => {
        currentPage++;
        renderTimeline();
        isLoading = false;
    }, 500);
}

function observeTimelineItems() {
    const items = document.querySelectorAll('.timeline-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    items.forEach(item => observer.observe(item));
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    document.getElementById('aplicarFiltros').addEventListener('click', () => {
        aplicarFiltros();
    });

    document.getElementById('limparFiltros').addEventListener('click', () => {
        document.getElementById('lugarFilter').value = '';
        document.getElementById('anoFilter').value = '';
        document.getElementById('periodoFilter').value = '';
        aplicarFiltros();
    });

    document.getElementById('fecharModal').addEventListener('click', () => {
        document.getElementById('saberMaisModal').classList.add('hidden');
        document.getElementById('saberMaisModal').classList.remove('flex');
    });

    document.getElementById('fecharMapModal').addEventListener('click', () => {
        document.getElementById('mapModal').classList.add('hidden');
        document.getElementById('mapModal').classList.remove('flex');
        if (currentMap) {
            currentMap.remove();
            currentMap = null;
        }
    });

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('saberMaisModal');
        const mapModal = document.getElementById('mapModal');
        if (e.target === modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        if (e.target === mapModal) {
            mapModal.classList.add('hidden');
            mapModal.classList.remove('flex');
            if (currentMap) {
                currentMap.remove();
                currentMap = null;
            }
        }
    });
}

// ============================================
// Mostrar Erro
// ============================================
function mostrarErro(mensagem) {
    const container = document.getElementById('timelineItems');
    container.innerHTML = `
        <div class="text-center py-16">
            <p style="color: var(--seal-light);">${escapeHtml(mensagem)}</p>
            <button onclick="location.reload()" class="action-btn-saber" style="margin-top: 1.25rem;">
                Tentar Novamente
            </button>
        </div>
    `;
}