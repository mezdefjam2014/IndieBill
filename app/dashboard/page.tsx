import Link from "next/link";
import { requireUser } from "@/lib/auth";
export default async function Page() {
  const { user, supabase } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("display_name,role").eq("id", user.id).single();
  const { data: submissions } = await supabase.from("track_submissions").select("id,track_title,status,submitted_at").eq("artist_id", user.id).order("submitted_at",{ascending:false});
  return <main className="dashboard">
    <span className="eyebrow">YOUR ACCOUNT</span><h1>Hello, {profile?.display_name || "artist"}</h1>
    <div className="actions"><Link className="button" href="/submit">Submit track</Link>{String(profile?.role)==="admin"&&<Link className="button secondary" href="/admin">Back office</Link>}</div>
    <section className="panel"><h2>Your submissions</h2>{submissions?.length?submissions.map((s: { id: string; track_title: string; status: string })=><div className="simple-row" key={s.id}><strong>{s.track_title}</strong><span>{s.status}</span></div>):<p>No submissions yet.</p>}</section>
  </main>;
}
