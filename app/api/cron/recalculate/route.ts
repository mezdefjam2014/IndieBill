import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function GET(request:Request) {
  if(request.headers.get("authorization")!==`Bearer ${process.env.APP_SIGNING_SECRET}`)return NextResponse.json({error:"Unauthorized"},{status:401});
  const{error}=await createAdminClient().rpc("recalculate_weekly_chart");
  return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json({ok:true});
}
