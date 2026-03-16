import { useState, useEffect } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import { ExternalLink, Copy, CheckCircle2, Circle, FolderOpen, Image, Tag, Check } from 'lucide-react'

type Plataforma = 'youtube' | 'spotify'
type Idioma = 'pt' | 'es' | 'en'

interface EpisodioResumo {
  id: string
  titulo: string
  pastaNome: string
  pastaAtual: string
  etapaAtual: string
}

interface PublicacaoRegistro {
  id: string
  titulo: string
  idioma: Idioma
  data: string
  episodio: string
}

const IDIOMAS = [
  { id: 'pt' as Idioma, label: '🇧🇷 PT', nome: 'Português' },
  { id: 'es' as Idioma, label: '🇪🇸 ES', nome: 'Espanhol' },
  { id: 'en' as Idioma, label: '🇺🇸 EN', nome: 'Inglês' },
]

const YOUTUBE_UPLOAD = {
  pt: 'https://studio.youtube.com/channel/UCaVxP3Jj67Ko-f4stRabrkA/videos/upload',
  es: 'https://studio.youtube.com/channel/UC7DwigoUdNYXAkv0d-KehVQ/videos/upload',
  en: 'https://studio.youtube.com/channel/UC1TB05Es-2GHi8RLuYienkQ/videos/upload',
}

const SPOTIFY_LINKS = {
  pt: 'https://creators.spotify.com/pod/show/6eksxTNuLAKqkEFf5FCsRR/home',
  es: 'https://creators.spotify.com/pod/show/0aqwiMj5HYw3APjH4q8ban/home',
  en: 'https://creators.spotify.com/pod/show/3KnWI3krZLKt8iJThUd6DA/home',
}

const PLAYLISTS_YT = ['Bíblia', 'Devocional', 'Estudo Bíblico', 'Sermão', 'Outro']

