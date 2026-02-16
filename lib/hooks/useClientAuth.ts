"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export function useClientAuth() {
  const [client, setClient] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchClient();
  }, []);

  const fetchClient = async () => {
    try {
      const res = await fetch("/api/client-auth/user");
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
      } else {
        setClient(null);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      setClient(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const res = await fetch("/api/client-auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      await fetchClient();
      return { success: true };
    } else {
      const data = await res.json();
      return { success: false, error: data.error };
    }
  };

  const signUp = async (name: string, email: string, phone: string, password: string) => {
    const res = await fetch("/api/client-auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });

    if (res.ok) {
      await fetchClient();
      return { success: true };
    } else {
      const data = await res.json();
      return { success: false, error: data.error };
    }
  };

  const signOut = async () => {
    await fetch("/api/client-auth/signout", { method: "POST" });
    setClient(null);
    router.push("/client/signin");
  };

  return {
    client,
    loading,
    signIn,
    signUp,
    signOut,
  };
}

