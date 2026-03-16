import { useState } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import { ExternalLink, Copy, CheckCircle2, Circle, FolderOpen, Image, Tag, Check } from 'lucide-react'

type Plataforma = 'youtube' | 'spotify'
type Idioma = 'pt' | 'es' | 'en'

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

const YOUTUBE_STUDIO = {
  pt: 'https://studio.youtube.com/channel/UCaVxP3Jj67Ko-f4stRabrkA',
  es: 'https://studio.youtube.com/channel/UC7DwigoUdNYXAkv0d-KehVQ',
  en: 'https://studio.youtube.com/channel/UC1TB05Es-2GHi8RLuYienkQ',
}

const SPOTIFY_LINKS = {
  pt: 'https://creators.spotify.com/pod/show/6eksxTNuLAKqkEFf5FCsRR/home',
  es: 'https://creators.spotify.com/pod/show/0aqwiMj5HYw3APjH4q8ban/home',
  en: 'https://creators.spotify.com/pod/show/3KnWI3krZLKt8iJThUd6DA/home',
}

interface FormSpotify {
  titulo: string
  descricao: string
  temporada: string
  episodio: string
  data: string
  hora: string
}

function CheckRow({ checked, onToggle, label, children, sub }: {
  checked: boolean
  onToggle: () => void
  label: string
  children: React.ReactNode
  sub?: React.ReactNode
}) {
  return (
    <div className={`py-2.5 px-3 transition-colors ${checked ? 'bg-green-50' : ''}`}>
      <div className="flex items-center gap-2">
        <button onClick={onToggle} className="flex-shrink-0">
          {checked
            ? <CheckCircle2 size={16} className="text-green-500" />
            : <Circle size={16} className="text-gray-300" />}
        </button>
        <span className={`text-sm flex-shrink-0 w-36 ${checked ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>{label}</span>
        <div className="flex-1 flex items-center gap-1.5 justify-end flex-wrap">
          {children}
        </div>
      </div>
      {sub && <div className="ml-[152px] mt-1.5">{sub}</div>}
    </div>
  )
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

  // ── Episódio (texto livre) ─────────────────────────────────────────────────
  const [nomeEpisodio, setNomeEpisodio] = useState('')

  // ── Checklist YT (por idioma) ──────────────────────────────────────────────
  const [checks, setChecks] = useState<Record<Idioma, boolean[]>>({
    pt: Array(TOTAL_STEPS).fill(false),
    es: Array(TOTAL_STEPS).fill(false),
    en: Array(TOTAL_STEPS).fill(false),
  })

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
      titulo: titulos[idioma] || '(sem título)',
      idioma,
      data: new Date().toLocaleDateString('pt-BR'),
      episodio: nomeEpisodio,
    }
    const lista = [nova, ...publicacoes]
    setPublicacoes(lista)
    localStorage.setItem(PUBLICACOES_KEY, JSON.stringify(lista))
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

          {/* Episódio */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs text-gray-500 flex-shrink-0">Episódio:</span>
            <input
              className="input flex-1 py-1 text-sm"
              placeholder="Nome do episódio atual"
              value={nomeEpisodio}
              onChange={e => setNomeEpisodio(e.target.value)}
            />
          </div>

          {/* Progresso */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-400">{concluidos} / {TOTAL_STEPS} concluídos</p>
            <button
              onClick={() => setChecks(c => ({ ...c, [idioma]: Array(TOTAL_STEPS).fill(false) }))}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Limpar
            </button>
          </div>

          {/* Checklist */}
          <div className="card overflow-hidden divide-y divide-gray-100">

            {/* 1. Upload */}
            <CheckRow checked={ytChecks[IDX_UPLOAD]} onToggle={() => toggleCheck(IDX_UPLOAD)} label="Upload do vídeo">
              <a href={YOUTUBE_STUDIO[idioma]} target="_blank" rel="noopener noreferrer"
                className="btn-xs bg-red-500 text-white hover:bg-red-600">
                <ExternalLink size={11} /> Abrir Studio
              </a>
              <button onClick={abrirPastaVideos} className="btn-xs">
                <FolderOpen size={11} /> 📁 Todos
              </button>
            </CheckRow>

            {/* 2. Título */}
            <CheckRow checked={ytChecks[IDX_TITULO]} onToggle={() => toggleCheck(IDX_TITULO)} label="Título">
              <input
                className="input py-1 text-xs flex-1 min-w-0"
                placeholder="Título do vídeo"
                value={titulos[idioma]}
                onChange={e => setTitulos(t => ({ ...t, [idioma]: e.target.value }))}
              />
              <button onClick={() => copiar('titulo', titulos[idioma])}
                className={`btn-xs flex-shrink-0 ${copiado === 'titulo' ? 'bg-green-100 text-green-600' : ''}`}>
                {copiado === 'titulo' ? <Check size={11} /> : <Copy size={11} />}
                {copiado === 'titulo' ? 'Copiado!' : 'Copiar'}
              </button>
            </CheckRow>

            {/* 3. Descrição */}
            <CheckRow
              checked={ytChecks[IDX_DESCRICAO]}
              onToggle={() => toggleCheck(IDX_DESCRICAO)}
              label="Descrição"
              sub={
                <button onClick={() => copiar('descricao', descricoes[idioma])}
                  className={`btn-xs ${copiado === 'descricao' ? 'bg-green-100 text-green-600' : ''}`}>
                  {copiado === 'descricao' ? <Check size={11} /> : <Copy size={11} />}
                  {copiado === 'descricao' ? 'Copiado!' : 'Copiar'}
                </button>
              }
            >
              <textarea
                className="input py-1 text-xs flex-1 min-w-0 resize-none"
                rows={3}
                placeholder="Descrição do vídeo..."
                value={descricoes[idioma]}
                onChange={e => setDescricoes(d => ({ ...d, [idioma]: e.target.value }))}
              />
            </CheckRow>

            {/* 4. Miniatura */}
            <CheckRow checked={ytChecks[IDX_MINIATURA]} onToggle={() => toggleCheck(IDX_MINIATURA)} label="Miniatura">
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <Image size={11} /> Upload no Studio
              </span>
              <button onClick={abrirPastaVideos} className="btn-xs">
                <FolderOpen size={11} /> 📁 Todos
              </button>
            </CheckRow>

            {/* 5. Tags */}
            <CheckRow checked={ytChecks[IDX_TAGS]} onToggle={() => toggleCheck(IDX_TAGS)} label="Tags">
              <a href="https://rapidtags.io/generator" target="_blank" rel="noopener noreferrer"
                className="btn-xs bg-violet-100 text-violet-700 hover:bg-violet-200">
                <Tag size={11} /> Gerar Tags
              </a>
              <span className="text-xs text-gray-400">"Mostrar Mais" no Studio</span>
            </CheckRow>

            {/* 6. Vídeo anterior */}
            <CheckRow
              checked={ytChecks[IDX_VIDEO_ANTERIOR]}
              onToggle={() => toggleCheck(IDX_VIDEO_ANTERIOR)}
              label="Vídeo anterior"
              sub={
                <div className="space-y-1">
                  <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer"
                    className="btn-xs bg-red-100 text-red-700 hover:bg-red-200 w-fit">
                    <ExternalLink size={11} /> Abrir Editor YouTube
                  </a>
                  <p className="text-xs text-gray-400">📍 Vídeo → Editor → Tela final → Adicionar elemento → Vídeo → cole o link</p>
                </div>
              }
            >
              <input
                className="input py-1 text-xs flex-1 min-w-0"
                placeholder="https://youtube.com/watch?v=..."
                value={videosAnteriores[idioma]}
                onChange={e => setVideosAnteriores(v => ({ ...v, [idioma]: e.target.value }))}
              />
              <button onClick={() => copiar('videoAnterior', videosAnteriores[idioma])}
                className={`btn-xs flex-shrink-0 ${copiado === 'videoAnterior' ? 'bg-green-100 text-green-600' : ''}`}>
                {copiado === 'videoAnterior' ? <Check size={11} /> : <Copy size={11} />}
                {copiado === 'videoAnterior' ? 'Copiado!' : 'Copiar'}
              </button>
            </CheckRow>

            {/* 7. Publicado */}
            <CheckRow checked={ytChecks[IDX_PUBLICADO]} onToggle={() => toggleCheck(IDX_PUBLICADO)} label="Publicado">
              <button onClick={salvarPublicacao}
                className="btn-xs bg-green-500 text-white hover:bg-green-600">
                <CheckCircle2 size={11} /> Marcar como Publicado
              </button>
            </CheckRow>

          </div>

          {/* Lista de publicações */}
          {publicacoes.length > 0 && (
            <div className="card p-4">
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
                    <button onClick={() => removerPublicacao(p.id)}
                      className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1">
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
