import {
  AlertTriangle,
  Clock,
  Play,
  Flag,
  PauseCircle,
  RefreshCw,
  ShieldAlert,
  PackageX,
  Route,
  Info
} from 'lucide-react';

/**
 * Tipos de ocorrência: os do web (ATRASO, AVARIA...) e os enviados pelo app
 * do motorista (Inicio, Fim, Continuando, Parada).
 */
const TYPE_META = {
  ROUBO: { label: 'Sinistro / Roubo', tone: 'danger', icon: ShieldAlert },
  AVARIA: { label: 'Avaria de carga', tone: 'danger', icon: PackageX },
  ATRASO: { label: 'Atraso', tone: 'warning', icon: Clock },
  DESVIO: { label: 'Desvio de rota', tone: 'warning', icon: Route },
  OUTROS: { label: 'Outros', tone: 'info', icon: Info },
  INICIO: { label: 'Início da rota', tone: 'info', icon: Play },
  CONTINUANDO: { label: 'Retomada', tone: 'info', icon: RefreshCw },
  PARADA: { label: 'Parada', tone: 'warning', icon: PauseCircle },
  FIM: { label: 'Entrega finalizada', tone: 'active', icon: Flag }
};

export const getOccurrenceMeta = (type) => {
  const key = (type || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  return TYPE_META[key] || { label: type || 'Ocorrência', tone: 'info', icon: AlertTriangle };
};

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

export const formatOccurrenceDate = (occ) => {
  const raw = occ?.dateTime || occ?.createdAt;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : dateTimeFormatter.format(date);
};

/** Ordena da mais recente para a mais antiga. */
export const sortOccurrences = (list = []) =>
  [...list].sort((a, b) => new Date(b.dateTime || b.createdAt || 0) - new Date(a.dateTime || a.createdAt || 0));

/**
 * Interpreta o campo `attachment` (texto livre na API). Hoje o app envia
 * o SVG cru da assinatura; quando não há anexo envia "Sem anexo".
 */
export const parseAttachment = (value) => {
  const raw = (value || '').trim();
  if (raw.length < 5 || /^sem anexo$/i.test(raw)) return null;

  if (/^(<\?xml[\s\S]*?\?>\s*)?<svg[\s>]/i.test(raw)) {
    const svg = /xmlns=/.test(raw) ? raw : raw.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    return {
      kind: 'image',
      label: 'Assinatura do recebedor',
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      fileName: 'assinatura.svg'
    };
  }

  if (/^data:image\//i.test(raw)) {
    const ext = raw.slice(11, raw.indexOf(';')).replace('svg+xml', 'svg') || 'png';
    return { kind: 'image', label: 'Imagem anexada', src: raw, fileName: `anexo.${ext}` };
  }

  if (/^https?:\/\//i.test(raw)) {
    const isImage = /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(raw);
    return { kind: isImage ? 'image' : 'link', label: isImage ? 'Imagem anexada' : 'Arquivo anexado', src: raw };
  }

  // Base64 puro de imagem (sem prefixo data:)
  if (/^[A-Za-z0-9+/=\s]{100,}$/.test(raw)) {
    const mime = raw.startsWith('/9j/') ? 'jpeg' : 'png';
    return { kind: 'image', label: 'Imagem anexada', src: `data:image/${mime};base64,${raw.replace(/\s/g, '')}`, fileName: `anexo.${mime === 'jpeg' ? 'jpg' : 'png'}` };
  }

  return { kind: 'text', label: 'Anexo', text: raw };
};

