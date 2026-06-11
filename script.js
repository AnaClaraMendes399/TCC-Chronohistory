// API Configuration
const API_URL = 'https://backendtcccronohistory.vercel.app/periodos';

// Estado global
let todosPeriodos = [];
let todosEventos = [];
let eventosFiltrados = [];
let currentPage = 1;
let isLoading = false;
let currentMap = null;
let itemsPerLoad = 8; // Aumentado para melhor experiência



// Script para abrir/fechar menu mobile
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
    
menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    setupEventListeners();
});

// Carregar dados da API
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

// Função melhorada para converter ano em número para ordenação
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

// Função para formatar ano para exibição
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

// Processar eventos de todos os períodos
function processarEventos() {
    todosEventos = [];
    
    todosPeriodos.forEach(periodo => {
        if (periodo.acontecimentos && Array.isArray(periodo.acontecimentos)) {
            periodo.acontecimentos.forEach(evento => {
                const anoNumerico = converterAnoParaNumero(evento.ano);
                const anoFormatado = formatarAno(evento.ano);
                
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
                    curiosidades: periodo.curiosidades || []
                });
            });
        } else if (periodo.nome) {
            const periodoInfo = periodo.periodo || '';
            const anoNumerico = converterAnoParaNumero(periodoInfo);
            const anoFormatado = formatarAno(periodoInfo);
            
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
                curiosidades: periodo.curiosidades || []
            });
        }
    });
    
    // Ordenar eventos por ano numérico (cronologicamente)
    todosEventos.sort((a, b) => {
        if (a.anoNumerico !== b.anoNumerico) {
            return a.anoNumerico - b.anoNumerico;
        }
        return (a.nome || '').localeCompare(b.nome || '');
    });
    
    console.log(`Processados ${todosEventos.length} eventos históricos em ordem cronológica`);
}

// Preencher opções dos filtros
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

// Aplicar filtros
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

