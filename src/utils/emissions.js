/**
 * Mesma regra de EmissionFactors.java (backend): kg CO₂/km informado no veículo ou
 * fator do combustível (IPCC 2006: diesel 2,68 kg/L; gasolina 2,31 kg/L; etanol/elétrico 0 em escopo 1)
 * ÷ consumo médio (km/L). Sem dado suficiente devolve null — nunca um fator presumido.
 */
const FUEL_KG_CO2_PER_LITER = { DIESEL: 2.68, GASOLINA: 2.31, ETANOL: 0, ELETRICO: 0 };

export const co2PerKm = (vehicle) => {
  if (!vehicle) return null;
  if (vehicle.co2PerKilometer !== null && vehicle.co2PerKilometer !== undefined) return vehicle.co2PerKilometer;
  const factor = FUEL_KG_CO2_PER_LITER[vehicle.typeFuel];
  if (factor === undefined) return null;
  if (factor === 0) return 0;
  return vehicle.kmPerLiter > 0 ? factor / vehicle.kmPerLiter : null;
};

/** kg CO₂ de uma viagem (distância em metros) ou null se o veículo não tem fator. */
export const tripCo2Kg = (meters, vehicle) => {
  const f = co2PerKm(vehicle);
  return f === null ? null : ((meters || 0) / 1000) * f;
};
