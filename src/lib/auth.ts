import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"

const authUserSession = async () => {
    const session = await getServerSession(authOptions);
    return session
}

export default authUserSession;