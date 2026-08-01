import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { listenerHash } from "@/lib/security";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const{id}=await params; const body=await request.json().catch(()=>({}));
  const seconds=Math.max(0,Math.min(36000,Number(body.listenedSeconds)||0));
  const completion=Math.max(0,Math.min(100,Number(body.completionPercent)||0));
  if(seconds<30)return NextResponse.json({ok:true,qualified:false});

  const headerStore=await headers();
  const ip=headerStore.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
  const ua=headerStore.get("user-agent")||"unknown";
  const hash=listenerHash(ip,ua);
  const admin=createAdminClient();
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();

  const{data:settings}=await admin.from("chart_settings").select("repeat_play_minutes").eq("id",true).single();
  const cooldown=Number(settings?.repeat_play_minutes||60);
  const since=new Date(Date.now()-cooldown*60_000).toISOString();
  const{count}=await admin.from("track_plays").select("*",{count:"exact",head:true}).eq("track_id",id).eq("listener_hash",hash).gte("created_at",since);
  if((count||0)>0)return NextResponse.json({ok:true,qualified:false,reason:"cooldown"});

  const{error}=await admin.from("track_plays").insert({
    track_id:id,user_id:user?.id||null,listener_hash:hash,listened_seconds:seconds,
    completion_percent:completion,qualified:true,invalidated:false,
  });
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true,qualified:true});
}
