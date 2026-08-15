import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/countdown';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Trophy, RefreshCw, CreditCard, Building2, ExternalLink, ShieldCheck, Copy, Check } from 'lucide-react';
import { ChapaLogo, ManualPaymentLogo } from '../../components/PaymentMethodLogos';
import { walletApi } from '../../utils/api';

export default function Wallet() {
  const { currentUser, transactions, setPaymentQueue } = useApp();
  const myTxs = transactions.filter(t => t.userId === currentUser?.id);

  const [selectedMethod, setSelectedMethod] = useState<'Chapa' | 'Manual' | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [receipt, setReceipt] = useState('');
  const [copiedBank, setCopiedBank] = useState(false);

  const bankAccounts = [
    { name: 'Commercial Bank of Ethiopia (CBE)', accNo: '1000 4829 10482', holder: 'BidLow Auctions PLC' },
    { name: 'Telebirr Transfer', accNo: '0911 002 233', holder: 'BidLow Telebirr Merchant' },
    { name: 'Dashen Bank / Amole', accNo: '0132 9845 2011', holder: 'BidLow Auctions PLC' },
  ];

  function handleOpenModal(method: 'Chapa' | 'Manual') {
    setSelectedMethod(method);
    setAmount('500');
    setReference(method === 'Chapa' ? `CHAPA-${Date.now()}` : `TXN-${Date.now().toString().slice(-6)}`);
    setNotes('');
    setReceipt(method === 'Chapa' ? 'https://chapa.co/receipt/digital-proof' : '');
    setMsg('');
    setShowModal(true);
  }

  function handleCopyAcc(accNo: string) {
    navigator.clipboard.writeText(accNo);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  }

  async function handleSubmitDeposit() {
    setMsg('');
    const amt = Number(amount);
    if (!selectedMethod || !amt || amt <= 0) {
      setMsg('Please enter a valid deposit amount');
      return;
    }
    if (selectedMethod === 'Manual' && (!reference || !receipt)) {
      setMsg('Reference number and receipt proof are required for manual deposit');
      return;
    }

    setLoading(true);
    try {
      const refNo = reference || `${selectedMethod.toUpperCase()}-${Date.now()}`;
      const receiptImg = receipt || 'https://bidlow.et/proofs/chapa-instant.png';
      
      const res = await walletApi.submitDeposit({
        amount: amt,
        credits: amt,
        payment_method: selectedMethod === 'Chapa' ? 'Chapa Digital' : 'Manual Bank Transfer',
        reference_number: refNo,
        receipt_image: receiptImg,
        notes: notes || `${selectedMethod} wallet deposit submission`
      });

      if (res && res.data) {
        setPaymentQueue(prev => [res.data, ...(prev || [])]);
      }

      setMsg(
        selectedMethod === 'Chapa'
          ? 'Chapa payment processed successfully! Admin will confirm your balance.'
          : 'Manual deposit submitted! Admin will verify your bank receipt shortly.'
      );

      setTimeout(() => {
        setAmount('');
        setReference('');
        setNotes('');
        setReceipt('');
        setSelectedMethod(null);
        setShowModal(false);
      }, 1800);
    } catch (err: any) {
      setMsg(err?.message || 'Deposit submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const txMeta = (type: string) => {
    if (type === 'wallet_deposit' || type === 'credit_purchase') return { icon: <ArrowDownLeft className="w-4 h-4 text-emerald-500" />, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Deposit' };
    if (type === 'bid_placed') return { icon: <ArrowUpRight className="w-4 h-4 text-rose-500" />, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Bid Placed' };
    if (type === 'winning_reward') return { icon: <Trophy className="w-4 h-4 text-amber-500" />, color: 'text-emerald-600', bg: 'bg-amber-50', label: 'Prize Won' };
    return { icon: <RefreshCw className="w-4 h-4 text-slate-500" />, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Refund / Adjustment' };
  };

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Wallet</h1>
        <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
          Manage your deposit funds, active bidding power, and financial history.
        </p>
      </div>

      {/* ── BALANCE CARDS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* ETB Balance Card */}
        <div className="relative bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900 rounded-3xl p-6 text-white overflow-hidden shadow-xl shadow-purple-950/20">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5 text-purple-200" />
              <span className="text-purple-200 text-xs font-bold uppercase tracking-wider">Available Balance</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified Account
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
            {(currentUser?.walletBalance ?? 0).toLocaleString()} <span className="text-xl font-bold text-purple-300">ETB</span>
          </p>
          <p className="text-purple-200/80 text-xs mt-2 font-medium">
            Use your wallet balance to place instant low-cost bids on live auctions.
          </p>
        </div>

        {/* Quick Information Box */}
        <div className="rounded-3xl bg-slate-50 p-6 border border-slate-200/80 text-slate-700 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2">
              <CreditCard className="w-4 h-4" /> Top-Up Guidelines
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
              We support instant digital payments via <strong className="text-purple-600 font-extrabold">Chapa</strong> or direct bank transfer via <strong className="text-emerald-600 font-extrabold">Manual Payment</strong>.
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 border-t border-slate-200 pt-3">
            🔒 All transactions are secured with end-to-end encryption.
          </p>
        </div>
      </div>

      {/* ── 2 ACCEPTED PAYMENT METHODS ──────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            Select Payment Method
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose your preferred deposit method below to top up your account balance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* METHOD 1: CHAPA */}
          <div
            onClick={() => handleOpenModal('Chapa')}
            role="button"
            tabIndex={0}
            className="group relative rounded-3xl border-2 border-slate-200 hover:border-purple-500 bg-gradient-to-b from-slate-50 to-purple-50/20 p-6 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-2 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
                <ChapaLogo />
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                Instant Gateway
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                Chapa Payment
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Instant online checkout supporting Telebirr, CBE Birr, Mobile Banking, and Debit/Credit Cards.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>Top up with Chapa</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* METHOD 2: MANUAL PAYMENT */}
          <div
            onClick={() => handleOpenModal('Manual')}
            role="button"
            tabIndex={0}
            className="group relative rounded-3xl border-2 border-slate-200 hover:border-emerald-500 bg-gradient-to-b from-slate-50 to-emerald-50/20 p-6 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-2 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
                <ManualPaymentLogo />
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                Bank Transfer
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                Manual Payment
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Direct bank transfer to CBE, Awash, or Telebirr with manual transaction slip receipt submission.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-emerald-600">
              <span>Submit Bank Receipt</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* ── TOP UP MODAL (CHAPA OR MANUAL) ────────────────────────────────── */}
      {showModal && selectedMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" />
          
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto font-sans">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
            >
              ✕
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                {selectedMethod === 'Chapa' ? <ChapaLogo /> : <ManualPaymentLogo />}
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  {selectedMethod === 'Chapa' ? 'Top Up via Chapa Gateway' : 'Manual Deposit & Bank Transfer'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedMethod === 'Chapa'
                    ? 'Enter deposit amount to initiate digital payment.'
                    : 'Transfer funds to our bank account and attach transaction proof.'}
                </p>
              </div>
            </div>

            {/* Preset Amount Pills */}
            <div className="mb-4">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Select Amount (ETB)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {['100', '250', '500', '1000'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2 text-xs font-black rounded-xl border transition-all ${
                      amount === val
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val} ETB
                  </button>
                ))}
              </div>

              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                placeholder="Or enter custom amount in ETB"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Manual Payment: Bank Details Display */}
            {selectedMethod === 'Manual' && (
              <div className="mb-4 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2">
                <p className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Transfer to Any Official Account:
                </p>
                <div className="space-y-2 mt-2">
                  {bankAccounts.map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-white rounded-xl border border-emerald-100 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{b.name}</p>
                        <p className="text-[10px] text-slate-500">{b.holder}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAcc(b.accNo)}
                        className="flex items-center gap-1 font-mono font-bold text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                        title="Click to copy account number"
                      >
                        {b.accNo}
                        {copiedBank ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction / Reference ID
                </label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  type="text"
                  placeholder="e.g. CBE-TXN-984210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              {selectedMethod === 'Manual' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Receipt Proof Image / URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={receipt}
                    onChange={(e) => setReceipt(e.target.value)}
                    type="text"
                    placeholder="https://... or paste transaction slip screenshot URL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any details for admin verification..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 h-16 resize-none"
                />
              </div>
            </div>

            {/* Error / Success message */}
            {msg && (
              <div className={`mt-4 p-3 rounded-xl text-xs font-semibold ${msg.includes('successfully') || msg.includes('submitted') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {msg}
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => { setShowModal(false); setSelectedMethod(null); }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitDeposit}
                className={`px-5 py-2.5 font-bold text-xs text-white rounded-xl shadow-lg transition-all flex items-center gap-2 ${
                  selectedMethod === 'Chapa'
                    ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                } disabled:opacity-50`}
              >
                {loading ? 'Processing...' : selectedMethod === 'Chapa' ? `Pay with Chapa (${amount || 0} ETB)` : 'Submit Deposit Proof'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── TRANSACTION HISTORY ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-black text-slate-900">Transaction History</h2>

        {myTxs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 space-y-2">
            <div className="text-4xl">📋</div>
            <p className="font-semibold text-sm">No transactions recorded yet</p>
            <p className="text-xs text-slate-400">Top up your wallet above to start participating in live auctions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myTxs.map(t => {
              const meta = txMeta(t.type);
              const isDebit = t.type === 'bid_placed';
              return (
                <div key={t.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100">
                  {/* Icon */}
                  <div className={`${meta.bg} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                    {meta.icon}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{meta.label}</p>
                    <p className="text-[11px] text-slate-500 truncate">{t.description}</p>
                  </div>
                  {/* Amount + Date */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isDebit ? '-' : '+'}{Math.abs(t.amount).toLocaleString()} ETB
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(t.timestamp)}</p>
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
