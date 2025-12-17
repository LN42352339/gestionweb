import { useContext } from "react";
import { AuthContext } from "../../presentation/context/AuthContext";

export function useAuth() {
  return useContext(AuthContext);
}
