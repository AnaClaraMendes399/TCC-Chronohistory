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
        console.log('Dados recebidos da API:', data);
        
        if (Array.isArray(data)) {
            todosPeriodos = data;
        } else if (data && typeof data === 'object') {
            todosPeriodos = data.periodos || data.data || [data];
        } else {
            console.error('Formato de dados inesperado:', data);
            todosPeriodos = [];
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
    
    if (numeros.length > 1) {
        ano = parseInt(numeros[0]);
    }
    
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

// ============================================
// Processar Eventos
// ============================================
function processarEventos() {
    todosEventos = [];
    
    todosPeriodos.forEach(periodo => {
        if (periodo.acontecimentos && Array.isArray(periodo.acontecimentos)) {
            periodo.acontecimentos.forEach(evento => {
                const anoNumerico = converterAnoParaNumero(evento.ano);
                const anoFormatado = formatarAno(evento.ano);
                
                const globalId = `${periodo.id || periodo.nome}_${evento.id || Math.random().toString(36).substr(2, 9)}`;
                
                todosEventos.push({
                    ...evento,
                    anoNumerico: anoNumerico,
                    anoOriginal: evento.ano,
                    ano: anoFormatado,
                    periodoNome: periodo.nome || 'Período não especificado',
                    periodoId: periodo.id,
                    periodoResumo: periodo.resumo || '',
                    caracteristicas_principais: periodo.caracteristicas_principais || [],
                    legado: periodo.legado || '',
                    curiosidades: periodo.curiosidades || [],
                    globalId: globalId
                });
            });
        } else if (periodo.nome) {
            const periodoInfo = periodo.periodo || '';
            const anoNumerico = converterAnoParaNumero(periodoInfo);
            const anoFormatado = formatarAno(periodoInfo);
            const globalId = `${periodo.id || periodo.nome}_${Math.random().toString(36).substr(2, 9)}`;
            
            todosEventos.push({
                id: periodo.id || todosEventos.length + 1,
                nome: periodo.nome,
                ano: anoFormatado,
                anoOriginal: periodoInfo,
                anoNumerico: anoNumerico,
                lugar: 'Regiões diversas',
                oque_aconteceu: periodo.resumo || 'Período histórico fundamental para compreensão da evolução da humanidade.',
                oque_mudou: periodo.legado || 'Este período deixou um legado significativo para as gerações futuras.',
                periodoNome: periodo.nome,
                periodoId: periodo.id,
                figuras_principais: [],
                periodoResumo: periodo.resumo || '',
                caracteristicas_principais: periodo.caracteristicas_principais || [],
                legado: periodo.legado || '',
                curiosidades: periodo.curiosidades || [],
                globalId: globalId
            });
        }
    });
    
    todosEventos.sort((a, b) => {
        if (a.anoNumerico !== b.anoNumerico) {
            return a.anoNumerico - b.anoNumerico;
        }
        return (a.nome || '').localeCompare(b.nome || '');
    });
    
    console.log(`Processados ${todosEventos.length} eventos históricos em ordem cronológica`);
}

// ============================================
// Filtros
// ============================================
function preencherFiltros() {
    const lugares = [...new Set(todosEventos.map(e => e.lugar).filter(l => l && l !== 'Regiões diversas' && l !== 'Local não especificado'))];
    const lugarSelect = document.getElementById('lugarFilter');
    lugares.sort().forEach(lugar => {
        const option = document.createElement('option');
        option.value = lugar;
        option.textContent = lugar;
        lugarSelect.appendChild(option);
    });
    
    const periodos = [...new Set(todosEventos.map(e => e.periodoNome).filter(p => p))];
    const periodoSelect = document.getElementById('periodoFilter');
    periodos.forEach(periodo => {
        const option = document.createElement('option');
        option.value = periodo;
        option.textContent = periodo;
        periodoSelect.appendChild(option);
    });
}

function aplicarFiltros() {
    const lugar = document.getElementById('lugarFilter').value;
    const ano = document.getElementById('anoFilter').value.toLowerCase();
    const periodo = document.getElementById('periodoFilter').value;
    
    eventosFiltrados = todosEventos.filter(evento => {
        let match = true;
        
        if (lugar && evento.lugar !== lugar) match = false;
        if (periodo && evento.periodoNome !== periodo) match = false;
        if (ano) {
            const anoEvento = evento.ano ? evento.ano.toLowerCase() : '';
            const anoOriginal = evento.anoOriginal ? evento.anoOriginal.toLowerCase() : '';
            if (!anoEvento.includes(ano) && !anoOriginal.includes(ano)) match = false;
        }
        
        return match;
    });
    
    eventosFiltrados.sort((a, b) => a.anoNumerico - b.anoNumerico);
    
    currentPage = 1;
    renderTimeline();
}

// ============================================
// Renderizar Timeline
// ============================================
function renderTimeline() {
    const container = document.getElementById('timelineItems');
    const start = 0;
    const end = currentPage * itemsPerLoad;
    const eventosToShow = eventosFiltrados.slice(start, end);
    
    if (currentPage === 1) {
        container.innerHTML = '';
    }
    
    if (eventosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
                <div class="text-7xl mb-4">🦉</div>
                <p class="text-[#8B7355] text-xl">Nenhum evento encontrado com os filtros selecionados.</p>
                <p class="text-[#8B7355] mt-3 text-lg">Tente ajustar seus filtros para descobrir mais histórias!</p>
            </div>
        `;
        return;
    }
    
    eventosToShow.forEach((evento, index) => {
        adicionarEventoTimeline(evento, container, index);
    });
    
    if (eventosFiltrados.length > end) {
        const loadingDiv = document.getElementById('loadingIndicator');
        loadingDiv.classList.remove('hidden');
        
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isLoading) {
                carregarMaisEventos();
            }
        }, { threshold: 0.1 });
        
        observer.observe(loadingDiv);
    } else {
        document.getElementById('loadingIndicator').classList.add('hidden');
    }
    
    observeTimelineItems();
}

function adicionarEventoTimeline(evento, container, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'timeline-item relative';
    itemDiv.setAttribute('data-event-id', evento.id);
    itemDiv.setAttribute('data-ano', evento.anoNumerico);
    
    const isLeft = index % 2 === 0;
    
    const nome = evento.nome || 'Evento Histórico';
    const ano = evento.ano || 'Data desconhecida';
    const lugar = evento.lugar || 'Regiões diversas';
    const descricao = evento.oque_aconteceu || 'Descrição disponível no "Saber Mais"';
    const periodoNome = evento.periodoNome || 'Período histórico';
    
    const isPeriodoEvent = !evento.oque_aconteceu || evento.oque_aconteceu.includes('Período histórico');
    
    let icone = '📜';
    if (isPeriodoEvent) icone = '📚';
    else if (evento.nome && (evento.nome.includes('Guerra') || evento.nome.includes('Batalha'))) icone = '⚔️';
    else if (evento.nome && (evento.nome.includes('Revolução') || evento.nome.includes('Revolta'))) icone = '✊';
    else if (evento.nome && (evento.nome.includes('Descobr') || evento.nome.includes('Exploração'))) icone = '🧭';
    else if (evento.nome && (evento.nome.includes('Arte') || evento.nome.includes('Renasc'))) icone = '🎨';
    else if (evento.nome && (evento.nome.includes('Ciência') || evento.nome.includes('Invenção'))) icone = '🔬';
    
    itemDiv.innerHTML = `
        <div class="flex flex-col md:flex-row items-start ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}">
            <div class="timeline-dot absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-7 h-7 ${isPeriodoEvent ? 'bg-[#D4C5A9]' : 'bg-[#8B6914]'} rounded-full z-10"
                 style="box-shadow: 0 0 0 5px rgba(139, 105, 20, 0.25);">
            </div>
            
            <div class="flex-1 md:w-1/2 ${isLeft ? 'md:pr-16 md:pl-8' : 'md:pl-16 md:pr-8'} pl-16 md:pl-0">
                <div class="timeline-card p-7 cursor-pointer">
                    <div class="flex justify-between items-start mb-5 flex-wrap gap-3">
                        <h3 class="text-4xl font-bold text-[#5C4033] flex items-center gap-3">
                            <span class="text-3xl">${icone}</span>
                            ${escapeHtml(nome)}
                        </h3>
                        <span class="year-badge text-white px-6 py-3 rounded-full text-xl font-bold shadow-md">
                            ${escapeHtml(ano)}
                        </span>
                    </div>
                    
                    <p class="text-[#5C4033] mb-5 leading-relaxed line-clamp-3 text-2xl font-medium">
                        ${escapeHtml(descricao)}
                    </p>
                    
                    <div class="flex flex-wrap gap-3 mb-5">
                        <span class="text-base bg-[#F5F0E6] px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm tag-text font-medium">
                            <span class="text-lg">📍</span> ${escapeHtml(lugar)}
                        </span>
                        <span class="text-base bg-[#F5F0E6] px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm tag-text font-medium">
                            <span class="text-lg">📚</span> ${escapeHtml(periodoNome)}
                        </span>
                        ${evento.anoNumerico !== 9999 ? `
                            <span class="text-base bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm tag-text font-medium">
                                <span class="text-lg">📅</span> Ordem: ${evento.anoNumerico < 0 ? `${Math.abs(evento.anoNumerico)}º a.C.` : `${evento.anoNumerico}º d.C.`}
                            </span>
                        ` : ''}
                    </div>
                    
                    <div class="flex gap-4 mt-5 flex-wrap">
                        <button onclick="abrirSaberMais('${evento.globalId}')" 
                                class="btn-primary px-7 py-3.5 text-white rounded-xl font-semibold flex items-center gap-2 shadow-md action-btn text-lg">
                            🦉 Saber Mais
                        </button>
                        <button onclick="mostrarMapa('${escapeHtml(lugar)}', '${escapeHtml(nome)}')" 
                                class="btn-secondary px-7 py-3.5 border-2 border-[#8B6914] text-[#8B6914] rounded-xl font-semibold hover:bg-[#8B6914] hover:text-white transition-all duration-300 flex items-center gap-2 action-btn text-lg">
                            🗺️ Ver Mapa
                        </button>
                    </div>
                </div>
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
            <p class="text-[#8B7355] text-xl">Buscando informações sobre ${evento.nome}...</p>
            <p class="text-sm text-[#8B7355] mt-2">🦉 A sabedoria está a caminho</p>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ periodo: evento.nome })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Resposta da API para:', evento.nome, data);
        
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
                                   informacoes.características || 
                                   informacoes.caracteristicas_principais || [];
            
            const curiosidades = informacoes.curiosidades || 
                                informacoes.curiosidade || 
                                informacoes.curiosidades_historicas || [];
            
            const legado = informacoes.legado || 
                          informacoes.legado_historico || 
                          informacoes.legado_histórico || '';
            
            modalContent.innerHTML = `
                <div class="space-y-5">
                    <div class="border-b-2 border-[#D4C5A9] pb-4">
                        <h4 class="text-2xl font-bold text-[#5C4033] flex items-center gap-2">
                            <span>📜</span> ${escapeHtml(evento.nome)}
                        </h4>
                        <p class="text-base text-[#8B7355] mt-1">${escapeHtml(evento.ano)} • ${escapeHtml(evento.lugar)}</p>
                    </div>
                    
                    ${evento.oque_aconteceu ? `
                        <div class="bg-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>📖</span> O que aconteceu:
                            </h5>
                            <p class="text-[#6B5B4F] leading-relaxed text-base">${escapeHtml(evento.oque_aconteceu)}</p>
                        </div>
                    ` : ''}
                    
                    ${evento.oque_mudou ? `
                        <div class="bg-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>🔄</span> O que mudou:
                            </h5>
                            <p class="text-[#6B5B4F] leading-relaxed text-base">${escapeHtml(evento.oque_mudou)}</p>
                        </div>
                    ` : ''}
                    
                    ${legado ? `
                        <div class="bg-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>🏛️</span> Legado:
                            </h5>
                            <p class="text-[#6B5B4F] leading-relaxed text-base">${escapeHtml(legado)}</p>
                        </div>
                    ` : ''}
                    
                    ${caracteristicas.length > 0 ? `
                        <div>
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>✨</span> Características principais:
                            </h5>
                            <ul class="list-disc list-inside text-[#6B5B4F] space-y-2 text-base">
                                ${caracteristicas.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${evento.figuras_principais && evento.figuras_principais.length > 0 ? `
                        <div>
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>👥</span> Figuras principais:
                            </h5>
                            <ul class="list-disc list-inside text-[#6B5B4F] space-y-2 text-base">
                                ${evento.figuras_principais.map(f => `<li>${escapeHtml(f.nome)} - ${escapeHtml(f.papel)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${curiosidades.length > 0 ? `
                        <div class="bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] p-6 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>🦉</span> Curiosidades históricas:
                            </h5>
                            <ul class="space-y-3">
                                ${curiosidades.slice(0, 3).map(c => `<li class="text-base text-[#6B5B4F] flex items-start gap-2"><span class="text-[#8B6914]">•</span> ${escapeHtml(c)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            modalContent.innerHTML = `
                <div class="space-y-4">
                    <div class="border-b border-[#D4C5A9] pb-3">
                        <h4 class="text-xl font-bold text-[#5C4033]">📜 ${escapeHtml(evento.nome)}</h4>
                        <p class="text-base text-[#8B7355]">${escapeHtml(evento.ano)} • ${escapeHtml(evento.lugar)}</p>
                    </div>
                    
                    ${evento.oque_aconteceu ? `
                        <div class="bg-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 text-lg">📖 Descrição:</h5>
                            <p class="text-[#6B5B4F] text-base">${escapeHtml(evento.oque_aconteceu)}</p>
                        </div>
                    ` : ''}
                    
                    ${evento.legado ? `
                        <div class="bg-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 text-lg">🏛️ Legado:</h5>
                            <p class="text-[#6B5B4F] text-base">${escapeHtml(evento.legado)}</p>
                        </div>
                    ` : ''}
                    
                    <div class="bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] p-5 rounded-xl text-center">
                        <span class="text-4xl">🦉</span>
                        <p class="text-base text-[#8B7355] mt-3">Informações complementares disponíveis em fontes históricas.</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao buscar informações:', error);
        modalContent.innerHTML = `
            <div class="text-center py-8">
                <div class="text-6xl mb-4">⚠️</div>
                <p class="text-[#8B7355] text-xl">Erro ao carregar informações detalhadas.</p>
                <p class="text-sm text-[#8B7355] mt-2">Tente novamente mais tarde.</p>
                <div class="mt-4 p-5 bg-[#F5F0E6] rounded-xl text-left">
                    <p class="text-base text-[#6B5B4F]"><strong>${escapeHtml(evento.nome)}</strong></p>
                    ${evento.oque_aconteceu ? `<p class="text-base text-[#6B5B4F] mt-2">${escapeHtml(evento.oque_aconteceu)}</p>` : ''}
                </div>
            </div>
        `;
    }
}

// ============================================
// ============================================
// FUNÇÕES DO MAPA - VERSÃO COMPLETA E MELHORADA
// ============================================
// ============================================

// ---------- COORDENADAS PRECISAS ----------
function obterCoordenadas(lugar) {
    if (!lugar) return { lat: 0, lng: 0 };
    
    const lugarLower = lugar.toLowerCase().trim();
    
    // Dicionário completo de coordenadas
    const coordenadas = {
        // ===== BRASIL - CIDADES =====
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
        'florianópolis': { lat: -27.5949, lng: -48.5482 },
        'vitória': { lat: -20.2976, lng: -40.2958 },
        'natal': { lat: -5.7793, lng: -35.2009 },
        'maceió': { lat: -9.6498, lng: -35.7089 },
        'joão pessoa': { lat: -7.1195, lng: -34.8450 },
        'teresina': { lat: -5.0892, lng: -42.8016 },
        'campo grande': { lat: -20.4697, lng: -54.6201 },
        'goiânia': { lat: -16.6869, lng: -49.2648 },
        'cuiabá': { lat: -15.5989, lng: -56.0949 },
        'ribeirão preto': { lat: -21.1699, lng: -47.8099 },
        'uberlândia': { lat: -18.9186, lng: -48.2772 },
        'são josé dos campos': { lat: -23.1896, lng: -45.8841 },
        'campinas': { lat: -22.9068, lng: -47.0616 },
        'santos': { lat: -23.9608, lng: -46.3322 },
        'são luís': { lat: -2.5387, lng: -44.2829 },
        'aracaju': { lat: -10.9472, lng: -37.0731 },
        'palmas': { lat: -10.2491, lng: -48.3243 },
        'boa vista': { lat: 2.8235, lng: -60.6758 },
        'porto velho': { lat: -8.7608, lng: -63.8999 },
        'rio branco': { lat: -9.9754, lng: -67.8249 },
        'macapá': { lat: 0.0349, lng: -51.0694 },
        
        // ===== EUROPA - CIDADES =====
        'paris': { lat: 48.8566, lng: 2.3522 },
        'roma': { lat: 41.9028, lng: 12.4964 },
        'londres': { lat: 51.5074, lng: -0.1278 },
        'lisboa': { lat: 38.7223, lng: -9.1393 },
        'madrid': { lat: 40.4168, lng: -3.7038 },
        'berlim': { lat: 52.5200, lng: 13.4050 },
        'atenas': { lat: 37.9838, lng: 23.7275 },
        'viena': { lat: 48.2082, lng: 16.3738 },
        'praga': { lat: 50.0755, lng: 14.4378 },
        'budapeste': { lat: 47.4979, lng: 19.0402 },
        'varsóvia': { lat: 52.2297, lng: 21.0122 },
        'estocolmo': { lat: 59.3293, lng: 18.0686 },
        'oslo': { lat: 59.9139, lng: 10.7522 },
        'copenhague': { lat: 55.6761, lng: 12.5683 },
        'bruxelas': { lat: 50.8503, lng: 4.3517 },
        'amsterdã': { lat: 52.3676, lng: 4.9041 },
        'amsterdao': { lat: 52.3676, lng: 4.9041 },
        'dublin': { lat: 53.3498, lng: -6.2603 },
        'edimburgo': { lat: 55.9533, lng: -3.1883 },
        'manchester': { lat: 53.4808, lng: -2.2426 },
        'barcelona': { lat: 41.3851, lng: 2.1734 },
        'valência': { lat: 39.4699, lng: -0.3763 },
        'valencia': { lat: 39.4699, lng: -0.3763 },
        'sevilha': { lat: 37.3891, lng: -5.9845 },
        'porto': { lat: 41.1579, lng: -8.6291 },
        'coimbra': { lat: 40.2033, lng: -8.4103 },
        'milão': { lat: 45.4642, lng: 9.1900 },
        'milan': { lat: 45.4642, lng: 9.1900 },
        'florença': { lat: 43.7696, lng: 11.2558 },
        'venza': { lat: 45.4408, lng: 12.3155 },
        'nápoles': { lat: 40.8518, lng: 14.2681 },
        'genebra': { lat: 46.2044, lng: 6.1432 },
        'zurique': { lat: 47.3769, lng: 8.5417 },
        
        // ===== AMÉRICA DO NORTE =====
        'nova york': { lat: 40.7128, lng: -74.0060 },
        'los angeles': { lat: 34.0522, lng: -118.2437 },
        'chicago': { lat: 41.8781, lng: -87.6298 },
        'miami': { lat: 25.7617, lng: -80.1918 },
        'toronto': { lat: 43.6532, lng: -79.3832 },
        'vancouver': { lat: 49.2827, lng: -123.1207 },
        'montreal': { lat: 45.5017, lng: -73.5673 },
        'mexico city': { lat: 19.4326, lng: -99.1332 },
        'cidade do méxico': { lat: 19.4326, lng: -99.1332 },
        'cancún': { lat: 21.1619, lng: -86.8515 },
        'guadalajara': { lat: 20.6597, lng: -103.3496 },
        'monterrey': { lat: 25.6866, lng: -100.3161 },
        'los cabos': { lat: 23.0594, lng: -109.7078 },
        'tijuana': { lat: 32.5149, lng: -117.0382 },
        
        // ===== AMÉRICA DO SUL =====
        'buenos aires': { lat: -34.6037, lng: -58.3816 },
        'santiago': { lat: -33.4489, lng: -70.6693 },
        'lima': { lat: -12.0464, lng: -77.0428 },
        'bogotá': { lat: 4.7110, lng: -74.0721 },
        'caracas': { lat: 10.4806, lng: -66.9036 },
        'montevidéu': { lat: -34.9011, lng: -56.1645 },
        'montevideu': { lat: -34.9011, lng: -56.1645 },
        'assunção': { lat: -25.2637, lng: -57.5759 },
        'assuncao': { lat: -25.2637, lng: -57.5759 },
        'la paz': { lat: -16.5000, lng: -68.1500 },
        'quito': { lat: -0.1807, lng: -78.4678 },
        'medellín': { lat: 6.2442, lng: -75.5812 },
        'cartagena': { lat: 10.3910, lng: -75.4794 },
        'barranquilla': { lat: 10.9685, lng: -74.7813 },
        'rosário': { lat: -32.9468, lng: -60.6393 },
        'cordoba': { lat: -31.4201, lng: -64.1888 },
        'valparaíso': { lat: -33.0472, lng: -71.6127 },
        
        // ===== ÁSIA =====
        'pequim': { lat: 39.9042, lng: 116.4074 },
        'toquio': { lat: 35.6762, lng: 139.6503 },
        'seul': { lat: 37.5665, lng: 126.9780 },
        'xangai': { lat: 31.2304, lng: 121.4737 },
        'hong kong': { lat: 22.3193, lng: 114.1694 },
        'bangcoc': { lat: 13.7563, lng: 100.5018 },
        'cidade de singapura': { lat: 1.3521, lng: 103.8198 },
        'mumbai': { lat: 19.0760, lng: 72.8777 },
        'nova delhi': { lat: 28.6139, lng: 77.2090 },
        'dubai': { lat: 25.2048, lng: 55.2708 },
        'teerã': { lat: 35.6892, lng: 51.3890 },
        'teera': { lat: 35.6892, lng: 51.3890 },
        'bagdá': { lat: 33.3152, lng: 44.3661 },
        'bagda': { lat: 33.3152, lng: 44.3661 },
        'jerusalém': { lat: 31.7683, lng: 35.2137 },
        'jerusalem': { lat: 31.7683, lng: 35.2137 },
        'ancara': { lat: 39.9334, lng: 32.8597 },
        'istambul': { lat: 41.0082, lng: 28.9784 },
        'bangkok': { lat: 13.7563, lng: 100.5018 },
        'jacarta': { lat: -6.2088, lng: 106.8456 },
        'manila': { lat: 14.5995, lng: 120.9842 },
        'cidade de ho chi minh': { lat: 10.8231, lng: 106.6297 },
        'cidade de hanoi': { lat: 21.0278, lng: 105.8342 },
        'taipé': { lat: 25.0330, lng: 121.5654 },
        'taipei': { lat: 25.0330, lng: 121.5654 },
        
        // ===== ÁFRICA =====
        'cairo': { lat: 30.0444, lng: 31.2357 },
        'alexandria': { lat: 31.2001, lng: 29.9187 },
        'cidade do cabo': { lat: -33.9249, lng: 18.4241 },
        'joanesburgo': { lat: -26.2041, lng: 28.0473 },
        'nairobi': { lat: -1.2921, lng: 36.8219 },
        'lagos': { lat: 6.5244, lng: 3.3792 },
        'casablanca': { lat: 33.5731, lng: -7.5898 },
        'túnis': { lat: 36.8065, lng: 10.1815 },
        'tunis': { lat: 36.8065, lng: 10.1815 },
        'dacar': { lat: 14.7167, lng: -17.4677 },
        'abidjan': { lat: 5.3595, lng: -4.0083 },
        'acra': { lat: 5.6037, lng: -0.1870 },
        'addis ababa': { lat: 9.0320, lng: 38.7469 },
        'kampala': { lat: 0.3476, lng: 32.5825 },
        'dar es salaam': { lat: -6.7924, lng: 39.2083 },
        'maputo': { lat: -25.9692, lng: 32.5732 },
        'luanda': { lat: -8.8390, lng: 13.2894 },
        'windhoek': { lat: -22.5609, lng: 17.0658 },
        'gaborone': { lat: -24.6282, lng: 25.9231 },
        
        // ===== OCEANIA =====
        'sydney': { lat: -33.8688, lng: 151.2093 },
        'melbourne': { lat: -37.8136, lng: 144.9631 },
        'auckland': { lat: -36.8485, lng: 174.7633 },
        'brisbane': { lat: -27.4698, lng: 153.0251 },
        'perth': { lat: -31.9505, lng: 115.8605 },
        'wellington': { lat: -41.2865, lng: 174.7762 },
        'christchurch': { lat: -43.5321, lng: 172.6362 },
        
        // ===== PAÍSES =====
        'frança': { lat: 46.6034, lng: 1.8883 },
        'franca': { lat: 46.6034, lng: 1.8883 },
        'portugal': { lat: 39.3999, lng: -8.2245 },
        'espanha': { lat: 40.4637, lng: -3.7492 },
        'italia': { lat: 41.8719, lng: 12.5674 },
        'alemanha': { lat: 51.1657, lng: 10.4515 },
        'inglaterra': { lat: 51.5074, lng: -0.1278 },
        'reino unido': { lat: 51.5074, lng: -0.1278 },
        'egito': { lat: 26.8206, lng: 30.8025 },
        'grécia': { lat: 39.0742, lng: 21.8243 },
        'greece': { lat: 39.0742, lng: 21.8243 },
        'china': { lat: 35.8617, lng: 104.1954 },
        'japão': { lat: 36.2048, lng: 138.2529 },
        'japao': { lat: 36.2048, lng: 138.2529 },
        'india': { lat: 20.5937, lng: 78.9629 },
        'rússia': { lat: 61.5240, lng: 105.3188 },
        'russia': { lat: 61.5240, lng: 105.3188 },
        'estados unidos': { lat: 37.0902, lng: -95.7129 },
        'méxico': { lat: 23.6345, lng: -102.5528 },
        'mexico': { lat: 23.6345, lng: -102.5528 },
        'argentina': { lat: -38.4161, lng: -63.6167 },
        'peru': { lat: -9.1900, lng: -75.0152 },
        'colômbia': { lat: 4.5709, lng: -74.2973 },
        'colombia': { lat: 4.5709, lng: -74.2973 },
        'austrália': { lat: -25.2744, lng: 133.7751 },
        'australia': { lat: -25.2744, lng: 133.7751 },
        'nova zelândia': { lat: -40.9006, lng: 174.8860 },
        'nova zelandia': { lat: -40.9006, lng: 174.8860 },
        'suiça': { lat: 46.8182, lng: 8.2275 },
        'suica': { lat: 46.8182, lng: 8.2275 },
        'holanda': { lat: 52.1326, lng: 5.2913 },
        'bélgica': { lat: 50.5039, lng: 4.4699 },
        'belgica': { lat: 50.5039, lng: 4.4699 },
        'áustria': { lat: 47.5162, lng: 14.5501 },
        'austria': { lat: 47.5162, lng: 14.5501 },
        'suécia': { lat: 60.1282, lng: 18.6435 },
        'suecia': { lat: 60.1282, lng: 18.6435 },
        'noruega': { lat: 60.4720, lng: 8.4689 },
        'dinamarca': { lat: 56.2639, lng: 9.5018 },
        'polônia': { lat: 51.9194, lng: 19.1451 },
        'polonia': { lat: 51.9194, lng: 19.1451 },
        'turquia': { lat: 38.9637, lng: 35.2433 },
        
        // ===== REGIÕES HISTÓRICAS =====
        'mesopotâmia': { lat: 33.2232, lng: 43.6793 },
        'mesopotamia': { lat: 33.2232, lng: 43.6793 },
        'egito antigo': { lat: 26.8206, lng: 30.8025 },
        'grécia antiga': { lat: 39.0742, lng: 21.8243 },
        'roma antiga': { lat: 41.9028, lng: 12.4964 },
        'império romano': { lat: 41.9028, lng: 12.4964 },
        'china antiga': { lat: 35.8617, lng: 104.1954 },
        'india antiga': { lat: 20.5937, lng: 78.9629 },
        'pérsia': { lat: 32.4279, lng: 53.6880 },
        'persia': { lat: 32.4279, lng: 53.6880 },
        'constantinopla': { lat: 41.0082, lng: 28.9784 },
        'império asteca': { lat: 19.4326, lng: -99.1332 },
        'império maia': { lat: 17.5046, lng: -88.1962 },
        'império inca': { lat: -13.5167, lng: -71.9781 },
        'cuzco': { lat: -13.5167, lng: -71.9781 },
        'machu picchu': { lat: -13.1631, lng: -72.5450 },
        'chichen itza': { lat: 20.6843, lng: -88.5678 },
        'tikal': { lat: 17.2221, lng: -89.6237 },
        
        // ===== CONTINENTES =====
        'europa': { lat: 48.8566, lng: 2.3522 },
        'ásia': { lat: 35.8617, lng: 104.1954 },
        'asia': { lat: 35.8617, lng: 104.1954 },
        'áfrica': { lat: 8.7832, lng: 34.5085 },
        'africa': { lat: 8.7832, lng: 34.5085 },
        'américa do sul': { lat: -15.7975, lng: -47.8919 },
        'america do sul': { lat: -15.7975, lng: -47.8919 },
        'américa do norte': { lat: 37.0902, lng: -95.7129 },
        'america do norte': { lat: 37.0902, lng: -95.7129 },
        'américa': { lat: 37.0902, lng: -95.7129 },
        'america': { lat: 37.0902, lng: -95.7129 },
        'oceania': { lat: -33.8688, lng: 151.2093 },
    };
    
    // Busca por correspondência exata ou parcial
    for (const [key, coords] of Object.entries(coordenadas)) {
        if (lugarLower === key || lugarLower.includes(key)) {
            return coords;
        }
    }
    
    return { lat: 0, lng: 0 };
}

// ---------- BUSCAR COORDENADAS POR NOME (Geocoding) ----------
function buscarCoordenadasPorNome(lugar, nomeEvento) {
    console.log('🔍 Buscando coordenadas para:', lugar);
    
    const coordsCache = obterCoordenadas(lugar);
    if (coordsCache.lat !== 0 || coordsCache.lng !== 0) {
        console.log('✅ Coordenadas encontradas no cache:', coordsCache);
        criarMapaComCoordenadas(coordsCache.lat, coordsCache.lng, lugar, nomeEvento);
        return;
    }
    
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(lugar)}&format=json&limit=1&accept-language=pt`;
    
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="flex items-center justify-center h-full bg-[#F5F0E6]">
                <div class="text-center">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p class="text-[#8B7355]">🔍 Buscando localização...</p>
                </div>
            </div>
        `;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('📡 Resposta do geocoding:', data);
            
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                const displayName = data[0].display_name || lugar;
                
                console.log('📍 Coordenadas encontradas:', lat, lng);
                criarMapaComCoordenadas(lat, lng, displayName, nomeEvento);
            } else {
                console.log('⚠️ Local não encontrado, usando coordenadas padrão');
                criarMapaComCoordenadas(0, 0, lugar, nomeEvento);
            }
        })
        .catch(error => {
            console.error('❌ Erro no geocoding:', error);
            criarMapaComCoordenadas(0, 0, lugar, nomeEvento);
        });
}

// ---------- CRIAR MAPA COM COORDENADAS ----------
function criarMapaComCoordenadas(lat, lng, lugar, nomeEvento) {
    try {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('❌ Container do mapa não encontrado');
            return;
        }
        
        if (currentMap) {
            currentMap.remove();
            currentMap = null;
        }
        
        mapContainer.innerHTML = '';
        
        const zoom = (lat === 0 && lng === 0) ? 2 : 6;
        const viewLat = (lat === 0 && lng === 0) ? 20 : lat;
        const viewLng = (lat === 0 && lng === 0) ? 0 : lng;
        
        console.log(`🗺️ Criando mapa: lat=${viewLat}, lng=${viewLng}, zoom=${zoom}`);
        
        currentMap = L.map('map', {
            center: [viewLat, viewLng],
            zoom: zoom,
            zoomControl: true
        });
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(currentMap);
        
        // Criar ícone personalizado
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="background: #8B6914; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid #5C4033; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                    📍
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        if (lat !== 0 || lng !== 0) {
            const marker = L.marker([lat, lng], { icon: customIcon })
                .bindPopup(`
                    <div style="font-family: 'Lato', sans-serif; text-align: center; min-width: 200px;">
                        <strong style="color: #5C4033; font-size: 1.2rem; display: block; margin-bottom: 4px;">${escapeHtml(nomeEvento)}</strong>
                        <span style="color: #8B7355; font-size: 1.1rem;">📍 ${escapeHtml(lugar)}</span>
                        <div style="margin-top: 8px; font-size: 0.9rem; color: #8B7355;">
                            📅 ${new Date().getFullYear()}
                        </div>
                    </div>
                `, {
                    maxWidth: 300
                })
                .openPopup();
            
            // Adicionar círculo de destaque
            L.circle([lat, lng], {
                color: '#8B6914',
                fillColor: '#D4C5A9',
                fillOpacity: 0.2,
                radius: 50000
            }).addTo(currentMap);
            
        } else {
            // Se não tiver coordenadas, mostrar mensagem no mapa
            L.popup()
                .setLatLng([20, 0])
                .setContent(`
                    <div style="text-align: center; padding: 15px;">
                        <span style="font-size: 3rem;">🌍</span>
                        <p style="color: #5C4033; font-weight: bold; margin-top: 8px; font-size: 1.1rem;">Localização não encontrada</p>
                        <p style="color: #8B7355; font-size: 1rem;">${escapeHtml(lugar)}</p>
                        <p style="color: #8B7355; font-size: 0.9rem; margin-top: 5px;">Tente buscar por uma região mais específica</p>
                    </div>
                `)
                .openOn(currentMap);
        }
        
        setTimeout(() => {
            if (currentMap) {
                currentMap.invalidateSize();
            }
        }, 300);
        
        console.log('✅ Mapa criado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao criar mapa:', error);
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="flex items-center justify-center h-full bg-[#F5F0E6]">
                    <div class="text-center p-4">
                        <span class="text-4xl">⚠️</span>
                        <p class="text-[#8B7355] mt-2">Erro ao carregar o mapa</p>
                        <p class="text-sm text-[#8B7355]">Tente novamente</p>
                    </div>
                </div>
            `;
        }
    }
}

// ---------- FUNÇÃO PRINCIPAL MOSTRAR MAPA ----------
function mostrarMapa(lugar, nomeEvento) {
    console.log('📍 Mostrando mapa para:', lugar, nomeEvento);
    
    const modal = document.getElementById('mapModal');
    const mapContainer = document.getElementById('map');
    
    if (!modal || !mapContainer) {
        console.error('❌ Modal ou container do mapa não encontrado');
        return;
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    mapContainer.innerHTML = `
        <div class="flex items-center justify-center h-full bg-[#F5F0E6]">
            <div class="text-center">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-[#8B7355]">🗺️ Carregando mapa...</p>
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
    if (isLoading) return;
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
        <div class="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
            <div class="text-7xl mb-4">🦉</div>
            <p class="text-red-600 text-xl mb-4">${mensagem}</p>
            <button onclick="location.reload()" class="btn-primary px-6 py-2 text-white rounded-xl font-semibold shadow-lg">
                Tentar Novamente
            </button>
        </div>
    `;
}