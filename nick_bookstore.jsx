// =============================================================
// Nick’s Literary Works – Batch 7 Implementation
// Focus: Admin‑created Buyer Accounts, Badge Icons SVG, Per‑Book Sale Discounts
// =============================================================
//  ▸ Adds API + UI for admin to create buyer accounts on their behalf
//  ▸ Ships simple SVG badge icons in /public
//  ▸ Adds `discount_percent` column per book (0‑75) editable in admin
// =============================================================

/*--------------------------------------------------------------*/
/* FILE: sql/schema.sql  (append)                               */
/*--------------------------------------------------------------*/
alter table public.books add column if not exists discount_percent int default 0 check (discount_percent between 0 and 75);

/*--------------------------------------------------------------*/
/* FILE: app/admin/users/create/page.tsx (new)                  */
/*--------------------------------------------------------------*/
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CreateUser() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);

  const create = async () => {
    setSending(true);
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    alert(json.ok ? "User created!" : json.error);
    setSending(false);
  };

  return (
    <section className="p-4 max-w-md">
      <h2 className="text-xl font-semibold mb-4">Create Buyer Account</h2>
      <input className="border p-2 w-full mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Temp Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button onClick={create} disabled={sending}>Create</Button>
    </section>
  );
}

/*--------------------------------------------------------------*/
/* FILE: app/api/admin/create-user/route.ts                     */
/*--------------------------------------------------------------*/
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  if (req.headers.get("Authorization") !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // init meta row
  await admin.from("user_meta").insert({ user_id: data.user?.id, badge: 'none', discount: 0 });
  return NextResponse.json({ ok: true });
}

/*--------------------------------------------------------------*/
/* FILE: app/admin/books/[id]/page.tsx  (append field)          */
/*--------------------------------------------------------------*/
...
const [discount, setDiscount] = useState(book.discount_percent);
...
<input type="number" min={0} max={75} className="border p-2 w-full mb-2" value={discount} onChange={(e)=>setDiscount(parseInt(e.target.value))} />
...
await supabase.from("books").update({ discount_percent: discount }).eq("id", id);
...

/*--------------------------------------------------------------*/
/* FILE: app/store/page.tsx  (update price calc)                */
/*--------------------------------------------------------------*/
const salePrice = b.price * (1 - b.discount_percent / 100);
const finalPrice = salePrice * (1 - discount / 100);
...
<p className="text-lg font-bold">₱{finalPrice.toFixed(2)} {(b.discount_percent>0||discount>0) && <span className="line-through text-xs ml-1 text-gray-400">₱{b.price.toFixed(2)}</span>}</p>
...

/*--------------------------------------------------------------*/
/* FILE: public/badge-bronze.svg                                */
/*--------------------------------------------------------------*/
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="#b08d57"><circle cx="32" cy="32" r="30"/><text x="32" y="40" font-size="24" text-anchor="middle" fill="#fff">B</text></svg>

/*--------------------------------------------------------------*/
/* FILE: public/badge-silver.svg                                */
/*--------------------------------------------------------------*/
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="#c0c0c0"><circle cx="32" cy="32" r="30"/><text x="32" y="40" font-size="24" text-anchor="middle" fill="#fff">S</text></svg>

/*--------------------------------------------------------------*/
/* FILE: public/badge-gold.svg                                  */
/*--------------------------------------------------------------*/
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="#d4af37"><circle cx="32" cy="32" r="30"/><text x="32" y="40" font-size="24" text-anchor="middle" fill="#fff">G</text></svg>

/*--------------------------------------------------------------*/
/* FILE: lib/constants.ts  (add badge icon mapping text)        */
/*--------------------------------------------------------------*/
export const BADGE_ICONS = {
  bronze: "/badge-bronze.svg",
  silver: "/badge-silver.svg",
  gold: "/badge-gold.svg",
};

/*--------------------------------------------------------------*/
/* FILE: components/BadgeIcon.tsx                               */
/*--------------------------------------------------------------*/
import Image from "next/image";
import { BADGE_ICONS } from "@/lib/constants";
export default function BadgeIcon({ badge }: { badge: string }) {
  if (badge === 'none') return null;
  return <Image src={BADGE_ICONS[badge]} alt={badge} width={24} height={24} />;
}

/*--------------------------------------------------------------*/
/* FILE: app/store/page.tsx (show icon)                         */
/*--------------------------------------------------------------*/
import BadgeIcon from "@/components/BadgeIcon";
...
{badge !== 'none' && <BadgeIcon badge={badge} />}
...

/*--------------------------------------------------------------*/
/* FILE: .env.example (append)                                  */
/*--------------------------------------------------------------*/
ADMIN_SECRET=someStrongBearerToken

/*--------------------------------------------------------------*/
/* FILE: README.md (append)                                     */
/*--------------------------------------------------------------*/
### Batch 7 Added
* Admin can now create buyer accounts at `/admin/users/create` (requires `Authorization: Bearer ADMIN_SECRET`).
* Simple SVG badge icons added (Bronze/Silver/Gold) and displayed next to discounted prices.
* Per‑book `discount_percent` (0‑75) editable in admin, combined with badge discount.

Migrate DB, add ENV `ADMIN_SECRET`, and enjoy full control!

// End Batch 7
