import { AuthOptions } from "next-auth";
import { connectToDatabase } from "./mognoose";
import User from "@/database/user.model";

import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();

        const user = await User.findOne({
          email: credentials?.email,
        });

        return user;
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session }: any) {
      await connectToDatabase();

      const isExistingUser = await User.findOne({ email: session.user.email });

      // If user has been deleted, invalidate the session
      if (!isExistingUser) {
        // Check if this is a new user or a deleted user
        if (session.currentUser?._id) {
          // User was deleted, return null to invalidate session
          return null;
        }
        
        // This is a new user, create their account
        const newUser = await User.create({
          email: session.user.email,
          name: session.user.name,
          profileImage: session.user.image,
        });

        session.currentUser = newUser;
        // Set user.id to match MongoDB _id for proper identification
        session.user.id = String(newUser._id);
      } else {
        session.currentUser = isExistingUser;
        // Set user.id to match MongoDB _id for proper identification
        session.user.id = String(isExistingUser._id);
      }

      return session;
    },
  },
  session: { strategy: "jwt" },
  jwt: { secret: process.env.NEXTAUTH_JWT_SECRET! },
  secret: process.env.NEXTAUTH_SECRET!,
};
