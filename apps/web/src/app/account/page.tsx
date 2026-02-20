import { getCurrentUserAction } from "@/shared/api/auth-actions";
import { redirect } from "next/navigation";
import AccountPageClient from "./components/AccountPageClient";
import ProtectedRoute from "@/components/ProtectedRoute";

/**
 * AccountPage - Server Component for the account dashboard.
 * Handles initial auth check and data fetching, then delegates to AccountPageClient.
 */
export default async function AccountPage() {
  const user = await getCurrentUserAction();

  if (!user) {
    redirect("/login?returnTo=/account");
  }

  return (
    <ProtectedRoute requireAuth>
      <AccountPageClient initialUser={user} />
    </ProtectedRoute>
  );
}
