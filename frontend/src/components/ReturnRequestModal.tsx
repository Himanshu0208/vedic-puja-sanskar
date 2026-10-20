'use client';

import { useRef, useState } from 'react';
import { X, Upload, Trash2, RotateCcw, Loader2, ImageIcon, Film } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService } from '@/services/api/orderService';

interface Props {
  orderId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnRequestModal({ orderId, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    for (const f of Array.from(incoming)) {
      if (next.length >= 5) { toast.error('Max 5 files allowed'); break; }
      next.push(f);
    }
    setFiles(next);
  };

  const remove = (idx: number) => setFiles(f => f.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!description.trim()) { toast.error('Please describe the reason for return'); return; }
    setSubmitting(true);
    try {
      if (!reason) { toast.error('Please select a return reason'); return; }
      await orderService.submitReturnRequest(orderId, reason, description.trim(), files);
      toast.success('Return request submitted!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 backdrop-blur-sm sm:items-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#fffefa] shadow-2xl ring-1 ring-stone-200/80 animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-100 text-amber-800">
              <RotateCcw size={15} />
            </span>
            <div>
              <p className="font-semibold text-stone-900">Request Return</p>
              <p className="text-xs text-stone-500">Order #{orderId}</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Why are you returning this? <span className="text-red-500">*</span></label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="mb-4 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100">
              <option value="">Select a reason</option>
              {['Damaged or defective', 'Wrong item received', 'Item missing parts', 'Quality not as expected', 'No longer needed', 'Other'].map(option => <option key={option}>{option}</option>)}
            </select>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Reason for return <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue — damaged product, wrong item, quality concern…"
              className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {/* Media upload */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Photos / Videos <span className="text-stone-400 font-normal normal-case">(up to 5)</span>
            </label>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={files.length >= 5}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 px-4 py-5 text-sm text-stone-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 disabled:pointer-events-none disabled:opacity-40"
            >
              <Upload size={16} />
              Click to upload images or videos
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              className="hidden"
              onChange={e => addFiles(e.target.files)}
            />

            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-3 py-2 shadow-sm">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-500">
                      {f.type.startsWith('video') ? <Film size={14} /> : <ImageIcon size={14} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-stone-700">{f.name}</span>
                    <span className="shrink-0 text-xs text-stone-400">{(f.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => remove(i)} className="shrink-0 text-stone-400 transition hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-stone-100 px-6 py-4">
          <button onClick={onClose} disabled={submitting} className="rounded-full border border-stone-200 px-5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={() => void submit()}
            disabled={submitting || !description.trim() || !reason}
            className="inline-flex items-center gap-2 rounded-full bg-amber-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-900 disabled:opacity-50"
          >
            {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <><RotateCcw size={14} /> Submit Request</>}
          </button>
        </div>
      </div>
    </div>
  );
}
