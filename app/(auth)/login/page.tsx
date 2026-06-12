"use client";

import { useState } from "react";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { loginWithEmail } from "@/lib/firebase/auth";
import Cookies from "js-cookie";
import { toast } from "sonner";

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Siti Rahma",
    handle: "@rahma_admin",
    text: "Sistem rekap tagihan dan invoice ini sangat mempermudah administrasi operasional kami setiap minggunya."
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Marcus Siregar",
    handle: "@marcus_ops",
    text: "Surat jalan terbaca cepat oleh OCR dan langsung masuk ke database tanpa ketik manual."
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/84.jpg",
    name: "David Wijaya",
    handle: "@david_finance",
    text: "Format invoice PDF rapi dan perhitungannya sangat jelas. Memudahkan verifikasi tagihan."
  },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const rememberMe = formData.get("rememberMe") === "on";

    if (!email || !password) return;

    setLoading(true);
    try {
      const cred = await loginWithEmail(email, password, rememberMe);
      const token = await cred.user.getIdToken();
      
      // Save auth cookie globally at root path
      Cookies.set("firebase-auth-token", token, {
        expires: rememberMe ? 30 : undefined,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
      
      toast.success("Login berhasil!");
      window.location.href = "/";
    } catch (err: any) {
      console.error(err);
      const msg =
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
          ? "Email atau password salah."
          : err.code === "auth/too-many-requests"
          ? "Terlalu banyak percobaan. Coba lagi nanti."
          : "Login gagal. Coba lagi.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white">
      <SignInPage
        title="Masuk ke Dashboard"
        description="Masukan email dan password admin BJA untuk mengakses data operasional."
        heroImageSrc="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=80" // Logistics truck image
        testimonials={sampleTestimonials}
        onSignIn={handleSignIn}
        loading={loading}
      />
    </div>
  );
}
