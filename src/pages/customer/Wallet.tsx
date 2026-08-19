import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/countdown';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Trophy, RefreshCw, CreditCard, Building2, ExternalLink, ShieldCheck, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { ChapaLogo, ManualPaymentLogo } from '../../components/PaymentMethodLogos';
import { walletApi, settingsApi, uploadApi } from '../../utils/api';

export default function Wallet() {
  const { currentUser, setPaymentQueue, refreshCurrentUser } = useApp();

  // ── Live transactions fetched from backend ────────────────────────────────
  const [myTxs, setMyTxs] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txRefreshing, setTxRefreshing] = useState(false);

  const fetchMyTransactions = useCallback(async (silent = false) => {
    if (!silent) setTxLoading(true);
    else setTxRefreshing(true);
    try {
      const res = await walletApi.myTransactions();
      setMyTxs((res.data || []).map((t: any) => ({
        id:          t.id,
        userId:      t.user_id ?? t.userId ?? '',
        userName:    t.user_name ?? t.userName ?? '',
        type:        t.type ?? '',
        amount:      Number(t.amount ?? 0),
        description: t.description ?? '',
        status:      t.status ?? 'completed',
        paymentMethod: t.payment_method ?? t.paymentMethod ?? '',
        timestamp:   t.created_at ?? t.timestamp ?? new Date().toISOString(),
      })));
    } catch {
      // keep existing data on error
    } finally {
      setTxLoading(false);
      setTxRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchMyTransactions();
  }, [currentUser?.id]);

  const [selectedMethod, setSelectedMethod] = useState<'Chapa' | 'Manual' | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error' | 'info'>('info');
  const [showModal, setShowModal] = useState(false);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [receipt, setReceipt] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);


  // Manual deposit proof mode & image import
  const [manualProofMode, setManualProofMode] = useState<'ref_id' | 'image'>('ref_id');
  const [receiptFilePreview, setReceiptFilePreview] = useState<string>('');

  function handleImageFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setReceiptFilePreview(dataUrl);
      };
      reader.readAsDataURL(file);
      setReceiptFile(file);
      setReceipt('');
    }
  }

  // Deposit vs Withdraw tab state & Bank help info toggle
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [showBankHelpInfo, setShowBankHelpInfo] = useState(false);

  // Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('Commercial Bank of Ethiopia (CBE)');
  const [withdrawAccountNo, setWithdrawAccountNo] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  // Chapa mode: deposit or withdraw
  const [chapaMode, setChapaMode] = useState<'deposit' | 'withdraw'>('deposit');

  // Dynamic official admin bank accounts state
  const [bankAccounts, setBankAccounts] = useState<Array<{ name: string; accNo: string; holder: string }>>([
    { name: 'Commercial Bank of Ethiopia (CBE)', accNo: '1000 4829 10482', holder: 'BidLow Auctions PLC (Admin Official)' },
    { name: 'CBE Birr', accNo: '1000 4829 10482', holder: 'BidLow Auctions PLC (Admin Official)' },
    { name: 'Telebirr Transfer', accNo: '0911 002 233', holder: 'BidLow Telebirr Merchant (Admin Official)' },
    { name: 'Bank of Abyssinia (Abyssinia)', accNo: '8492 1048 2011', holder: 'BidLow Auctions PLC (Admin Official)' },
    { name: 'Dashen Bank / Amole', accNo: '0132 9845 2011', holder: 'BidLow Auctions PLC (Admin Official)' },
  ]);

  useEffect(() => {
    settingsApi.getBankAccounts()
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data
            .filter((b: any) => b.is_active !== false)
            .map((b: any) => ({
              name: b.method_name,
              accNo: b.account_number,
              holder: b.account_holder,
            }));
          if (mapped.length > 0) setBankAccounts(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // ── Auto-verify Chapa payment on return from checkout ─────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef  = params.get('tx_ref');
    const status = params.get('status');
    if (!txRef || status !== 'success') return;

    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);

    setMsg('Verifying your Chapa payment…');
    setMsgType('info');

    walletApi.chapaVerify(txRef)
      .then(res => {
        if (res.success && res.data?.status === 'approved') {
          setMsg(`✅ ${res.message || 'Payment confirmed! Your wallet has been credited.'}`);
          setMsgType('success');
          refreshCurrentUser();
          fetchMyTransactions(true);
        } else {
          setMsg('⚠️ Payment is pending confirmation. Check back shortly.');
          setMsgType('info');
        }
      })
      .catch(() => {
        setMsg('⚠️ Could not verify payment automatically. Contact support if balance not updated.');
        setMsgType('error');
      });
  }, []);

  function handleOpenModal(method: 'Chapa' | 'Manual', mode: 'deposit' | 'withdraw' = 'deposit') {
    setSelectedMethod(method);
    setChapaMode(mode);
    setAmount('500');
    setReference(method === 'Chapa' ? '' : `TXN-${Date.now().toString().slice(-6)}`);
    setNotes('');
    setReceipt('');
    setMsg('');
    setShowModal(true);
  }



  async function handleSubmitDeposit() {
    setMsg('');
    const amt = Number(amount);
    if (!selectedMethod || !amt || amt <= 0) {
      setMsg('Please enter a valid deposit amount.');
      setMsgType('error');
      return;
    }

    setLoading(true);

    try {
      if (selectedMethod === 'Chapa') {
        if (chapaMode === 'deposit') {
          // ── Real Chapa deposit gateway ──────────────────────────────
          if (amt < 10) {
            setMsg('Minimum Chapa deposit is 10 ETB.');
            setMsgType('error');
            setLoading(false);
            return;
          }
          const res = await walletApi.chapaInitialize(amt);
          if (res.success && res.data?.checkout_url) {
            setMsg('Redirecting to Chapa checkout…');
            setMsgType('info');
            window.location.href = res.data.checkout_url;
          } else {
            setMsg('Failed to initialize Chapa payment. Please try again.');
            setMsgType('error');
          }
        } else {
          // ── Chapa withdrawal request (queue) ────────────────────────
          const userBal = currentUser?.walletBalance ?? 0;
          if (amt > userBal) {
            setMsg(`Insufficient balance. You have ${userBal} ETB available.`);
            setMsgType('error');
            setLoading(false);
            return;
          }
          if (!reference && !notes) {
            setMsg('Please enter your account number or withdrawal details in the notes.');
            setMsgType('error');
            setLoading(false);
            return;
          }
          const res = await walletApi.submitDeposit({
            amount: -amt,
            credits: -amt,
            payment_method: 'Chapa Withdrawal',
            reference_number: reference || `CHAPA-WD-${Date.now().toString().slice(-6)}`,
            receipt_image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
            notes: notes || `Chapa withdrawal request of ${amt} ETB`,
          });
          if (res?.data) {
            setPaymentQueue(prev => [res.data, ...(prev || [])]);
          }
          setMsg('✅ Chapa withdrawal request submitted! Admin will verify and transfer funds.');
          setMsgType('success');
          setTimeout(() => {
            setAmount('');
            setReference('');
            setNotes('');
            setSelectedMethod(null);
            setShowModal(false);
          }, 1800);
        }
      } else {
        // ── Manual bank deposit ────────────────────────────────────────
        if (!reference && !receipt) {
          setMsg('Please provide a reference ID / SMS text message or receipt proof image.');
          setMsgType('error');
          setLoading(false);
          return;
        }
        const finalRef = reference || `TXN-${Date.now().toString().slice(-6)}`;
        let finalReceipt = receipt;
        if (receiptFile) {
          setMsg('Uploading receipt securely…');
          setMsgType('info');
          const uploadRes = await uploadApi.receipt(receiptFile);
          finalReceipt = uploadRes.data.url;
        }

        const res = await walletApi.submitDeposit({
          amount: amt,
          credits: amt,
          payment_method: 'Manual Bank Transfer',
          reference_number: finalRef,
          receipt_image: finalReceipt,
          notes: notes || 'Manual bank deposit submission',
        });
        if (res?.data) {
          setPaymentQueue(prev => [res.data, ...(prev || [])]);
        }
        setMsg('✅ Manual deposit submitted! Admin will verify your bank receipt shortly.');
        setMsgType('success');
        fetchMyTransactions(true);
        setMsgType('success');
        setTimeout(() => {
          setAmount('');
          setReference('');
          setNotes('');
          setReceipt('');
          setReceiptFile(null);
          setReceiptFilePreview('');
          setSelectedMethod(null);
          setShowModal(false);
        }, 1800);
      }
    } catch (err: any) {
      setMsg(err?.message || 'Deposit submission failed. Please try again.');
      setMsgType('error');
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

  async function handleWithdrawSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawMsg('');
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      setWithdrawMsg('Please enter a valid withdrawal amount.');
      return;
    }
    const userBal = currentUser?.walletBalance ?? 0;
    if (amt > userBal) {
      setWithdrawMsg(`Insufficient wallet balance. You have ${userBal} ETB available.`);
      return;
    }
    if (!withdrawAccountNo || !withdrawAccountName) {
      setWithdrawMsg('Please provide your bank account number and holder name.');
      return;
    }

    setWithdrawLoading(true);
    try {
      const res = await walletApi.submitDeposit({
        amount: -amt,
        credits: -amt,
        payment_method: withdrawBank,
        reference_number: `WD-${Date.now().toString().slice(-6)}`,
        receipt_image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
        notes: `Withdrawal request to ${withdrawBank} (Acc: ${withdrawAccountNo}, Name: ${withdrawAccountName})`,
      });
      if (res?.data) {
        setPaymentQueue(prev => [res.data, ...(prev || [])]);
      }
      setWithdrawMsg('✅ Withdrawal request submitted! Admin will verify and transfer funds to your account.');
      setWithdrawAmount('');
      setWithdrawAccountNo('');
      setWithdrawAccountName('');
    } catch (err: any) {
      setWithdrawMsg(err?.message || 'Withdrawal submission failed.');
    } finally {
      setWithdrawLoading(false);
    }
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">

      {/* ── Global Chapa verification banner ──────────────────────────── */}
      {msg && !showModal && (
        <div className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-2 border ${
          msgType === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          msgType === 'error'   ? 'bg-rose-50 text-rose-700 border-rose-200' :
          'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {msgType === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
          {msgType === 'error'   && <XCircle className="w-5 h-5 shrink-0" />}
          {msgType === 'info'    && <Loader2 className="w-5 h-5 shrink-0 animate-spin" />}
          {msg}
        </div>
      )}

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
              <CreditCard className="w-4 h-4" /> Top-Up &amp; Withdrawal Guidelines
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
              Instant digital deposits via <strong className="text-purple-600 font-extrabold">Chapa</strong>, direct bank deposits, or fast withdrawals directly to your account.
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 border-t border-slate-200 pt-3">
            🔒 All transactions are secured with end-to-end encryption.
          </p>
        </div>
      </div>

      {/* ── DEPOSIT VS WITHDRAW TOGGLE ──────────────────────────────────── */}
      <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setWalletTab('deposit')}
          className={`flex-1 py-3 px-6 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            walletTab === 'deposit'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Deposit Funds
        </button>
        <button
          type="button"
          onClick={() => setWalletTab('withdraw')}
          className={`flex-1 py-3 px-6 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            walletTab === 'withdraw'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" /> Withdraw Funds
        </button>
      </div>

      {/* ── DEPOSIT TAB CONTENT ─────────────────────────────────────────── */}
      {walletTab === 'deposit' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              Select Payment Method
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your preferred deposit method below to top up your account balance.
            </p>
          </div>

          {/* Help Text / Official Bank Accounts Toggle Button */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowBankHelpInfo(!showBankHelpInfo)}
              className="w-full p-4 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-2xl flex items-center justify-between text-xs font-bold text-purple-900 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                Official Accounts
              </span>
              <span className="text-purple-700 font-extrabold bg-purple-200/60 px-3 py-1 rounded-full text-[10px] uppercase">
                {showBankHelpInfo ? 'Hide Accounts ▲' : 'Show Accounts ▼'}
              </span>
            </button>

            {showBankHelpInfo && (
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-4 text-xs animate-in fade-in">
                <p className="font-extrabold text-amber-400 text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Official Deposit Accounts
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {bankAccounts.map(b => (
                    <div key={b.name} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <p className="font-bold text-white text-xs">{b.name}</p>
                      <p className="text-slate-400 text-[11px]">{b.holder}</p>
                      <p className="font-mono text-emerald-400 font-bold text-sm select-all">{b.accNo}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* METHOD 1: CHAPA */}
            <div className="group relative rounded-3xl border-2 border-slate-200 hover:border-purple-500 bg-gradient-to-b from-slate-50 to-purple-50/20 p-6 transition-all duration-300 hover:shadow-xl flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-2 shadow-md flex items-center justify-center">
                  <ChapaLogo />
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                  Instant Gateway
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-base font-black text-slate-900">
                  Chapa Payment
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Instant checkout via Telebirr, CBE Birr, Mobile Banking, and Debit/Credit Cards.
                </p>
              </div>

              {/* Deposit / Withdraw split buttons */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenModal('Chapa', 'deposit')}
                  className="py-2.5 text-xs font-black rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-900/30 flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Deposit
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenModal('Chapa', 'withdraw')}
                  className="py-2.5 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-900/30 flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
                </button>
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
      ) : (
        /* ── WITHDRAWAL TAB CONTENT ───────────────────────────────────────── */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              Request Wallet Withdrawal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Withdraw funds from your wallet directly to your verified bank or Telebirr account.
            </p>
          </div>

          {withdrawMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
              withdrawMsg.includes('✅')
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <span>{withdrawMsg}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Withdrawal Amount (ETB)
              </label>
              <input
                type="number"
                min="1"
                max={currentUser?.walletBalance ?? 0}
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount (e.g. 500)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-rose-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Available for withdrawal: <strong className="text-emerald-600">{(currentUser?.walletBalance ?? 0).toLocaleString()} ETB</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Select Destination Bank / Provider
              </label>
              <select
                value={withdrawBank}
                onChange={e => setWithdrawBank(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
              >
                <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                <option value="Telebirr Transfer">Telebirr Transfer</option>
                <option value="Dashen Bank / Amole">Dashen Bank / Amole</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Account / Phone Number
              </label>
              <input
                type="text"
                value={withdrawAccountNo}
                onChange={e => setWithdrawAccountNo(e.target.value)}
                placeholder="e.g. 1000 4829 10482 or 0911002233"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={withdrawAccountName}
                onChange={e => setWithdrawAccountName(e.target.value)}
                placeholder="Name as registered on bank account"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={withdrawLoading}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {withdrawLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting Request…</span></>
              ) : (
                <><ArrowUpRight className="w-4 h-4" /><span>Submit Withdrawal Request</span></>
              )}
            </button>
          </form>
        </div>
      )}

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
                  {selectedMethod === 'Chapa'
                    ? (chapaMode === 'deposit' ? '⚡ Chapa Deposit' : '💸 Chapa Withdrawal Request')
                    : 'Manual Deposit & Bank Transfer'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedMethod === 'Chapa'
                    ? (chapaMode === 'deposit'
                      ? 'Enter deposit amount to initiate instant digital payment.'
                      : 'Submit a withdrawal request. Admin will transfer funds to your account.')
                    : 'Transfer funds to our bank account and attach transaction proof.'}
                </p>
              </div>
            </div>

            {/* Chapa Deposit/Withdraw mode toggle inside modal */}
            {selectedMethod === 'Chapa' && (
              <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setChapaMode('deposit'); setMsg(''); }}
                  className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    chapaMode === 'deposit' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Deposit via Chapa
                </button>
                <button
                  type="button"
                  onClick={() => { setChapaMode('withdraw'); setMsg(''); }}
                  className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    chapaMode === 'withdraw' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw Funds
                </button>
              </div>
            )}

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



            {/* Chapa Withdrawal — account & notes fields */}
            {selectedMethod === 'Chapa' && chapaMode === 'withdraw' && (
              <div className="space-y-3 pt-1 pb-2">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start gap-2">
                  <ArrowUpRight className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>Your withdrawal will be processed by admin and sent to your registered payment account. Provide details below.</span>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Your Account / Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0911 002 233 or 1000 4829 10482"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Withdrawal Notes (Bank / Method)
                  </label>
                  <textarea
                    placeholder="e.g. Telebirr – 0911 002 233, or CBE – 1000 4829 10482"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:border-rose-400 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Additional Inputs — Manual only */}
            {selectedMethod === 'Manual' && (
              <div className="space-y-4 pt-1">
                {/* Proof Type Toggle Switch */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Verification Method
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setManualProofMode('ref_id')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                        manualProofMode === 'ref_id'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🔑 Reference ID / Link / SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualProofMode('image')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                        manualProofMode === 'image'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🖼️ Receipt Proof Image
                    </button>
                  </div>
                </div>

                {/* Mode 1: Reference ID / Link / SMS */}
                {manualProofMode === 'ref_id' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Transaction ID, Confirmation SMS, or Payment Link <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={reference}
                      onChange={(e) => {
                        setReference(e.target.value);
                        if (!receipt) setReceipt('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400');
                      }}
                      placeholder="Paste your transaction ID code (e.g. CBE-TXN-984210), bank SMS confirmation text message, or payment link..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500 h-20 resize-none"
                    />
                  </div>
                ) : (
                  /* Mode 2: Receipt Proof Image with File Importer */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Import Local Image File <span className="text-rose-500">*</span>
                      </label>
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50 cursor-pointer transition-colors text-center">
                        <span className="text-xs font-bold text-emerald-700">📁 Click to Import Receipt Photo</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, JPEG, WEBP files</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileImport}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Or Paste Receipt Image URL
                      </label>
                      <input
                        value={receipt}
                        onChange={(e) => {
                          setReceipt(e.target.value);
                          setReceiptFilePreview(e.target.value);
                        }}
                        type="text"
                        placeholder="https://... or paste screenshot picture URL"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {(receiptFilePreview || (receipt && receipt.startsWith('http'))) && (
                      <div className="p-2 bg-slate-100 rounded-2xl border border-slate-200 flex items-center gap-3">
                        <img
                          src={receiptFilePreview || receipt}
                          alt="Receipt Preview"
                          className="w-14 h-14 object-cover rounded-xl border border-slate-300 shrink-0"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <div className="text-xs">
                          <p className="font-bold text-emerald-700">✓ Image Imported</p>
                          <p className="text-[10px] text-slate-500">Ready to submit to admin verification queue.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any details for admin verification..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 h-16 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Chapa info note */}
            {selectedMethod === 'Chapa' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-700 font-medium">
                🔒 You'll be redirected to Chapa's secure checkout. Supports Telebirr, CBE Birr, Mobile Banking & Cards.
                After payment, you'll return here automatically and your wallet will be credited instantly.
              </div>
            )}

            {/* Status message */}
            {msg && (
              <div className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                msgType === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                msgType === 'error'   ? 'bg-rose-50 text-rose-700 border-rose-200' :
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {msgType === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
                {msgType === 'error'   && <XCircle className="w-4 h-4 shrink-0" />}
                {msgType === 'info'    && <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
                {msg}
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => { setShowModal(false); setSelectedMethod(null); setMsg(''); }}
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
                {loading
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting Deposit…</>
                  : selectedMethod === 'Chapa'
                    ? 'Pay via Chapa →'
                    : 'Deposit'
                }
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── TRANSACTION HISTORY ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Transaction History</h2>
          <button
            onClick={() => fetchMyTransactions(true)}
            disabled={txRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${txRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {txLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading transactions…
          </div>
        ) : myTxs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 space-y-2">
            <div className="text-4xl">📋</div>
            <p className="font-semibold text-sm">No transactions recorded yet</p>
            <p className="text-xs text-slate-400">Top up your wallet above to start participating in live auctions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myTxs.map(t => {
              const meta = txMeta(t.type);
              const isDebit = Number(t.amount) < 0;
              return (
                <div key={t.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100">
                  <div className={`${meta.bg} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-slate-900 truncate">{meta.label}</p>
                      {t.paymentMethod && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
                          {t.paymentMethod}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{t.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isDebit ? '' : '+'}{Number(t.amount).toLocaleString()} ETB
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
