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

const SPOTIFY_NEW_EP = {
  pt: 'https://creators.spotify.com/pod/show/6eksxTNuLAKqkEFf5FCsRR/episodes/new',
  es: 'https://creators.spotify.com/pod/show/0aqwiMj5HYw3APjH4q8ban/episodes/new',
  en: 'https://creators.spotify.com/pod/show/3KnWI3krZLKt8iJThUd6DA/episodes/new',
}

const PUBLICACOES_SP_KEY = 'publicacoes_spotify'

const IDX_SP_UPLOAD = 0
const IDX_SP_TITULO = 1
const IDX_SP_DESCRICAO = 2
const IDX_SP_MINIATURA = 3
const IDX_SP_TAGS = 4
const IDX_SP_ARTE = 5
const IDX_SP_PUBLICADO = 6
const TOTAL_SP = 7

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
      {sub && <div className="ml-[152px] mt-1 flex justify-end">{sub}</div>}
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
  const [checksSP, setChecksSP] = useState<Record<Idioma, boolean[]>>({
    pt: Array(TOTAL_SP).fill(false),
    es: Array(TOTAL_SP).fill(false),
    en: Array(TOTAL_SP).fill(false),
  })
  const toggleSP = (idx: number) => setChecksSP(c => ({
    ...c, [idioma]: c[idioma].map((v, i) => i === idx ? !v : v),
  }))

  const [titulosSP, setTitulosSP] = useState<Record<Idioma, string>>({ pt: '', es: '', en: '' })
  const [descricoesSP, setDescricoesSP] = useState<Record<Idioma, string>>({ pt: '', es: '', en: '' })

  const [publicacoesSP, setPublicacoesSP] = useState<PublicacaoRegistro[]>(() => {
    try { return JSON.parse(localStorage.getItem(PUBLICACOES_SP_KEY) || '[]') } catch { return [] }
  })
  const salvarPublicacaoSP = () => {
    const nova: PublicacaoRegistro = {
      id: Date.now().toString(),
      titulo: titulosSP[idioma] || '(sem título)',
      idioma,
      data: new Date().toLocaleDateString('pt-BR'),
      episodio: nomeEpisodio,
    }
    const lista = [nova, ...publicacoesSP]
    setPublicacoesSP(lista)
    localStorage.setItem(PUBLICACOES_SP_KEY, JSON.stringify(lista))
  }
  const removerPublicacaoSP = (id: string) => {
    const lista = publicacoesSP.filter(p => p.id !== id)
    setPublicacoesSP(lista)
    localStorage.setItem(PUBLICACOES_SP_KEY, JSON.stringify(lista))
  }

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
            <CheckRow checked={ytChecks[IDX_UPLOAD]} onToggle={() => toggleCheck(IDX_UPLOAD)} label="⬆️ Upload do vídeo">
              <a href={YOUTUBE_STUDIO[idioma]} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-500 mr-auto">
                — <span className="text-red-600 hover:underline">Upload</span>
              </a>
              <button onClick={abrirPastaVideos} className="btn-xs">
                <FolderOpen size={11} /> 📁 Todos
              </button>
            </CheckRow>

            {/* 2. Título */}
            <CheckRow checked={ytChecks[IDX_TITULO]} onToggle={() => toggleCheck(IDX_TITULO)} label="✏️ Título">
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
            <CheckRow checked={ytChecks[IDX_DESCRICAO]} onToggle={() => toggleCheck(IDX_DESCRICAO)} label="📝 Descrição">
              <textarea
                className="input py-1 text-xs flex-1 min-w-0 resize-none"
                rows={1}
                placeholder="Descrição do vídeo..."
                value={descricoes[idioma]}
                onChange={e => setDescricoes(d => ({ ...d, [idioma]: e.target.value }))}
              />
              <button onClick={() => copiar('descricao', descricoes[idioma])}
                className={`btn-xs flex-shrink-0 ${copiado === 'descricao' ? 'bg-green-100 text-green-600' : ''}`}>
                {copiado === 'descricao' ? <Check size={11} /> : <Copy size={11} />}
                {copiado === 'descricao' ? 'Copiado!' : 'Copiar'}
              </button>
            </CheckRow>

            {/* 4. Miniatura */}
            <CheckRow checked={ytChecks[IDX_MINIATURA]} onToggle={() => toggleCheck(IDX_MINIATURA)} label="🖼️ Miniatura">
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <Image size={11} /> Upload no Studio
              </span>
              <button onClick={abrirPastaVideos} className="btn-xs">
                <FolderOpen size={11} /> 📁 Todos
              </button>
            </CheckRow>

            {/* 5. Tags */}
            <CheckRow checked={ytChecks[IDX_TAGS]} onToggle={() => toggleCheck(IDX_TAGS)} label="🏷️ Tags">
              <a href="https://rapidtags.io/generator" target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-500 mr-auto">
                — <span className="text-violet-600 hover:underline">gerar tags</span>
              </a>
            </CheckRow>

            {/* 6. Vídeo anterior */}
            <CheckRow checked={ytChecks[IDX_VIDEO_ANTERIOR]} onToggle={() => toggleCheck(IDX_VIDEO_ANTERIOR)} label="📺 Vídeo anterior">
              <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-500 flex-shrink-0">
                — <span className="text-red-600 hover:underline">Abrir YouTube</span>
              </a>
              <input
                className="input py-1 text-xs flex-1 min-w-0"
                placeholder="vídeo → editor → tela final → adicionar elemento → vídeo → cole o link"
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
            <CheckRow
              checked={ytChecks[IDX_PUBLICADO]}
              onToggle={() => { if (!ytChecks[IDX_PUBLICADO]) salvarPublicacao(); toggleCheck(IDX_PUBLICADO) }}
              label="✅ Publicado">
              <></>
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
      {plataforma === 'spotify' && (() => {
        const spChecks = checksSP[idioma]
        const spConcluidos = spChecks.filter(Boolean).length
        return (
          <div className="space-y-3">

            {/* Progresso */}
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-400">{spConcluidos} / {TOTAL_SP} concluídos</p>
              <button
                onClick={() => setChecksSP(c => ({ ...c, [idioma]: Array(TOTAL_SP).fill(false) }))}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Limpar
              </button>
            </div>

            {/* Checklist */}
            <div className="card overflow-hidden divide-y divide-gray-100">

              {/* 1. Novo Episódio */}
              <CheckRow checked={spChecks[IDX_SP_UPLOAD]} onToggle={() => toggleSP(IDX_SP_UPLOAD)} label="📁 Novo Episódio">
                <a href={SPOTIFY_NEW_EP[idioma]} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-gray-500 mr-auto">
                  — <span className="text-green-600 hover:underline">Upload</span>
                </a>
                <button onClick={abrirPastaVideos} className="btn-xs">
                  <FolderOpen size={11} /> 📁 Todos
                </button>
              </CheckRow>

              {/* 2. Título */}
              <CheckRow checked={spChecks[IDX_SP_TITULO]} onToggle={() => toggleSP(IDX_SP_TITULO)} label="✏️ Título">
                <input
                  className="input py-1 text-xs flex-1 min-w-0"
                  placeholder="Título do episódio"
                  value={titulosSP[idioma]}
                  onChange={e => setTitulosSP(t => ({ ...t, [idioma]: e.target.value }))}
                />
                <button onClick={() => copiar('spTitulo', titulosSP[idioma])}
                  className={`btn-xs flex-shrink-0 ${copiado === 'spTitulo' ? 'bg-green-100 text-green-600' : ''}`}>
                  {copiado === 'spTitulo' ? <Check size={11} /> : <Copy size={11} />}
                  {copiado === 'spTitulo' ? 'Copiado!' : 'Copiar'}
                </button>
              </CheckRow>

              {/* 3. Descrição */}
              <CheckRow checked={spChecks[IDX_SP_DESCRICAO]} onToggle={() => toggleSP(IDX_SP_DESCRICAO)} label="📝 Descrição">
                <textarea
                  className="input py-1 text-xs flex-1 min-w-0 resize-none"
                  rows={1}
                  placeholder="Descrição do episódio..."
                  value={descricoesSP[idioma]}
                  onChange={e => setDescricoesSP(d => ({ ...d, [idioma]: e.target.value }))}
                />
                <button onClick={() => copiar('spDescricao', descricoesSP[idioma])}
                  className={`btn-xs flex-shrink-0 ${copiado === 'spDescricao' ? 'bg-green-100 text-green-600' : ''}`}>
                  {copiado === 'spDescricao' ? <Check size={11} /> : <Copy size={11} />}
                  {copiado === 'spDescricao' ? 'Copiado!' : 'Copiar'}
                </button>
              </CheckRow>

              {/* 4. Miniatura */}
              <CheckRow checked={spChecks[IDX_SP_MINIATURA]} onToggle={() => toggleSP(IDX_SP_MINIATURA)} label="🖼️ Miniatura">
                <button onClick={abrirPastaVideos} className="btn-xs">
                  <FolderOpen size={11} /> 📁 Todos
                </button>
              </CheckRow>

              {/* 5. Tags */}
              <CheckRow checked={spChecks[IDX_SP_TAGS]} onToggle={() => toggleSP(IDX_SP_TAGS)} label="🏷️ Tags">
                <a href="https://rapidtags.io/generator" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-gray-500 mr-auto">
                  — <span className="text-violet-600 hover:underline">gerar tags</span>
                </a>
              </CheckRow>

              {/* 6. Arte do Episódio */}
              <CheckRow checked={spChecks[IDX_SP_ARTE]} onToggle={() => toggleSP(IDX_SP_ARTE)} label="🎨 Arte do Episódio">
                <button onClick={abrirPastaVideos} className="btn-xs">
                  <FolderOpen size={11} /> 📁 Todos
                </button>
              </CheckRow>

              {/* 7. Publicado */}
              <CheckRow
                checked={spChecks[IDX_SP_PUBLICADO]}
                onToggle={() => { if (!spChecks[IDX_SP_PUBLICADO]) salvarPublicacaoSP(); toggleSP(IDX_SP_PUBLICADO) }}
                label="✅ Publicado">
                <></>
              </CheckRow>

            </div>

            {/* Lista de publicações Spotify */}
            {publicacoesSP.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Episódios Publicados</h3>
                <div className="space-y-2">
                  {publicacoesSP.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.titulo}</p>
                        <p className="text-xs text-gray-400">
                          {p.data} · {IDIOMAS.find(i => i.id === p.idioma)?.label}
                          {p.episodio && ` · ${p.episodio}`}
                        </p>
                      </div>
                      <button onClick={() => removerPublicacaoSP(p.id)}
                        className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}
    </ModuleLayout>
  )
}
