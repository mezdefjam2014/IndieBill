import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-auth";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
  const access=await getApiAdmin(); if(access.error)return access.error;
  const{id}=await params; const{admin,user}=access;
  const{data:s}=await admin.from("track_submissions").select("mp3_path,artwork_path").eq("id",id).single();
  if(!s)return NextResponse.json({error:"Submission not found."},{status:404});
  await Promise.all([admin.storage.from("pending-track-audio").remove([s.mp3_path]),admin.storage.from("pending-track-artwork").remove([s.artwork_path])]);
  await admin.from("track_submissions").delete().eq("id",id);
  await admin.from("audit_logs").insert({admin_id:user.id,action:"deny_submission",submission_id:id,reason:"Denied and deleted"});
  return NextResponse.json({ok:true});
}
