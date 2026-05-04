import React, { useState, useEffect } from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * DataTable Genérico para listagem de dados em painéis administrativos.
 * 
 * @param {Array} columns Lista de objetos { label, key, sortable, render(row) }
 * @param {Array} data Lista bruta de objetos a serem listados na tabela
 * @param {boolean} loading Flag indiciando se ainda deve exibir "Carregando..."
 * @param {function} onEdit Ação que recebe a linha clicada pelo botão Lápis
 * @param {function} onDelete Ação que recebe a linha clicada pela Lixeira
 * @param {number} itemsPerPage Quantidade de resultados por quebra de pagina
 * @param {string} emptyMessage Mensagem caso não encontre resultado
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  onEdit,
  onDelete,
  itemsPerPage = 15,
  emptyMessage = "Nenhum registro encontrado."
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);

  // Reseta a paginaçao se os dados brutos mudarem de tamanho drasticamente (ex: filtro de busca)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const handleSort = (key, sortable) => {
    if (sortable === false) return;
    
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = a[sortConfig.key] ? String(a[sortConfig.key]).toLowerCase() : '';
    const valB = b[sortConfig.key] ? String(b[sortConfig.key]).toLowerCase() : '';
    
    if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const currentTableData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <table className="profiles-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', background: 'var(--bg-surface)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <thead style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
          <tr>
            {columns.map((col, index) => (
              <th 
                key={index} 
                onClick={() => handleSort(col.key, col.sortable)}
                style={{ 
                  padding: '1rem', 
                  textAlign: 'left', 
                  fontSize: '0.85rem', 
                  color: 'var(--text-muted)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  cursor: col.sortable !== false ? 'pointer' : 'default',
                  userSelect: 'none'
                }}
              >
                {col.label} 
                {col.sortable !== false && sortConfig.key === col.key ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="actions-header" style={{ padding: '1rem', width: '100px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} style={{textAlign:'center', padding: '2rem', color: 'var(--text-muted)'}}>Carregando...</td></tr>
          ) : currentTableData.length === 0 ? (
            <tr><td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} style={{textAlign:'center', padding: '2rem', color: 'var(--text-muted)'}}>{emptyMessage}</td></tr>
          ) : currentTableData.map((row, rowIndex) => (
            <tr key={row.id || rowIndex} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s ease', ':hover': { backgroundColor: 'var(--bg-hover)' } }}>
              {columns.map((col, colIndex) => (
                <td key={colIndex} style={{ padding: '1rem', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {col.render ? col.render(row) : (row[col.key] || '-')}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="actions-cell" style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(row)} 
                      aria-label="Edit"
                      style={{ background: 'transparent', border: 'none', color: 'var(--info-color)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--info-color)'}
                    >
                      <Edit size={18} />
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(row)} 
                      aria-label="Delete"
                      style={{ background: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--error-color)'}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginator */}
      {!loading && sortedData.length > 0 && (
        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingBottom: '1rem' }}>
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: currentPage === 1 ? 'var(--border-color)' : 'var(--info-color)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--white)', border: 'none', borderRadius: '4px', padding: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            <ChevronLeft size={20} />
          </button>
          
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Página <span style={{ color: 'var(--text-color)' }}>{currentPage}</span> de <span style={{ color: 'var(--text-color)' }}>{totalPages}</span>
          </span>
          
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: currentPage === totalPages ? 'var(--border-color)' : 'var(--info-color)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--white)', border: 'none', borderRadius: '4px', padding: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </>
  );
};

export default DataTable;
