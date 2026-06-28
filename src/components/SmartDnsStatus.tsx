"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldOff } from "lucide-react";
import Link from "next/link";

export default function SmartDnsStatus() {
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const dns = localStorage.getItem("streamtv_smart_dns");
    setConfigured(!!dns);
  }, []);

  return (
    <Link
      href="/settings"
      className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
        configured
          ? "text-green-400 hover:bg-green-400/10"
          : "text-muted-foreground hover:text-white hover:bg-white/5"
      }`}
      title={configured ? "Smart DNS configured" : "Smart DNS not configured"}
    >
      {configured ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
      <span className="hidden sm:inline">{configured ? "DNS Active" : "No DNS"}</span>
    </Link>
  );
}
