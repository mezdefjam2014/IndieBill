import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <header className="header">
      <Link className="logo" href="/">
        INDIE BILLBOARD
        <span>DISCOVER · PLAY · VOTE</span>
      </Link>
      <nav>
        <Link href="/">Chart</Link>
        <Link href="/artists">Artists</Link>
        <Link href="/submit">Submit</Link>
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <form action="/auth/signout" method="post">
              <button className="nav-button">Logout</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link className="button small" href="/signup">Join</Link>
          </>
        )}
      </nav>
    </header>
  );
}
