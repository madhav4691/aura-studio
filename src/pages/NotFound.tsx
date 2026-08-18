import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-3" style={{ color: "var(--foreground)" }}>404</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>This page doesn&apos;t exist.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-1.5">
          <ArrowLeft className="w-3 h-3" /> Go home
        </Button>
      </div>
    </motion.div>
  );
}
