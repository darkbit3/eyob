import { useState, useEffect } from 'react';
import { formatAuctionCountdown, getAuctionDisplayStatus } from '../utils/countdown';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ endTime, status, startTime }: { endTime: string; status: string; startTime?: string }) {
  const normalizedStatus = getAuctionDisplayStatus(status, startTime, endTime);
  const [label, setLabel] = useState(formatAuctionCountdown(endTime, status, startTime));

  useEffect(() => {
    const update = () => setLabel(formatAuctionCountdown(endTime, status, startTime));
    update();
    if (normalizedStatus === 'closed' || normalizedStatus === 'paused' || normalizedStatus === 'draft') return;
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endTime, status, startTime, normalizedStatus]);

  if (normalizedStatus === 'closed') return (
    <span className="flex items-center gap-1 text-gray-400 text-sm"><Clock className="w-3.5 h-3.5" /> Closed</span>
  );

  if (normalizedStatus === 'paused') return (
    <span className="flex items-center gap-1 text-amber-600 text-sm font-semibold"><Clock className="w-3.5 h-3.5" /> Paused</span>
  );

  if (normalizedStatus === 'draft') return (
    <span className="flex items-center gap-1 text-slate-500 text-sm font-semibold"><Clock className="w-3.5 h-3.5" /> Draft</span>
  );

  return (
    <span className={`flex items-center gap-1 text-sm font-semibold ${normalizedStatus === 'upcoming' ? 'text-blue-600' : 'text-emerald-600'}`}>
      <Clock className="w-3.5 h-3.5" /> {label}
    </span>
  );
}
