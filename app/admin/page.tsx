import { getProfile } from "@/lib/profile";
import { redirect } from "next/navigation";

export default async function Admin() {
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  return <div>Admin Panel</div>;
}