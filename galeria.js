// ============================================
// GALERIA HISTÓRICA — CHRONOHISTORY
// ============================================

const API_URL = 'periodos.json'; // 'https://backendtcccronohistory.vercel.app/periodos';

// ── Estado Global ─────────────────────────
let todosPeriodos = [];
let todosEventos = [];
let eventosFiltrados = [];
let filtroAtual = 'todos';
let buscaAtual = '';
let galeriaEventoAtivo = null;

// ── Mapa de imagens por período ────────────
const IMAGENS_PERIODO = {
    'pré-história': 'periodo_pre_historia.jpg',
    'pré historia': 'periodo_pre_historia.jpg',
    'pre-historia': 'periodo_pre_historia.jpg',
    'prehistória': 'periodo_pre_historia.jpg',
    'idade antiga': 'periodo_idade_antiga.jpg',
    'antiguidade': 'periodo_idade_antiga.jpg',
    'idade média': 'periodo_idade_media.jpg',
    'idade media': 'periodo_idade_media.jpg',
    'medieval': 'periodo_idade_media.jpg',
    'idade moderna': 'periodo_idade_moderna.jpg',
    'modernidade': 'periodo_idade_moderna.jpg',
    'idade contemporânea': 'periodo_idade_contemporanea.jpg',
    'idade contemporanea': 'periodo_idade_contemporanea.jpg',
    'contemporâneo': 'periodo_idade_contemporanea.jpg',
    'contemporaneo': 'periodo_idade_contemporanea.jpg',
};

const IMAGEM_FALLBACK = 'periodo_idade_media.jpg';

// ── Filtro de período para cada botão ─────
const FILTRO_PERIODOS = {
    'todos': 'Todos',
    'pre-historia': ['pré-história', 'pré historia', 'pre-historia', 'prehistória', 'pre história'],
    'idade-antiga': ['idade antiga', 'antiguidade', 'antiga', 'egito', 'grécia', 'roma', 'greco', 'romano'],
    'idade-media': ['idade média', 'idade media', 'medieval'],
    'idade-moderna': ['idade moderna', 'modernidade', 'moderna', 'renascimento'],
    'idade-contemporanea': ['idade contemporânea', 'idade contemporanea', 'contemporâneo', 'contemporaneo', 'contemporânea', 'contemporanea'],
};

function getImagemPeriodo(periodoNome) {
    if (!periodoNome) return IMAGEM_FALLBACK;
    const lower = periodoNome.toLowerCase().trim();
    for (const [chave, imagem] of Object.entries(IMAGENS_PERIODO)) {
        if (lower.includes(chave)) return imagem;
    }
    return IMAGEM_FALLBACK;
}

function matchFiltro(evento, filtro) {
    if (filtro === 'todos') return true;
    const periodoLower = (evento.periodoNome || '').toLowerCase();
    const keywords = FILTRO_PERIODOS[filtro] || [];
    return keywords.some(kw => periodoLower.includes(kw));
}

// ============================================
// Inicialização
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    setupEventListeners();
    checkUrlParams();
});

// ============================================
// Carregar Dados da API
// ============================================
async function carregarDados() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (Array.isArray(data)) {
            todosPeriodos = data;
        } else if (data && typeof data === 'object') {
            if (data.periodos && Array.isArray(data.periodos)) todosPeriodos = data.periodos;
            else if (data.data && Array.isArray(data.data)) todosPeriodos = data.data;
            else todosPeriodos = [data];
        }

        processarEventos();
        renderGaleria();

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarErroGaleria('Não foi possível carregar os eventos históricos.');
    }
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
                const globalId = `periodo_${periodo.id || periodoIndex}_evento_${evento.id || eventoIndex}`;
                todosEventos.push({
                    id: evento.id || `${periodoIndex}_${eventoIndex}`,
                    globalId: globalId,
                    nome: evento.nome || `Evento ${eventoIndex + 1}`,
                    ano: evento.ano || 'Data desconhecida',
                    lugar: evento.lugar || 'Regiões diversas',
                    oque_aconteceu: evento.oque_aconteceu || '',
                    oque_mudou: evento.oque_mudou || '',
                    curiosidades: evento.curiosidades || periodo.curiosidades || [],
                    legado: evento.legado || periodo.legado || '',
                    figuras_principais: evento.figuras_principais || [],
                    informacoes_adicionais: evento.informacoes_adicionais || '',
                    periodoNome: periodoNome,
                    periodoId: periodo.id || periodoIndex,
                    imagem: evento.imagemUrl || (evento.imagem ? 'imagens/' + evento.imagem : getImagemPeriodo(periodoNome)),
                });
            });
        }
    });
}

