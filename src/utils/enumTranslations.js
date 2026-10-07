/**
 * Utilitário central de tradução e formatação de Enums do GoLog TMS
 * Garante consistência em português em todas as tabelas, chips e visualizações.
 */

export const STATUS_TRANSLATIONS = {
  // Transportes & Remessas
  PENDING: 'Pendente',
  PENDENTE: 'Pendente',
  IN_TRANSIT: 'Em trânsito',
  EM_TRANSITO: 'Em trânsito',
  EM_VIAGEM: 'Em viagem',
  IN_DELIVERY: 'Em entrega',
  EM_ENTREGA: 'Em entrega',
  DELIVERED: 'Concluído',
  FINALIZADO: 'Concluído',
  CONCLUIDO: 'Concluído',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  CANCELADO: 'Cancelado',
  DELAYED: 'Atrasado',
  ATRASADO: 'Atrasado',

  // Entidades & Veículos
  ACTIVE: 'Ativo',
  ATIVO: 'Ativo',
  INACTIVE: 'Inativo',
  INATIVO: 'Inativo',
  DESATIVADO: 'Desativado',
  MAINTENANCE: 'Manutenção',
  MANUTENCAO: 'Manutenção',
  AVAILABLE: 'Disponível',
  DISPONIVEL: 'Disponível',
  EM_OPERACAO: 'Em operação',
  IN_OPERATION: 'Em operação'
};

export const VEHICLE_TYPE_TRANSLATIONS = {
  TRACTOR: 'Cavalo Mecânico',
  TRAILER: 'Carreta / Reboque',
  TRUCK: 'Caminhão Toco / Truck',
  truck: 'Caminhão Toco / Truck',
  carreta: 'Carreta / Reboque',
  cavalo: 'Cavalo Mecânico'
};

export const FUEL_TRANSLATIONS = {
  DIESEL: 'Diesel',
  GASOLINE: 'Gasolina',
  ETHANOL: 'Etanol',
  ELECTRIC: 'Elétrico',
  HYBRID: 'Híbrido'
};

export const OPERATION_TRANSLATIONS = {
  PICKUP: 'Coleta',
  COLETA: 'Coleta',
  DELIVERY: 'Entrega',
  ENTREGA: 'Entrega'
};

export const USER_ROLE_TRANSLATIONS = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  DRIVER: 'Motorista',
  POWERBI: 'Power BI',
  'POWER BI': 'Power BI'
};

export const RULE_TYPE_TRANSLATIONS = {
  INCOMPATIBLE_ON_SAME_VEHICLE: 'Incompatível no mesmo veículo',
  SAME_VEHICLE_INCOMPATIBILITY: 'Incompatível no mesmo veículo'
};

export const WEEKDAY_TRANSLATIONS = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo'
};

export const translateStatus = (status) => {
  if (!status) return '-';
  const clean = String(status).trim().toUpperCase();
  return STATUS_TRANSLATIONS[clean] || STATUS_TRANSLATIONS[status] || status;
};

export const translateVehicleType = (type) => {
  if (!type) return '-';
  const clean = String(type).trim();
  return VEHICLE_TYPE_TRANSLATIONS[clean] || VEHICLE_TYPE_TRANSLATIONS[clean.toUpperCase()] || type;
};

export const translateFuel = (fuel) => {
  if (!fuel) return '-';
  const clean = String(fuel).trim().toUpperCase();
  return FUEL_TRANSLATIONS[clean] || fuel;
};

export const translateOperation = (op) => {
  if (!op) return 'Entrega';
  const clean = String(op).trim().toUpperCase();
  return OPERATION_TRANSLATIONS[clean] || op;
};

export const translateUserRole = (role) => {
  if (!role) return '-';
  const clean = String(role).trim().toUpperCase();
  return USER_ROLE_TRANSLATIONS[clean] || role;
};

export const translateRuleType = (rule) => {
  if (!rule) return '-';
  return RULE_TYPE_TRANSLATIONS[rule] || rule;
};

export const translateWeekday = (day) => {
  if (!day) return '-';
  const clean = String(day).trim().toUpperCase();
  return WEEKDAY_TRANSLATIONS[clean] || day;
};
