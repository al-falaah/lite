import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Users, Gift, CheckCircle2, Clock, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralLeaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPayoutId, setSavingPayoutId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [refsRes, payoutsRes] = await Promise.all([
      supabase
        .from('referrals')
        .select('referrer_student_id, referred_student_id, program, created_at, students!referrals_referrer_student_id_fkey(full_name, email, referral_code)')
        .order('created_at', { ascending: false }),
      supabase
        .from('referral_payouts')
        .select('*, students(full_name, email)')
        .order('owed_at', { ascending: false }),
    ]);

    if (refsRes.error) {
      console.error(refsRes.error);
    } else {
      const grouped = {};
      for (const r of refsRes.data || []) {
        const key = r.referrer_student_id;
        if (!grouped[key]) {
          grouped[key] = {
            student_id: key,
            full_name: r.students?.full_name || '—',
            email: r.students?.email || '',
            referral_code: r.students?.referral_code || '',
            count: 0,
            latest: r.created_at,
          };
        }
        grouped[key].count++;
      }
      setLeaders(Object.values(grouped).sort((a, b) => b.count - a.count));
    }

    if (payoutsRes.error) {
      console.error(payoutsRes.error);
    } else {
      setPayouts(payoutsRes.data || []);
    }

    setLoading(false);
  }

  async function markPaid(payout) {
    const ref = prompt('Payment reference (bank transfer id, etc.):');
    if (!ref) return;
    setSavingPayoutId(payout.id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('referral_payouts')
      .update({
        paid_at: new Date().toISOString(),
        paid_by: user?.id,
        payment_reference: ref,
      })
      .eq('id', payout.id);
    setSavingPayoutId(null);
    if (error) {
      toast.error('Failed to mark paid');
      console.error(error);
    } else {
      toast.success('Marked as paid');
      load();
    }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code}`);
  }

  const unpaid = payouts.filter((p) => !p.paid_at);
  const paid = payouts.filter((p) => p.paid_at);
  const totalOwed = unpaid.reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return <div className="text-gray-500 py-8 text-center">Loading referrals…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="h-4 w-4" />
            Total referrals
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {leaders.reduce((s, l) => s + l.count, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clock className="h-4 w-4" />
            Unpaid owed
          </div>
          <div className="text-2xl font-semibold text-amber-600">
            ${totalOwed.toFixed(2)} NZD
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <CheckCircle2 className="h-4 w-4" />
            Paid out
          </div>
          <div className="text-2xl font-semibold text-emerald-600">
            {paid.length}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <Gift className="h-4 w-4 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Leaderboard</h3>
        </div>
        {leaders.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No referrals yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Code</th>
                <th className="px-4 py-2 font-medium text-center">Referrals</th>
                <th className="px-4 py-2 font-medium text-center">Next payout at</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((l) => {
                const nextMilestone = (Math.floor(l.count / 3) + 1) * 3;
                return (
                  <tr key={l.student_id} className="border-t border-gray-100">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{l.full_name}</div>
                      <div className="text-gray-500 text-xs">{l.email}</div>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => copyCode(l.referral_code)}
                        className="inline-flex items-center gap-1 font-mono text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                      >
                        {l.referral_code}
                        <Copy className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="px-4 py-2 text-center font-semibold">{l.count}</td>
                    <td className="px-4 py-2 text-center text-gray-500">
                      {nextMilestone} ({nextMilestone - l.count} to go)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Owed payouts */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900">Payouts owed</h3>
        </div>
        {unpaid.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No payouts owed.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Milestone</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Owed since</th>
                <th className="px-4 py-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {unpaid.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <div className="font-medium text-gray-900">{p.students?.full_name || '—'}</div>
                    <div className="text-gray-500 text-xs">{p.students?.email}</div>
                  </td>
                  <td className="px-4 py-2">{p.milestone_count} referrals</td>
                  <td className="px-4 py-2">${Number(p.amount).toFixed(2)} {p.currency}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(p.owed_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      disabled={savingPayoutId === p.id}
                      onClick={() => markPaid(p)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded disabled:opacity-50"
                    >
                      {savingPayoutId === p.id ? 'Saving…' : 'Mark paid'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paid history */}
      {paid.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Paid history</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Paid on</th>
                <th className="px-4 py-2 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-900">{p.students?.full_name || '—'}</td>
                  <td className="px-4 py-2">${Number(p.amount).toFixed(2)} {p.currency}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(p.paid_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-600">{p.payment_reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
