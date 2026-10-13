export const CATEGORIES = {
  TRANSPORT: {
    units: ['km', 'miles'],
    types: [
      { value: 'CAR_PETROL', label: 'Car (petrol)', factor: 0.192 },
      { value: 'CAR_DIESEL', label: 'Car (diesel)', factor: 0.171 },
      { value: 'BUS', label: 'Bus', factor: 0.105 },
      { value: 'TRAIN', label: 'Train', factor: 0.035 },
      { value: 'FLIGHT_SHORT', label: 'Flight (short haul)', factor: 0.246 },
      { value: 'FLIGHT_LONG', label: 'Flight (long haul)', factor: 0.15 },
    ],
  },
  ELECTRICITY: {
    units: ['kwh'],
    types: [
      { value: 'GRID_ELECTRICITY', label: 'Grid electricity', factor: 0.708 },
      { value: 'SOLAR', label: 'Solar', factor: 0.041 },
    ],
  },
  FOOD: {
    units: ['servings'],
    types: [
      { value: 'MEAL_VEGAN', label: 'Vegan meal', factor: 0.5 },
      { value: 'MEAL_VEGETARIAN', label: 'Vegetarian meal', factor: 1.2 },
      { value: 'MEAL_CHICKEN', label: 'Chicken meal', factor: 2.5 },
      { value: 'MEAL_BEEF', label: 'Beef meal', factor: 7.2 },
    ],
  },
  SHOPPING: {
    units: ['inr', 'usd'],
    types: [
      { value: 'CLOTHING', label: 'Clothing', factor: 0.005 },
      { value: 'ELECTRONICS', label: 'Electronics', factor: 0.02 },
      { value: 'GROCERIES', label: 'Groceries', factor: 0.002 },
    ],
  },
};

// Convert to the base unit the factor is expressed in (km, kwh, servings, inr)
export const UNIT_MULTIPLIER = { km: 1, miles: 1.609, kwh: 1, servings: 1, inr: 1, usd: 83 };

export function calcCo2(category, activityType, quantity, unit) {
  const type = CATEGORIES[category]?.types.find((t) => t.value === activityType);
  const q = parseFloat(quantity);
  if (!type || !q || q <= 0) return 0;
  return type.factor * q * (UNIT_MULTIPLIER[unit] ?? 1);
}
