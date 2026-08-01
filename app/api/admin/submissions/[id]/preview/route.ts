import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-auth";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
  const access=await getApiAdmin(); if(access.error)return access.error;
  const{id}=await params;
  const{data:item}=await access.admin.from("track_submissions").select("mp3_path,artwork_path").eq("id",id).single();
  if(!item)return NextResponse.json({error:"Submission not found."},{status:404});
  const[a,b]=await Promise.all([
    access.admin.storage.from("pending-track-audio").createSignedUrl(item.mp3_path,900),
    access.admin.storage.from("pending-track-artwork").createSignedUrl(item.artwork_path,900),
  ]);
  if(a.error||b.error)return NextResponse.json({error:a.error?.message||b.error?.message},{status:500});
  return NextResponse.json({audio:a.data.signedUrl,artwork:b.data.signedUrl});
}
