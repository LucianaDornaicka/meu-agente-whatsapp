import { useState } from 'react'
import ModuleLayout from '@/components/ModuleLayout'
import { ExternalLink, Copy, CheckCircle2, Image } from 'lucide-react'

type Plataforma = 'youtube' | 'spotify'
type Idioma = 'pt' | 'es' | 'en'

const IDIOMAS = [
  { id: 'pt' as Idioma, label: '🇧🇷 PT', nome: 'Português' },
  { id: 'es' as Idioma, label: '🇪🇸 ES', nome: 'Espanhol' },
  { id: 'en' as Idioma, label: '🇺🇸 EN', nome: 'Inglês' },
]

const YOUTUBE_CHANNEL_IDS = {
  pt: 'UCaVxP3Jj67Ko-f4stRabrkA',
  es: 'UC7DwigoUdNYXAkv0d-KehVQ',
  en: 'UC1TB05Es-2GHi8RLuYienkQ',
}

const YOUTUBE_LINKS = {
  pt: `https://studio.youtube.com/channel/${YOUTUBE_CHANNEL_IDS.pt}`,
  es: `https://studio.youtube.com/channel/${YOUTUBE_CHANNEL_IDS.es}`,
  en: `https://studio.youtube.com/channel/${YOUTUBE_CHANNEL_IDS.en}`,
}

const YOUTUBE_UPLOAD_LINKS = {
  pt: `https://studio.youtube.com/channel/${YOUTUBE_CHANNEL_IDS.pt}/videos/upload`,
  es: `https://studio.youtube.com/channel/${YOUTUBE_CHANNEL_IDS.es}/videos/upload`,
  en: `https://studio.youtube.com/channel/${YOUTUBE_CHANNEL_IDS.en}/videos/upload`,
}

const SPOTIFY_LINKS = {
  pt: 'https://creators.spotify.com/pod/show/6eksxTNuLAKqkEFf5FCsRR/home',
  es: 'https://creators.spotify.com/pod/show/0aqwiMj5HYw3APjH4q8ban/home',
  en: 'https://creators.spotify.com/pod/show/3KnWI3krZLKt8iJThUd6DA/home',
}

const PLAYLISTS_YT = ['Bíblia', 'Devocional', 'Estudo Bíblico', 'Sermão', 'Outro']

interface FormYoutube {
  titulo: string
  descricao: string
  playlist: string
  tags: string
  data: string
  hora: string
  publico: boolean
  episodioAnteriorUrl: string
}

interface FormSpotify {
  titulo: string
  descricao: string
  temporada: string
  episodio: string
  data: string
  hora: string
}

const YT_STEPS = [
  '📁 Fazer upload do vídeo pronto',
  '✏️ Título',
  '📝 Descrição',
  '🖼️ Imagem Miniatura',
  '📋 Selecionar Playlist',
  '🚫 Não é conteúdo para crianças',
  '🏷️ Mostrar Mais → Tags',
  '▶️ Avançar → Avançar',
  '🌐 Público → Programar: Data e Horário',
  '📺 Tela final → adicionar vídeo do episódio anterior',
]

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

