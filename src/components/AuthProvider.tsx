import { AuthContext } from "../contexts/AuthContext";
import { users } from "../data";
import { useState } from "react";
import { User } from "../types";
import { useToast } from "@/hooks/use-toast";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    const userRecord = users.find((x) => x.email === email);
    if (!userRecord || userRecord.password !== password) {
      throw new Error("Invalid credentials");
    }
    setUser({ id: userRecord.id, email });
    toast({ description: "Signed in successfully" });
  };

  const signUp = async (email: string, password: string) => {
    if (users.find((x) => x.email === email)) {
      throw new Error("User already exists");
    }

    const userId = Math.random().toString(36).substring(2);
    users.push({
      password,
      id: userId,
      name: email.split("@")[0],
      email: email,
    });
    toast({ description: "Account created successfully" });
  };

  const signOut = () => {
    setUser(null);
    toast({ description: "Signed out successfully" });
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
