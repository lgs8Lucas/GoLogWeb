import React, { useState, useEffect } from 'react';
import { Building2, Globe, ChevronDown, Check } from 'lucide-react';
import { authService } from '../services/authService';
import { tenantService } from '../services/tenantService';
import '../styles/TenantSwitcher.css';

const TenantSwitcher = () => {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMaster = authService.isMaster();
  const tenantInfo = authService.getTenantInfo();

  useEffect(() => {
    const current = authService.getSelectedTenant();
    setSelectedTenant(current || (isMaster ? 'all' : tenantInfo.companyId));
    loadTenants();
  }, [isMaster, tenantInfo.companyId]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantService.getAllTenants();
      const safeTenants = Array.isArray(data) ? data : [];
      setTenants(safeTenants);
    } catch (err) {
      console.error('Erro ao carregar tenants para o seletor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (tenantId) => {
    setSelectedTenant(tenantId);
    authService.setSelectedTenant(tenantId);
    setIsOpen(false);
    // Recarrega para aplicar o novo tenant em todos os endpoints e páginas
    window.location.reload();
  };

  const canSwitch = isMaster || tenants.length > 1;

  if (!canSwitch) {
    if (!tenantInfo.companyName) return null;
    return (
      <div className="tenant-badge-client" title={`Empresa: ${tenantInfo.companyName}`}>
        <Building2 size={16} className="tenant-icon" />
        <span className="tenant-name">{tenantInfo.companyName}</span>
      </div>
    );
  }

  // Nome do tenant ativo atualmente
  const getActiveLabel = () => {
    if (selectedTenant === 'all' || !selectedTenant) {
      return isMaster ? 'Visão Global (Todos)' : (tenantInfo.companyName || 'Matriz');
    }
    const found = tenants.find((t) => t.id === selectedTenant);
    return found ? found.legalName : (tenantInfo.companyName || 'Tenant Selecionado');
  };

  return (
    <div className="tenant-switcher-container">
      <button
        type="button"
        className={`tenant-switcher-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Alternar Empresa / Tenant Ativo"
      >
        {selectedTenant === 'all' || !selectedTenant ? (
          <Globe size={16} className="tenant-icon global" />
        ) : (
          <Building2 size={16} className="tenant-icon" />
        )}
        <div className="tenant-switcher-info">
          <span className="tenant-switcher-label">Tenant Ativo</span>
          <span className="tenant-switcher-val">{getActiveLabel()}</span>
        </div>
        <ChevronDown size={14} className={`chevron-icon ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="tenant-dropdown-backdrop" onClick={() => setIsOpen(false)} />
          <div className="tenant-dropdown-menu">
            <div className="tenant-dropdown-header">
              <span>Selecione a Empresa / Tenant</span>
            </div>

            <div className="tenant-dropdown-list">
              {isMaster && (
                <>
                  <button
                    type="button"
                    className={`tenant-dropdown-item ${selectedTenant === 'all' || !selectedTenant ? 'selected' : ''}`}
                    onClick={() => handleSelect('all')}
                  >
                    <div className="item-left">
                      <Globe size={16} className="item-icon" />
                      <div className="item-text">
                        <span className="item-title">Visão Global (Todos)</span>
                        <span className="item-desc">Acesso irrestrito a todos os dados</span>
                      </div>
                    </div>
                    {(selectedTenant === 'all' || !selectedTenant) && <Check size={16} className="check-icon" />}
                  </button>
                  <div className="tenant-dropdown-divider" />
                </>
              )}

              {tenants.map((t) => {
                const isSelected = selectedTenant === t.id;
                const isHeadquarter = t.companyType === 'TENANT_HEADQUARTER';
                const isBranch = t.companyType === 'TENANT_BRANCH';
                const isMasterTenant = t.companyType === 'TENANT_MASTER';

                let badgeLabel = 'Tenant';
                if (isMasterTenant) badgeLabel = 'GoLog Master';
                else if (isHeadquarter) badgeLabel = 'Matriz';
                else if (isBranch) badgeLabel = 'Filial';

                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`tenant-dropdown-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(t.id)}
                  >
                    <div className="item-left">
                      <Building2 size={16} className="item-icon" />
                      <div className="item-text">
                        <div className="item-header-line">
                          <span className="item-title">{t.legalName}</span>
                          <span className={`tenant-type-tag ${t.companyType?.toLowerCase()}`}>
                            {badgeLabel}
                          </span>
                        </div>
                        <span className="item-desc">
                          {t.city ? `${t.city}/${t.state || 'BR'}` : t.cnpjCpf}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TenantSwitcher;
