/**
 * Mock API Service
 * Centralizamos todas as chamadas aqui. Quando o backend em Spring Boot estiver pronto,
 * basta trocar os retornos do "Promise.resolve(mock)" por "axios.get('URL_DO_BAKEND')" ou "fetch()".
 */

export const mockApi = {
  // Profiles (Usuários)
  getProfiles: async () => {
    return [
      { id: 1, nome: "João Silva", email: "joao.silva@empresa.com", perfil: "Motorista", status: "Ativo", cpf: "xxx.xxx.xxx-xx", cnh: "xxx.xxx", validade: "01/01/2025" },
      { id: 2, nome: "Maria Fernandes", email: "maria.fernandes@logistica.net", perfil: "Apoio Logístico", status: "Inativo", cpf: "xxx.xxx.xxx-xx", cnh: "-", validade: "-" },
      { id: 3, nome: "Carla Souza", email: "carla.souza@transporte.com.br", perfil: "Administrador", status: "Ativo", cpf: "xxx.xxx.xxx-xx", cnh: "-", validade: "-" },
      { id: 4, nome: "Rodrigo Almeida", email: "rodrigo.almeida@supplychain.org", perfil: "Motorista", status: "Ativo", cpf: "xxx.xxx.xxx-xx", cnh: "xxx.xxx", validade: "01/01/2025" },
      { id: 5, nome: "Paulo Santos", email: "paulo.santos@corpbrasil.com", perfil: "Motorista", status: "Inativo", cpf: "xxx.xxx.xxx-xx", cnh: "xxx.xxx", validade: "01/01/2025" },
    ];
  },

  // Frota (Fleet)
  getFleet: async () => {
    return [
      { id: 1, placa: "ABC-1234", motorista: "João Silva", status: "Ativo", renavam: "12345678900", ano: "2020", marca: "Volvo FH", capacidade: "30t", tipo: "Carreta" },
      { id: 2, placa: "XYZ-9876", motorista: "Lucas Gonçalves", status: "Em Manutenção", renavam: "09876543211", ano: "2018", marca: "Scania RM", capacidade: "25t", tipo: "Truck" },
      { id: 3, placa: "DEF-5678", motorista: "Jonathan Alves", status: "Inativo", renavam: "56789012344", ano: "2015", marca: "Mercedes-Benz", capacidade: "15t", tipo: "Toco" },
      { id: 4, placa: "EZP-7A66", motorista: "João Neves", status: "Ativo", renavam: "11223344556", ano: "2022", marca: "Volvo FH", capacidade: "35t", tipo: "Carreta" },
    ];
  },

  // Transports (Cargas e Rotas)
  getTransports: async () => {
    return [
      { id: "#100004", origin: "Atibaia - SP", currentDest: "Bauru - SP", eq1: "ERQ0B51", eq2: "MFU5H83", driver: "Felipe L.", status: "Em viagem" },
      { id: "#100049", origin: "Araras - SP", currentDest: "S. J. dos Campos - SP", eq1: "AAA1234", eq2: "CCC1122", driver: "Lucas S.", status: "Atrasado" },
      { id: "#100007", origin: "Araras - SP", currentDest: "Leme - SP", eq1: "GLP9I77", eq2: "MTU5H86", driver: "Jonathan A.", status: "Em entrega" },
      { id: "#100016", origin: "Limeira - SP", currentDest: "Leme - SP", eq1: "CNI5713", eq2: "KKP7L89", driver: "José M.", status: "Em viagem" },
      { id: "#100028", origin: "Limeira - SP", currentDest: "Fortaleza - CE", eq1: "CMI5U89", eq2: "KCI7E09", driver: "Matheus P.", status: "Em viagem" },
      { id: "#100060", origin: "Fortaleza - CE", currentDest: "Leme - SP", eq1: "MTU5H86", eq2: "GUKP9I17", driver: "Pogbá S.", status: "Em entrega",
        steps: [
          { label: "Depósito", type: "pin", status: "completed" },
          { label: "Fortaleza - CE", type: "package", status: "completed" },
          { label: "Leme - SP", type: "package", status: "active" },
          { label: "Araras - SP", type: "package", status: "pending" },
          { label: "Limeira - SP", type: "package", status: "pending" },
          { label: "Piracicaba - SP", type: "package", status: "pending" },
          { label: "Campinas - SP", type: "package", status: "pending" },
          { label: "São Paulo - SP", type: "package", status: "pending" },
          { label: "Guarujá - SP", type: "package", status: "pending" },
        ]
      },
      { id: "#100005", origin: "São Luis - MA", currentDest: "Araras - SP", eq1: "MCK4B45", eq2: "CHI5U99", driver: "Yuri A.", status: "Atrasado" },
      { id: "#100022", origin: "Limeira - SP", currentDest: "Niquelândia - GO", eq1: "KFM8A75", eq2: "RUE7A66", driver: "Rodrigo G.", status: "Em viagem" }
    ];
  },

  // Realtime Monitoring Vehicles
  getActiveVehicles: async () => {
    return [
      { id: '1', plate: 'EZP7A66', driver: 'Lucas Gonçalves', lat: '40%', lng: '30%', status: 'Em viagem' },
      { id: '2', plate: 'HMT2570', driver: 'Jonathan Alves', lat: '45%', lng: '45%', status: 'Em viagem' },
      { id: '3', plate: 'EPG4667', driver: 'João Neves', lat: '75%', lng: '60%', status: 'Em viagem' }
    ];
  },

  // Dashboard Statistics
  getDashboardStats: async () => {
    return {
      motoristas: 10,
      rotas: 47,
      entregas: 68,
      backlogs: 3,
      kpis: {
        alocacao: { value: 59, status: 'down' },
        concluidas: { value: 74, status: 'neutral' },
        sla: { value: 96, status: 'up' },
        atrasos: { value: 4, status: 'down' }
      }
    };
  }
};
