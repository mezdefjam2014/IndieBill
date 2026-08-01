"use client";
import { useState } from "react";

export function SubmissionReview({ items }: { items: any[] }) {
  const [urls, setUrls] = useState<Record<string, {audio:string;artwork:string}>>({});
  const [message, setMessage] = useState("");

  async function preview(id: string) {
    const response = await fetch(`/api/admin/submissions/${id}/preview`, { method: "POST" });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error || "Preview failed.");
    setUrls((old: Record<string, { audio: string; artwork: string }>) => ({ ...old, [id]: result }));
  }

  async function act(id: string, action: "approve"|"deny") {
    if (action === "deny" && !confirm("Deny and permanently delete this submission?")) return;
    setMessage(`${action === "approve" ? "Approving" : "Deleting"}…`);
    const response = await fetch(`/api/admin/submissions/${id}/${action}`, { method: "POST" });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error || "Action failed.");
    location.reload();
  }

  return <div>
    {message && <p className="message">{message}</p>}
    {items.map(item => <article className="review" key={item.id}>
      <div className="review-main">
        {urls[item.id]?.artwork && <img src={urls[item.id].artwork} alt="" />}
        <div><span className="eyebrow">PENDING REVIEW</span><h2>{item.track_title}</h2><p>{item.artist_name} · {item.contact_email}</p>
        {urls[item.id]?.audio ? <audio controls src={urls[item.id].audio}/> : <button className="button secondary" onClick={()=>preview(item.id)}>Load preview</button>}</div>
      </div>
      <div className="review-actions"><button className="button" onClick={()=>act(item.id,"approve")}>Approve</button><button className="danger" onClick={()=>act(item.id,"deny")}>Deny & delete</button></div>
    </article>)}
  </div>;
}
