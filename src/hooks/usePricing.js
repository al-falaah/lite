import { useState, useEffect } from 'react';
import { supabaseAnon } from '../services/supabase';

/**
 * Hook to fetch live pricing from program_pricing table.
 * Returns { pricing, loading, error, refetch }.
 *
 * pricing is a map: { qari: {...}, tajweed: {...}, essentials: {...} }
 * Each entry has:
 *   - hourly_rate, hours_per_week, total_weeks
 *   - full_price (computed: hourly_rate × hours_per_week × total_weeks)
 *   - current_price / current_price_monthly / current_price_annual
 *   - pricing_type, currency
 *   - isSubsidized (boolean)
 *   - discountPercent (number 0-100)
 *   - For subscription: full_monthly, full_annual (derived per-period market rates)
 */
export default function usePricing() {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabaseAnon
        .from('program_pricing')
        .select('*');

      if (fetchError) throw fetchError;

      const map = {};
      for (const row of data) {
        const fullPrice = row.hourly_rate * row.hours_per_week * row.total_weeks;
        const durationMonths = Math.max(1, Math.round(row.total_weeks / 4.33));
        const durationYears = Math.max(1, Math.round(row.total_weeks / 52));

        let isSubsidized = false;
        let discountPercent = 0;

        if (row.pricing_type === 'one-time') {
          isSubsidized = row.current_price < fullPrice;
          discountPercent = isSubsidized
            ? Math.round((1 - row.current_price / fullPrice) * 100)
            : 0;
        } else {
          // Compare total paid (monthly path) vs full market price
          const totalPaidMonthly = row.current_price_monthly * durationMonths;
          isSubsidized = totalPaidMonthly < fullPrice;
          discountPercent = isSubsidized
            ? Math.round((1 - totalPaidMonthly / fullPrice) * 100)
            : 0;
        }

        map[row.program_id] = {
          ...row,
          full_price: fullPrice,
          duration_months: durationMonths,
          duration_years: durationYears,
          // Per-period market rates for subscription display
          full_monthly: row.pricing_type === 'subscription'
            ? Math.round(fullPrice / durationMonths)
            : null,
          full_annual: row.pricing_type === 'subscription'
            ? Math.round(fullPrice / durationYears)
            : null,
          isSubsidized,
          discountPercent,
        };
      }

      setPricing(map);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch pricing:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  return { pricing, loading, error, refetch: fetchPricing };
}
