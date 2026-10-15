"use client";
export default function InquiryForm() {
  return (
    <form className="grid gap-2.5" action="#" method="POST" onSubmit={(e)=>e.preventDefault()}>
      <input name="name" required placeholder="Nom *" className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-brand)]" />
      <input name="company" placeholder="Société" className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-brand)]" />
      <input name="email" required placeholder="E-mail / Tél *" className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-brand)]" />
      <input name="qty" type="number" min="1" placeholder="Quantité" className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-brand)]" />
      <textarea name="msg" rows={3} placeholder="Message (quantité, destination, paiement…)" className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-brand)]" />
      <button type="submit" className="bg-[var(--color-brand)] text-white font-bold rounded-full py-3 text-sm w-full mt-1">Envoyer</button>
    </form>
  );
}
