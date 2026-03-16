import { useState, useEffect, useRef, useMemo } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import {
  CheckCircle2, Circle, ChevronRight, Upload, Languages, Mic, Image, Film,
  Scissors, ExternalLink, Wand2, Download, Loader2, FolderOpen, Copy, Check,
  Plus, Trash2, ArrowLeft, Clock,
} from 'lucide-react'

type Etapa = 'script' | 'traducao' | 'audios' | 'prompts' | 'imagens' | 'speedpaint' | 'capcut'
type View = 'lista' | 'pipeline'

interface Prompt {
  id: string
  ptScript: string
  ptPrompt: string
  enPrompt: string
  validado: boolean
  loadingTraducao: boolean
  imagemUrl?: string
  loadingImagem?: boolean
}

interface EpisodioResumo {
  id: string
  titulo: string
  etapaAtual: Etapa
  etapasConcluidas: string[]
  pastaNome: string
  atualizadoEm: string
}

const ETAPAS = [
  { id: 'script',     label: 'Script',      icon: Upload,   desc: 'Upload ou texto do roteiro em PT' },
  { id: 'traducao',   label: 'Tradução',    icon: Languages, desc: 'Tradução para ES e EN' },
  { id: 'audios',     label: 'Áudios',      icon: Mic,      desc: 'Geração via ElevenLabs' },
  { id: 'prompts',    label: 'Prompts',     icon: Image,    desc: 'Geração e validação de prompts' },
  { id: 'imagens',    label: 'Imagens',     icon: Image,    desc: 'Geração das imagens DALL-E' },
  { id: 'speedpaint', label: 'SpeedPaint',  icon: Film,     desc: 'Animação manual no SpeedPaint' },
  { id: 'capcut',     label: 'CapCut',      icon: Scissors, desc: 'Edição final no CapCut' },
]

