import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getCurrentUserContext } from "@/lib/auth/session"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Development",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const { user } = await getCurrentUserContext()

        return {
          id: user.id,
          email: credentials?.email || user.email,
          name: user.name || "MoOn Owner",
        }
      },
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.email = token.email
        session.user.name = token.name
      }

      return session
    },
  },
}
