import { tenantService } from '../services/tenantService';
import { authService } from '../services/authService';

/**
 * Empresas que podem ser DONAS de um cadastro operacional (veículos, usuários, perfis de custo):
 * somente tenants (matriz/filial/master) visíveis ao usuário — nunca clientes ou fornecedores.
 *
 * Antes, os formulários usavam a lista de /company (clientes inclusos) e pré-selecionavam o primeiro
 * item; o registro era gravado na empresa errada e "sumia" da lista do tenant ativo.
 */
export const loadTenantOptions = async () => {
  try {
    const list = await tenantService.getAllTenants();
    return (Array.isArray(list) ? list : []).filter((t) => t.active !== false);
  } catch {
    return [];
  }
};

/** Tenant padrão para novos cadastros: o tenant ativo no seletor, senão a empresa do usuário logado. */
export const defaultTenantId = (tenants = []) => {
  const selected = authService.getSelectedTenant();
  if (selected && selected !== 'all' && tenants.some((t) => t.id === selected)) return selected;
  const own = authService.getTenantInfo()?.companyId;
  if (own && (tenants.length === 0 || tenants.some((t) => t.id === own))) return own;
  return tenants[0]?.id || own || '';
};

export const tenantLabel = (t) => {
  const kind = t.companyType === 'TENANT_MASTER' ? 'Master'
    : t.companyType === 'TENANT_HEADQUARTER' ? 'Matriz'
    : t.companyType === 'TENANT_BRANCH' ? 'Filial' : 'Tenant';
  return `${t.legalName} (${kind})`;
};
