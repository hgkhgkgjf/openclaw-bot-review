// app/daily/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useI18n, localeToBcp47 } from '@/lib/i18n';

interface DailyItem {
  time: string;
  content: string;
  status: 'completed' | 'in-progress' | 'pending';
}

function DailyBoard() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<DailyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    async function fetchDaily() {
      try {
        const res = await fetch('/api/daily');
        const data = await res.json();
        setItems(data.items || []);
      } catch (error) {
        console.error('Failed to fetch daily:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDaily();
  }, []);

  const completedItems = items.filter(i => i.status === 'completed');
  const inProgressItems = items.filter(i => i.status === 'in-progress');

  const reportText = completedItems.length > 0
    ? t('daily.reportCompleted')
        .replace('{count}', String(completedItems.length))
        .replace('{items}', completedItems.map(i => i.content).join(locale === 'en' ? '. ' : '。'))
    : t('daily.reportEmpty');

  const speak = () => {
    if (!('speechSynthesis' in window)) {
      alert(t('daily.noSpeechSupport'));
      return;
    }

    if (speaking && utterance) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const u = new SpeechSynthesisUtterance(reportText);
    u.lang = localeToBcp47(locale);
    u.rate = 1.0;

    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);

    setUtterance(u);
    window.speechSynthesis.speak(u);
  };

  const today = new Date().toLocaleDateString(localeToBcp47(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📅 {t('daily.title')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{today}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={speak}
            disabled={loading || items.length === 0}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              speaking
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {speaking ? (
              <>
                <span>⏹️</span> {t('daily.stop')}
              </>
            ) : (
              <>
                <span>🎤</span> {t('daily.report')}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{completedItems.length}</div>
          <div className="text-xs text-[var(--text-muted)]">{t('daily.completed')}</div>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{inProgressItems.length}</div>
          <div className="text-xs text-[var(--text-muted)]">{t('daily.inProgress')}</div>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">
            {items.length - completedItems.length - inProgressItems.length}
          </div>
          <div className="text-xs text-[var(--text-muted)]">{t('daily.pending')}</div>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">{t('common.loading')}</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            {t('daily.noRecords')}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {items.map((item, index) => (
              <div
                key={index}
                className={`p-4 flex items-start gap-3 ${
                  speaking && item.status === 'completed' ? 'opacity-60' : ''
                }`}
              >
                <span className="text-lg mt-0.5">
                  {item.status === 'completed' ? '✅' :
                   item.status === 'in-progress' ? '🔄' : '⏳'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${
                    item.status === 'completed'
                      ? 'text-[var(--text-muted)] line-through'
                      : ''
                  }`}>
                    {item.content}
                  </p>
                  {item.time && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">{item.time}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {speaking && (
        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400">
          🎤 {t('daily.speakingHint')}
        </div>
      )}
    </main>
  );
}

export default function DailyPage() {
  return <DailyBoard />;
}
