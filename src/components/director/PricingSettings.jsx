import { useState, useEffect } from 'react';
import { DollarSign, Save, RefreshCw, TrendingDown } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';

const PROGRAM_LABELS = {
  qari: { name: "QARI – Qur'an & Arabic Reading Literacy", short: 'QARI' },
  tajweed: { name: 'TMP – Tajweed Mastery Program', short: 'TMP' },
  essentials: { name: 'EASI – Essential Arabic & Islamic Studies', short: 'EASI' },
};

const PROGRAM_ORDER = ['qari', 'tajweed', 'essentials'];

export default function PricingSettings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // program_id being saved

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('program_pricing')
      .select('*');
    if (error) {
      toast.error('Failed to load pricing');
      console.error(error);
    } else {
      // Sort by defined order
      const sorted = PROGRAM_ORDER
        .map(id => data.find(r => r.program_id === id))
        .filter(Boolean);
      setRows(sorted);
    }
    setLoading(false);
  };

  const updateField = (programId, field, value) => {
    setRows(prev =>
      prev.map(r =>
        r.program_id === programId ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSave = async (row) => {
    setSaving(row.program_id);
    try {
      const updates = {
        hourly_rate: parseFloat(row.hourly_rate),
        hours_per_week: parseFloat(row.hours_per_week),
        total_weeks: parseInt(row.total_weeks, 10),
        updated_at: new Date().toISOString(),
      };

      if (row.pricing_type === 'one-time') {
        updates.current_price = parseFloat(row.current_price);
      } else {
        updates.current_price_monthly = parseFloat(row.current_price_monthly);
        updates.current_price_annual = parseFloat(row.current_price_annual);
      }

      // Validate
      if (Object.values(updates).some(v => typeof v === 'number' && isNaN(v))) {
        toast.error('Please enter valid numbers');
        return;
      }

      const { error } = await supabase
        .from('program_pricing')
        .update(updates)
        .eq('program_id', row.program_id);

      if (error) throw error;
      toast.success(`${PROGRAM_LABELS[row.program_id]?.short || row.program_id} pricing updated`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(null);
    }
  };

  const calcFullPrice = (row) => {
    const hr = parseFloat(row.hourly_rate) || 0;
    const hpw = parseFloat(row.hours_per_week) || 0;
    const tw = parseInt(row.total_weeks, 10) || 0;
    return hr * hpw * tw;
  };

  const calcDiscount = (row) => {
    const full = calcFullPrice(row);
    if (full <= 0) return 0;
    if (row.pricing_type === 'one-time') {
      const current = parseFloat(row.current_price) || 0;
      return Math.round((1 - current / full) * 100);
    }
    const months = Math.max(1, Math.round((parseInt(row.total_weeks, 10) || 0) / 4.33));
    const totalPaid = (parseFloat(row.current_price_monthly) || 0) * months;
    return Math.round((1 - totalPaid / full) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Program Pricing</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Set fees and hourly rates. Changes reflect on the website and Stripe instantly.
          </p>
        </div>
      </div>

      {rows.map((row) => {
        const fullPrice = calcFullPrice(row);
        const discount = calcDiscount(row);
        const label = PROGRAM_LABELS[row.program_id] || { name: row.program_id, short: row.program_id };

        return (
          <div
            key={row.program_id}
            className="bg-white rounded-lg border border-gray-200 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{label.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Market rate: <span className="font-medium text-gray-600">${fullPrice.toLocaleString()} NZD</span>
                  {discount > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                      <TrendingDown className="h-3 w-3" />
                      {discount}% subsidized
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleSave(row)}
                disabled={saving === row.program_id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
              >
                {saving === row.program_id ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Save
              </button>
            </div>

            {/* Rate & Schedule */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.hourly_rate}
                  onChange={(e) => updateField(row.program_id, 'hourly_rate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Hours / Week
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={row.hours_per_week}
                  onChange={(e) => updateField(row.program_id, 'hours_per_week', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Total Weeks
                </label>
                <input
                  type="number"
                  min="1"
                  value={row.total_weeks}
                  onChange={(e) => updateField(row.program_id, 'total_weeks', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Current Fees */}
            {row.pricing_type === 'one-time' ? (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Current Fee ($) — One-time
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.current_price}
                    onChange={(e) => updateField(row.program_id, 'current_price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Monthly Fee ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.current_price_monthly}
                    onChange={(e) => updateField(row.program_id, 'current_price_monthly', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Annual Fee ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.current_price_annual}
                    onChange={(e) => updateField(row.program_id, 'current_price_annual', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