export default function PublicacaoVideo() {
  const [plataforma, setPlataforma] = useState<Plataforma>('youtube')
  const [idioma, setIdioma] = useState<Idioma>('pt')
  const [copiado, setCopiado] = useState<string | null>(null)
  const [stepsYT, setStepsYT] = useState<boolean[]>(Array(YT_STEPS.length).fill(false))
  const [stepsSP, setStepsSP] = useState<boolean[]>(Array(SP_STEPS.length).fill(false))

  const [formsYT, setFormsYT] = useState<Record<Idioma, FormYoutube>>({
    pt: { titulo: '', descricao: '', playlist: 'Bíblia', tags: '', data: '', hora: '', publico: true, episodioAnteriorUrl: '' },
    es: { titulo: '', descricao: '', playlist: 'Bíblia', tags: '', data: '', hora: '', publico: true, episodioAnteriorUrl: '' },
    en: { titulo: '', descricao: '', playlist: 'Bíblia', tags: '', data: '', hora: '', publico: true, episodioAnteriorUrl: '' },
  })

  const [formsSpotify, setFormsSpotify] = useState<Record<Idioma, FormSpotify>>({
    pt: { titulo: '', descricao: '', temporada: '1', episodio: '', data: '', hora: '' },
    es: { titulo: '', descricao: '', temporada: '1', episodio: '', data: '', hora: '' },
    en: { titulo: '', descricao: '', temporada: '1', episodio: '', data: '', hora: '' },
  })

  const copiarParaTodos = (campo: keyof FormYoutube | keyof FormSpotify) => {
    if (plataforma === 'youtube') {
      const valor = (formsYT[idioma] as any)[campo]
      setFormsYT(f => {
        const novo = { ...f }
        IDIOMAS.forEach(i => { (novo[i.id] as any)[campo] = valor })
        return novo
      })
    } else {
      const valor = (formsSpotify[idioma] as any)[campo]
      setFormsSpotify(f => {
        const novo = { ...f }
        IDIOMAS.forEach(i => { (novo[i.id] as any)[campo] = valor })
        return novo
      })
    }
    setCopiado(campo as string)
    setTimeout(() => setCopiado(null), 1500)
  }

  const updateYT = (campo: keyof FormYoutube, valor: string | boolean) => {
    setFormsYT(f => ({ ...f, [idioma]: { ...f[idioma], [campo]: valor } }))
  }

  const updateSpotify = (campo: keyof FormSpotify, valor: string) => {
    setFormsSpotify(f => ({ ...f, [idioma]: { ...f[idioma], [campo]: valor } }))
  }

  const toggleStep = (steps: boolean[], setSteps: (s: boolean[]) => void, idx: number) => {
    const novo = [...steps]
    novo[idx] = !novo[idx]
    setSteps(novo)
  }

  const resetSteps = (setSteps: (s: boolean[]) => void, len: number) => {
    setSteps(Array(len).fill(false))
  }

  const CopyBtn = ({ campo }: { campo: string }) => (
    <button
      onClick={() => copiarParaTodos(campo as any)}
      className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-md transition-all ${copiado === campo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
    >
      {copiado === campo ? <CheckCircle2 size={11} /> : <Copy size={11} />}
      {copiado === campo ? 'Copiado!' : 'Copiar p/ todos'}
    </button>
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

      {/* Link direto */}
      <a
        href={plataforma === 'youtube' ? YOUTUBE_LINKS[idioma] : SPOTIFY_LINKS[idioma]}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors"
      >
        <ExternalLink size={15} />
        Abrir {plataforma === 'youtube' ? 'YouTube Studio' : 'Spotify Creators'} ({IDIOMAS.find(i2 => i2.id === idioma)?.nome})
      </a>

      {/* YOUTUBE */}
      {plataforma === 'youtube' && (
        <div className="space-y-4">
          {/* Checklist de passos */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Checklist de Publicação</h3>
              <button onClick={() => resetSteps(setStepsYT, YT_STEPS.length)} className="text-xs text-gray-400 hover:text-gray-600">Limpar</button>
            </div>
            <div className="space-y-1.5">
              {YT_STEPS.map((step, i) => (
                <button
                  key={i}
                  onClick={() => toggleStep(stepsYT, setStepsYT, i)}
                  className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm transition-all ${stepsYT[i] ? 'bg-green-50 text-green-700 line-through' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${stepsYT[i] ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                    {stepsYT[i] ? '✓' : ''}
                  </span>
                  {step}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {stepsYT.filter(Boolean).length} / {YT_STEPS.length} concluídos
            </p>
          </div>

          {/* Formulário */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Dados para copiar</h3>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Título</label>
                <CopyBtn campo="titulo" />
              </div>
              <input className="input" placeholder="Título do vídeo" value={formsYT[idioma].titulo} onChange={e => updateYT('titulo', e.target.value)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Descrição</label>
                <div className="flex items-center gap-1.5">
                  <a
                    href={YOUTUBE_UPLOAD_LINKS[idioma]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                  >
                    <ExternalLink size={11} />
                    Abrir no YouTube Studio
                  </a>
                  <CopyBtn campo="descricao" />
                </div>
              </div>
              <textarea className="input resize-none" rows={4} placeholder="Descrição do vídeo..." value={formsYT[idioma].descricao} onChange={e => updateYT('descricao', e.target.value)} />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-700">
              <Image size={15} className="flex-shrink-0" />
              <span>Lembrete: fazer upload da <strong>Imagem Miniatura</strong> no YouTube Studio</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Playlist</label>
                <CopyBtn campo="playlist" />
              </div>
              <select className="input" value={formsYT[idioma].playlist} onChange={e => updateYT('playlist', e.target.value)}>
                {PLAYLISTS_YT.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <span className="text-sm text-gray-700 flex-1">🚫 Não é conteúdo para crianças</span>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Marcar essa opção</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Tags</label>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://keywordtool.io/youtube?keyword=${encodeURIComponent(formsYT[idioma].titulo)}&country=BR&language=pt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 text-violet-600 hover:bg-violet-200 transition-all"
                  >
                    <ExternalLink size={11} />
                    Gerar Tags
                  </a>
                  <CopyBtn campo="tags" />
                </div>
              </div>
              <input className="input" placeholder="tag1, tag2, tag3..." value={formsYT[idioma].tags} onChange={e => updateYT('tags', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Acessível em "Mostrar Mais" no YouTube Studio</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Data de publicação</label>
                <input type="date" className="input" value={formsYT[idioma].data} onChange={e => updateYT('data', e.target.value)} />
              </div>
              <div>
                <label className="label">Horário</label>
                <input type="time" className="input" value={formsYT[idioma].hora} onChange={e => updateYT('hora', e.target.value)} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">📺 Tela Final — URL do Episódio Anterior</label>
                <CopyBtn campo="episodioAnteriorUrl" />
              </div>
              <input
                className="input"
                placeholder="https://youtube.com/watch?v=..."
                value={formsYT[idioma].episodioAnteriorUrl}
                onChange={e => updateYT('episodioAnteriorUrl', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Aparece no final do vídeo para o espectador assistir o episódio anterior</p>
            </div>
          </div>
        </div>
      )}

      {/* SPOTIFY */}
      {plataforma === 'spotify' && (
        <div className="space-y-4">
          {/* Checklist de passos */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Checklist de Publicação</h3>
              <button onClick={() => resetSteps(setStepsSP, SP_STEPS.length)} className="text-xs text-gray-400 hover:text-gray-600">Limpar</button>
            </div>
            <div className="space-y-1.5">
              {SP_STEPS.map((step, i) => (
                <button
                  key={i}
                  onClick={() => toggleStep(stepsSP, setStepsSP, i)}
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
                <CopyBtn campo="titulo" />
              </div>
              <input className="input" placeholder="Título do episódio" value={formsSpotify[idioma].titulo} onChange={e => updateSpotify('titulo', e.target.value)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Descrição</label>
                <CopyBtn campo="descricao" />
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
