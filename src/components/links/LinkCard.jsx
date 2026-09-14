import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Edit2, Archive, Trash2, Tag, Globe, GripVertical } from 'lucide-react';
import { priorityColors, priorityLabels } from '../../utils/constants';
import { sanitizeUrl } from '../../utils/securityUtils';

const getDomain = (url) => {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname;
  } catch {
    return '';
  }
};

const LinkCard = ({
  link,
  view,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onCopy,
  copied,
  onEdit,
  onArchive,
  onDelete,
  dragHandleProps,
  isDragging
}) => {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const domain = getDomain(link.url);
  const faviconUrl = domain && !faviconFailed ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

  return (
    <div
      onClick={() => {
        if (isSelectionMode) {
          onToggleSelect(link.id);
        }
      }}
      className={`glass-panel p-5 flex flex-col justify-between group transition-all relative ${
        isSelectionMode ? 'cursor-pointer hover:border-accent-primary/50' : 'hover:-translate-y-1 hover:border-white/20'
      } ${isSelected && isSelectionMode ? 'ring-2 ring-accent-primary border-accent-primary/50 bg-accent-primary/5' : ''} ${
        isDragging ? 'opacity-40 scale-95 border-dashed border-accent-primary' : ''
      }`}
    >
      <div>
        {/* Header Row: Category & Priority & Drag Handle */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {dragHandleProps && !isSelectionMode && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                title="سحب لإعادة الترتيب"
              >
                <GripVertical size={16} />
              </div>
            )}

            {isSelectionMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(link.id);
                }}
                className={`w-5 h-5 rounded-md flex justify-center items-center shrink-0 transition-all duration-300 ${
                  isSelected
                    ? 'bg-accent-primary border-accent-primary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.4)]'
                    : 'bg-black/30 border border-glass-border hover:border-accent-primary/50 hover:bg-black/40'
                }`}
              >
                {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
              </button>
            )}
            {link.category && (
              <span className="text-xs font-medium text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-glass-border flex items-center gap-1.5">
                <Tag size={11} className="text-accent-primary" />
                {link.category}
              </span>
            )}
          </div>

          {link.priority && link.priority !== 'none' && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-medium border flex items-center gap-1 ${
                link.priority === 'urgent-important'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : link.priority === 'important'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityColors[link.priority]}`} />
              {priorityLabels[link.priority]}
            </span>
          )}
        </div>

        {/* Title & Favicon */}
        <div className="flex items-start gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center shrink-0 overflow-hidden mt-0.5 group-hover:border-accent-primary/40 transition-colors">
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="w-4 h-4 object-contain rounded"
                onError={() => setFaviconFailed(true)}
                loading="lazy"
              />
            ) : (
              <Globe size={16} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-accent-primary transition-colors">
              {link.title}
            </h3>
            <p className="text-xs text-slate-400 font-mono line-clamp-1 break-all mt-1 opacity-70">
              {domain || link.url}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="flex items-center justify-between border-t border-glass-border pt-3 mt-2">
        <div className="flex items-center gap-1.5">
          <a
            href={sanitizeUrl(link.url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => isSelectionMode && e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink size={13} /> فتح الرابط
          </a>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy(link.url, link.id);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="نسخ الرابط"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="flex items-center gap-1">
          {view === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(link);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
              title="تعديل"
            >
              <Edit2 size={14} />
            </button>
          )}

          {view === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(link.id);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
              title="أرشفة"
            >
              <Archive size={14} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(link.id);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="حذف"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkCard;
