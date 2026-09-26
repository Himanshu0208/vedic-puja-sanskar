import { MessageSquareText, Star } from 'lucide-react';

export default function AdminFeedbackPage() {
  return <section>
    <div className="mb-6"><h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Feedback</h1><p className="mt-1 text-sm text-stone-500">Customer comments and product reviews.</p></div>
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center shadow-sm"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-800"><MessageSquareText size={25}/></span><h2 className="mt-4 text-lg font-semibold text-stone-900">Your feedback inbox is ready</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">There’s no customer feedback to show yet because the storefront doesn’t currently collect or store reviews.</p><div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600"><Star size={14}/> Feedback collection not enabled</div></div>
  </section>;
}
