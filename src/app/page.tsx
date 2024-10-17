"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebaseConfig.js";
import { useUserInfoStore } from "@/store/userStore.ts";
import { ref, get } from "firebase/database";
import { useRouter } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { userInfo, setUserInfo } = useUserInfoStore();
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted");

    try {
      const result = await signInWithEmailAndPassword(email, password);
      console.log("Authentication result:", result);

      const userId = result?.user.uid;
      console.log("User ID:", userId);

      if (userId) {
        const userRef = ref(db, `users/${userId}`);
        console.log("User reference:", userRef);

        const userSnapshot = await get(userRef);
        console.log("User snapshot:", userSnapshot);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          setUserInfo({ id: userId, ...userData });

          if (userData.faculty) {
            router.push("/faculty");
          } else {
            router.push("/student");
          }
        } else {
          console.log("No user data available");
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleLogin}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button className="w-full" type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </Button>
      {error && <p className="text-red-500">{error.message}</p>}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Educational Login System
          </CardTitle>
          <CardDescription className="text-center">
            Login to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            className="text-sm text-blue-600 hover:underline"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
