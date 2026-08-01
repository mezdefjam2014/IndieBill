import { requireAdmin } from "@/lib/auth";
import { DirectUploadForm } from "@/components/direct-upload-form";
export default async function Page(){await requireAdmin();return <main className="page"><DirectUploadForm mode="admin"/></main>;}
