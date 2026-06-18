// API Configuration
const API_URL = 'https://backendtcccronohistory.vercel.app/periodos';

// Estado global
let todosPeriodos = [];
let todosEventos = [];
let eventosFiltrados = [];
let currentPage = 1;
let isLoading = false;
let currentMap = null;
let itemsPerLoad = 8;

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

// Adicionar evento à timeline com estilo melhorado - TEXTOS MAIORES
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
    
    // Determinar ícone baseado no tipo de evento
    let icone = '📜';
    if (isPeriodoEvent) icone = '📚';
    else if (evento.nome && (evento.nome.includes('Guerra') || evento.nome.includes('Batalha'))) icone = '⚔️';
    else if (evento.nome && (evento.nome.includes('Revolução') || evento.nome.includes('Revolta'))) icone = '✊';
    else if (evento.nome && (evento.nome.includes('Descobr') || evento.nome.includes('Exploração'))) icone = '🧭';
    else if (evento.nome && (evento.nome.includes('Arte') || evento.nome.includes('Renasc'))) icone = '🎨';
    else if (evento.nome && (evento.nome.includes('Ciência') || evento.nome.includes('Invenção'))) icone = '🔬';
    
    itemDiv.innerHTML = `
        <div class="flex flex-col md:flex-row items-start ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}">
            <!-- Dot da linha do tempo -->
            <div class="timeline-dot absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-7 h-7 ${isPeriodoEvent ? 'bg-[#D4C5A9]' : 'bg-[#8B6914]'} rounded-full z-10"
                 style="box-shadow: 0 0 0 5px rgba(139, 105, 20, 0.25);">
            </div>
            
            <!-- Card do evento -->
            <div class="flex-1 md:w-1/2 ${isLeft ? 'md:pr-16 md:pl-8' : 'md:pl-16 md:pr-8'} pl-16 md:pl-0">
                <div class="timeline-card p-7 cursor-pointer">
                    <!-- Cabeçalho do card - TÍTULO GRANDE -->
                    <div class="flex justify-between items-start mb-5 flex-wrap gap-3">
                        <h3 class="text-4xl font-bold text-[#5C4033] flex items-center gap-3">
                            <span class="text-3xl">${icone}</span>
                            ${escapeHtml(nome)}
                        </h3>
                        <span class="year-badge text-white px-6 py-3 rounded-full text-xl font-bold shadow-md">
                            ${escapeHtml(ano)}
                        </span>
                    </div>
                    
                    <!-- Descrição - TEXTO GRANDE E VISÍVEL -->
                    <p class="text-[#5C4033] mb-5 leading-relaxed line-clamp-3 text-2xl font-medium">
                        ${escapeHtml(descricao)}
                    </p>
                    
                    <!-- Tags informativas - TEXTO MAIOR -->
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
                    
                    <!-- Botões de ação - TEXTO MAIOR -->
                    <div class="flex gap-4 mt-5 flex-wrap">
                        <button onclick="abrirSaberMais(${evento.id})" 
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
            <p class="text-[#8B7355] text-xl">Buscando informações detalhadas sobre ${evento.nome}...</p>
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
                        <h4 class="text-2xl font-bold text-[#5C4033] flex items-center gap-2">
                            <span>📜</span> ${escapeHtml(evento.nome)}
                        </h4>
                        <p class="text-base text-[#8B7355] mt-1">${escapeHtml(evento.ano)} • ${escapeHtml(evento.lugar)}</p>
                    </div>
                    
                    <div class="bg-[#F5F0E6] p-5 rounded-xl">
                        <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                            <span>📖</span> O que aconteceu:
                        </h5>
                        <p class="text-[#6B5B4F] leading-relaxed text-base">${escapeHtml(eventoDetalhado?.oque_aconteceu || evento.oque_aconteceu || 'Informação não disponível')}</p>
                    </div>
                    
                    <div class="bg-[#F5F0E6] p-5 rounded-xl">
                        <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                            <span>🔄</span> O que mudou:
                        </h5>
                        <p class="text-[#6B5B4F] leading-relaxed text-base">${escapeHtml(eventoDetalhado?.oque_mudou || evento.oque_mudou || 'Impacto histórico significativo documentado')}</p>
                    </div>
                    
                    ${eventoDetalhado?.figuras_principais && eventoDetalhado.figuras_principais.length > 0 ? `
                        <div>
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>👥</span> Figuras principais:
                            </h5>
                            <ul class="list-disc list-inside text-[#6B5B4F] space-y-2 text-base">
                                ${eventoDetalhado.figuras_principais.map(f => `<li>${escapeHtml(f.nome)} - ${escapeHtml(f.papel)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${informacoes.caracteristicas_principais && informacoes.caracteristicas_principais.length > 0 ? `
                        <div>
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>✨</span> Características principais:
                            </h5>
                            <ul class="list-disc list-inside text-[#6B5B4F] space-y-2 text-base">
                                ${informacoes.caracteristicas_principais.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${(informacoes.curiosidades && informacoes.curiosidades.length > 0) || (evento.curiosidades && evento.curiosidades.length > 0) ? `
                        <div class="bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] p-6 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>🦉</span> Curiosidades históricas:
                            </h5>
                            <ul class="space-y-3">
                                ${(informacoes.curiosidades || evento.curiosidades || []).slice(0, 3).map(c => `<li class="text-base text-[#6B5B4F] flex items-start gap-2"><span class="text-[#8B6914]">•</span> ${escapeHtml(c)}</li>`).join('')}
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
                    
                    <div class="bg-[#F5F0E6] p-5 rounded-xl">
                        <h5 class="font-semibold text-[#5C4033] mb-3 text-lg">📖 Descrição:</h5>
                        <p class="text-[#6B5B4F] text-base">${escapeHtml(evento.oque_aconteceu || 'Este evento marcou a história de forma significativa.')}</p>
                    </div>
                    
                    ${evento.legado ? `
                        <div class="bg-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 text-lg">🏛️ Legado:</h5>
                            <p class="text-[#6B5B4F] text-base">${escapeHtml(evento.legado)}</p>
                        </div>
                    ` : ''}
                    
                    <div class="bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] p-5 rounded-xl text-center">
                        <span class="text-4xl">🦉</span>
                        <p class="text-base text-[#8B7355] mt-3">Para mais detalhes, consulte fontes históricas especializadas.</p>
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
                    <p class="text-base text-[#6B5B4F] mt-2">${escapeHtml(evento.oque_aconteceu || 'Evento histórico importante.')}</p>
                </div>
            </div>
        `;
    }
}

// 🔥 FUNÇÃO MAPA CORRIGIDA - COM COORDENADAS COMPLETAS
function mostrarMapa(lugar, nomeEvento) {
    console.log('📍 Mostrando mapa para:', lugar, nomeEvento);
    
    const modal = document.getElementById('mapModal');
    const mapContainer = document.getElementById('map');
    
    if (!modal || !mapContainer) {
        console.error('❌ Modal ou container do mapa não encontrado');
        return;
    }
    
    // Mostrar o modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Pequeno delay para garantir que o modal esteja visível
    setTimeout(() => {
        try {
            // Remover mapa anterior se existir
            if (currentMap) {
                currentMap.remove();
                currentMap = null;
            }
            
            // Obter coordenadas
            const coordenadas = obterCoordenadas(lugar);
            console.log('📍 Coordenadas obtidas:', coordenadas);
            
            // Se as coordenadas forem 0,0 (default), tentar buscar por geocoding
            if (coordenadas.lat === 0 && coordenadas.lng === 0) {
                console.log('⚠️ Coordenadas padrão, tentando geocoding...');
                buscarCoordenadasPorNome(lugar, nomeEvento);
                return;
            }
            
            // Criar novo mapa
            currentMap = L.map('map').setView([coordenadas.lat, coordenadas.lng], 6);
            
            // Adicionar camada do mapa
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(currentMap);
            
            // Adicionar marcador
            const marker = L.marker([coordenadas.lat, coordenadas.lng])
                .bindPopup(`
                    <div style="font-family: 'Lato', sans-serif; text-align: center;">
                        <strong style="color: #5C4033; font-size: 1.2rem; display: block; margin-bottom: 4px;">${escapeHtml(nomeEvento)}</strong>
                        <span style="color: #8B7355; font-size: 1.1rem;">📍 ${escapeHtml(lugar)}</span>
                    </div>
                `)
                .openPopup();
            
            // Forçar atualização do tamanho do mapa
            setTimeout(() => {
                if (currentMap) {
                    currentMap.invalidateSize();
                }
            }, 200);
            
            console.log('✅ Mapa criado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao criar mapa:', error);
        }
    }, 300);
}

// 🔥 BUSCAR COORDENADAS POR NOME (Geocoding)
function buscarCoordenadasPorNome(lugar, nomeEvento) {
    console.log('🔍 Buscando coordenadas para:', lugar);
    
    // Tentar usar a API de geocoding do OpenStreetMap (gratuita)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(lugar)}&format=json&limit=1`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('📡 Resposta do geocoding:', data);
            
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                
                console.log('📍 Coordenadas encontradas:', lat, lng);
                
                // Criar mapa com as coordenadas encontradas
                criarMapaComCoordenadas(lat, lng, lugar, nomeEvento);
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

// 🔥 CRIAR MAPA COM COORDENADAS
function criarMapaComCoordenadas(lat, lng, lugar, nomeEvento) {
    try {
        // Remover mapa anterior se existir
        if (currentMap) {
            currentMap.remove();
            currentMap = null;
        }
        
        // Se as coordenadas forem 0,0, mostrar o mundo inteiro
        const zoom = (lat === 0 && lng === 0) ? 2 : 6;
        const viewLat = (lat === 0 && lng === 0) ? 20 : lat;
        const viewLng = (lat === 0 && lng === 0) ? 0 : lng;
        
        // Criar novo mapa
        currentMap = L.map('map').setView([viewLat, viewLng], zoom);
        
        // Adicionar camada do mapa
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(currentMap);
        
        // Se tiver coordenadas válidas, adicionar marcador
        if (lat !== 0 || lng !== 0) {
            const marker = L.marker([lat, lng])
                .bindPopup(`
                    <div style="font-family: 'Lato', sans-serif; text-align: center;">
                        <strong style="color: #5C4033; font-size: 1.2rem; display: block; margin-bottom: 4px;">${escapeHtml(nomeEvento)}</strong>
                        <span style="color: #8B7355; font-size: 1.1rem;">📍 ${escapeHtml(lugar)}</span>
                    </div>
                `)
                .openPopup();
        } else {
            // Se não tiver coordenadas, mostrar mensagem no mapa
            L.popup()
                .setLatLng([20, 0])
                .setContent(`
                    <div style="text-align: center; padding: 10px;">
                        <span style="font-size: 3rem;">🌍</span>
                        <p style="color: #5C4033; font-weight: bold; margin-top: 8px;">Localização não encontrada</p>
                        <p style="color: #8B7355;">${escapeHtml(lugar)}</p>
                    </div>
                `)
                .openOn(currentMap);
        }
        
        // Forçar atualização do tamanho do mapa
        setTimeout(() => {
            if (currentMap) {
                currentMap.invalidateSize();
            }
        }, 200);
        
        console.log('✅ Mapa criado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao criar mapa:', error);
    }
}

// 🔥 COORDENADAS COMPLETAS - MAIS ABRANGENTE
function obterCoordenadas(lugar) {
    if (!lugar) return { lat: 0, lng: 0 };
    
    const lugarLower = lugar.toLowerCase().trim();
    
    // ============ PAÍSES ============
    const paises = {
        'frança': { lat: 46.6034, lng: 1.8883 },
        'franca': { lat: 46.6034, lng: 1.8883 },
        'france': { lat: 46.6034, lng: 1.8883 },
        'brasil': { lat: -14.2350, lng: -51.9253 },
        'brazil': { lat: -14.2350, lng: -51.9253 },
        'portugal': { lat: 39.3999, lng: -8.2245 },
        'espanha': { lat: 40.4637, lng: -3.7492 },
        'spain': { lat: 40.4637, lng: -3.7492 },
        'italia': { lat: 41.8719, lng: 12.5674 },
        'italy': { lat: 41.8719, lng: 12.5674 },
        'alemanha': { lat: 51.1657, lng: 10.4515 },
        'germany': { lat: 51.1657, lng: 10.4515 },
        'inglaterra': { lat: 51.5074, lng: -0.1278 },
        'england': { lat: 51.5074, lng: -0.1278 },
        'reino unido': { lat: 51.5074, lng: -0.1278 },
        'uk': { lat: 51.5074, lng: -0.1278 },
        'egito': { lat: 26.8206, lng: 30.8025 },
        'egypt': { lat: 26.8206, lng: 30.8025 },
        'grécia': { lat: 39.0742, lng: 21.8243 },
        'greece': { lat: 39.0742, lng: 21.8243 },
        'china': { lat: 35.8617, lng: 104.1954 },
        'japão': { lat: 36.2048, lng: 138.2529 },
        'japan': { lat: 36.2048, lng: 138.2529 },
        'india': { lat: 20.5937, lng: 78.9629 },
        'russia': { lat: 61.5240, lng: 105.3188 },
        'estados unidos': { lat: 37.0902, lng: -95.7129 },
        'usa': { lat: 37.0902, lng: -95.7129 },
        'méxico': { lat: 23.6345, lng: -102.5528 },
        'mexico': { lat: 23.6345, lng: -102.5528 },
        'argentina': { lat: -38.4161, lng: -63.6167 },
        'peru': { lat: -9.1900, lng: -75.0152 },
        'colômbia': { lat: 4.5709, lng: -74.2973 },
        'colombia': { lat: 4.5709, lng: -74.2973 },
    };
    
    // ============ CIDADES ============
    const cidades = {
        'paris': { lat: 48.8566, lng: 2.3522 },
        'roma': { lat: 41.9028, lng: 12.4964 },
        'londres': { lat: 51.5074, lng: -0.1278 },
        'lisboa': { lat: 38.7223, lng: -9.1393 },
        'madrid': { lat: 40.4168, lng: -3.7038 },
        'berlim': { lat: 52.5200, lng: 13.4050 },
        'atenas': { lat: 37.9838, lng: 23.7275 },
        'cairo': { lat: 30.0444, lng: 31.2357 },
        'moscou': { lat: 55.7558, lng: 37.6173 },
        'pequim': { lat: 39.9042, lng: 116.4074 },
        'toquio': { lat: 35.6762, lng: 139.6503 },
        'brasilia': { lat: -15.7975, lng: -47.8919 },
        'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
        'são paulo': { lat: -23.5505, lng: -46.6333 },
        'salvador': { lat: -12.9777, lng: -38.5016 },
        'recife': { lat: -8.0476, lng: -34.8770 },
        'fortaleza': { lat: -3.7327, lng: -38.5270 },
        'belo horizonte': { lat: -19.9191, lng: -43.9386 },
        'porto alegre': { lat: -30.0346, lng: -51.2177 },
        'curitiba': { lat: -25.4296, lng: -49.2713 },
        'manaus': { lat: -3.1190, lng: -60.0217 },
        'nova york': { lat: 40.7128, lng: -74.0060 },
        'los angeles': { lat: 34.0522, lng: -118.2437 },
        'miami': { lat: 25.7617, lng: -80.1918 },
        'toronto': { lat: 43.6532, lng: -79.3832 },
        'sydney': { lat: -33.8688, lng: 151.2093 },
        'cidade do méxico': { lat: 19.4326, lng: -99.1332 },
        'bogotá': { lat: 4.7110, lng: -74.0721 },
        'lima': { lat: -12.0464, lng: -77.0428 },
        'santiago': { lat: -33.4489, lng: -70.6693 },
        'buenos aires': { lat: -34.6037, lng: -58.3816 },
        'jerusalém': { lat: 31.7683, lng: 35.2137 },
        'alexandria': { lat: 31.2001, lng: 29.9187 },
        'constantinopla': { lat: 41.0082, lng: 28.9784 },
    };
    
    // ============ REGIÕES HISTÓRICAS ============
    const regioes = {
        'mesopotâmia': { lat: 33.2232, lng: 43.6793 },
        'mesopotamia': { lat: 33.2232, lng: 43.6793 },
        'egito antigo': { lat: 26.8206, lng: 30.8025 },
        'grécia antiga': { lat: 39.0742, lng: 21.8243 },
        'roma antiga': { lat: 41.9028, lng: 12.4964 },
        'império romano': { lat: 41.9028, lng: 12.4964 },
        'china antiga': { lat: 35.8617, lng: 104.1954 },
        'india antiga': { lat: 20.5937, lng: 78.9629 },
        'persia': { lat: 32.4279, lng: 53.6880 },
        'américa do sul': { lat: -15.7975, lng: -47.8919 },
        'america do sul': { lat: -15.7975, lng: -47.8919 },
        'europa': { lat: 48.8566, lng: 2.3522 },
        'asia': { lat: 35.8617, lng: 104.1954 },
        'africa': { lat: 8.7832, lng: 34.5085 },
        'américa': { lat: 37.0902, lng: -95.7129 },
        'america': { lat: 37.0902, lng: -95.7129 },
        'oceania': { lat: -33.8688, lng: 151.2093 },
        'oriente médio': { lat: 29.2985, lng: 42.5510 },
        'oriente medio': { lat: 29.2985, lng: 42.5510 },
    };
    
    // ============ CONTINENTES ============
    const continentes = {
        'europa': { lat: 48.8566, lng: 2.3522 },
        'asia': { lat: 35.8617, lng: 104.1954 },
        'áfrica': { lat: 8.7832, lng: 34.5085 },
        'africa': { lat: 8.7832, lng: 34.5085 },
        'américa do sul': { lat: -15.7975, lng: -47.8919 },
        'america do sul': { lat: -15.7975, lng: -47.8919 },
        'américa do norte': { lat: 37.0902, lng: -95.7129 },
        'america do norte': { lat: 37.0902, lng: -95.7129 },
        'oceania': { lat: -33.8688, lng: 151.2093 },
    };
    
    // ============ BUSCA ============
    // 1. Buscar em cidades
    for (const [key, coords] of Object.entries(cidades)) {
        if (lugarLower.includes(key)) {
            return coords;
        }
    }
    
    // 2. Buscar em países
    for (const [key, coords] of Object.entries(paises)) {
        if (lugarLower.includes(key)) {
            return coords;
        }
    }
    
    // 3. Buscar em regiões históricas
    for (const [key, coords] of Object.entries(regioes)) {
        if (lugarLower.includes(key)) {
            return coords;
        }
    }
    
    // 4. Buscar em continentes
    for (const [key, coords] of Object.entries(continentes)) {
        if (lugarLower.includes(key)) {
            return coords;
        }
    }
    
    // 5. Se não encontrar, retorna default (será feita busca por geocoding)
    return { lat: 0, lng: 0 };
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