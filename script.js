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
        console.log('� Dados recebidos da API:', data);
        
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
        
        console.log(`� Encontrados ${todosPeriodos.length} períodos históricos`);
        console.log('� Nomes dos períodos:', todosPeriodos.map(p => p.nome));
        
        if (todosPeriodos.length === 0) {
            mostrarErro('Nenhum dado histórico encontrado na API.');
            return;
        }
        
        processarEventos();
        preencherFiltros();
        aplicarFiltros();
        
    } catch (error) {
        console.error(' Erro ao carregar dados:', error);
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
    
    console.log('� Processando todos os períodos para extrair eventos...');
    
    todosPeriodos.forEach((periodo, periodoIndex) => {
        const periodoNome = periodo.nome || `Período ${periodoIndex + 1}`;
        console.log(`� Processando período: "${periodoNome}"`);
        
        if (periodo.acontecimentos && Array.isArray(periodo.acontecimentos)) {
            console.log(`    Encontrados ${periodo.acontecimentos.length} acontecimentos em "${periodoNome}"`);
            
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
        } else {
            console.log(`   ️ Nenhum acontecimento encontrado em "${periodoNome}"`);
        }
    });
    
    todosEventos.sort((a, b) => {
        if (a.anoNumerico === 9999 && b.anoNumerico === 9999) return 0;
        if (a.anoNumerico === 9999) return 1;
        if (b.anoNumerico === 9999) return -1;
        return a.anoNumerico - b.anoNumerico;
    });
    
    console.log(` Total de eventos processados: ${todosEventos.length}`);
    console.log('� Distribuição por período:');
    const distribuicao = {};
    todosEventos.forEach(e => {
        distribuicao[e.periodoNome] = (distribuicao[e.periodoNome] || 0) + 1;
    });
    console.log(distribuicao);
}

// ============================================
// Filtros
// ============================================
function preencherFiltros() {
    const lugares = [...new Set(todosEventos.map(e => e.lugar).filter(l => l && l !== 'Regiões diversas' && l !== 'Local não especificado'))];
    const lugarOptions = document.getElementById('lugarOptions');
    lugarOptions.innerHTML = ''; // limpar options
    lugares.sort().forEach(lugar => {
        const option = document.createElement('option');
        option.value = lugar;
        lugarOptions.appendChild(option);
    });
    
    const periodos = [...new Set(todosEventos.map(e => e.periodoNome).filter(p => p))];
    const periodoSelect = document.getElementById('periodoFilter');
    
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
    
    console.log(`🔍 Aplicando filtros: lugar="${lugar}", ano="${ano}", periodo="${periodo}"`);
    
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
    
    eventosFiltrados.sort((a, b) => {
        if (a.anoNumerico === 9999 && b.anoNumerico === 9999) return 0;
        if (a.anoNumerico === 9999) return 1;
        if (b.anoNumerico === 9999) return -1;
        return a.anoNumerico - b.anoNumerico;
    });
    
    console.log(`� Filtrados ${eventosFiltrados.length} eventos de ${todosEventos.length} total`);
    console.log('� Distribuição após filtro:');
    const distribuicao = {};
    eventosFiltrados.forEach(e => {
        distribuicao[e.periodoNome] = (distribuicao[e.periodoNome] || 0) + 1;
    });
    console.log(distribuicao);
    
    currentPage = 1;
    totalEventosCarregados = 0;
    todosEventosCarregados = false;
    renderTimeline();
}

