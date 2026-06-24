import { useEffect, useRef, useState } from 'react';
import { formatAmount } from '../lib/money';
import { IconArrowRight, IconScale } from './icons';

const SEED = [
  { id: 'ops', name: 'Operating Cash', type: 'asset', balance: 600000000 },
  { id: 'stripe', name: 'Stripe Settlement', type: 'asset', balance: 200000000 },
  { id: 'treasury', name: 'Treasury Reserve', type: 'asset', balance: 600000000 },
  { id: 'deposits', name: 'Customer Deposits', type: 'liability', balance: -1400000000 },
];

const NAMES = Object.fromEntries(SEED.map((account) => [account.id, account.name]));
const ASSET_IDS = SEED.filter((account) => account.type === 'asset').map((account) => account.id);

const KIND_LABELS = {
  transfer: 'Transfer',
  deposit: 'Deposit',
  payout: 'Payout',
};

function randomCents(min, max) {
  return Math.round((min + Math.random() * (max - min)) / 100) * 100;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function nextEvent(balances) {
  const roll = Math.random();

  if (roll < 0.65) {
    const src = pick(ASSET_IDS);
    let dst = pick(ASSET_IDS);
    while (dst === src) dst = pick(ASSET_IDS);
    const ceiling = Math.max(120000, Math.min(2500000, balances[src] * 0.25));
    return { kind: 'transfer', src, dst, amount: randomCents(80000, ceiling) };
  }

  if (roll < 0.83) {
    return { kind: 'deposit', src: 'deposits', dst: pick(ASSET_IDS), amount: randomCents(150000, 1200000) };
  }

  const fundable = ASSET_IDS.filter((id) => balances[id] > 3000000);
  if (fundable.length === 0) {
    const src = pick(ASSET_IDS);
    let dst = pick(ASSET_IDS);
    while (dst === src) dst = pick(ASSET_IDS);
    return { kind: 'transfer', src, dst, amount: randomCents(80000, 600000) };
  }
  return { kind: 'payout', src: pick(fundable), dst: 'deposits', amount: randomCents(120000, 700000) };
}

export default function LiveLedgerCard() {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const targetsRef = useRef(Object.fromEntries(SEED.map((account) => [account.id, account.balance])));
  const [display, setDisplay] = useState(targetsRef.current);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    if (reducedMotion) return undefined;
    let frame;
    let count = 0;
    let lastEventAt = null;

    const loop = (now) => {
      if (lastEventAt === null) lastEventAt = now - 1700;
      if (now - lastEventAt >= 2600) {
        lastEventAt = now;
        const balances = targetsRef.current;
        const generated = nextEvent(balances);
        targetsRef.current = {
          ...balances,
          [generated.src]: balances[generated.src] - generated.amount,
          [generated.dst]: balances[generated.dst] + generated.amount,
        };
        count += 1;
        setEvent({ ...generated, n: count });
      }

      setDisplay((current) => {
        let changed = false;
        const next = { ...current };
        for (const id of Object.keys(targetsRef.current)) {
          const target = targetsRef.current[id];
          const value = current[id];
          const delta = target - value;
          if (Math.abs(delta) > 50) {
            next[id] = value + delta * 0.14;
            changed = true;
          } else if (value !== target) {
            next[id] = target;
            changed = true;
          }
        }
        return changed ? next : current;
      });

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const totalAssets = ASSET_IDS.reduce((sum, id) => sum + display[id], 0);

  return (
    <div className="relative">
      <div className="glow-orb inset-0 m-auto h-72 w-72 animate-float bg-sky-500/20" />
      <div className="glass-strong relative rounded-3xl p-6 shadow-glow">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total balance</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Live demo
              </span>
            </div>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-white">
              ${formatAmount(Math.round(totalAssets))}
            </p>
            <p className="mt-1 text-xs text-slate-500">{ASSET_IDS.length} asset accounts · 1 liability</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-sky-300">
            <IconScale className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          {SEED.map((account) => {
            const touched = event && (event.src === account.id || event.dst === account.id);
            const credited = event && event.dst === account.id;
            const value = display[account.id];
            return (
              <div
                key={account.id}
                className="relative flex items-center justify-between overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
              >
                {touched && (
                  <span
                    key={event.n}
                    className={`pointer-events-none absolute inset-0 animate-row-flash ${
                      credited ? 'bg-emerald-400/10 ring-1 ring-emerald-400/30' : 'bg-sky-400/10 ring-1 ring-sky-400/25'
                    }`}
                  />
                )}
                <div className="relative flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      account.type === 'asset' ? 'bg-sky-500/10 text-sky-300' : 'bg-violet-500/10 text-violet-300'
                    }`}
                  >
                    <IconScale className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{account.name}</p>
                    <p className="text-xs capitalize text-slate-500">{account.type}</p>
                  </div>
                </div>
                <span
                  className={`relative shrink-0 whitespace-nowrap pl-3 font-mono text-sm tabular-nums ${
                    account.type === 'asset' ? 'text-white' : 'text-rose-400'
                  }`}
                >
                  {value < 0 ? '−' : ''}${formatAmount(Math.abs(Math.round(value)))}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 h-12">
          {event ? (
            <div
              key={event.n}
              className="animate-flow-in flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {KIND_LABELS[event.kind]}
                </span>
                <span className="truncate text-xs text-slate-300">{NAMES[event.src]}</span>
                <IconArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                <span className="truncate text-xs text-slate-300">{NAMES[event.dst]}</span>
              </div>
              <span className="shrink-0 font-mono text-sm tabular-nums text-emerald-300">
                ${formatAmount(event.amount)}
              </span>
            </div>
          ) : (
            <div className="flex h-full items-center rounded-xl border border-white/5 bg-white/[0.03] px-4 text-xs text-slate-500">
              Posting double-entry transfers…
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/5 px-4 py-3 text-sm">
          <span className="text-slate-400">Net position</span>
          <span className="font-medium text-emerald-300">Balanced · 0.00</span>
        </div>
      </div>
    </div>
  );
}
