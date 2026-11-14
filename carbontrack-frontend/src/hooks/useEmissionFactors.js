import { useEffect, useState } from 'react';
import { api } from '../api/client';

/**
 * Hook to fetch emission factors from the backend.
 * Returns a map keyed by activityType containing { factor, unit }.
 * factor corresponds to kgCO2e per unit (as provided by the DTO field `kgCo2ePerUnit`).
 */
export function useEmissionFactors() {
  const [factorsMap, setFactorsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchFactors() {
      try {
        const data = await api.emissionFactors.get();
        // data is an array of EmissionFactorResponseDTO
        const map = {};
        data.forEach((f) => {
          if (!f || !f.activityType) return;
          map[f.activityType] = { factor: Number(f.kgCo2ePerUnit), unit: f.unit };
        });
        if (!cancelled) {
          setFactorsMap(map);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e);
          setLoading(false);
        }
      }
    }
    fetchFactors();
    return () => {
      cancelled = true;
    };
  }, []);

  return { factorsMap, loading, error };
}

