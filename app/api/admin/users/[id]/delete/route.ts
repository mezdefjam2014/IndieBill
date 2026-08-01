import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-auth";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}) {
  const access=await getApiAdmin(); if(access.error)return access.error; const{id}=await params;
  if(id===access.user.id)return NextResponse.json({error:"You cannot delete your own logged-in admin account."},{status:400});
  for(const bucket of ["artist-images","track-artwork","pending-track-artwork","pending-track-audio","approved-track-audio","verification-documents"]) {
    const{data}=await access.admin.storage.from(bucket).list(id,{limit:1000});
    if(data?.length)await access.admin.storage.from(bucket).remove(data.map((f: { name: string })=>`${id}/${f.name}`));
  }
  const{error}=await access.admin.auth.admin.deleteUser(id);
  return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({ok:true});
}
