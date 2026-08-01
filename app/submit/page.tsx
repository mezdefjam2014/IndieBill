import { requireUser } from "@/lib/auth";
import { DirectUploadForm } from "@/components/direct-upload-form";
export default async function Page(){await requireUser();return <main className="page"><DirectUploadForm mode="artist"/></main>;}