// Renderizar linha do tempo com scroll infinito
function renderTimeline() {
    const container = document.getElementById('timelineItems');
    const start = 0;
    const end = currentPage * itemsPerLoad;
    const eventosToShow = eventosFiltrados.slice(start, end);
    
    if (currentPage === 1) {
        container.innerHTML = '';
        
        const timelineInfo = document.createElement('div');
        timelineInfo.className = 'text-center mb-8 p-4 bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] rounded-2xl shadow-md';
        timelineInfo.innerHTML = `
            <div class="flex items-center justify-center gap-3">
                <span class="text-2xl">🦉</span>
                <p class="text-[#5C4033] font-semibold">
                    Linha do tempo cronológica - ${eventosFiltrados.length} evento(s) no total
                </p>
                <span class="text-2xl">📅</span>
            </div>
        `;
        container.appendChild(timelineInfo);
    }
    
    if (eventosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
                <div class="text-7xl mb-4">🦉</div>
                <p class="text-[#8B7355] text-lg">Nenhum evento encontrado com os filtros selecionados.</p>
                <p class="text-[#8B7355] mt-2">Tente ajustar seus filtros para descobrir mais histórias!</p>
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

// Adicionar evento à timeline com estilo melhorado e alternado
function adicionarEventoTimeline(evento, container, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'timeline-item relative';
    itemDiv.setAttribute('data-event-id', evento.id);
    itemDiv.setAttribute('data-ano', evento.anoNumerico);
    
    // Alternar entre esquerda e direita
    const isLeft = index % 2 === 0;
    
    const nome = evento.nome || 'Evento Histórico';
    const ano = evento.ano || 'Data desconhecida';
    const lugar = evento.lugar || 'Regiões diversas';
    const descricao = evento.oque_aconteceu || 'Descrição disponível no "Saber Mais"';
    const periodoNome = evento.periodoNome || 'Período histórico';
    
    const isPeriodoEvent = !evento.oque_aconteceu || evento.oque_aconteceu.includes('Período histórico');
    
    itemDiv.innerHTML = `
        <div class="flex flex-col md:flex-row items-start ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}">
            <!-- Dot da linha do tempo -->
            <div class="timeline-dot absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-5 h-5 ${isPeriodoEvent ? 'bg-[#D4C5A9]' : 'bg-[#8B6914]'} rounded-full z-10"
                 style="box-shadow: 0 0 0 4px rgba(139, 105, 20, 0.2);">
            </div>
            
            <!-- Card do evento -->
            <div class="flex-1 md:w-1/2 ${isLeft ? 'md:pr-16 md:pl-8' : 'md:pl-16 md:pr-8'} pl-16 md:pl-0">
                <div class="timeline-card p-6 cursor-pointer">
                    <!-- Cabeçalho do card -->
                    <div class="flex justify-between items-start mb-4 flex-wrap gap-2">
                        <h3 class="text-xl font-bold text-[#5C4033] flex items-center gap-2">
                            <span class="text-2xl">${isPeriodoEvent ? '📚' : '📜'}</span>
                            ${escapeHtml(nome)}
                        </h3>
                        <span class="year-badge text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-md">
                            ${escapeHtml(ano)}
                        </span>
                    </div>
                    
                    <!-- Descrição -->
                    <p class="text-[#6B5B4F] mb-4 leading-relaxed line-clamp-3">
                        ${escapeHtml(descricao)}
                    </p>
                    
                    <!-- Tags informativas -->
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="text-xs bg-[#F5F0E6] px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                            <span>📍</span> ${escapeHtml(lugar)}
                        </span>
                        <span class="text-xs bg-[#F5F0E6] px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                            <span>📚</span> ${escapeHtml(periodoNome)}
                        </span>
                        ${evento.anoNumerico !== 9999 ? `
                            <span class="text-xs bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                                <span>📅</span> Ordem: ${evento.anoNumerico < 0 ? `${Math.abs(evento.anoNumerico)}º a.C.` : `${evento.anoNumerico}º d.C.`}
                            </span>
                        ` : ''}
                    </div>
                    
                    <!-- Botões de ação -->
                    <div class="flex gap-3 mt-4">
                        <button onclick="abrirSaberMais(${evento.id})" 
                                class="btn-primary px-4 py-2 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md">
                            🦉 Saber Mais
                        </button>
                        <button onclick="mostrarMapa('${escapeHtml(lugar)}', '${escapeHtml(nome)}')" 
                                class="btn-secondary px-4 py-2 border-2 border-[#8B6914] text-[#8B6914] rounded-xl text-sm font-semibold hover:bg-[#8B6914] hover:text-white transition-all duration-300 flex items-center gap-2">
                            🗺️ Ver Mapa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(itemDiv);
}

// Função para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Abrir modal "Saber Mais"
async function abrirSaberMais(eventoId) {
    const evento = todosEventos.find(e => e.id === eventoId);
    if (!evento) {
        console.error('Evento não encontrado:', eventoId);
        return;
    }
    
    const modal = document.getElementById('saberMaisModal');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = `
        <div class="text-center py-8">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-[#8B7355]">Buscando informações detalhadas sobre ${evento.nome}...</p>
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
            body: JSON.stringify({ periodo: evento.periodoNome })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Resposta do POST:', data);
        
        let informacoes = null;
        
        if (data.informações) {
            informacoes = data.informações.periodo_unico || data.informações;
        } else if (data.periodo_unico) {
            informacoes = data.periodo_unico;
        } else if (data.data) {
            informacoes = data.data;
        }
        
        if (informacoes) {
            const eventoDetalhado = informacoes.acontecimentos?.find(e => e.id === eventoId);
            
            modalContent.innerHTML = `
                <div class="space-y-5">
                    <div class="border-b-2 border-[#D4C5A9] pb-4">
                        <h4 class="text-xl font-bold text-[#5C4033] flex items-center gap-2">
                            <span>📜</span> ${escapeHtml(evento.nome)}
                        </h4>
                        <p class="text-sm text-[#8B7355] mt-1">${escapeHtml(evento.ano)} • ${escapeHtml(evento.lugar)}</p>
                    </div>
                    
                    <div class="bg-[#F5F0E6] p-4 rounded-xl">
                        <h5 class="font-semibold text-[#5C4033] mb-2 flex items-center gap-2">
                            <span>📖</span> O que aconteceu:
                        </h5>
                        <p class="text-[#6B5B4F] leading-relaxed">${escapeHtml(eventoDetalhado?.oque_aconteceu || evento.oque_aconteceu || 'Informação não disponível')}</p>
                    </div>
                    
                    <div class="bg-[#F5F0E6] p-4 rounded-xl">
                        <h5 class="font-semibold text-[#5C4033] mb-2 flex items-center gap-2">
                            <span>🔄</span> O que mudou:
                        </h5>
                        <p class="text-[#6B5B4F] leading-relaxed">${escapeHtml(eventoDetalhado?.oque_mudou || evento.oque_mudou || 'Impacto histórico significativo documentado')}</p>
                    </div>
                    
                    ${eventoDetalhado?.figuras_principais && eventoDetalhado.figuras_principais.length > 0 ? `
                        <div>
                            <h5 class="font-semibold text-[#5C4033] mb-2 flex items-center gap-2">
                                <span>👥</span> Figuras principais:
                            </h5>
                            <ul class="list-disc list-inside text-[#6B5B4F] space-y-1">
                                ${eventoDetalhado.figuras_principais.map(f => `<li>${escapeHtml(f.nome)} - ${escapeHtml(f.papel)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${informacoes.caracteristicas_principais && informacoes.caracteristicas_principais.length > 0 ? `
                        <div>
                            <h5 class="font-semibold text-[#5C4033] mb-2 flex items-center gap-2">
                                <span>✨</span> Características principais:
                            </h5>
                            <ul class="list-disc list-inside text-[#6B5B4F] space-y-1">
                                ${informacoes.caracteristicas_principais.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${(informacoes.curiosidades && informacoes.curiosidades.length > 0) || (evento.curiosidades && evento.curiosidades.length > 0) ? `
                        <div class="bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-2 flex items-center gap-2">
                                <span>🦉</span> Curiosidades históricas:
                            </h5>
                            <ul class="space-y-2">
                                ${(informacoes.curiosidades || evento.curiosidades || []).slice(0, 3).map(c => `<li class="text-sm text-[#6B5B4F] flex items-start gap-2"><span class="text-[#8B6914]">•</span> ${escapeHtml(c)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            modalContent.innerHTML = `
                <div class="space-y-4">
                    <div class="border-b border-[#D4C5A9] pb-3">
                        <h4 class="text-lg font-bold text-[#5C4033]">📜 ${escapeHtml(evento.nome)}</h4>
                        <p class="text-sm text-[#8B7355]">${escapeHtml(evento.ano)} • ${escapeHtml(evento.lugar)}</p>
                    </div>
                    
                    <div class="bg-[#F5F0E6] p-4 rounded-xl">
                        <h5 class="font-semibold text-[#5C4033] mb-2">📖 Descrição:</h5>
                        <p class="text-[#6B5B4F]">${escapeHtml(evento.oque_aconteceu || 'Este evento marcou a história de forma significativa.')}</p>
                    </div>
                    
                    ${evento.legado ? `
                        <div class="bg-[#F5F0E6] p-4 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-2">🏛️ Legado:</h5>
                            <p class="text-[#6B5B4F]">${escapeHtml(evento.legado)}</p>
                        </div>
                    ` : ''}
                    
                    <div class="bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] p-4 rounded-xl text-center">
                        <span class="text-3xl">🦉</span>
                        <p class="text-sm text-[#8B7355] mt-2">Para mais detalhes, consulte fontes históricas especializadas.</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao buscar informações:', error);
        modalContent.innerHTML = `
            <div class="text-center py-8">
                <div class="text-6xl mb-4">⚠️</div>
                <p class="text-[#8B7355]">Erro ao carregar informações detalhadas.</p>
                <p class="text-sm text-[#8B7355] mt-2">Tente novamente mais tarde.</p>
                <div class="mt-4 p-4 bg-[#F5F0E6] rounded-xl text-left">
                    <p class="text-sm text-[#6B5B4F]"><strong>${escapeHtml(evento.nome)}</strong></p>
                    <p class="text-sm text-[#6B5B4F] mt-2">${escapeHtml(evento.oque_aconteceu || 'Evento histórico importante.')}</p>
                </div>
            </div>
        `;
    }
}

// Mostrar mapa
function mostrarMapa(lugar, nomeEvento) {
    const modal = document.getElementById('mapModal');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    setTimeout(() => {
        if (currentMap) {
            currentMap.remove();
        }
        
        const coordenadas = obterCoordenadas(lugar);
        
        currentMap = L.map('map').setView([coordenadas.lat, coordenadas.lng], 5);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(currentMap);
        
        const marker = L.marker([coordenadas.lat, coordenadas.lng])
            .bindPopup(`
                <div style="font-family: 'Lato', sans-serif;">
                    <strong style="color: #5C4033;">${escapeHtml(nomeEvento)}</strong><br>
                    <span style="color: #8B7355;">${escapeHtml(lugar)}</span>
                </div>
            `)
            .openPopup();
        
        currentMap.invalidateSize();
    }, 100);
}

// Obter coordenadas aproximadas
function obterCoordenadas(lugar) {
    const coordenadasBase = {
        'Roma': { lat: 41.9028, lng: 12.4964 },
        'Atenas': { lat: 37.9838, lng: 23.7275 },
        'Paris': { lat: 48.8566, lng: 2.3522 },
        'Londres': { lat: 51.5074, lng: -0.1278 },
        'Jerusalém': { lat: 31.7683, lng: 35.2137 },
        'Alexandria': { lat: 31.2001, lng: 29.9187 },
        'Constantinopla': { lat: 41.0082, lng: 28.9784 },
        'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
        'Brasil': { lat: -14.2350, lng: -51.9253 },
        'Egito': { lat: 26.8206, lng: 30.8025 },
        'Grécia': { lat: 39.0742, lng: 21.8243 },
        'Itália': { lat: 41.8719, lng: 12.5674 },
        'China': { lat: 35.8617, lng: 104.1954 },
        'Estados Unidos': { lat: 37.0902, lng: -95.7129 },
        'Alemanha': { lat: 51.1657, lng: 10.4515 },
        'Espanha': { lat: 40.4637, lng: -3.7492 },
        'Portugal': { lat: 39.3999, lng: -8.2245 },
        'Rússia': { lat: 61.5240, lng: 105.3188 },
        'Japão': { lat: 36.2048, lng: 138.2529 },
        'Índia': { lat: 20.5937, lng: 78.9629 },
        'default': { lat: 0, lng: 0 }
    };
    
    for (const [key, coords] of Object.entries(coordenadasBase)) {
        if (lugar && lugar.toLowerCase().includes(key.toLowerCase())) {
            return coords;
        }
    }
    
    return coordenadasBase.default;
}

// Scroll infinito
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

// Setup event listeners
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
        }
    });
}

function mostrarErro(mensagem) {
    const container = document.getElementById('timelineItems');
    container.innerHTML = `
        <div class="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
            <div class="text-7xl mb-4">🦉</div>
            <p class="text-red-600 text-lg mb-4">${mensagem}</p>
            <button onclick="location.reload()" class="btn-primary px-6 py-2 text-white rounded-xl font-semibold shadow-lg">
                Tentar Novamente
            </button>
        </div>
    `;
}