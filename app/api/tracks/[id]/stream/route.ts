import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
  const{id}=await params; const admin=createAdminClient();
  const{data:t}=await admin.from("tracks").select("mp3_path,status").eq("id",id).single();
  if(!t||String(t.status)!=="published")return NextResponse.json({error:"Track unavailable."},{status:404});
  const{data,error}=await admin.storage.from("approved-track-audio").createSignedUrl(t.mp3_path,900);
  return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json({signedUrl:data.signedUrl});
}