const ETAPA_LABEL: Record<string, string> = {
  script: 'Script',
  traducao: 'Tradução',
  audios: 'Áudios',
  prompts: 'Prompts',
  imagens: 'Imagens',
  speedpaint: 'SpeedPaint',
  capcut: 'CapCut',
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('app_token')}`,
  }
}

function formatarData(iso: string) {
  try {
    const d = new Date(iso)
    const agora = new Date()
    const diff = Math.floor((agora.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'agora mesmo'
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
    if (diff < 604800) return `${Math.floor(diff / 86400)} dias atrás`
    return d.toLocaleDateString('pt-BR')
  } catch { return '' }
}

export default function CriacaoVideo() {
  // ── Navegação ──────────────────────────────────────────────────────────────
  const [view, setView] = useState<View>('lista')
  const [episodioId, setEpisodioId] = useState<string | null>(null)

  // ── Lista ──────────────────────────────────────────────────────────────────
  const [lista, setLista] = useState<EpisodioResumo[]>([])
  const [loadingLista, setLoadingLista] = useState(true)

  // ── Pipeline: Script ──────────────────────────────────────────────────────
  const [titulo, setTitulo] = useState('')
  const [scriptPT, setScriptPT] = useState('')

  // ── Pipeline: Tradução ────────────────────────────────────────────────────
  const [traducaoES, setTraducaoES] = useState('')
  const [traducaoEN, setTraducaoEN] = useState('')
  const [loadingTraducao, setLoadingTraducao] = useState(false)

  // ── Pipeline: Pasta ───────────────────────────────────────────────────────
  const [pastaAtual, setPastaAtual] = useState('')
  const [pastaNome, setPastaNome] = useState('')

  // ── Pipeline: Áudios ─────────────────────────────────────────────────────
  const [audiosGerados, setAudiosGerados] = useState({ pt: false, es: false, en: false })
  const [loadingAudios, setLoadingAudios] = useState(false)
  const [audiosBase64, setAudiosBase64] = useState<{ pt?: string; es?: string; en?: string }>({})

  // ── Pipeline: Prompts ─────────────────────────────────────────────────────
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [novoPromptPT, setNovoPromptPT] = useState('')
  const [loadingPrompts, setLoadingPrompts] = useState(false)

  // ── Pipeline: Etapas ─────────────────────────────────────────────────────
  const [etapaAtual, setEtapaAtual] = useState<Etapa>('script')
  const [etapasConcluidas, setEtapasConcluidas] = useState<Set<Etapa>>(new Set())

  // ── Feedback ──────────────────────────────────────────────────────────────
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [copiadoId, setCopiadoId] = useState<string | null>(null)

  const scriptRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Carregar lista ao montar ───────────────────────────────────────────────
  useEffect(() => {
    carregarLista()
  }, [])

  async function carregarLista() {
    setLoadingLista(true)
    try {
      const res = await fetch('/api/episodios', { headers: authHeaders() })
      if (res.ok) setLista(await res.json())
    } catch { /* rede indisponível */ }
    finally { setLoadingLista(false) }
  }

  // ── Auto-save no servidor ─────────────────────────────────────────────────
  const etapasConcluidasKey = useMemo(() => [...etapasConcluidas].sort().join(','), [etapasConcluidas])

  useEffect(() => {
    if (!episodioId) return
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(async () => {
      setSalvando(true)
      try {
        await fetch(`/api/episodios/${episodioId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            titulo,
            etapaAtual,
            etapasConcluidas: [...etapasConcluidas],
            scriptPT,
            traducaoES,
            traducaoEN,
            audiosGerados,
            prompts: prompts.map(({ loadingTraducao: _lt, loadingImagem: _li, ...rest }) => rest),
            pastaAtual,
            pastaNome,
          }),
        })
      } finally {
        setSalvando(false)
      }
    }, 1500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodioId, etapaAtual, etapasConcluidasKey, titulo, scriptPT, traducaoES, traducaoEN, audiosGerados, prompts, pastaAtual, pastaNome])

  // ── Ações da lista ────────────────────────────────────────────────────────
  async function criarNovoEpisodio() {
    const res = await fetch('/api/episodios', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ titulo: '', etapaAtual: 'script' }),
    })
    if (!res.ok) { setErro('Erro ao criar episódio'); return }
    const ep = await res.json()
    restaurarEstado(ep)
    setView('pipeline')
  }

  async function abrirEpisodio(id: string) {
    const res = await fetch(`/api/episodios/${id}`, { headers: authHeaders() })
    if (!res.ok) { setErro('Erro ao carregar episódio'); return }
    const ep = await res.json()
    restaurarEstado(ep)
    setView('pipeline')
  }

  async function excluirEpisodio(id: string) {
    await fetch(`/api/episodios/${id}`, { method: 'DELETE', headers: authHeaders() })
    setLista(l => l.filter(e => e.id !== id))
  }

  function restaurarEstado(ep: Record<string, unknown>) {
    setEpisodioId(ep.id as string)
    setTitulo((ep.titulo as string) || '')
    setScriptPT((ep.scriptPT as string) || '')
    setTraducaoES((ep.traducaoES as string) || '')
    setTraducaoEN((ep.traducaoEN as string) || '')
    setPastaAtual((ep.pastaAtual as string) || '')
    setPastaNome((ep.pastaNome as string) || '')
    setAudiosGerados((ep.audiosGerados as typeof audiosGerados) || { pt: false, es: false, en: false })
    setAudiosBase64({})
    setPrompts(((ep.prompts as Prompt[]) || []).map(p => ({ ...p, loadingTraducao: false, loadingImagem: false })))
    setEtapaAtual((ep.etapaAtual as Etapa) || 'script')
    setEtapasConcluidas(new Set((ep.etapasConcluidas as Etapa[]) || []))
    setErro('')
  }

  function voltarParaLista() {
    setView('lista')
    setEpisodioId(null)
    carregarLista()
  }

  // ── Ações do pipeline ─────────────────────────────────────────────────────
  const copiar = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto)
    setCopiadoId(id)
    setTimeout(() => setCopiadoId(null), 1500)
  }

  const inserirMarcador = (voz: 'LUCIANA' | 'TOM') => {
    const ta = scriptRef.current
    if (!ta) return
    const inicio = ta.selectionStart
    const fim = ta.selectionEnd
    const selecao = scriptPT.slice(inicio, fim)
    const antes = scriptPT.slice(0, inicio)
    const depois = scriptPT.slice(fim)
    const inserido = selecao ? `[${voz}]\n${selecao}\n[/${voz}]` : `[${voz}]\n\n[/${voz}]`
    setScriptPT(antes + inserido + depois)
    requestAnimationFrame(() => {
      const novaPosicao = selecao ? inicio + inserido.length : inicio + `[${voz}]\n`.length
      ta.focus()
      ta.setSelectionRange(novaPosicao, novaPosicao)
    })
  }

  const concluirEtapa = async (etapa: Etapa) => {
    if (etapa === 'script' && !pastaAtual) {
      try {
        const res = await fetch('/api/videos/criar-pasta', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ scriptPT, titulo }),
        })
        if (res.ok) {
          const data = await res.json()
          setPastaAtual(data.pasta)
          setPastaNome(data.pastaNome)
        }
      } catch { /* não bloqueia */ }
    }
    setEtapasConcluidas(s => new Set([...s, etapa]))
    const idx = ETAPAS.findIndex(e => e.id === etapa)
    if (idx < ETAPAS.length - 1) setEtapaAtual(ETAPAS[idx + 1].id as Etapa)
  }

  const abrirPasta = async () => {
    if (!pastaAtual) return
    await fetch('/api/videos/abrir-pasta', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ pasta: pastaAtual }) })
  }

  const gerarTraducao = async () => {
    if (!scriptPT.trim()) return
    setLoadingTraducao(true)
    setErro('')
    try {
      const res = await fetch('/api/videos/traduzir', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ texto: scriptPT, pasta: pastaAtual }),
      })
      if (res.ok) {
        const data = await res.json()
        setTraducaoES(data.es || '')
        setTraducaoEN(data.en || '')
      } else { setErro((await res.json()).erro || 'Erro ao traduzir') }
    } catch { setErro('Erro de conexão ao traduzir') }
    finally { setLoadingTraducao(false) }
  }

  const gerarAudios = async () => {
    setLoadingAudios(true)
    setErro('')
    try {
      const res = await fetch('/api/videos/gerar-audios', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ scriptPT, scriptES: traducaoES, scriptEN: traducaoEN, pasta: pastaAtual }),
      })
      if (res.ok) {
        const data = await res.json()
        setAudiosBase64(data)
        setAudiosGerados({ pt: !!data.pt, es: !!data.es, en: !!data.en })
      } else { setErro((await res.json()).erro || 'Erro ao gerar áudios') }
    } catch { setErro('Erro de conexão ao gerar áudios') }
    finally { setLoadingAudios(false) }
  }

  const baixarAudio = (idioma: 'pt' | 'es' | 'en') => {
    const base64 = audiosBase64[idioma]
    if (!base64) return
    const byteChars = atob(base64)
    const byteNums = new Uint8Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
    const blob = new Blob([byteNums], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audio_${idioma}.mp3`
    a.click()
    URL.revokeObjectURL(url)
  }

  const gerarPromptsAutomatico = async () => {
    if (!scriptPT.trim()) return
    setLoadingPrompts(true)
    setErro('')
    try {
      const res = await fetch('/api/videos/gerar-prompts', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ texto: scriptPT }),
      })
      if (res.ok) {
        const data = await res.json()
        const novosPrompts: Prompt[] = (data.prompts || []).map((item: { ptScript: string; ptPrompt: string }) => ({
          id: `${Date.now()}-${Math.random()}`,
          ptScript: item.ptScript,
          ptPrompt: item.ptPrompt,
          enPrompt: '',
          validado: false,
          loadingTraducao: false,
        }))
        setPrompts(novosPrompts)
      } else { setErro((await res.json()).erro || 'Erro ao gerar prompts') }
    } catch { setErro('Erro de conexão ao gerar prompts') }
    finally { setLoadingPrompts(false) }
  }

  const adicionarPrompt = () => {
    if (!novoPromptPT.trim()) return
    setPrompts(p => [...p, {
      id: Date.now().toString(),
      ptScript: '',
      ptPrompt: novoPromptPT,
      enPrompt: '',
      validado: false,
      loadingTraducao: false,
    }])
    setNovoPromptPT('')
  }

  const editarPromptPT = (id: string, novoTexto: string) => {
    setPrompts(p => p.map(x => x.id === id ? { ...x, ptPrompt: novoTexto, validado: false, enPrompt: '' } : x))
  }

  const togglePrompt = async (id: string) => {
    const prompt = prompts.find(x => x.id === id)
    if (!prompt) return
    if (prompt.validado) {
      setPrompts(p => p.map(x => x.id === id ? { ...x, validado: false, enPrompt: '' } : x))
      return
    }
    if (!prompt.ptPrompt.trim()) return
    setPrompts(p => p.map(x => x.id === id ? { ...x, loadingTraducao: true } : x))
    setErro('')
    try {
      const res = await fetch('/api/videos/traduzir-prompt', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ prompt: prompt.ptPrompt }),
      })
      if (res.ok) {
        const data = await res.json()
        setPrompts(p => p.map(x => x.id === id ? { ...x, enPrompt: data.en, validado: true, loadingTraducao: false } : x))
      } else {
        setErro((await res.json()).erro || 'Erro ao traduzir prompt')
        setPrompts(p => p.map(x => x.id === id ? { ...x, loadingTraducao: false } : x))
      }
    } catch {
      setErro('Erro de conexão ao traduzir prompt')
      setPrompts(p => p.map(x => x.id === id ? { ...x, loadingTraducao: false } : x))
    }
  }

  const deletarPrompt = (id: string) => setPrompts(p => p.filter(x => x.id !== id))

  const gerarImagem = async (id: string, enPrompt: string) => {
    setPrompts(p => p.map(x => x.id === id ? { ...x, loadingImagem: true } : x))
    setErro('')
    try {
      const res = await fetch('/api/videos/gerar-imagem', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ prompt: enPrompt, pasta: pastaAtual, indice: prompts.findIndex(x => x.id === id) }),
      })
      if (res.ok) {
        const data = await res.json()
        setPrompts(p => p.map(x => x.id === id ? { ...x, imagemUrl: data.url, loadingImagem: false } : x))
      } else {
        setErro((await res.json()).erro || 'Erro ao gerar imagem')
        setPrompts(p => p.map(x => x.id === id ? { ...x, loadingImagem: false } : x))
      }
    } catch {
      setErro('Erro de conexão ao gerar imagem')
      setPrompts(p => p.map(x => x.id === id ? { ...x, loadingImagem: false } : x))
    }
  }

  const gerarTodasImagens = async () => {
    const validados = prompts.filter(p => p.validado && p.enPrompt && !p.imagemUrl)
    for (const p of validados) await gerarImagem(p.id, p.enPrompt)
  }

  const etapaIdx = ETAPAS.findIndex(e => e.id === etapaAtual)
  const imagensGeradas = prompts.filter(p => p.imagemUrl).length
  const promptsValidados = prompts.filter(p => p.validado)

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: LISTA DE EPISÓDIOS
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'lista') {
    const emAndamento = lista.filter(ep => ep.etapasConcluidas.length < ETAPAS.length)
    const finalizados = lista.filter(ep => ep.etapasConcluidas.length >= ETAPAS.length)

    const renderCard = (ep: EpisodioResumo) => {
      const finalizado = ep.etapasConcluidas.length >= ETAPAS.length
      const etapaNum = ETAPAS.findIndex(e => e.id === ep.etapaAtual) + 1
      return (
        <div key={ep.id} className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
            {finalizado ? '✅' : '🎬'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {ep.titulo || <span className="text-gray-400 font-normal">Sem título</span>}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              {finalizado ? (
                <span className="text-xs text-green-600 font-medium">Pipeline concluído</span>
              ) : (
                <span className="text-xs text-pink-600 font-medium">
                  Etapa {etapaNum}/7 — {ETAPA_LABEL[ep.etapaAtual] || ep.etapaAtual}
                </span>
              )}
              <div className="flex items-center gap-0.5">
                {ETAPAS.map(e => (
                  <div
                    key={e.id}
                    className={`w-2 h-2 rounded-full ${
                      ep.etapasConcluidas.includes(e.id) ? 'bg-green-400' :
                      ep.etapaAtual === e.id ? 'bg-pink-400' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
              <Clock size={10} />
              {formatarData(ep.atualizadoEm)}
              {ep.pastaNome && <span className="ml-1 text-gray-300">• {ep.pastaNome}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => abrirEpisodio(ep.id)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                finalizado
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {finalizado ? 'Ver' : 'Continuar'}
            </button>
            <button
              onClick={() => excluirEpisodio(ep.id)}
              className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
              title="Excluir episódio"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )
    }

    return (
      <ModuleLayout title="Criação de Vídeos" emoji="🎬" description="Pipeline de produção" color="text-pink-600" bgColor="bg-pink-50">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Episódios em andamento</h2>
          <button
            onClick={criarNovoEpisodio}
            className="flex items-center gap-1.5 px-3 py-2 bg-pink-500 text-white text-sm font-medium rounded-xl hover:bg-pink-600 transition-colors"
          >
            <Plus size={15} /> Novo episódio
          </button>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex justify-between">
            {erro}
            <button onClick={() => setErro('')} className="text-red-400 hover:text-red-600 ml-2">✕</button>
          </div>
        )}

        {loadingLista ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Carregando...
          </div>
        ) : lista.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🎬</p>
            <p className="font-medium text-gray-600 mb-1">Nenhum episódio em andamento</p>
            <p className="text-sm">Clique em "Novo episódio" para começar</p>
          </div>
        ) : (
          <div className="space-y-5">
            {emAndamento.length > 0 && (
              <div className="space-y-3">
                {emAndamento.map(renderCard)}
              </div>
            )}

            {finalizados.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-green-500" /> Episódios Finalizados
                </h3>
                <div className="space-y-3">
                  {finalizados.map(renderCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </ModuleLayout>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW: PIPELINE DO EPISÓDIO
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <ModuleLayout title="Criação de Vídeos" emoji="🎬" description="Pipeline de produção" color="text-pink-600" bgColor="bg-pink-50">

      {/* Barra superior: voltar + pasta + auto-save */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={voltarParaLista}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-pink-600 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={12} /> Episódios
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-0 p-2 bg-gray-50 border border-gray-200 rounded-lg">
          <FolderOpen size={13} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate flex-1">
            {pastaNome ? <span className="font-medium text-gray-700">{pastaNome}</span> : <span className="text-gray-400">Pasta criada ao concluir etapa 1</span>}
          </span>
          {pastaAtual && (
            <button onClick={abrirPasta} className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 hover:text-pink-600 border border-gray-200 rounded-md hover:border-pink-300 transition-colors">
              <FolderOpen size={11} /> Abrir
            </button>
          )}
          <button
            onClick={async () => { await fetch('/api/videos/abrir-pasta-videos', { method: 'POST', headers: authHeaders() }) }}
            className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 hover:text-pink-600 border border-gray-200 rounded-md hover:border-pink-300 transition-colors"
          >
            <FolderOpen size={11} /> Todos
          </button>
        </div>
        {salvando && (
          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <Loader2 size={11} className="animate-spin" /> Salvando
          </div>
        )}
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {ETAPAS.map((e, i) => {
          const concluida = etapasConcluidas.has(e.id as Etapa)
          const atual = etapaAtual === e.id
          return (
            <div key={e.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setEtapaAtual(e.id as Etapa)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  atual ? 'bg-pink-500 text-white shadow' :
                  concluida ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {concluida ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                {e.label}
              </button>
              {i < ETAPAS.length - 1 && <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />}
            </div>
          )
        })}
      </div>

      {/* Erro global */}
      {erro && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between">
          {erro}
          <button onClick={() => setErro('')} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      {/* ── ETAPA 1: SCRIPT ── */}
      {etapaAtual === 'script' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">1. Script em Português</h2>
          <div>
            <label className="label">Título do vídeo <span className="text-gray-400 font-normal">(opcional — usado no nome da pasta)</span></label>
            <input
              className="input"
              placeholder="Ex: Antigo Testamento — Episódio 01"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Roteiro em Português</label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 mr-1">Selecione o trecho e clique:</span>
                <button type="button" onClick={() => inserirMarcador('LUCIANA')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
                  [LUCIANA]
                </button>
                <button type="button" onClick={() => inserirMarcador('TOM')}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                  [TOM]
                </button>
              </div>
            </div>
            <textarea
              ref={scriptRef}
              className="input resize-none font-mono text-sm"
              rows={10}
              placeholder="Cole ou escreva aqui o roteiro do vídeo em português...&#10;&#10;Dica: selecione um trecho e clique em [LUCIANA] ou [TOM] para marcar quem fala."
              value={scriptPT}
              onChange={e => setScriptPT(e.target.value)}
            />
          </div>
          <button onClick={() => concluirEtapa('script')} disabled={!scriptPT.trim()} className="btn-primary w-full">
            Próximo: Tradução →
          </button>
        </div>
      )}

      {/* ── ETAPA 2: TRADUÇÃO ── */}
      {etapaAtual === 'traducao' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">2. Tradução para ES e EN</h2>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 max-h-24 overflow-y-auto">
            <p className="font-medium text-xs text-gray-400 mb-1">SCRIPT PT</p>
            {scriptPT}
          </div>
          <button onClick={gerarTraducao} disabled={loadingTraducao} className="btn-secondary w-full flex items-center justify-center gap-2">
            {loadingTraducao ? <><Loader2 size={16} className="animate-spin" /> Traduzindo...</> : <><Wand2 size={16} /> Gerar Traduções Automaticamente</>}
          </button>
          <div>
            <label className="label">🇪🇸 Espanhol</label>
            <textarea className="input resize-none" rows={4} value={traducaoES} onChange={e => setTraducaoES(e.target.value)} placeholder="Tradução em espanhol..." />
          </div>
          <div>
            <label className="label">🇺🇸 Inglês</label>
            <textarea className="input resize-none" rows={4} value={traducaoEN} onChange={e => setTraducaoEN(e.target.value)} placeholder="English translation..." />
          </div>
          <button onClick={() => concluirEtapa('traducao')} disabled={!traducaoES || !traducaoEN} className="btn-primary w-full">
            Próximo: Áudios →
          </button>
        </div>
      )}

      {/* ── ETAPA 3: ÁUDIOS ── */}
      {etapaAtual === 'audios' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">3. Gerar Áudios — ElevenLabs</h2>
          <p className="text-sm text-gray-500">
            O script deve ter blocos <code className="bg-gray-100 px-1 rounded text-xs">[LUCIANA]...[/LUCIANA]</code> e <code className="bg-gray-100 px-1 rounded text-xs">[TOM]...[/TOM]</code>.
          </p>
          <button onClick={gerarAudios} disabled={loadingAudios} className="btn-secondary w-full flex items-center justify-center gap-2">
            {loadingAudios ? <><Loader2 size={16} className="animate-spin" /> Gerando áudios...</> : <><Wand2 size={16} /> Gerar Áudios Automaticamente (ElevenLabs)</>}
          </button>
          {loadingAudios && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              Gerando áudios PT, ES e EN via ElevenLabs. Aguarde...
            </div>
          )}
          <div className="space-y-2">
            {(['pt', 'es', 'en'] as const).map(idioma => {
              const labels = { pt: '🇧🇷 Português — Luciana + Tom', es: '🇪🇸 Espanhol — Luciana + Tom', en: '🇺🇸 Inglês — Luciana + Tom' }
              const gerado = audiosGerados[idioma]
              return (
                <div key={idioma} className={`flex items-center justify-between p-3 rounded-lg border ${gerado ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{labels[idioma]}</p>
                    {gerado ? <p className="text-xs text-green-600">Gerado — pronto para download</p> : <p className="text-xs text-gray-400">Aguardando...</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {audiosBase64[idioma] && (
                      <button onClick={() => baixarAudio(idioma)} className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors">
                        <Download size={12} /> MP3
                      </button>
                    )}
                    <CheckCircle2 size={20} className={gerado ? 'text-green-500' : 'text-gray-300'} />
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={() => concluirEtapa('audios')} disabled={!Object.values(audiosGerados).some(Boolean)} className="btn-primary w-full">
            Próximo: Prompts →
          </button>
        </div>
      )}

      {/* ── ETAPA 4: PROMPTS ── */}
      {etapaAtual === 'prompts' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">4. Prompts para Imagens</h2>
          <button onClick={gerarPromptsAutomatico} disabled={loadingPrompts} className="btn-secondary w-full flex items-center justify-center gap-2">
            {loadingPrompts ? <><Loader2 size={16} className="animate-spin" /> Gerando prompts com IA...</> : <><Wand2 size={16} /> Gerar Prompts Automaticamente (IA)</>}
          </button>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Adicionar prompt em português manualmente..."
              value={novoPromptPT} onChange={e => setNovoPromptPT(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionarPrompt()} />
            <button onClick={adicionarPrompt} className="btn-primary px-3">+</button>
          </div>
          <div className="space-y-3 max-h-[32rem] overflow-y-auto">
            {prompts.map((p, i) => (
              <div key={p.id} className={`rounded-lg border overflow-hidden ${p.validado ? 'border-green-200' : 'border-gray-200'}`}>
                {p.ptScript && (
                  <div className="px-3 pt-2 pb-1.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-400 mb-0.5">#{i + 1} — trecho do script</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{p.ptScript}</p>
                  </div>
                )}
                <div className={`px-3 pt-2 pb-2 ${p.validado ? 'bg-green-50' : 'bg-white'}`}>
                  {!p.ptScript && <p className="text-xs font-medium text-gray-400 mb-1">#{i + 1} — prompt</p>}
                  <div className="flex items-start gap-2">
                    <textarea className="flex-1 text-sm text-gray-800 bg-transparent border-0 outline-none resize-none leading-relaxed min-h-[3rem]"
                      value={p.ptPrompt} onChange={e => editarPromptPT(p.id, e.target.value)} rows={2} />
                    <div className="flex gap-1 flex-shrink-0 mt-0.5">
                      <button onClick={() => togglePrompt(p.id)} disabled={p.loadingTraducao || !p.ptPrompt.trim()}
                        className={`p-1 rounded transition-colors ${p.loadingTraducao ? 'text-gray-300' : p.validado ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}>
                        {p.loadingTraducao ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      </button>
                      <button onClick={() => deletarPrompt(p.id)} className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors">✕</button>
                    </div>
                  </div>
                  {p.validado && p.enPrompt && (
                    <p className="mt-1.5 text-xs text-gray-400 italic border-t border-green-100 pt-1.5">🇺🇸 {p.enPrompt}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {prompts.length > 0 && (
            <p className="text-xs text-gray-400">{prompts.filter(p => p.validado).length}/{prompts.length} prompts validados</p>
          )}
          <button onClick={() => concluirEtapa('prompts')} disabled={prompts.filter(p => p.validado).length === 0} className="btn-primary w-full">
            Próximo: Gerar Imagens →
          </button>
        </div>
      )}

      {/* ── ETAPA 5: IMAGENS ── */}
      {etapaAtual === 'imagens' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">5. Gerar Imagens — DALL-E 3</h2>
          {promptsValidados.length === 0 && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">Nenhum prompt validado. Volte à etapa anterior.</p>
          )}
          {promptsValidados.length > 0 && (
            <>
              <button onClick={gerarTodasImagens}
                disabled={promptsValidados.every(p => p.imagemUrl || p.loadingImagem || !p.enPrompt)}
                className="btn-secondary w-full flex items-center justify-center gap-2">
                <Wand2 size={16} /> Gerar Todas ({promptsValidados.filter(p => !p.imagemUrl && p.enPrompt).length} restantes)
              </button>
              <div className="space-y-4">
                {promptsValidados.map((p, i) => (
                  <div key={p.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-100">
                      {p.ptScript && (
                        <div className="px-3 pt-2 pb-1 border-b border-gray-100">
                          <p className="text-xs text-gray-400 font-medium mb-0.5">#{i + 1} — trecho do script</p>
                          <p className="text-xs text-gray-400 leading-relaxed">{p.ptScript}</p>
                        </div>
                      )}
                      <div className="flex items-start gap-2 px-3 py-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 leading-relaxed">{p.ptPrompt}</p>
                          {p.enPrompt && <p className="mt-1 text-xs text-gray-400 italic">🇺🇸 {p.enPrompt}</p>}
                        </div>
                        {!p.imagemUrl && !p.loadingImagem && p.enPrompt && (
                          <button onClick={() => gerarImagem(p.id, p.enPrompt)}
                            className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-pink-500 text-white text-xs rounded-lg hover:bg-pink-600 transition-colors">
                            <Wand2 size={12} /> Gerar
                          </button>
                        )}
                      </div>
                    </div>
                    {p.loadingImagem && (
                      <div className="flex items-center justify-center p-8 bg-gray-50">
                        <Loader2 size={24} className="animate-spin text-pink-500" />
                        <span className="ml-2 text-sm text-gray-500">Gerando...</span>
                      </div>
                    )}
                    {p.imagemUrl && (
                      <div className="relative">
                        <img src={p.imagemUrl} alt={`Imagem ${i + 1}`} className="w-full object-cover" />
                        <a href={p.imagemUrl} download={`imagem-${i + 1}.png`} target="_blank" rel="noopener noreferrer"
                          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs rounded-lg hover:bg-black/80 transition-colors">
                          <Download size={12} /> Baixar
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {imagensGeradas > 0 && (
                <p className="text-xs text-green-600 font-medium">{imagensGeradas}/{promptsValidados.length} imagens geradas</p>
              )}
            </>
          )}
          <button onClick={() => concluirEtapa('imagens')} className="btn-primary w-full">
            Próximo: SpeedPaint →
          </button>
        </div>
      )}

      {/* ── ETAPA 6: SPEEDPAINT ── */}
      {etapaAtual === 'speedpaint' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">6. Animar no SpeedPaint</h2>
          <p className="text-sm text-gray-500">Execute os comandos abaixo no PowerShell para animar as imagens automaticamente.</p>

          {prompts.filter(p => p.imagemUrl).length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {prompts.filter(p => p.imagemUrl).map((p, i) => (
                <a key={p.id} href={p.imagemUrl} target="_blank" rel="noopener noreferrer"
                  className="aspect-video rounded-lg overflow-hidden border border-gray-200 hover:border-pink-400 transition-colors">
                  <img src={p.imagemUrl} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
            <p className="text-sm font-medium text-blue-800">Automação via Playwright (recomendado)</p>

            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-700">1. Entre na pasta do episódio</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 block text-xs bg-white border border-blue-200 rounded p-2 text-blue-900 break-all select-all">
                  {pastaAtual ? `Set-Location "${pastaAtual}"` : `Set-Location "C:\\Users\\c182154\\Desktop\\Meu_Agente\\Agente-Videos\\videos\\<pasta-do-episodio>"`}
                </code>
                <button onClick={() => copiar('cmd1', pastaAtual ? `Set-Location "${pastaAtual}"` : `Set-Location "C:\\Users\\c182154\\Desktop\\Meu_Agente\\Agente-Videos\\videos\\<pasta-do-episodio>"`)}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-white border border-blue-200 text-blue-500 hover:text-blue-700 transition-colors" title="Copiar">
                  {copiadoId === 'cmd1' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-700">2. Animar todas as imagens</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 block text-xs bg-white border border-blue-200 rounded p-2 text-blue-900 break-all select-all">
                  {`python "C:\\Users\\c182154\\Desktop\\Meu_Agente\\Agente-Videos\\scripts\\animar_imagens.py" imagens`}
                </code>
                <button onClick={() => copiar('cmd2', `python "C:\\Users\\c182154\\Desktop\\Meu_Agente\\Agente-Videos\\scripts\\animar_imagens.py" imagens`)}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-white border border-blue-200 text-blue-500 hover:text-blue-700 transition-colors" title="Copiar">
                  {copiadoId === 'cmd2' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-700">3. Se travar, retomar de onde parou</p>
              <p className="text-xs text-blue-500">Substitua <span className="font-mono bg-blue-100 px-1 rounded">nome_da_imagem.png</span> pelo arquivo onde travou</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 block text-xs bg-white border border-blue-200 rounded p-2 text-blue-900 break-all select-all">
                  {`python "C:\\Users\\c182154\\Desktop\\Meu_Agente\\Agente-Videos\\scripts\\animar_imagens.py" imagens --debug --start nome_da_imagem.png`}
                </code>
                <button onClick={() => copiar('cmd3', `python "C:\\Users\\c182154\\Desktop\\Meu_Agente\\Agente-Videos\\scripts\\animar_imagens.py" imagens --debug --start nome_da_imagem.png`)}
                  className="flex-shrink-0 p-1.5 rounded-lg bg-white border border-blue-200 text-blue-500 hover:text-blue-700 transition-colors" title="Copiar">
                  {copiadoId === 'cmd3' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-amber-800">Ou manualmente no site:</p>
            <a href="https://speedpaint.co" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-700 underline hover:text-amber-900">
              <ExternalLink size={12} /> speedpaint.co
            </a>
            <ol className="list-decimal list-inside space-y-0.5 text-xs text-amber-700 mt-1">
              <li>Upload da imagem PNG</li>
              <li>Sketching duration: 10-12s</li>
              <li>Color fill: 8s</li>
              <li>Clique em Animate → Download MP4</li>
            </ol>
          </div>

          <button onClick={() => concluirEtapa('speedpaint')} className="btn-primary w-full">
            Próximo: CapCut →
          </button>
        </div>
      )}

      {/* ── ETAPA 7: CAPCUT ── */}
      {etapaAtual === 'capcut' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">7. Editar no CapCut</h2>
          <p className="text-sm text-gray-500">Importe os áudios e as imagens animadas no CapCut para a edição final.</p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <CheckCircle2 size={14} className="text-green-500" /> Áudios PT, ES, EN prontos
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <CheckCircle2 size={14} className="text-green-500" /> Imagens animadas do SpeedPaint prontas
            </div>
          </div>
          <button onClick={() => concluirEtapa('capcut')} className="btn-primary w-full">
            ✅ Vídeo Pronto! Ir para Publicação →
          </button>
        </div>
      )}

      {/* Concluído */}
      {etapasConcluidas.size === ETAPAS.length && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-semibold text-green-700">Pipeline concluído!</p>
          <p className="text-sm text-green-600 mt-1">Vá para Publicação de Vídeos para publicar no YouTube e Spotify.</p>
          <button onClick={voltarParaLista} className="mt-3 text-sm text-green-600 underline hover:text-green-800">
            ← Voltar à lista de episódios
          </button>
        </div>
      )}
    </ModuleLayout>
  )
}
