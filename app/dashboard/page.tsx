import { getProfile } from "@/lib/profile";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  return <div>Student Dashboard</div>;
}