// ============================================
// Renderizar Galeria
// ============================================
function renderGaleria() {
    const grid = document.getElementById('galeriaGrid');
    const contador = document.getElementById('contadorEventos');
    const semResultados = document.getElementById('semResultados');

    if (!grid) return;

    // Aplicar filtro de período
    eventosFiltrados = todosEventos.filter(e => {
        const matchPeriodo = matchFiltro(e, filtroAtual);
        const matchBusca = buscaAtual === '' ||
            e.nome.toLowerCase().includes(buscaAtual) ||
            (e.periodoNome || '').toLowerCase().includes(buscaAtual) ||
            (e.lugar || '').toLowerCase().includes(buscaAtual);
        return matchPeriodo && matchBusca;
    });

    if (contador) {
        contador.textContent = `${eventosFiltrados.length} evento${eventosFiltrados.length !== 1 ? 's' : ''}`;
    }

    grid.innerHTML = '';

    if (eventosFiltrados.length === 0) {
        if (semResultados) semResultados.classList.remove('hidden');
        return;
    }
    if (semResultados) semResultados.classList.add('hidden');

    eventosFiltrados.forEach((evento, index) => {
        const card = criarCardGaleria(evento, index);
        grid.appendChild(card);
    });

    // Marcar cards como visíveis (para efeitos hover)
    document.querySelectorAll('.galeria-card').forEach(card => {
        card.classList.add('card-visible');
    });
}

// ============================================
// Criar Card da Galeria
// ============================================
function criarCardGaleria(evento, index) {
    const card = document.createElement('div');
    card.className = 'galeria-card';
    card.setAttribute('data-event-id', evento.globalId);

    const descricaoCorta = evento.oque_aconteceu
        ? evento.oque_aconteceu.substring(0, 120) + (evento.oque_aconteceu.length > 120 ? '...' : '')
        : 'Clique para descobrir mais sobre este evento histórico.';

    card.innerHTML = `
        <div class="card-imagem-wrapper">
            <img
                src="${evento.imagem}"
                alt="${escapeHtml(evento.nome)}"
                class="card-imagem"
                onerror="this.src='periodo_idade_media.jpg'"
            />
            <div class="card-imagem-overlay"></div>
            <div class="card-periodo-badge">${escapeHtml(evento.periodoNome)}</div>
        </div>
        <div class="card-corpo">
            <h3 class="card-titulo">${escapeHtml(evento.nome)}</h3>
            <div class="card-meta">
                <span class="card-meta-item">📅 ${escapeHtml(evento.ano)}</span>
                <span class="card-meta-item">📍 ${escapeHtml(evento.lugar)}</span>
            </div>
            <p class="card-descricao">${escapeHtml(descricaoCorta)}</p>
            <div class="card-acoes">
                <button class="btn-ver-evento" onclick="abrirDetalhe('${evento.globalId}')">
                    🔍 Ver Evento
                </button>
                <a href="index.html#timeline-section" class="btn-ver-timeline" onclick="salvarEventoParaTimeline('${evento.globalId}')">
                    📜 Ver na Linha do Tempo
                </a>
            </div>
        </div>
    `;

    card.querySelector('.card-imagem-wrapper').addEventListener('click', () => abrirDetalhe(evento.globalId));
    return card;
}

function salvarEventoParaTimeline(globalId) {
    sessionStorage.setItem('chronohistory_evento_destaque', globalId);
}

