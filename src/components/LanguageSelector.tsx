import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
    { code: 'am', label: 'አማርኛ', flag: '🇪🇹', short: 'AM' },
  ] as const;

  const current = languages.find(l => l.code === lang) || languages[0];

  return (
    <div ref={ref} className="relative inline-block text-left font-sans">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200/80 shadow-xs"
        title="Change Language / ቋንቋ ይቀይሩ"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-600" />
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="font-black tracking-wider text-[11px]">{current.short}</span>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden py-1 animate-fade-in">
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Language / ቋንቋ
          </div>
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLang(item.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors ${
                lang === item.code ? 'bg-emerald-50 text-emerald-700 font-black' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{item.flag}</span>
                <span>{item.label}</span>
              </span>
              {lang === item.code && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
