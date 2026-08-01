import { requireAdmin } from "@/lib/auth";
import { SubmissionReview } from "@/components/submission-review";
export default async function Page(){const{supabase}=await requireAdmin();const{data}=await supabase.from("track_submissions").select("*").eq("status","pending").order("submitted_at");return <main className="dashboard"><h1>Review submissions</h1><SubmissionReview items={data||[]}/></main>;}
