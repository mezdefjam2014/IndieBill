import { loadChart } from "@/lib/chart";
import { ChartList } from "@/components/chart-list";

export const revalidate = 30;

export default async function Home() {
  const tracks = await loadChart();
  return (
    <main>
      <section className="hero">
        <div className="cover"><span>IB</span><b>HOT 100</b></div>
        <div>
          <span className="eyebrow">THE INDEPENDENT MUSIC CHART</span>
          <h1>INDIE BILLBOARD HOT 100</h1>
          <p>Independent songs ranked by qualified listening, genuine likes, and weekly votes.</p>
          <div className="meta">Updated automatically · MP3 submissions · Artist verified</div>
        </div>
      </section>
      <section className="layout">
        <div>
          <div className="toolbar"><h2>Weekly chart</h2><span className="tag">HOT 100</span></div>
          {tracks.length ? <ChartList tracks={tracks} /> : (
            <div className="empty"><h3>The chart is ready.</h3><p>Publish the first track in the back office to begin.</p></div>
          )}
        </div>
        <aside className="info">
          <h3>How the chart works</h3>
          <p><b>Listen</b><br/>A play qualifies after 30 seconds.</p>
          <p><b>Like</b><br/>One like per account and track.</p>
          <p><b>Vote</b><br/>One vote per track each week.</p>
          <p><b>Rise</b><br/>Rankings recalculate after activity.</p>
        </aside>
      </section>
    </main>
  );
}
