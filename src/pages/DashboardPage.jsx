import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, CalendarCheck, Truck, CheckCircle2, AlertTriangle, Users, Timer,
  Route as RouteIcon, Clock, DollarSign, Gauge, Weight, Leaf, Shuffle, RefreshCw, Map as MapIcon,
  BarChart3, Factory
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import MapComponent from '../components/MapComponent';
import StatCard from '../components/ui/StatCard';
import SectionCard from '../components/ui/SectionCard';
import Hint from '../components/ui/Hint';
import InfoTip from '../components/ui/InfoTip';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { dashboardService } from '../services/dashboardService';
import { deliveryService } from '../services/deliveryService';
import { decodePolyline } from '../utils/polyline';
import { translateStatus } from '../utils/enumTranslations';
import { useToast } from '../components/ToastContext';
import { extractErrorMessage } from '../utils/errorUtils';
import '../styles/Dashboard.css';

const fmtNum = (v, d = 0) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const fmtMoney = (v) => (v === null || v === undefined ? null : v);

/** Monta as rotas do mapa a partir da visão consolidada remessa + parada + transporte. */
const buildRoutes = (rows) => {
  const byTransport = new Map();
  rows.forEach((r) => {
    const t = r.transport;
    if (!t || !r.address) return;
    if (!byTransport.has(t.id)) {
      const plate = t.equipamentGroup?.equipament1?.plate;
      const driver = t.driver?.user?.name;
      byTransport.set(t.id, {
        id: t.id,
        label: [`Viagem #${t.codeTransport ?? t.id.slice(0, 6)}`, plate, driver].filter(Boolean).join(' · '),
        coords: decodePolyline(t.routePlanned || ''),
        stops: []
      });
    }
    byTransport.get(t.id).stops.push({
      coord: [parseFloat(r.address.latitude), parseFloat(r.address.longitude)],
      type: r.typeOperation,
      label: r.customer?.legalName,
      status: r.status,
      statusLabel: translateStatus(r.status),
      sequence: r.routeStop?.sequenceOrder
    });
  });
  // Só viagens com algo por fazer: viagens 100% concluídas não poluem o mapa operacional
  return [...byTransport.values()]
    .map(v => ({ ...v, stops: v.stops.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)) }))
    .filter(v => v.stops.some(s => s.status !== 'FINALIZADO'));
};

