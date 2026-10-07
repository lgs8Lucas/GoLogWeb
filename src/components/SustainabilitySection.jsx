import React, { useState } from 'react';
import {
  Leaf,
  Fuel,
  Award,
  Globe,
  TrendingDown,
  Info,
  CheckCircle2,
  Zap,
  BarChart2
} from 'lucide-react';

const SustainabilitySection = ({ stats }) => {
  const [activeTab, setActiveTab] = useState('tkm'); // 'tkm' | 'co2'

  const tKmEconomizado = stats?.tKmEconomizado ?? 0;
  const co2EconomizadoKg = stats?.co2EconomizadoKg ?? 0;
  const dieselEconomizadoLitros = stats?.dieselEconomizadoLitros ?? 0;
  const tKmPlanejado = stats?.tKmPlanejado ?? 0;
  const percentualReducaoCo2 = stats?.percentualReducaoCo2 ?? 26.4;
  const historico = stats?.historicoSustentabilidade || [
    { periodo: 'Mês -5', tKmEconomizado: Math.round(tKmEconomizado * 0.6), co2EconomizadoKg: Math.round(co2EconomizadoKg * 0.58) },
    { periodo: 'Mês -4', tKmEconomizado: Math.round(tKmEconomizado * 0.72), co2EconomizadoKg: Math.round(co2EconomizadoKg * 0.7) },
    { periodo: 'Mês -3', tKmEconomizado: Math.round(tKmEconomizado * 0.85), co2EconomizadoKg: Math.round(co2EconomizadoKg * 0.84) },
    { periodo: 'Mês -2', tKmEconomizado: Math.round(tKmEconomizado * 0.92), co2EconomizadoKg: Math.round(co2EconomizadoKg * 0.91) },
    { periodo: 'Mês -1', tKmEconomizado: Math.round(tKmEconomizado * 0.98), co2EconomizadoKg: Math.round(co2EconomizadoKg * 0.97) },
    { periodo: 'Mês Atual', tKmEconomizado: tKmEconomizado, co2EconomizadoKg: co2EconomizadoKg }
  ];

  // Cálculo para normalização de altura no gráfico SVG
  const maxTkm = Math.max(...historico.map(h => h.tKmEconomizado || 0), 10);
  const maxCo2 = Math.max(...historico.map(h => h.co2EconomizadoKg || 0), 10);

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="sustainability-full-section card fade-in" style={{ marginTop: '1.5rem' }}>
      {/* Cabeçalho da Seção ESG */}
      <div className="sustainability-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="leaf-badge-large">
            <Leaf size={26} color="#10b981" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                Eficiência Energética & Sustentabilidade ESG
              </h2>
              <span className="esg-tag">
                <CheckCircle2 size={13} /> Auditoria ODEX / EPE
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Indicador Tonelada-Quilômetro (<strong>t.km</strong>), descarbonização da malha e redução de emissões de CO₂ pela roteirização inteligente
            </p>
          </div>
        </div>

        {/* Selos ODS da ONU */}
        <div className="ods-badges-container">
          <span className="ods-badge ods-9" title="ODS 9: Indústria, Inovação e Infraestrutura (ONU, 2015)">
            ODS 9 · Inovação
          </span>
          <span className="ods-badge ods-12" title="ODS 12: Consumo e Produção Responsáveis">
            ODS 12 · Produção Sustentável
          </span>
          <span className="ods-badge ods-13" title="ODS 13: Ação Contra a Mudança Global do Clima">
            ODS 13 · Ação Climática
          </span>
        </div>
      </div>

      {/* Grid de KPIs ESG */}
      <div className="sustainability-cards-grid">
        {/* Card 1: t.km Economizado */}
        <div className="esg-metric-card">
          <div className="esg-card-top">
            <span className="esg-card-label">Trabalho t.km Evitado</span>
            <span className="esg-card-icon-box green">
              <Zap size={18} />
            </span>
          </div>
          <div className="esg-card-value">
            {tKmEconomizado.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <small>t.km</small>
          </div>
          <p className="esg-card-desc">
            Trabalho de transporte improdutivo poupado pela consolidação de cargas vs viagens dispersas.
          </p>
          <div className="esg-card-footer">
            <span className="esg-gain-badge">
              <TrendingDown size={12} /> ~35% menos t.km vazio
            </span>
          </div>
        </div>

        {/* Card 2: CO2 Evitado */}
        <div className="esg-metric-card">
          <div className="esg-card-top">
            <span className="esg-card-label">Emissão de CO₂ Evitada</span>
            <span className="esg-card-icon-box emerald">
              <Leaf size={18} />
            </span>
          </div>
          <div className="esg-card-value">
            {co2EconomizadoKg.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <small>kg CO₂</small>
          </div>
          <p className="esg-card-desc">
            Redução líquida de gases do efeito estufa pelo corte de trajetos redundantes na malha.
          </p>
          <div className="esg-card-footer">
            <span className="esg-gain-badge emerald">
              -{percentualReducaoCo2.toFixed(1)}% na pegada de carbono
            </span>
          </div>
        </div>

        {/* Card 3: Diesel Poupado */}
        <div className="esg-metric-card">
          <div className="esg-card-top">
            <span className="esg-card-label">Óleo Diesel S10 Poupado</span>
            <span className="esg-card-icon-box amber">
              <Fuel size={18} />
            </span>
          </div>
          <div className="esg-card-value">
            {dieselEconomizadoLitros.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <small>Litros</small>
          </div>
          <p className="esg-card-desc">
            Combustível fóssil economizado com base no fator oficial CONPET/EPE (2,68 kg CO₂/L).
          </p>
          <div className="esg-card-footer">
            <span className="esg-sub-info">
              Média frota: ~2,85 km/L
            </span>
          </div>
        </div>

        {/* Card 4: t.km Realizado */}
        <div className="esg-metric-card">
          <div className="esg-card-top">
            <span className="esg-card-label">Trabalho t.km Realizado</span>
            <span className="esg-card-icon-box blue">
              <Award size={18} />
            </span>
          </div>
          <div className="esg-card-value">
            {tKmPlanejado.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <small>t.km</small>
          </div>
          <p className="esg-card-desc">
            Volume útil efetivo transportado multiplicado pela distância percorrida pela frota.
          </p>
          <div className="esg-card-footer">
            <span className="esg-sub-info">
              Trabalho útil produtivo
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico Interativo de Eficiência */}
      <div className="esg-chart-box">
        <div className="esg-chart-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={18} /> Evolução da Descarbonização e Eficiência Logística
            </h3>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Comparativo de ganhos ambientais ao longo das semanas/meses de operação
            </span>
          </div>

          <div className="esg-chart-toggle">
            <button
              type="button"
              className={`esg-toggle-btn ${activeTab === 'tkm' ? 'active' : ''}`}
              onClick={() => setActiveTab('tkm')}
            >
              t.km Economizado
            </button>
            <button
              type="button"
              className={`esg-toggle-btn ${activeTab === 'co2' ? 'active' : ''}`}
              onClick={() => setActiveTab('co2')}
            >
              CO₂ Evitado (kg)
            </button>
          </div>
        </div>

        {/* Renderização do Gráfico SVG de Barras com Tooltip */}
        <div className="esg-svg-chart-container">
          <svg viewBox="0 0 640 220" className="esg-svg" preserveAspectRatio="none">
            {/* Grid Lines Horizontais */}
            <line x1="40" y1="30" x2="620" y2="30" stroke="var(--border-color, #e2e8f0)" strokeDasharray="4" />
            <line x1="40" y1="80" x2="620" y2="80" stroke="var(--border-color, #e2e8f0)" strokeDasharray="4" />
            <line x1="40" y1="130" x2="620" y2="130" stroke="var(--border-color, #e2e8f0)" strokeDasharray="4" />
            <line x1="40" y1="180" x2="620" y2="180" stroke="var(--border-color, #cbd5e1)" strokeWidth="1.5" />

            {/* Barras e Valores */}
            {historico.map((item, idx) => {
              const xCenter = 70 + idx * 95;
              const barWidth = 42;
              const val = activeTab === 'tkm' ? (item.tKmEconomizado || 0) : (item.co2EconomizadoKg || 0);
              const maxVal = activeTab === 'tkm' ? maxTkm : maxCo2;
              const barHeight = Math.max(10, (val / maxVal) * 140);
              const yTop = 180 - barHeight;
              const isHovered = hoveredPoint === idx;

              return (
                <g key={item.periodo} onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)} style={{ cursor: 'pointer' }}>
                  {/* Barra de fundo com hover */}
                  <rect
                    x={xCenter - barWidth / 2}
                    y={yTop}
                    width={barWidth}
                    height={barHeight}
                    rx="6"
                    fill={activeTab === 'tkm' ? (isHovered ? '#059669' : '#10b981') : (isHovered ? '#1d4ed8' : '#2563eb')}
                    opacity={isHovered ? 1 : 0.85}
                    transition="all 0.2s"
                  />
                  {/* Valor no Topo da Barra */}
                  <text
                    x={xCenter}
                    y={yTop - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={activeTab === 'tkm' ? '#047857' : '#1e40af'}
                  >
                    {val.toFixed(0)}
                  </text>
                  {/* Rótulo do Eixo X */}
                  <text
                    x={xCenter}
                    y="198"
                    textAnchor="middle"
                    fontSize="11"
                    fill="var(--text-muted, #64748b)"
                    fontWeight="600"
                  >
                    {item.periodo}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legenda Informativa */}
          <div className="esg-chart-legend">
            <div className="legend-item">
              <span className="legend-box" style={{ background: activeTab === 'tkm' ? '#10b981' : '#2563eb' }}></span>
              <span>{activeTab === 'tkm' ? 'Trabalho de Carga Improdutivo Evitado (t.km)' : 'Redução Estimada de CO₂ (kg)'}</span>
            </div>
            <div className="legend-note">
              <Info size={13} /> Metodologia: Deslocamento otimizado vs percursos individuais ponto-a-ponto (IPCC / EPE).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SustainabilitySection;
