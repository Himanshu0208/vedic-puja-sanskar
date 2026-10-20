'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, Loader2, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/api/adminService';
import type { AdminReturn } from '@/types/admin';

export default function AdminReturnsPage() {
  const [items, setItems] = useState<AdminReturn[]>([]);
  const [section, setSection] = useState<'review' | 'refund'>('review');
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [refundReferences, setRefundReferences] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const filter = section === 'review' ? 'PENDING' : 'REFUND_DUE';
  const load = useCallback(async () => {
    try { setItems((await adminService.getReturns({ page: 1, pageSize: 100, status: filter })).returns); }
    catch { toast.error('Could not load return requests'); }
  }, [filter]);
  useEffect(() => { void load(); }, [load]);

  const review = async (item: AdminReturn, approved: boolean) => {
    const note = remarks[item.id]?.trim();
    if (!note) { toast.error('Add a remark before reviewing'); return; }
    setBusy(item.id);
    try {
      await adminService.reviewReturn(item.id, approved, note);
      toast.success(approved ? 'Approved return moved to refunds' : 'Return rejected');
      if (approved) setSection('refund');
      else await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not review request'); }
    finally { setBusy(null); }
  };

  const processRefund = async (item: AdminReturn) => {
    setBusy(item.id);
    try { await adminService.processReturnRefund(item.id); toast.success('Refund raised with Razorpay'); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not raise refund'); }
    finally { setBusy(null); }
  };

  const recordCODRefund = async (item: AdminReturn) => {
    const reference = refundReferences[item.id]?.trim();
    if (!reference) { toast.error('Enter the UPI/bank reference or cash note'); return; }
    setBusy(item.id);
    try { await adminService.recordCODRefund(item.id, reference); toast.success('COD refund recorded'); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not record COD refund'); }
    finally { setBusy(null); }
  };

  return <main className="mx-auto max-w-6xl p-5 sm:p-8">
    <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">After sales</p><h1 className="mt-1 font-serif text-3xl text-stone-900">Returns & refunds</h1><p className="mt-1 text-sm text-stone-500">Approve return requests first; raise the refund after the item arrives.</p></div>
    <div role="tablist" aria-label="Return workflow" className="mb-6 flex gap-2 rounded-2xl bg-stone-100 p-1.5 sm:w-fit">
      <button role="tab" aria-selected={section === 'review'} onClick={() => setSection('review')} className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${section === 'review' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'}`}>Review returns</button>
      <button role="tab" aria-selected={section === 'refund'} onClick={() => setSection('refund')} className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${section === 'refund' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'}`}>Refunds</button>
    </div>
    <h2 className="mb-4 text-lg font-semibold text-stone-900">{section === 'review' ? 'Requests awaiting approval' : 'Approved returns awaiting refund'}</h2>
    {!items.length ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500"><RotateCcw className="mx-auto mb-3 text-amber-700"/><p>{section === 'review' ? 'No return requests need review.' : 'No approved returns are waiting for a refund.'}</p></div> : <div className="space-y-5">{items.map(item => <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold text-stone-900">Order #{item.orderId} <span className="mx-1 text-stone-300">·</span> {item.customerEmail}</p><p className="mt-1 text-xs text-stone-500">Submitted {new Date(item.createdAt).toLocaleString()}</p></div><span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${item.status === 'PENDING' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>{item.status}</span></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-stone-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-stone-500">Reason · {item.reason}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-800">{item.description}</p><p className="mt-3 text-xs text-stone-500">Payment: {item.paymentMethod || 'none'} · {item.paymentStatus || 'unpaid'}<br/>Refund amount: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: item.currency || 'INR' }).format(item.amount)}</p></div><div className="flex flex-wrap content-start gap-2">{item.mediaUrls?.map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm text-amber-900 hover:bg-amber-50"><ExternalLink size={14}/> Evidence {i + 1}</a>)}{!item.mediaUrls?.length && <p className="text-sm text-stone-400">No photo or video attached</p>}</div></div>
      {section === 'review' ? <div className="mt-4"><label htmlFor={`remarks-${item.id}`} className="mb-1 block text-xs font-semibold text-stone-600">Decision remarks · required</label><textarea id={`remarks-${item.id}`} rows={2} value={remarks[item.id] ?? ''} onChange={e => setRemarks(v => ({ ...v, [item.id]: e.target.value }))} className="w-full rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-amber-500" placeholder="Explain the decision to the customer"/><div className="mt-3 flex justify-end gap-2"><button disabled={busy === item.id} onClick={() => void review(item, false)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50">{busy === item.id ? <Loader2 size={15} className="animate-spin"/> : <X size={15}/>} Reject</button><button disabled={busy === item.id} onClick={() => void review(item, true)} className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"><Check size={15}/> Approve return</button></div></div> : <div className="mt-4 rounded-xl bg-stone-50 p-4">{item.adminRemarks && <p className="mb-3 text-sm text-stone-700"><strong>Admin remarks:</strong> {item.adminRemarks}</p>}{item.refundId ? <><p className="mb-1 text-xs text-stone-500">Item received {item.receivedAt ? new Date(item.receivedAt).toLocaleString() : ''}</p><p className="text-sm font-semibold text-emerald-800">Refund raised · {item.refundId}</p></> : item.paymentMethod === 'RAZORPAY' && item.paymentStatus === 'success' ? <><p className="mb-3 text-sm text-stone-600">{item.receivedAt ? `Item receipt recorded ${new Date(item.receivedAt).toLocaleString()}.` : 'Confirm the returned item has arrived before raising its full refund.'}</p><button disabled={busy === item.id} onClick={() => void processRefund(item)} className="inline-flex items-center gap-2 rounded-full bg-amber-800 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-900 disabled:opacity-50">{busy === item.id ? <Loader2 size={15} className="animate-spin"/> : <RotateCcw size={15}/>} {item.receivedAt ? 'Retry Razorpay refund' : 'Confirm received & raise refund'}</button></>  : item.paymentMethod === 'COD' && item.paymentStatus === 'success' ? <><p className="mb-3 text-sm text-stone-600">Send the refund outside the app first, then record its UPI/bank reference or cash note.</p><input value={refundReferences[item.id] ?? ''} onChange={e => setRefundReferences(v => ({ ...v, [item.id]: e.target.value }))} className="mb-3 w-full rounded-xl border border-stone-200 bg-white p-3 text-sm outline-none focus:border-amber-500" placeholder="UPI / bank reference or cash note"/><button disabled={busy === item.id} onClick={() => void recordCODRefund(item)} className="inline-flex items-center gap-2 rounded-full bg-amber-800 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-900 disabled:opacity-50">{busy === item.id ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>} Record COD refund sent</button></> : <p className="text-sm text-stone-600">Automated refunds require a successful payment.</p>}</div>}
    </article>)}</div>}
  </main>;
}
