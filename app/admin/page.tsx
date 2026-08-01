import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
export default async function Page() {
  const { supabase } = await requireAdmin();
  const [{count:pending},{count:tracks},{count:users}] = await Promise.all([
    supabase.from("track_submissions").select("*",{count:"exact",head:true}).eq("status","pending"),
    supabase.from("tracks").select("*",{count:"exact",head:true}),
    supabase.from("profiles").select("*",{count:"exact",head:true}),
  ]);
  return <main className="dashboard"><span className="eyebrow">BACK OFFICE · V2</span><h1>Admin control center</h1>
    <div className="stats"><div><b>{pending||0}</b><span>Pending</span></div><div><b>{tracks||0}</b><span>Tracks</span></div><div><b>{users||0}</b><span>Users</span></div></div>
    <div className="admin-links"><Link href="/admin/upload">Publish track</Link><Link href="/admin/submissions">Review submissions</Link><Link href="/admin/users">Manage users</Link></div>
  </main>;
}
