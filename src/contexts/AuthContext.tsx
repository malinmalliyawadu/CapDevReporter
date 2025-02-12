import { createContext } from "react";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
