import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-auth";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
  const access=await getApiAdmin(); if(access.error)return access.error; const{id}=await params;

await access.admin.from("profiles").update({status:"banned",banned_at:new Date().toISOString(),ban_reason:"Banned by admin"}).eq("id",id);
const{error}=await access.admin.auth.admin.updateUserById(id,{ban_duration:"876000h"});

  return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({ok:true});
}
