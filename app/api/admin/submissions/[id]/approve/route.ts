import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-auth";
import { slug } from "@/lib/upload-session";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
  const access=await getApiAdmin(); if(access.error)return access.error;
  const{id}=await params; const{admin,user}=access;
  const{data:s}=await admin.from("track_submissions").select("*").eq("id",id).single();
  if(!s)return NextResponse.json({error:"Submission not found."},{status:404});
  const[audio,art]=await Promise.all([
    admin.storage.from("pending-track-audio").download(s.mp3_path),
    admin.storage.from("pending-track-artwork").download(s.artwork_path),
  ]);
  if(audio.error||art.error)return NextResponse.json({error:"Could not read submitted files."},{status:500});
  const token=randomUUID(); const ext=s.artwork_path.split(".").pop()||"jpg";
  const audioPath=`${s.artist_id}/${token}.mp3`; const artworkPath=`${s.artist_id}/${token}.${ext}`;
  const[ua,ui]=await Promise.all([
    admin.storage.from("approved-track-audio").upload(audioPath,audio.data,{contentType:"audio/mpeg"}),
    admin.storage.from("track-artwork").upload(artworkPath,art.data),
  ]);
  if(ua.error||ui.error)return NextResponse.json({error:ua.error?.message||ui.error?.message},{status:500});
  const{data:track,error}=await admin.from("tracks").insert({
    submission_id:s.id,artist_id:s.artist_id,genre_id:s.genre_id,title:s.track_title,
    slug:`${slug(s.track_title)||"track"}-${token.slice(0,8)}`,
    artwork_path:artworkPath,
    mp3_path:audioPath,

    // Compatibility with the original tracks schema.
    cover_path:artworkPath,
    audio_path:audioPath,

    status:"published",chart_eligible:true,published_at:new Date().toISOString(),
  }).select("id").single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  await admin.from("track_submissions").update({status:"approved",reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq("id",id);
  await Promise.all([admin.storage.from("pending-track-audio").remove([s.mp3_path]),admin.storage.from("pending-track-artwork").remove([s.artwork_path])]);
  await admin.from("audit_logs").insert({admin_id:user.id,action:"approve_submission",submission_id:id,track_id:track.id});
  await admin.rpc("recalculate_weekly_chart");
  return NextResponse.json({ok:true});
}
