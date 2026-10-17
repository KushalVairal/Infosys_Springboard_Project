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

export const CATEGORY_COLORS = {
  TRANSPORT: '#246B43',
  ELECTRICITY: '#D9822B',
  FOOD: '#5C946E',
  SHOPPING: '#1A7A82',
  OTHER: '#7D9283'
};

export const DARK_CATEGORY_COLORS = {
  TRANSPORT: '#34D399',
  ELECTRICITY: '#FBA94C',
  FOOD: '#86EFAC',
  SHOPPING: '#38BDF8',
  OTHER: '#94A3B8'
};

export function getCategoryColor(categoryKey, isDark = false) {
  const key = (categoryKey || 'OTHER').toUpperCase();
  if (isDark) {
    return DARK_CATEGORY_COLORS[key] || DARK_CATEGORY_COLORS.OTHER;
  }
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.OTHER;
}

export function getCategoryForActivityType(activityType) {
  if (!activityType) return 'OTHER';
  const upper = activityType.toUpperCase();
  if (
    upper.includes('CAR') ||
    upper.includes('BUS') ||
    upper.includes('TRAIN') ||
    upper.includes('FLIGHT') ||
    upper.includes('MOTORCYCLE') ||
    upper.includes('BICYCLE') ||
    upper.includes('WALKING') ||
    upper.includes('TRANSPORT')
  ) {
    return 'TRANSPORT';
  }
  if (
    upper.includes('ELEC') ||
    upper.includes('GRID') ||
    upper.includes('SOLAR') ||
    upper.includes('LPG') ||
    upper.includes('GAS') ||
    upper.includes('HEATING')
  ) {
    return 'ELECTRICITY';
  }
  if (
    upper.includes('MEAL') ||
    upper.includes('FOOD') ||
    upper.includes('DIET') ||
    upper.includes('BEEF') ||
    upper.includes('VEGAN') ||
    upper.includes('VEGETARIAN') ||
    upper.includes('CHICKEN')
  ) {
    return 'FOOD';
  }
  if (
    upper.includes('SHOP') ||
    upper.includes('CLOTH') ||
    upper.includes('ELEC_ITEM') ||
    upper.includes('ELECTRONIC') ||
    upper.includes('GROCER') ||
    upper.includes('WASTE')
  ) {
    return 'SHOPPING';
  }
  return 'OTHER';
}

export function calcCo2(category, activityType, quantity, unit) {
  const type = CATEGORIES[category]?.types.find((t) => t.value === activityType);
  const q = parseFloat(quantity);
  if (!type || !q || q <= 0) return 0;
  return type.factor * q * (UNIT_MULTIPLIER[unit] ?? 1);
}
