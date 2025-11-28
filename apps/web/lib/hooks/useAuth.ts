import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = session?.user;
  const accessToken = session?.accessToken;

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false });
    router.push("/login");
  };

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    signOut,
  };
}
