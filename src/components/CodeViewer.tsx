import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language?: string;
  title?: string;
  badge?: string;
  badgeColor?: 'indigo' | 'emerald' | 'amber';
  maxHeight?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'python',
  title,
  badge,
  badgeColor = 'indigo',
  maxHeight = 'max-h-[500px]',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  const badgeStyles = {
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  }[badgeColor];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg flex flex-col">
      {/* Code Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          {title && <span className="text-sm font-semibold text-slate-200">{title}</span>}
          {badge && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badgeStyles}`}>
              {badge}
            </span>
          )}
          <span className="text-xs text-slate-500 uppercase font-mono px-2 py-0.5 rounded bg-slate-800/80">
            {language}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          title="העתק קוד ללוח"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">הועתק!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>העתק</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body with line numbers */}
      <div className={`overflow-x-auto overflow-y-auto ${maxHeight} p-3 font-mono text-xs sm:text-sm leading-relaxed text-slate-200`}>
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-900/50 group">
                <td className="w-10 pr-3 pl-2 text-right select-none text-slate-600 group-hover:text-slate-400 text-xs align-top">
                  {idx + 1}
                </td>
                <td className="pl-3 pr-2 text-left whitespace-pre font-mono align-top text-slate-100">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
