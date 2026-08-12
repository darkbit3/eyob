import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/countdown';
import { Wallet as WalletIcon, CheckCircle, ArrowUpRight, ArrowDownLeft, Trophy, RefreshCw } from 'lucide-react';
import { ArifPayLogo, ChapaLogo, TelebirrLogo, MPesaLogo, EBirrLogo } from '../../components/PaymentMethodLogos';
import { walletApi } from '../../utils/api';

export default function Wallet() {
  const { currentUser, transactions, setPaymentQueue } = useApp();
  const myTxs = transactions.filter(t => t.userId === currentUser?.id);

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reference, setReference] = useState(`WEB-${Date.now()}`);
  const [notes, setNotes] = useState('');
  const [receipt, setReceipt] = useState('');

  const txMeta = (type: string) => {
    if (type === 'wallet_deposit') return { icon: <ArrowDownLeft className="w-4 h-4 text-blue-500" />, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Deposit' };
    if (type === 'bid_placed') return { icon: <ArrowUpRight className="w-4 h-4 text-rose-500" />, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Bid Placed' };
    if (type === 'winning_reward') return { icon: <Trophy className="w-4 h-4 text-amber-500" />, color: 'text-emerald-600', bg: 'bg-amber-50', label: 'Prize Won' };
    return { icon: <RefreshCw className="w-4 h-4 text-slate-500" />, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Refund' };
  };

  return (
    <div className="space-y-5 font-sans">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Wallet</h1>
        <p className="text-slate-500 text-xs font-medium mt-1">Manage your wallet balance and auction activity</p>
      </div>

      {/* ── BALANCE CARDS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* ETB Balance */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
          <div className="flex items-center gap-2 mb-3">
            <WalletIcon className="w-4 h-4 text-blue-200" />
            <span className="text-blue-200 text-xs font-semibold">Balance</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black leading-tight">{(currentUser?.walletBalance ?? 0).toLocaleString()}</p>
          <p className="text-blue-300 text-[10px] font-bold mt-0.5 uppercase">ETB</p>
        </div>

        <div className="rounded-3xl bg-slate-50 p-5 border border-slate-200 text-slate-700">
          <p className="text-sm font-semibold text-slate-900">Your wallet balance is used for bidding and activity tracking.</p>
          <p className="text-xs text-slate-500 mt-2">Maintain sufficient balance to place bids on auctions.</p>
        </div>
      </div>

      {/* ── PAYMENT METHODS ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-slate-900">Accepted Payment Methods</h2>
            <p className="text-xs text-slate-500 mt-1">Use any of these supported channels to top up your wallet.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div onClick={() => { setSelectedMethod('ArifPay'); setShowModal(true); setReference(`WEB-${Date.now()}`); }} role="button" tabIndex={0} className={`rounded-3xl overflow-hidden border bg-slate-50 shadow-sm cursor-pointer ${selectedMethod === 'ArifPay' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'}`}>
            <div className="flex items-center justify-center h-24 bg-gradient-to-br from-sky-500 to-cyan-500">
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center shadow-sm">
                <ArifPayLogo />
              </div>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm font-bold text-slate-900">Arif Pay</p>
              <p className="text-[11px] text-slate-500 mt-1">Secure Ethiopian mobile payment</p>
              {selectedMethod === 'ArifPay' && (
                <div className="flex items-center justify-center mt-3 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
          <div onClick={() => { setSelectedMethod('Chapa'); setShowModal(true); setReference(`WEB-${Date.now()}`); }} role="button" tabIndex={0} className={`rounded-3xl overflow-hidden border bg-slate-50 shadow-sm cursor-pointer ${selectedMethod === 'Chapa' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'}`}>
            <div className="flex items-center justify-center h-24 bg-gradient-to-br from-indigo-500 to-violet-500">
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center shadow-sm">
                <ChapaLogo />
              </div>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm font-bold text-slate-900">Chapa</p>
              <p className="text-[11px] text-slate-500 mt-1">Fast digital payments for merchants</p>
              {selectedMethod === 'Chapa' && (
                <div className="flex items-center justify-center mt-3 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
          <div onClick={() => { setSelectedMethod('Telebirr'); setShowModal(true); setReference(`WEB-${Date.now()}`); }} role="button" tabIndex={0} className={`rounded-3xl overflow-hidden border bg-slate-50 shadow-sm cursor-pointer ${selectedMethod === 'Telebirr' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'}`}>
            <div className="flex items-center justify-center h-24 bg-gradient-to-br from-orange-500 to-amber-500">
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center shadow-sm">
                <TelebirrLogo />
              </div>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm font-bold text-slate-900">Telebirr</p>
              <p className="text-[11px] text-slate-500 mt-1">Mobile money from Ethio Telecom</p>
              {selectedMethod === 'Telebirr' && (
                <div className="flex items-center justify-center mt-3 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
          <div onClick={() => { setSelectedMethod('M-Pesa'); setShowModal(true); setReference(`WEB-${Date.now()}`); }} role="button" tabIndex={0} className={`rounded-3xl overflow-hidden border bg-slate-50 shadow-sm cursor-pointer ${selectedMethod === 'M-Pesa' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'}`}>
            <div className="flex items-center justify-center h-24 bg-gradient-to-br from-emerald-500 to-teal-500">
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center shadow-sm">
                <MPesaLogo />
              </div>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm font-bold text-slate-900">M-Pesa</p>
              <p className="text-[11px] text-slate-500 mt-1">Trusted African mobile wallet</p>
              {selectedMethod === 'M-Pesa' && (
                <div className="flex items-center justify-center mt-3 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
          <div onClick={() => { setSelectedMethod('eBirr'); setShowModal(true); setReference(`WEB-${Date.now()}`); }} role="button" tabIndex={0} className={`rounded-3xl overflow-hidden border bg-slate-50 shadow-sm cursor-pointer ${selectedMethod === 'eBirr' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'}`}>
            <div className="flex items-center justify-center h-24 bg-gradient-to-br from-slate-600 to-slate-700">
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center shadow-sm">
                <EBirrLogo />
              </div>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm font-bold text-slate-900">eBirr</p>
              <p className="text-[11px] text-slate-500 mt-1">Digital wallet by the National Bank</p>
              {selectedMethod === 'eBirr' && (
                <div className="flex items-center justify-center mt-3 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedMethod && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-lg p-6 w-full max-w-md z-50">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 z-50 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold">✕</button>
            <h3 className="font-bold text-lg mb-2">Top up via {selectedMethod}</h3>
            <p className="text-xs text-slate-500 mb-4">Enter deposit details and submit. Admin will verify and credit your account.</p>
            <div className="space-y-3">
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount (ETB)" className="border border-slate-200 rounded-xl p-2 w-full" />
              <input value={reference} onChange={(e) => setReference(e.target.value)} type="text" placeholder="Reference number" className="border border-slate-200 rounded-xl p-2 w-full" />
              <input value={receipt} onChange={(e) => setReceipt(e.target.value)} type="text" placeholder="Receipt image URL or text" className="border border-slate-200 rounded-xl p-2 w-full" />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="border border-slate-200 rounded-xl p-2 w-full h-20" />
              <div className="flex items-center justify-between gap-2">
                <button disabled={loading} onClick={async () => {
                  setMsg('');
                  const amt = Number(amount);
                  if (!selectedMethod || !amt || amt <= 0 || !reference || !receipt) { setMsg('Amount, reference and receipt are required'); return; }
                  setLoading(true);
                  try {
                    const reference_number = reference;
                    const receipt_image = receipt;
                    const res = await walletApi.submitDeposit({ amount: amt, payment_method: selectedMethod, reference_number, receipt_image, notes });
                    if (res && res.data) setPaymentQueue(prev => [res.data, ...(prev || [])]);
                    setMsg('Deposit submitted — awaiting admin approval');
                    setAmount(''); setReference(`WEB-${Date.now()}`); setNotes(''); setReceipt(''); setSelectedMethod(null); setShowModal(false);
                  } catch (err: any) {
                    setMsg(err?.message || 'Submission failed');
                  } finally { setLoading(false); }
                }} className="bg-indigo-600 text-white rounded-xl px-4 py-2">{loading ? 'Submitting...' : 'Submit Deposit'}</button>
                <button onClick={() => { setShowModal(false); setSelectedMethod(null); }} className="border border-slate-200 rounded-xl px-4 py-2">Cancel</button>
              </div>
              {msg && <p className="text-sm text-slate-500">{msg}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSACTION HISTORY ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="font-black text-slate-900">Transaction History</h2>

        {myTxs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 space-y-2">
            <div className="text-4xl">📋</div>
            <p className="font-semibold text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myTxs.map(t => {
              const meta = txMeta(t.type);
              const isDebit = t.type === 'bid_placed';
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  {/* Icon */}
                  <div className={`${meta.bg} w-9 h-9 rounded-xl flex items-center justify-center shrink-0`}>
                    {meta.icon}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{meta.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{t.description}</p>
                  </div>
                  {/* Amount + Date */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isDebit ? '-' : '+'}{Math.abs(t.amount).toLocaleString()} ETB
                    </p>
                    <p className="text-[10px] text-slate-400">{formatDate(t.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
