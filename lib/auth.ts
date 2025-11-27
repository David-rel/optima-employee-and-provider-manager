import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "./db";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = String(credentials.email).toLowerCase();
        const password = String(credentials.password);

        // Find user by email
        const result = await query<{
          id: number;
          name: string;
          email: string;
          hashed_password: string;
          email_verified: boolean;
          role: string;
          user_image_url: string | null;
        }>(
          "SELECT id, name, email, hashed_password, email_verified, role, user_image_url FROM users WHERE email = $1",
          [email]
        );

        const user = result.rows[0];

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.hashed_password);

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        // Update last_online and logged_in_status
        await query(
          "UPDATE users SET last_online = CURRENT_TIMESTAMP, logged_in_status = true WHERE id = $1",
          [user.id]
        );

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.email_verified,
          image: user.user_image_url || null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }: any) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.emailVerified = (user as any).emailVerified || false;
        token.image = (user as any).image || null;
      }
      // Refresh email verification status and image when session is updated
      if (trigger === "update" && token.id) {
        const result = await query<{
          email_verified: boolean;
          user_image_url: string | null;
        }>("SELECT email_verified, user_image_url FROM users WHERE id = $1", [
          parseInt(token.id),
        ]);
        if (result.rows[0]) {
          token.emailVerified = result.rows[0].email_verified;
          token.image = result.rows[0].user_image_url || null;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = (token.image as string | null) || null;

        // Always check database for latest email_verified status
        // This ensures session stays in sync with database changes
        try {
          const result = await query<{
            email_verified: boolean;
            user_image_url: string | null;
          }>("SELECT email_verified, user_image_url FROM users WHERE id = $1", [
            parseInt(token.id as string),
          ]);
          if (result.rows[0]) {
            session.user.emailVerified = result.rows[0].email_verified;
            session.user.image = result.rows[0].user_image_url || null;
            // Also update token for consistency
            token.emailVerified = result.rows[0].email_verified;
            token.image = result.rows[0].user_image_url || null;
          } else {
            session.user.emailVerified =
              (token.emailVerified as boolean) || false;
          }
        } catch (error) {
          console.error(
            "Error checking email_verified in session callback:",
            error
          );
          // Fallback to token value if database check fails
          session.user.emailVerified =
            (token.emailVerified as boolean) || false;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);