// ============================================
// Abrir Modal de Detalhes
// ============================================
function abrirDetalhe(globalId) {
    const evento = todosEventos.find(e => e.globalId === globalId);
    if (!evento) return;

    galeriaEventoAtivo = evento;

    const modal = document.getElementById('galeriaModal');
    const modalImagem = document.getElementById('modalImagem');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalPeriodo = document.getElementById('modalPeriodo');
    const modalAno = document.getElementById('modalAno');
    const modalLugar = document.getElementById('modalLugar');
    const modalDescricao = document.getElementById('modalDescricao');
    const modalMudou = document.getElementById('modalMudou');
    const modalCuriosidades = document.getElementById('modalCuriosidades');
    const modalLegado = document.getElementById('modalLegado');
    const modalFonte = document.getElementById('modalFonte');
    const btnTimeline = document.getElementById('modalBtnTimeline');

    modalImagem.src = evento.imagem;
    modalImagem.onerror = () => { modalImagem.src = 'periodo_idade_media.jpg'; };
    modalImagem.alt = evento.nome;

    modalTitulo.textContent = evento.nome;
    modalPeriodo.textContent = evento.periodoNome;
    modalAno.textContent = evento.ano;
    modalLugar.textContent = evento.lugar;

    modalDescricao.textContent = evento.oque_aconteceu || 'Descrição não disponível.';

    // Seção O que mudou
    const secMudou = document.getElementById('secaoMudou');
    if (evento.oque_mudou) {
        modalMudou.textContent = evento.oque_mudou;
        secMudou.classList.remove('hidden');
    } else {
        secMudou.classList.add('hidden');
    }

    // Seção Legado
    const secLegado = document.getElementById('secaoLegado');
    if (evento.legado) {
        modalLegado.textContent = evento.legado;
        secLegado.classList.remove('hidden');
    } else {
        secLegado.classList.add('hidden');
    }

    // Curiosidades
    const secCuriosidades = document.getElementById('secaoCuriosidades');
    if (evento.curiosidades && evento.curiosidades.length > 0) {
        modalCuriosidades.innerHTML = evento.curiosidades.slice(0, 3)
            .map(c => `<li class="modal-curiosidade-item">⬥ ${escapeHtml(c)}</li>`)
            .join('');
        secCuriosidades.classList.remove('hidden');
    } else {
        secCuriosidades.classList.add('hidden');
    }

    // Fonte
    modalFonte.textContent = `Chronohistory — API Histórica / ${evento.periodoNome}`;

    // Botão timeline
    btnTimeline.href = `index.html#timeline-section`;
    btnTimeline.onclick = () => salvarEventoParaTimeline(globalId);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        modal.querySelector('.modal-galeria-container').classList.add('modal-entrada');
    }, 20);
}

function fecharDetalhe() {
    const modal = document.getElementById('galeriaModal');
    const container = modal.querySelector('.modal-galeria-container');
    container.classList.remove('modal-entrada');
    container.classList.add('modal-saida');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        container.classList.remove('modal-saida');
        document.body.style.overflow = '';
    }, 300);
}

// ============================================
// Verificar URL Params
// ============================================
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const eventoId = params.get('evento');
    if (eventoId) {
        // Aguardar dados carregarem antes de abrir
        setTimeout(() => {
            const evento = todosEventos.find(e => e.globalId === eventoId || e.nome.toLowerCase().includes(eventoId.toLowerCase()));
            if (evento) abrirDetalhe(evento.globalId);
        }, 800);
    }
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Filtros de período
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('filtro-ativo'));
            btn.classList.add('filtro-ativo');
            filtroAtual = btn.getAttribute('data-filtro');
            renderGaleria();
        });
    });

    // Pesquisa
    const searchInput = document.getElementById('galeriaSearch');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                buscaAtual = searchInput.value.toLowerCase().trim();
                renderGaleria();
            }, 300);
        });
    }

    // Fechar modal
    const fecharBtn = document.getElementById('fecharGaleriaModal');
    if (fecharBtn) fecharBtn.addEventListener('click', fecharDetalhe);

    const modal = document.getElementById('galeriaModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharDetalhe();
        });
    }

    // Menu mobile
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            menuBtn.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰';
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                menuBtn.textContent = '☰';
            });
        });
    }

    // Header scroll
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 40);
        }, { passive: true });
    }

    // Tecla ESC fecha modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharDetalhe();
    });
}

// ============================================
// Mostrar Erro
// ============================================
function mostrarErroGaleria(mensagem) {
    const grid = document.getElementById('galeriaGrid');
    if (grid) {
        grid.innerHTML = `
            <div class="galeria-erro">
                <div class="galeria-erro-icone">⚠️</div>
                <p>${mensagem}</p>
                <button onclick="location.reload()" class="btn-ver-evento" style="margin-top:1rem">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

// ── Utilitário HTML escape ─────────────────
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
