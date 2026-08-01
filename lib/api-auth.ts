import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getApiUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Login required." }, { status: 401 }) } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status,submissions_disabled")
    .eq("id", user.id)
    .single();

  if (String(profile?.status) !== "active") {
    return { error: NextResponse.json({ error: "This account is not active." }, { status: 403 }) } as const;
  }

  return { error: null, user, profile, admin: createAdminClient() } as const;
}

export async function getApiAdmin() {
  const result = await getApiUser();
  if (result.error) return result;
  if (String(result.profile?.role) !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required." }, { status: 403 }) } as const;
  }
  return result;
}
