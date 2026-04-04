import { redirect } from "next/navigation";

export default function OldCasualNewPage() {
  redirect("/app/casual-posts/new");
}
