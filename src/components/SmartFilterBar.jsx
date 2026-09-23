import React, { useState, useMemo } from 'react';
import { Filter, X, ChevronDown, Check, RotateCcw } from 'lucide-react';

/**
 * SmartFilterBar
 * Componente genérico e inteligente de filtros para tabelas e listagens.
 * 
 * @param {Array} filterConfigs - Configurações dos filtros:
 *    [
 *      {
 *        key: 'status',
 *        label: 'Status',
 *        type: 'select' | 'chips',
 *        options: [{ label: 'Ativo', value: 'ATIVO' }] // Se omitido, extrai dinamicamente dos dados!
 *      },
 *      {
 *        key: 'origin',
 *        label: 'Origem',
 *        type: 'select'
 *      }
 *    ]
 * @param {Array} data - Dados originais para inferir opções automaticamente se não especificadas
 * @param {Object} selectedFilters - Estado de filtros ativos: { [key]: value }
 * @param {Function} onFilterChange - Callback executado ao alterar um filtro: (newFilters) => void
 * @param {Function} onClear - Callback para limpar todos os filtros
 */
const SmartFilterBar = ({
  filterConfigs = [],
  data = [],
  selectedFilters = {},
  onFilterChange,
  onClear,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Filtrar registros...'
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  // Computa opções dinâmicas para filtros que não especificaram options fixas
  const computedFilters = useMemo(() => {
    return filterConfigs.map(cfg => {
      if (cfg.options && cfg.options.length > 0) return cfg;

      // Extrai valores únicos dos dados
      const set = new Set();
      data.forEach(item => {
        let val;
        if (cfg.accessor && typeof cfg.accessor === 'function') {
          val = cfg.accessor(item);
        } else if (cfg.key.includes('.')) {
          val = cfg.key.split('.').reduce((obj, k) => obj?.[k], item);
        } else {
          val = item[cfg.key];
        }

        if (val !== null && val !== undefined && val !== '') {
          set.add(String(val));
        }
      });

      const dynamicOptions = Array.from(set).sort().map(val => ({
        label: cfg.labelFormatter ? cfg.labelFormatter(val) : val,
        value: val
      }));

      return {
        ...cfg,
        options: dynamicOptions
      };
    });
  }, [filterConfigs, data]);

  const activeFilterCount = Object.keys(selectedFilters).filter(k => selectedFilters[k] !== undefined && selectedFilters[k] !== '' && selectedFilters[k] !== 'ALL').length;

  const handleSelect = (key, value) => {
    const next = { ...selectedFilters };
    if (value === 'ALL' || value === '' || value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onFilterChange(next);
    setOpenDropdown(null);
  };

  const handleClearAll = () => {
    if (onClear) {
      onClear();
    } else {
      onFilterChange({});
    }
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      backgroundColor: 'var(--bg-subtle, #f8fafc)',
      border: '1px solid var(--border-color, #e2e8f0)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '0.85rem 1rem',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 700,
            fontSize: '0.8125rem',
            color: 'var(--primary-color)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            <Filter size={15} />
            <span>Filtros Inteligentes</span>
          </div>

          {activeFilterCount > 0 && (
            <span style={{
              fontSize: '0.75rem',
              backgroundColor: 'var(--primary-color)',
              color: '#ffffff',
              borderRadius: '999px',
              padding: '0.15rem 0.5rem',
              fontWeight: 700
            }}>
              {activeFilterCount} ativo{activeFilterCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="btn-icon"
            style={{
              fontSize: '0.75rem',
              gap: '0.3rem',
              color: 'var(--status-danger-text, #ef4444)',
              fontWeight: 600,
              padding: '0.25rem 0.5rem'
            }}
            title="Limpar todos os filtros"
          >
            <RotateCcw size={13} />
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        {computedFilters.map(cfg => {
          const currentVal = selectedFilters[cfg.key];
          const hasSelected = currentVal !== undefined && currentVal !== '' && currentVal !== 'ALL';
          const selectedOption = cfg.options?.find(o => String(o.value) === String(currentVal));

          return (
            <div key={cfg.key} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === cfg.key ? null : cfg.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: hasSelected ? '1px solid var(--secondary-color, #2ab29b)' : '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: hasSelected ? 'rgba(42, 178, 155, 0.08)' : 'var(--bg-surface, #ffffff)',
                  color: hasSelected ? 'var(--primary-color)' : 'var(--text-main, #1e293b)',
                  fontSize: '0.8125rem',
                  fontWeight: hasSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cfg.label}:</span>
                <strong style={{ color: hasSelected ? 'var(--secondary-color)' : 'var(--text-muted)' }}>
                  {selectedOption ? selectedOption.label : 'Todos'}
                </strong>
                <ChevronDown size={14} style={{ opacity: 0.6 }} />
              </button>

              {openDropdown === cfg.key && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setOpenDropdown(null)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    zIndex: 50,
                    minWidth: '180px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: 'var(--radius-md, 8px)',
                    boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1))',
                    padding: '0.35rem'
                  }}>
                    <div
                      onClick={() => handleSelect(cfg.key, 'ALL')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.8125rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: !hasSelected ? 700 : 400,
                        backgroundColor: !hasSelected ? 'var(--bg-hover, #f1f5f9)' : 'transparent',
                        color: !hasSelected ? 'var(--primary-color)' : 'var(--text-main)'
                      }}
                    >
                      <span>Todos</span>
                      {!hasSelected && <Check size={14} color="var(--secondary-color)" />}
                    </div>

                    {cfg.options?.map(opt => {
                      const isOptionSelected = String(currentVal) === String(opt.value);
                      return (
                        <div
                          key={opt.value}
                          onClick={() => handleSelect(cfg.key, opt.value)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.65rem',
                            fontSize: '0.8125rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: isOptionSelected ? 700 : 400,
                            backgroundColor: isOptionSelected ? 'rgba(42, 178, 155, 0.1)' : 'transparent',
                            color: isOptionSelected ? 'var(--primary-color)' : 'var(--text-main)'
                          }}
                        >
                          <span>{opt.label}</span>
                          {isOptionSelected && <Check size={14} color="var(--secondary-color)" />}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartFilterBar;