interface FormSpotify {
  titulo: string
  descricao: string
  temporada: string
  episodio: string
  data: string
  hora: string
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('app_token')}`,
})

const PUBLICACOES_KEY = 'publicacoes_youtube'

// Índices do checklist YT
const IDX_UPLOAD = 0
const IDX_TITULO = 1
const IDX_DESCRICAO = 2
const IDX_MINIATURA = 3
const IDX_TAGS = 4
const IDX_VIDEO_ANTERIOR = 5
const IDX_PUBLICADO = 6
const TOTAL_STEPS = 7

export default function PublicacaoVideo() {
  const [plataforma, setPlataforma] = useState<Plataforma>('youtube')
  const [idioma, setIdioma] = useState<Idioma>('pt')

  // ── Episódios ──────────────────────────────────────────────────────────────
  const [episodios, setEpisodios] = useState<EpisodioResumo[]>([])
  const [epId, setEpId] = useState<string>('')
  const ep = episodios.find(e => e.id === epId) ?? null

  useEffect(() => {
    fetch('/api/episodios', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then((lista: EpisodioResumo[]) => {
        setEpisodios(lista)
        if (lista.length > 0 && !epId) setEpId(lista[0].id)
      })
      .catch(() => {})
  }, [])

  // ── Checklist YT (por idioma) ──────────────────────────────────────────────
  const [checks, setChecks] = useState<Record<Idioma, boolean[]>>({
    pt: Array(TOTAL_STEPS).fill(false),
    es: Array(TOTAL_STEPS).fill(false),
    en: Array(TOTAL_STEPS).fill(false),
  })

  const marcar = (idx: number) => {
    setChecks(c => ({
      ...c,
      [idioma]: c[idioma].map((v, i) => (i === idx ? true : v)),
    }))
  }

  const toggleCheck = (idx: number) => {
    setChecks(c => ({
      ...c,
      [idioma]: c[idioma].map((v, i) => (i === idx ? !v : v)),
    }))
  }

  // ── Campos YT (por idioma) ─────────────────────────────────────────────────
  const [titulos, setTitulos] = useState<Record<Idioma, string>>({ pt: '', es: '', en: '' })
  const [descricoes, setDescricoes] = useState<Record<Idioma, string>>({ pt: '', es: '', en: '' })
  const [videosAnteriores, setVideosAnteriores] = useState<Record<Idioma, string>>({ pt: '', es: '', en: '' })

  // ── Publicações registradas ────────────────────────────────────────────────
  const [publicacoes, setPublicacoes] = useState<PublicacaoRegistro[]>(() => {
    try { return JSON.parse(localStorage.getItem(PUBLICACOES_KEY) || '[]') } catch { return [] }
  })

  const salvarPublicacao = () => {
    const nova: PublicacaoRegistro = {
      id: Date.now().toString(),
      titulo: titulos[idioma] || ep?.titulo || '(sem título)',
      idioma,
      data: new Date().toLocaleDateString('pt-BR'),
      episodio: ep?.pastaNome || '',
    }
    const lista = [nova, ...publicacoes]
    setPublicacoes(lista)
    localStorage.setItem(PUBLICACOES_KEY, JSON.stringify(lista))
    marcar(IDX_PUBLICADO)
  }

  const removerPublicacao = (id: string) => {
    const lista = publicacoes.filter(p => p.id !== id)
    setPublicacoes(lista)
    localStorage.setItem(PUBLICACOES_KEY, JSON.stringify(lista))
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const [copiado, setCopiado] = useState<string | null>(null)

  const copiar = (key: string, texto: string) => {
    navigator.clipboard.writeText(texto).catch(() => {})
    setCopiado(key)
    setTimeout(() => setCopiado(null), 1500)
  }

  const abrirPastaEpisodio = async () => {
    if (!ep?.pastaAtual) return
    await fetch('/api/videos/abrir-pasta', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ pasta: ep.pastaAtual }),
    })
  }

  const abrirPastaVideos = async () => {
    await fetch('/api/videos/abrir-pasta-videos', { method: 'POST', headers: authHeaders() })
  }

  // ── Spotify state ──────────────────────────────────────────────────────────
  const [formsSpotify, setFormsSpotify] = useState<Record<Idioma, FormSpotify>>({
    pt: { titulo: '', descricao: '', temporada: '1', episodio: '', data: '', hora: '' },
    es: { titulo: '', descricao: '', temporada: '1', episodio: '', data: '', hora: '' },
    en: { titulo: '', descricao: '', temporada: '1', episodio: '', data: '', hora: '' },
  })

  const [copiadoSP, setCopiadoSP] = useState<string | null>(null)

  const updateSpotify = (campo: keyof FormSpotify, valor: string) => {
    setFormsSpotify(f => ({ ...f, [idioma]: { ...f[idioma], [campo]: valor } }))
  }

  const copiarParaTodosSP = (campo: keyof FormSpotify) => {
    const valor = formsSpotify[idioma][campo]
    setFormsSpotify(f => {
      const novo = { ...f }
      IDIOMAS.forEach(i => { (novo[i.id] as any)[campo] = valor })
      return novo
    })
    setCopiadoSP(campo)
    setTimeout(() => setCopiadoSP(null), 1500)
  }

  const CopySPBtn = ({ campo }: { campo: string }) => (
    <button
      onClick={() => copiarParaTodosSP(campo as keyof FormSpotify)}
      className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-md transition-all ${copiadoSP === campo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
    >
      {copiadoSP === campo ? <CheckCircle2 size={11} /> : <Copy size={11} />}
      {copiadoSP === campo ? 'Copiado!' : 'Copiar p/ todos'}
    </button>
  )

  const [stepsSP, setStepsSP] = useState<boolean[]>(Array(8).fill(false))
  const SP_STEPS = [
    '📁 Novo Episódio → Selecionar Arquivo',
    '✏️ Título',
    '📝 Descrição',
    '🖼️ Miniatura',
    '🔢 Número da Temporada',
    '🔢 Número do Episódio',
    '🎨 Arte do Episódio',
    '📅 Programar: Data e Hora',
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  const ytChecks = checks[idioma]
  const concluidos = ytChecks.filter(Boolean).length

  const CheckRow = ({ idx, label, children }: { idx: number; label: string; children: React.ReactNode }) => (
    <div className={`rounded-xl border transition-all ${ytChecks[idx] ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start gap-3 p-3">
        <button onClick={() => toggleCheck(idx)} className="mt-0.5 flex-shrink-0">
          {ytChecks[idx]
            ? <CheckCircle2 size={18} className="text-green-500" />
            : <Circle size={18} className="text-gray-300" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium mb-2 ${ytChecks[idx] ? 'text-green-700 line-through' : 'text-gray-800'}`}>{label}</p>
          {children}
        </div>
      </div>
    </div>
  )

  return (
    <ModuleLayout title="Publicação de Vídeos" emoji="📤" description="YouTube e Spotify" color="text-rose-600" bgColor="bg-rose-50">

      {/* Plataforma */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        {(['youtube', 'spotify'] as const).map(p => (
          <button key={p} onClick={() => setPlataforma(p)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${plataforma === p ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}>
            {p === 'youtube' ? '▶️ YouTube' : '🎙️ Spotify'}
          </button>
        ))}
      </div>

      {/* Idioma */}
      <div className="flex gap-1 mb-4">
        {IDIOMAS.map(i => (
          <button key={i.id} onClick={() => setIdioma(i.id)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${idioma === i.id ? 'bg-rose-500 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:bg-rose-50'}`}>
            {i.label}
          </button>
        ))}
      </div>

      {/* ══ YOUTUBE ══════════════════════════════════════════════════════════ */}
      {plataforma === 'youtube' && (
        <div className="space-y-3">

          {/* Seletor de episódio */}
          <div className="card p-3">
            <label className="label mb-1">Episódio sendo publicado</label>
            {episodios.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum episódio encontrado. Crie um no módulo de Criação de Vídeos.</p>
            ) : (
              <select
                className="input"
                value={epId}
                onChange={e => setEpId(e.target.value)}
              >
                {episodios.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.titulo || e.pastaNome || `Episódio ${e.id}`}
                  </option>
                ))}
              </select>
            )}
            {ep?.pastaNome && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <FolderOpen size={11} /> {ep.pastaNome}
              </p>
            )}
          </div>

          {/* Progresso */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-500">{concluidos} / {TOTAL_STEPS} itens concluídos</p>
            <button
              onClick={() => setChecks(c => ({ ...c, [idioma]: Array(TOTAL_STEPS).fill(false) }))}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Limpar
            </button>
          </div>

          {/* ── 1. Upload ── */}
          <CheckRow idx={IDX_UPLOAD} label="Fazer upload do vídeo">
            <div className="flex flex-wrap gap-2">
              <a
                href={YOUTUBE_UPLOAD[idioma]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => marcar(IDX_UPLOAD)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                <ExternalLink size={12} /> Abrir Upload
              </a>
              <button
                onClick={() => { abrirPastaEpisodio(); marcar(IDX_UPLOAD) }}
                disabled={!ep?.pastaAtual}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                <FolderOpen size={12} /> 📁 Abrir
              </button>
              <button
                onClick={() => { abrirPastaVideos(); marcar(IDX_UPLOAD) }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FolderOpen size={12} /> 📁 Todos
              </button>
            </div>
          </CheckRow>

          {/* ── 2. Título ── */}
          <CheckRow idx={IDX_TITULO} label="Título">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Título do vídeo"
                value={titulos[idioma]}
                onChange={e => { setTitulos(t => ({ ...t, [idioma]: e.target.value })); marcar(IDX_TITULO) }}
              />
              <button
                onClick={() => { copiar('titulo', titulos[idioma]); marcar(IDX_TITULO) }}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${copiado === 'titulo' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {copiado === 'titulo' ? <Check size={12} /> : <Copy size={12} />}
                {copiado === 'titulo' ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </CheckRow>

          {/* ── 3. Descrição ── */}
          <CheckRow idx={IDX_DESCRICAO} label="Descrição">
            <div className="space-y-2">
              <textarea
                className="input resize-none w-full"
                rows={4}
                placeholder="Descrição do vídeo..."
                value={descricoes[idioma]}
                onChange={e => { setDescricoes(d => ({ ...d, [idioma]: e.target.value })); marcar(IDX_DESCRICAO) }}
              />
              <button
                onClick={() => { copiar('descricao', descricoes[idioma]); marcar(IDX_DESCRICAO) }}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${copiado === 'descricao' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {copiado === 'descricao' ? <Check size={12} /> : <Copy size={12} />}
                {copiado === 'descricao' ? 'Copiado!' : 'Copiar Descrição'}
              </button>
            </div>
          </CheckRow>

          {/* ── 4. Miniatura ── */}
          <CheckRow idx={IDX_MINIATURA} label="Imagem Miniatura">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                <Image size={12} /> Fazer upload no YouTube Studio
              </div>
              <button
                onClick={() => { abrirPastaEpisodio(); marcar(IDX_MINIATURA) }}
                disabled={!ep?.pastaAtual}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                <FolderOpen size={12} /> 📁 Abrir
              </button>
              <button
                onClick={() => { abrirPastaVideos(); marcar(IDX_MINIATURA) }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FolderOpen size={12} /> 📁 Todos
              </button>
            </div>
          </CheckRow>

          {/* ── 5. Tags ── */}
          <CheckRow idx={IDX_TAGS} label="Tags">
            <a
              href={`https://keywordtool.io/youtube?keyword=${encodeURIComponent(titulos[idioma])}&country=BR&language=pt`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => marcar(IDX_TAGS)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-lg hover:bg-violet-200 transition-colors w-fit"
            >
              <Tag size={12} /> Buscar Tags
            </a>
            <p className="text-xs text-gray-400 mt-1.5">Abre o KeywordTool com o título já preenchido. Adicionar em "Mostrar Mais" no YouTube Studio.</p>
          </CheckRow>

          {/* ── 6. Vídeo anterior ── */}
          <CheckRow idx={IDX_VIDEO_ANTERIOR} label="Adicionar vídeo anterior (tela final)">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="https://youtube.com/watch?v=..."
                value={videosAnteriores[idioma]}
                onChange={e => { setVideosAnteriores(v => ({ ...v, [idioma]: e.target.value })); marcar(IDX_VIDEO_ANTERIOR) }}
              />
              <button
                onClick={() => { copiar('videoAnterior', videosAnteriores[idioma]); marcar(IDX_VIDEO_ANTERIOR) }}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${copiado === 'videoAnterior' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {copiado === 'videoAnterior' ? <Check size={12} /> : <Copy size={12} />}
                {copiado === 'videoAnterior' ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Aparece no final do vídeo para o espectador assistir o episódio anterior.</p>
          </CheckRow>

          {/* ── 7. Publicado ── */}
          <CheckRow idx={IDX_PUBLICADO} label="Publicado">
            <button
              onClick={salvarPublicacao}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
            >
              <CheckCircle2 size={14} /> Marcar como Publicado
            </button>
          </CheckRow>

          {/* ── Lista de publicações ── */}
          {publicacoes.length > 0 && (
            <div className="card p-4 mt-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Vídeos Publicados</h3>
              <div className="space-y-2">
                {publicacoes.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.titulo}</p>
                      <p className="text-xs text-gray-400">
                        {p.data} · {IDIOMAS.find(i => i.id === p.idioma)?.label}
                        {p.episodio && ` · ${p.episodio}`}
                      </p>
                    </div>
                    <button
                      onClick={() => removerPublicacao(p.id)}
                      className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ SPOTIFY ══════════════════════════════════════════════════════════ */}
      {plataforma === 'spotify' && (
        <div className="space-y-4">

          {/* Link direto */}
          <a
            href={SPOTIFY_LINKS[idioma]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors"
          >
            <ExternalLink size={15} />
            Abrir Spotify Creators ({IDIOMAS.find(i => i.id === idioma)?.nome})
          </a>

          {/* Checklist de passos */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Checklist de Publicação</h3>
              <button onClick={() => setStepsSP(Array(8).fill(false))} className="text-xs text-gray-400 hover:text-gray-600">Limpar</button>
            </div>
            <div className="space-y-1.5">
              {SP_STEPS.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setStepsSP(s => s.map((v, j) => j === i ? !v : v))}
                  className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm transition-all ${stepsSP[i] ? 'bg-green-50 text-green-700 line-through' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${stepsSP[i] ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                    {stepsSP[i] ? '✓' : ''}
                  </span>
                  {step}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {stepsSP.filter(Boolean).length} / {SP_STEPS.length} concluídos
            </p>
          </div>

          {/* Formulário */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Dados para copiar</h3>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-700">
              <Image size={15} className="flex-shrink-0" />
              <span>Lembrete: selecionar o <strong>arquivo de áudio/vídeo</strong> primeiro no Spotify Creators</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Título do Episódio</label>
                <CopySPBtn campo="titulo" />
              </div>
              <input className="input" placeholder="Título do episódio" value={formsSpotify[idioma].titulo} onChange={e => updateSpotify('titulo', e.target.value)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Descrição</label>
                <CopySPBtn campo="descricao" />
              </div>
              <textarea className="input resize-none" rows={4} placeholder="Descrição do episódio..." value={formsSpotify[idioma].descricao} onChange={e => updateSpotify('descricao', e.target.value)} />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-700">
              <Image size={15} className="flex-shrink-0" />
              <span>Lembrete: fazer upload da <strong>Miniatura</strong> e da <strong>Arte do Episódio</strong> no Spotify Creators</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Número da Temporada</label>
                <input type="number" className="input" value={formsSpotify[idioma].temporada} onChange={e => updateSpotify('temporada', e.target.value)} />
              </div>
              <div>
                <label className="label">Número do Episódio</label>
                <input type="number" className="input" placeholder="Ex: 42" value={formsSpotify[idioma].episodio} onChange={e => updateSpotify('episodio', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Data de publicação</label>
                <input type="date" className="input" value={formsSpotify[idioma].data} onChange={e => updateSpotify('data', e.target.value)} />
              </div>
              <div>
                <label className="label">Horário</label>
                <input type="time" className="input" value={formsSpotify[idioma].hora} onChange={e => updateSpotify('hora', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  )
}
