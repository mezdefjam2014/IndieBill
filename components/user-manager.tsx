"use client";
export function UserManager({users}:{users:any[]}) {
  async function act(id:string,action:"ban"|"unban"|"delete") {
    if(action==="delete"&&!confirm("Permanently delete this user and files?"))return;
    const r=await fetch(`/api/admin/users/${id}/${action}`,{method:"POST"});
    const d=await r.json(); if(!r.ok)return alert(d.error||"Action failed."); location.reload();
  }
  return <section className="panel">{users.map(u=><div className="simple-row" key={u.id}><div><strong>{u.display_name}</strong><small>{u.email} · {u.role} · {u.status}</small></div><div className="row-actions"><button className="button secondary small" onClick={()=>act(u.id,u.status==="banned"?"unban":"ban")}>{u.status==="banned"?"Unban":"Ban"}</button><button className="danger small" onClick={()=>act(u.id,"delete")}>Delete</button></div></div>)}</section>;
}