const DailyChart = ({ points }) => {
  const [hover, setHover] = useState(null);
  const today = new Date().toISOString().slice(0, 10);
  const max = Math.max(1, ...points.map(p => p.shipments));
  if (points.length === 0) {
    return <EmptyState icon={BarChart3} title="Sem remessas no período" description="A série mostra 7 dias para trás e 14 para frente a partir das datas agendadas." />;
  }
  return (
    <div className="dash-chart">
      <div className="dash-chart__legend">
        <span><i style={{ background: '#0d9488' }} /> Entregues</span>
        <span><i style={{ background: '#6366f1' }} /> A entregar</span>
      </div>
      <div className="dash-chart__plot" role="img" aria-label="Remessas agendadas por dia">
        {[0.5, 1].map(f => (
          <div key={f} className="dash-chart__grid" style={{ bottom: `${f * 100}%` }}>
            <span>{Math.round(max * f)}</span>
          </div>
        ))}
        {points.map((p) => {
          const delivered = p.delivered;
          const open = p.shipments - p.delivered;
          const isToday = p.date === today;
          const d = new Date(`${p.date}T12:00:00`);
          return (
            <div
              key={p.date}
              className={`dash-chart__col ${isToday ? 'is-today' : ''} ${hover === p.date ? 'is-hover' : ''}`}
              onMouseEnter={() => setHover(p.date)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(p.date)}
              onBlur={() => setHover(null)}
              tabIndex={0}
            >
              <div className="dash-chart__stack">
                {open > 0 && <div className="dash-chart__bar dash-chart__bar--open" style={{ height: `${(open / max) * 100}%` }} />}
                {delivered > 0 && <div className="dash-chart__bar dash-chart__bar--done" style={{ height: `${(delivered / max) * 100}%` }} />}
              </div>
              <span className="dash-chart__label">{d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              {hover === p.date && (
                <div className="dash-chart__tip">
                  <strong>{d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}{isToday ? ' · hoje' : ''}</strong>
                  <span>{p.shipments} remessa(s) · {p.delivered} entregue(s)</span>
                  <span>{p.plannedKm > 0 ? `${fmtNum(p.plannedKm, 1)} km planejados` : 'sem viagem planejada'}</span>
                  {p.plannedCo2Kg !== null && p.plannedCo2Kg !== undefined && <span>{fmtNum(p.plannedCo2Kg, 1)} kg CO₂ planejados</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <details className="dash-chart__table">
        <summary>Ver como tabela</summary>
        <table>
          <thead><tr><th>Data</th><th>Remessas</th><th>Entregues</th><th>km planejado</th><th>kg CO₂ planejado</th></tr></thead>
          <tbody>
            {points.map(p => (
              <tr key={p.date}>
                <td>{new Date(`${p.date}T12:00:00`).toLocaleDateString('pt-BR')}</td>
                <td>{p.shipments}</td><td>{p.delivered}</td><td>{fmtNum(p.plannedKm, 1)}</td><td>{fmtNum(p.plannedCo2Kg, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [metrics, rows] = await Promise.all([
        dashboardService.getAll(),
        deliveryService.getAllPersonalized().catch(() => [])
      ]);
      setData(metrics);
      setRoutes(buildRoutes(Array.isArray(rows) ? rows : []));
      if (manual) showToast('Indicadores atualizados.', 'success');
    } catch (error) {
      showToast(extractErrorMessage(error, 'Não foi possível carregar os indicadores.'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const m = data?.methodology || {};
  const op = data?.operation;
  const sla = data?.sla;
  const plan = data?.planning;
  const em = data?.emissions;
  const seq = data?.sequencing;

  const coverage = em && em.tripsTotal > 0 ? Math.round((100 * em.tripsWithFactor) / em.tripsTotal) : null;
  const seqMax = seq ? Math.max(seq.baselineStraightKm, seq.optimizedStraightKm, 1) : 1;
  const updatedAt = useMemo(() => (data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null), [data]);

  return (
    <div className="dash">
      <PageHeader
        title="Visão Geral da Operação"
        description={updatedAt ? `Indicadores calculados com os dados registrados · atualizado às ${updatedAt}` : 'Indicadores calculados com os dados registrados'}
        icon={LayoutDashboard}
      >
        <button className="btn btn-outline" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> Atualizar
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/transporte')}>
          <RouteIcon size={16} /> Planejar rotas
        </button>
      </PageHeader>

      <Hint id="dashboard-metodologia" title="Como ler estes indicadores" tone="info" compact>
        Nenhum número aqui é estimado por percentual fixo ou histórico simulado: tudo vem de remessas, viagens, paradas e
        ocorrências registradas. Quando falta base para um cálculo o card mostra <b>sem dados</b>. Clique no <b>ⓘ</b> de
        cada indicador para ver a fórmula e a fonte.
      </Hint>

      {/* ---------------------------------------------------------------- Operação agora */}
      <div className="ui-kpi-grid ui-stagger dash-ops">
        <StatCard label="Aguardando roteirização" value={op?.shipmentsPending} icon={Package} tone="warning" loading={loading}
          footer="Remessas pendentes de planejamento" onClick={() => navigate('/entregas')} />
        <StatCard label="Planejadas" value={op?.shipmentsPlanned} icon={CalendarCheck} tone="info" loading={loading}
          footer="Em rota, aguardando início" onClick={() => navigate('/transporte')} />
        <StatCard label="Em andamento" value={op?.shipmentsInProgress} icon={Truck} tone="brand" loading={loading}
          footer="Iniciadas pelo motorista" onClick={() => navigate('/monitoramento')} />
        <StatCard label="Entregues" value={op?.shipmentsDelivered} icon={CheckCircle2} tone="success" loading={loading}
          footer={op ? `Hoje: ${op.todayDelivered} de ${op.todayShipments}` : null} />
        <StatCard label="Atrasadas" value={op?.shipmentsOverdue} icon={AlertTriangle} tone={op?.shipmentsOverdue ? 'danger' : 'neutral'} loading={loading}
          info={m.overdue} footer="Horário agendado já passou" onClick={() => navigate('/entregas')} />
        <StatCard label="Entregas no prazo" value={sla?.onTimeRate} unit="%" decimals={1} icon={Timer} tone="success" loading={loading}
          info={m.sla}
          footer={sla ? `${sla.deliveredOnTime} de ${sla.deliveredWithTimestamp} com horário registrado` : null} />
      </div>

      {/* ---------------------------------------------------------------- Mapa + viagens */}
      <div className="dash-grid">
        <SectionCard
          className="dash-map"
          icon={MapIcon}
          title="Rotas em operação"
          description="Viagens planejadas ou em andamento, com as paradas na ordem do otimizador"
          actions={<button className="btn btn-outline btn-sm" onClick={() => navigate('/monitoramento')}>Abrir monitoramento</button>}
          bodyClassName="dash-map__body"
        >
          <div className="dash-map__canvas">
            <MapComponent polylines={routes} interactive zoom={11} />
          </div>
        </SectionCard>

        <div className="dash-side ui-stagger">
          <SectionCard icon={RouteIcon} title="Viagens">
            {loading ? <Skeleton height={88} /> : (
              <div className="dash-trips">
                <div><strong>{op?.tripsPlanned ?? 0}</strong><span>planejadas</span></div>
                <div><strong>{op?.tripsInProgress ?? 0}</strong><span>em andamento</span></div>
                <div><strong>{op?.tripsFinished ?? 0}</strong><span>concluídas</span></div>
              </div>
            )}
          </SectionCard>
          <StatCard label="Motoristas cadastrados" value={op?.activeDrivers} icon={Users} loading={loading} onClick={() => navigate('/perfis')} />
          <StatCard label="Veículos ativos" value={op?.activeVehicles} icon={Truck} loading={loading} onClick={() => navigate('/frota')} />
        </div>
      </div>

      {/* ---------------------------------------------------------------- Planejamento */}
      <SectionCard icon={Gauge} title="Plano gerado pelo otimizador"
        description="Totais das viagens roteirizadas pelo Google Route Optimization">
        <div className="ui-kpi-grid">
          <StatCard label="Distância planejada" value={plan?.plannedKm} unit="km" decimals={1} icon={RouteIcon} loading={loading} info={m.plannedKm}
            footer={plan ? `${plan.trips} viagem(ns) · ${plan.plannedStops} parada(s)` : null} />
          <StatCard label="Tempo planejado" value={plan?.plannedHours} unit="h" decimals={1} icon={Clock} loading={loading}
            footer="Deslocamento + atendimento nas paradas" />
          <StatCard label="Custo estimado" value={fmtMoney(plan?.plannedCost)} prefix="R$" decimals={2} icon={DollarSign} loading={loading}
            footer="Custo/km do veículo + custo/hora do motorista + custo fixo do perfil" />
          <StatCard label="Paradas por viagem" value={plan?.avgStopsPerTrip} decimals={1} icon={Package} loading={loading} />
          <StatCard label="Ocupação média de carga" value={plan?.avgLoadFactor} unit="%" decimals={1} icon={Weight} loading={loading} info={m.loadFactor}
            footer={plan ? `${plan.tripsWithCapacity} viagem(ns) com capacidade cadastrada` : null} />
          <StatCard label="Trabalho de transporte" value={plan?.tonKm} unit="t·km" decimals={1} icon={Factory} loading={loading} info={m.tonKm} />
        </div>
      </SectionCard>

      {/* ---------------------------------------------------------------- Emissões e sequenciamento */}
      <div className="dash-grid dash-grid--even">
        <SectionCard icon={Leaf} title="Emissões de CO₂" description="Combustão direta (escopo 1) das viagens planejadas e realizadas"
          badge={<InfoTip title="Emissões de CO₂">{m.co2}</InfoTip>}>
          <div className="ui-kpi-grid">
            <StatCard label="CO₂ planejado" value={em?.plannedCo2Kg} unit="kg" decimals={1} tone="success" icon={Leaf} loading={loading} />
            <StatCard label="CO₂ realizado" value={em?.realizedCo2Kg} unit="kg" decimals={1} icon={Leaf} loading={loading} info={m.co2Realized}
              emptyText="sem viagens concluídas" footer={em ? `${em.tripsWithRealizedKm} viagem(ns) com km realizado` : null} />
            <StatCard label="Por entrega" value={em?.co2PerDeliveryKg} unit="kg CO₂" decimals={2} loading={loading} />
            <StatCard label="Intensidade" value={em?.gCo2PerTonKm} unit="g/t·km" decimals={1} loading={loading} info={m.tonKm} />
          </div>
          {em && (
            <div className="dash-coverage">
              <div className="dash-coverage__head">
                <span>Cobertura do cálculo</span>
                <strong>{em.tripsWithFactor} de {em.tripsTotal} viagens</strong>
              </div>
              <div className="dash-coverage__bar"><span style={{ width: `${coverage ?? 0}%` }} /></div>
              {coverage !== null && coverage < 100 && (
                <Hint tone="warning" title="Complete o cadastro da frota para medir todas as viagens">
                  Viagens cujo veículo não tem <b>consumo médio (km/L)</b> nem <b>kg CO₂/km</b> informados ficam fora do total —
                  nenhum valor é presumido. Ajuste em <a href="/frota">Frota de Veículos</a>.
                </Hint>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={Shuffle} title="Ganho de sequenciamento"
          description="Rota otimizada × atender as mesmas paradas na ordem de agendamento"
          badge={<InfoTip title="Linha de base" align="left">{m.sequencing}</InfoTip>}>
          {loading ? <Skeleton height={140} /> : seq && seq.tripsEvaluated > 0 ? (
            <div className="dash-seq">
              <div className="dash-seq__headline">
                <strong>{seq.savedPercent !== null ? `${fmtNum(seq.savedPercent, 1)}%` : '—'}</strong>
                <span>menos distância em linha reta · {fmtNum(seq.savedStraightKm, 1)} km em {seq.tripsEvaluated} viagem(ns)</span>
              </div>
              <div className="dash-seq__bars">
                <div className="dash-seq__row">
                  <span>Ordem de agendamento</span>
                  <div className="dash-seq__track"><i className="is-baseline" style={{ width: `${(seq.baselineStraightKm / seqMax) * 100}%` }} /></div>
                  <b>{fmtNum(seq.baselineStraightKm, 1)} km</b>
                </div>
                <div className="dash-seq__row">
                  <span>Sequência otimizada</span>
                  <div className="dash-seq__track"><i className="is-optimized" style={{ width: `${(seq.optimizedStraightKm / seqMax) * 100}%` }} /></div>
                  <b>{fmtNum(seq.optimizedStraightKm, 1)} km</b>
                </div>
              </div>
              <p className="dash-seq__note">Estimativa geométrica (haversine) com o mesmo critério nos dois lados; não é medição rodoviária nem converte em CO₂ evitado.</p>
            </div>
          ) : (
            <EmptyState icon={Shuffle} title="Sem viagens para comparar" description="O comparativo aparece quando houver viagens com 2 ou mais paradas e endereços com coordenadas." />
          )}
        </SectionCard>
      </div>

      {/* ---------------------------------------------------------------- Série diária */}
      <SectionCard icon={BarChart3} title="Remessas por dia" description="Data agendada · 7 dias anteriores e 14 seguintes">
        {loading ? <Skeleton height={200} /> : <DailyChart points={data?.daily || []} />}
      </SectionCard>
    </div>
  );
};

export default DashboardPage;
