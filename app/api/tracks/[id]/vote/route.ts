import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
  const access=await getApiUser(); if(access.error)return access.error; const{id}=await params;
  const{error}=await access.admin.from("track_votes").insert({track_id:id,user_id:access.user.id});
  if(error?.code==="23505")return NextResponse.json({error:"You already voted this track this week."},{status:409});
  if(error)return NextResponse.json({error:error.message},{status:400});
  await access.admin.rpc("recalculate_weekly_chart");
  return NextResponse.json({ok:true});
}
