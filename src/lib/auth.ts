import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";

export const getServerAuthSession = () => getServerSession(authOptions);