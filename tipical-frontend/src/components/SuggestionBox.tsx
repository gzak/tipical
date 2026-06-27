import { useState, useEffect, useRef } from 'react';
import { submitSuggestion } from '../services/suggestionService';

type Phase = 'idle' | 'open' | 'submitting' | 'thanks' | 'done';

const MAX_CHARS = 2000;

export function SuggestionBox() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dismiss = () => { setPhase('idle'); setError(''); };

  useEffect(() => {
    if (phase === 'open') textareaRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (phase !== 'thanks') return;
    const id = setTimeout(() => setPhase('done'), 3000);
    return () => clearTimeout(id);
  }, [phase]);

  // Document-level Escape listener so it works regardless of which element has focus.
  useEffect(() => {
    if (phase !== 'open') return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [phase]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) { setError('Please enter a suggestion.'); return; }
    setError('');
    setPhase('submitting');
    try {
      await submitSuggestion(trimmed);
      setPhase('thanks');
    } catch {
      setPhase('open');
      setError('Something went wrong. Please try again.');
    }
  };

  if (phase === 'done') return null;

  if (phase === 'thanks') {
    return (
      <div
        className="fixed bottom-12 left-12 z-50 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg animate-fade-out"
        role="status"
        aria-live="polite"
      >
        Thanks for the feedback!
      </div>
    );
  }

  return (
    <>
      {(phase === 'open' || phase === 'submitting') && (
        <div className="fixed inset-0 z-40" onClick={dismiss} aria-hidden="true" />
      )}

      <div className="fixed bottom-12 left-12 z-50 flex flex-col items-start gap-2">
        {phase === 'open' && (
          <div className="bg-white rounded-xl shadow-xl w-72 p-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Send anonymous feedback</p>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => { setText(e.target.value); setError(''); }}
              placeholder="Share a suggestion or report an issue…"
              maxLength={MAX_CHARS}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-200 p-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{text.length}/{MAX_CHARS}</span>
              {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
            <button
              onClick={handleSubmit}
              className="w-full rounded-lg bg-blue-600 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Submit
            </button>
          </div>
        )}

        <button
          onClick={() => { if (phase !== 'submitting') setPhase(p => p === 'open' ? 'idle' : 'open'); }}
          disabled={phase === 'submitting'}
          title={phase === 'open' ? 'Close suggestion box' : 'Send feedback'}
          aria-label={phase === 'open' ? 'Close suggestion box' : 'Send feedback'}
          aria-expanded={phase === 'open'}
          className="bg-white rounded-full shadow-md p-2.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-8 8l4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 4z" />
          </svg>
        </button>
      </div>
    </>
  );
}
