"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChannelsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/Report/contacts");
  }, [router]);
  return null;
}
