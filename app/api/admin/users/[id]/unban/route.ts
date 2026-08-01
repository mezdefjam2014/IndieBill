import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-auth";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
  const access=await getApiAdmin(); if(access.error)return access.error; const{id}=await params;

await access.admin.from("profiles").update({status:"active",banned_at:null,ban_reason:null}).eq("id",id);
const{error}=await access.admin.auth.admin.updateUserById(id,{ban_duration:"none"});

  return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({ok:true});
}
