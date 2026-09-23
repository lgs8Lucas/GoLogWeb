import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search, Database } from 'lucide-react';
import SmartFilterBar from './SmartFilterBar';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  onEdit,
  onDelete,
  itemsPerPage = 12,
  emptyMessage = "Nenhum registro encontrado.",
  searchable = true,
  searchPlaceholder = "Buscar registros...",
  filterConfigs = []
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, searchTerm, activeFilters]);

  // Filter data based on search term AND active smart filters
  const filteredData = useMemo(() => {
    let result = data;

    // Apply smart filters
    const filterKeys = Object.keys(activeFilters);
    if (filterKeys.length > 0) {
      result = result.filter(row => {
        return filterKeys.every(k => {
          const targetVal = activeFilters[k];
          if (targetVal === undefined || targetVal === '' || targetVal === 'ALL') return true;

          // Find config to check for custom accessor
          const cfg = filterConfigs.find(c => c.key === k);
          let rowVal;
          if (cfg && cfg.accessor) {
            rowVal = cfg.accessor(row);
          } else if (k.includes('.')) {
            rowVal = k.split('.').reduce((obj, prop) => obj?.[prop], row);
          } else {
            rowVal = row[k];
          }

          return String(rowVal).toLowerCase() === String(targetVal).toLowerCase();
        });
      });
    }

    // Apply text search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(val => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') return false;
          return String(val).toLowerCase().includes(term);
        });
      });
    }

    return result;
  }, [data, searchTerm, activeFilters, filterConfigs]);

  const handleSort = (key, sortable) => {
    if (sortable === false) return;
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (!sortConfig.key) return 0;
      const valA = a[sortConfig.key] ? String(a[sortConfig.key]).toLowerCase() : '';
      const valB = b[sortConfig.key] ? String(b[sortConfig.key]).toLowerCase() : '';
      
      if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const currentTableData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {filterConfigs.length > 0 && (
        <SmartFilterBar
          filterConfigs={filterConfigs}
          data={data}
          selectedFilters={activeFilters}
          onFilterChange={setActiveFilters}
          onClear={() => setActiveFilters({})}
        />
      )}

      {searchable && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', height: '40px' }}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Exibindo {currentTableData.length} de {sortedData.length} registros
          </span>
        </div>
      )}

      <div className="table-container">
        <table className="tms-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={index} 
                  onClick={() => handleSort(col.key, col.sortable)}
                  style={{ 
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    width: col.width || 'auto'
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>{col.label}</span>
                    {col.sortable !== false && (
                      sortConfig.key === col.key ? (
                        sortConfig.direction === 'ascending' ? <ArrowUp size={14} color="var(--secondary-color)" /> : <ArrowDown size={14} color="var(--secondary-color)" />
                      ) : (
                        <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                      )
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th style={{ width: '90px', textAlign: 'center' }}>
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '28px', height: '28px', border: '3px solid var(--border-color)', borderTopColor: 'var(--secondary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    <span>Carregando dados da tabela...</span>
                  </div>
                </td>
              </tr>
            ) : currentTableData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Database size={32} style={{ opacity: 0.3, color: 'var(--primary-color)' }} />
                    <span style={{ fontWeight: 600 }}>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : currentTableData.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>
                    {col.render ? col.render(row) : (row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-')}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(row)} 
                          aria-label="Editar"
                          title="Editar"
                          className="btn-icon"
                        >
                          <Edit size={16} color="var(--primary-color)" />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(row)} 
                          aria-label="Excluir"
                          title="Excluir"
                          className="btn-icon"
                          style={{ color: 'var(--status-danger-text)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && sortedData.length > 0 && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Página <strong style={{ color: 'var(--text-main)' }}>{currentPage}</strong> de <strong style={{ color: 'var(--text-main)' }}>{totalPages}</strong>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.75rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.75rem', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