// ============================================
// Renderizar Timeline - CORRIGIDO (sem repetição)
// ============================================
function renderTimeline() {
    const container = document.getElementById('timelineItems');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Calcular quantos eventos já foram carregados
    const start = totalEventosCarregados;
    const end = Math.min(start + itemsPerLoad, eventosFiltrados.length);
    const eventosToShow = eventosFiltrados.slice(start, end);
    
    console.log(` Renderizando: start=${start}, end=${end}, total=${eventosFiltrados.length}`);
    
    if (currentPage === 1) {
        container.innerHTML = '';
        totalEventosCarregados = 0;
    }
    
    if (eventosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
                <div class="text-7xl mb-4"></div>
                <p class="text-[#8B7355] text-xl">Nenhum evento encontrado com os filtros selecionados.</p>
                <p class="text-[#8B7355] mt-3 text-lg">Tente ajustar seus filtros para descobrir mais histórias!</p>
            </div>
        `;
        loadingIndicator.classList.add('hidden');
        return;
    }
    
    // Adicionar APENAS os novos eventos (start até end)
    eventosToShow.forEach((evento, index) => {
        adicionarEventoTimeline(evento, container, totalEventosCarregados + index);
    });
    
    // Atualizar contador de eventos carregados
    totalEventosCarregados += eventosToShow.length;
    
    // Verificar se já mostrou todos os eventos
    const allEventsShown = totalEventosCarregados >= eventosFiltrados.length;
    
    if (allEventsShown) {
        loadingIndicator.classList.add('hidden');
        todosEventosCarregados = true;
        
        // Removido o "Fim da Jornada Histórica" - apenas esconde o loading
        // Não adiciona mais nenhuma mensagem de fim
        
    } else {
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.innerHTML = `
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-[#EDD9A3] text-lg">Carregando mais eventos históricos...</p>
            <p class="text-[#EDD9A3] text-sm mt-2">${totalEventosCarregados} de ${eventosFiltrados.length} eventos carregados</p>
            <p class="text-[#EDD9A3] text-xs mt-1">${Math.round((totalEventosCarregados / eventosFiltrados.length) * 100)}% completo</p>
        `;
        todosEventosCarregados = false;
        
        // Remove observers antigos
        const oldObserver = loadingIndicator._observer;
        if (oldObserver) {
            oldObserver.disconnect();
        }
        
        // Configurar novo observer para scroll infinito
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

function adicionarEventoTimeline(evento, container, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'timeline-item relative';
    itemDiv.setAttribute('data-event-id', evento.id);
    itemDiv.setAttribute('data-ano', evento.anoNumerico);
    itemDiv.setAttribute('data-periodo', evento.periodoNome);
    
    const isLeft = index % 2 === 0;
    
    const nome = evento.nome || 'Evento Histórico';
    const ano = evento.ano || 'Data desconhecida';
    const lugar = evento.lugar || 'Regiões diversas';
    const descricao = evento.oque_aconteceu || 'Descrição disponível no "Saber Mais"';
    const periodoNome = evento.periodoNome || 'Período histórico';
    
    let icone = '';
    const nomeLower = (evento.nome || '').toLowerCase();
    if (nomeLower.includes('guerra') || nomeLower.includes('batalha') || nomeLower.includes('conquista')) icone = '️';
    else if (nomeLower.includes('revolução') || nomeLower.includes('revolta') || nomeLower.includes('independência')) icone = '';
    else if (nomeLower.includes('descobr') || nomeLower.includes('exploração') || nomeLower.includes('viagem')) icone = '';
    else if (nomeLower.includes('arte') || nomeLower.includes('renasc') || nomeLower.includes('cultura')) icone = '�';
    else if (nomeLower.includes('ciência') || nomeLower.includes('invenção') || nomeLower.includes('tecnologia')) icone = '�';
    else if (nomeLower.includes('império') || nomeLower.includes('reino') || nomeLower.includes('dinastia')) icone = '';
    else if (nomeLower.includes('religião') || nomeLower.includes('igreja') || nomeLower.includes('fé')) icone = '';
    else if (nomeLower.includes('filosofia') || nomeLower.includes('pensador') || nomeLower.includes('ideia')) icone = '';
    else if (nomeLower.includes('peste') || nomeLower.includes('fome') || nomeLower.includes('crise')) icone = '️';
    else if (nomeLower.includes('paz') || nomeLower.includes('tratado') || nomeLower.includes('acordo')) icone = '�️';
    
    const anoDisplay = evento.anoNumerico !== 9999 ? 
        `${evento.anoNumerico < 0 ? `${Math.abs(evento.anoNumerico)}º a.C.` : `${evento.anoNumerico}º d.C.`}` : 
        'Data desconhecida';
    
    let figurasHtml = '';
    if (evento.figuras_principais && evento.figuras_principais.length > 0) {
        const nomesFiguras = evento.figuras_principais.map(f => f.nome || f).join(', ');
        figurasHtml = `
            <span class="text-base bg-gradient-to-r from-[#D4C5A9] to-[#E8DCC8] px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm tag-text font-medium">
                <span class="text-lg">�</span> ${escapeHtml(nomesFiguras)}
            </span>
        `;
    }
    
    let infoAdicionalHtml = '';
    if (evento.informacoes_adicionais) {
        infoAdicionalHtml = `
            <span class="text-base bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm tag-text font-medium">
                <span class="text-lg">�</span> ${escapeHtml(evento.informacoes_adicionais)}
            </span>
        `;
    }
    
    itemDiv.innerHTML = `
        <div class="flex flex-col md:flex-row items-start ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}">
            <div class="timeline-dot absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-7 h-7 bg-[#8B6914] rounded-full z-10"
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
                            <span class="text-lg">�</span> ${escapeHtml(lugar)}
                        </span>
                        <span class="text-base bg-[#F5F0E6] px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm tag-text font-medium">
                            <span class="text-lg">�</span> ${escapeHtml(periodoNome)}
                        </span>
                        ${evento.anoNumerico !== 9999 ? `
                            <span class="text-base bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] px-4 py-2.5 rounded-full flex items-center gap-2 shadow-sm tag-text font-medium">
                                <span class="text-lg">📅</span> ${anoDisplay}
                            </span>
                        ` : ''}
                        ${figurasHtml}
                        ${infoAdicionalHtml}
                    </div>
                    
                    <div class="flex gap-4 mt-5 flex-wrap">
                        <button onclick="abrirSaberMais('${evento.globalId}')" 
                                class="btn-primary px-7 py-3.5 text-white rounded-xl font-semibold flex items-center gap-2 shadow-md action-btn text-lg action-btn-saber">
                             Saber Mais
                        </button>
                        <button onclick="mostrarMapa('${escapeHtml(lugar)}', '${escapeHtml(nome)}')" 
                                class="btn-secondary px-7 py-3.5 border-2 border-[#8B6914] text-[#8B6914] rounded-xl font-semibold hover:bg-[#8B6914] hover:text-white transition-all duration-300 flex items-center gap-2 action-btn text-lg action-btn-mapa">
                            🗺️ Ver Mapa
                        </button>
                        <a href="galeria.html?evento=${encodeURIComponent(evento.globalId)}"
                           class="btn-secondary px-7 py-3.5 border-2 border-[#8B6914] text-[#8B6914] rounded-xl font-semibold hover:bg-[#8B6914] hover:text-white transition-all duration-300 flex items-center gap-2 action-btn text-lg action-btn-galeria">
                            🖼️ Ver Imagens
                        </a>
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
            <p class="text-sm text-[#8B7355] mt-2"> A sabedoria está a caminho</p>
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
        console.log('Resposta da API para:', evento.periodoNome, data);
        
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
            
            modalContent.innerHTML = `
                <div class="space-y-5">
                    <div class="border-b-2 border-[#D4C5A9] pb-4">
                        <h4 class="text-2xl font-bold text-[#5C4033] flex items-center gap-2">
                            <span></span> ${escapeHtml(evento.nome)}
                        </h4>
                        <p class="text-base text-[#8B7355] mt-1">${escapeHtml(evento.ano)} • ${escapeHtml(evento.lugar)}</p>
                        <p class="text-sm text-[#8B7355] mt-1">� ${escapeHtml(evento.periodoNome)}</p>
                    </div>
                    
                    ${evento.oque_aconteceu ? `
                        <div class="bg-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>�</span> O que aconteceu:
                            </h5>
                            <p class="text-[#6B5B4F] leading-relaxed text-base">${escapeHtml(evento.oque_aconteceu)}</p>
                        </div>
                    ` : ''}
                    
                    ${evento.oque_mudou ? `
                        <div class="bg-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>�</span> O que mudou:
                            </h5>
                            <p class="text-[#6B5B4F] leading-relaxed text-base">${escapeHtml(evento.oque_mudou)}</p>
                        </div>
                    ` : ''}
                    
                    ${legado ? `
                        <div class="bg-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>�️</span> Legado:
                            </h5>
                            <p class="text-[#6B5B4F] leading-relaxed text-base">${escapeHtml(legado)}</p>
                        </div>
                    ` : ''}
                    
                    ${caracteristicas.length > 0 ? `
                        <div>
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span></span> Características principais:
                            </h5>
                            <ul class="list-disc list-inside text-[#6B5B4F] space-y-2 text-base">
                                ${caracteristicas.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${evento.figuras_principais && evento.figuras_principais.length > 0 ? `
                        <div>
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>�</span> Figuras principais:
                            </h5>
                            <ul class="list-disc list-inside text-[#6B5B4F] space-y-2 text-base">
                                ${evento.figuras_principais.map(f => `<li>${escapeHtml(f.nome || f)}${f.papel ? ` - ${escapeHtml(f.papel)}` : ''}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${evento.informacoes_adicionais ? `
                        <div class="bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] p-6 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span>�</span> Informações adicionais:
                            </h5>
                            <p class="text-base text-[#6B5B4F] leading-relaxed">${escapeHtml(evento.informacoes_adicionais)}</p>
                        </div>
                    ` : ''}
                    
                    ${curiosidades.length > 0 ? `
                        <div class="bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] p-6 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 flex items-center gap-2 text-lg">
                                <span></span> Curiosidades históricas:
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
                        <h4 class="text-xl font-bold text-[#5C4033]"> ${escapeHtml(evento.nome)}</h4>
                        <p class="text-base text-[#8B7355]">${escapeHtml(evento.ano)} • ${escapeHtml(evento.lugar)}</p>
                        <p class="text-sm text-[#8B7355]">� ${escapeHtml(evento.periodoNome)}</p>
                    </div>
                    
                    ${evento.oque_aconteceu ? `
                        <div class="bg-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 text-lg">� Descrição:</h5>
                            <p class="text-[#6B5B4F] text-base">${escapeHtml(evento.oque_aconteceu)}</p>
                        </div>
                    ` : ''}
                    
                    ${evento.oque_mudou ? `
                        <div class="bg-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 text-lg">� O que mudou:</h5>
                            <p class="text-[#6B5B4F] text-base">${escapeHtml(evento.oque_mudou)}</p>
                        </div>
                    ` : ''}
                    
                    ${evento.informacoes_adicionais ? `
                        <div class="bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] p-5 rounded-xl">
                            <h5 class="font-semibold text-[#5C4033] mb-3 text-lg">� Informações adicionais:</h5>
                            <p class="text-[#6B5B4F] text-base">${escapeHtml(evento.informacoes_adicionais)}</p>
                        </div>
                    ` : ''}
                    
                    <div class="bg-gradient-to-r from-[#E8DCC8] to-[#F5F0E6] p-5 rounded-xl text-center">
                        <span class="text-4xl"></span>
                        <p class="text-base text-[#8B7355] mt-3">Informações complementares disponíveis em fontes históricas.</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao buscar informações:', error);
        modalContent.innerHTML = `
            <div class="text-center py-8">
                <div class="text-6xl mb-4">️</div>
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
            <div class="flex items-center justify-center h-full bg-[#F5F0E6]">
                <div class="text-center">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p class="text-[#8B7355]">� Buscando localização...</p>
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
        
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="background: #8B6914; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 3px solid #5C4033; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                    �
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        if (lat !== 0 || lng !== 0) {
            L.marker([lat, lng], { icon: customIcon })
                .bindPopup(`
                    <div style="font-family: 'Inter', sans-serif; text-align: center; min-width: 200px;">
                        <strong style="color: #5C4033; font-size: 1.2rem; display: block; margin-bottom: 4px;">${escapeHtml(nomeEvento)}</strong>
                        <span style="color: #8B7355; font-size: 1.1rem;">� ${escapeHtml(lugar)}</span>
                    </div>
                `)
                .openPopup();
            
            L.circle([lat, lng], {
                color: '#8B6914',
                fillColor: '#D4C5A9',
                fillOpacity: 0.2,
                radius: 50000
            }).addTo(currentMap);
        } else {
            L.popup()
                .setLatLng([20, 0])
                .setContent(`
                    <div style="text-align: center; padding: 15px;">
                        <span style="font-size: 3rem;">�</span>
                        <p style="color: #5C4033; font-weight: bold; margin-top: 8px; font-size: 1.1rem;">Localização não encontrada</p>
                        <p style="color: #8B7355; font-size: 1rem;">${escapeHtml(lugar)}</p>
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
        <div class="flex items-center justify-center h-full bg-[#F5F0E6]">
            <div class="text-center">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-[#8B7355]">�️ Carregando mapa...</p>
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
    
    console.log(` Carregando mais eventos...`);
    
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
            <div class="text-7xl mb-4"></div>
            <p class="text-red-600 text-xl mb-4">${mensagem}</p>
            <button onclick="location.reload()" class="btn-primary px-6 py-2 text-white rounded-xl font-semibold shadow-lg">
                Tentar Novamente
            </button>
        </div>
    `;
}