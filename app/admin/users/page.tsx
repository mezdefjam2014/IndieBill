import { requireAdmin } from "@/lib/auth";
import { UserManager } from "@/components/user-manager";
export default async function Page(){const{supabase}=await requireAdmin();const{data}=await supabase.from("profiles").select("id,email,display_name,role,status").order("created_at",{ascending:false});return <main className="dashboard"><h1>Manage users</h1><UserManager users={data||[]}/></main>;}
