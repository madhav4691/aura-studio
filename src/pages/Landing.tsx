import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Target,
  Flame,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  TrendingUp,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* ── NAV ───────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 md:px-10 h-14 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: "var(--secondary)" }}>
            <Target className="w-4 h-4" style={{ color: "var(--ring)" }} />
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ color: "var(--foreground)" }}>AURA</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-[11px] font-semibold h-8">
            Sign in
          </Button>
          <Button size="sm" onClick={() => navigate("/auth")} className="text-[11px] font-semibold h-8 gap-1">
            Get started <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-16 pb-20">
        <motion.div
          initial="hidden"
          animate="visible"
          className="max-w-2xl mx-auto"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-widest mb-6"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "var(--secondary)" }}
          >
            <Sparkles className="w-3 h-3" /> Studio Edition
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-5"
            style={{ color: "var(--foreground)" }}
          >
            Build habits that
            <br />
            <span style={{ color: "var(--ring)" }}>compound over time.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-base md:text-lg max-w-lg mx-auto leading-relaxed mb-8"
            style={{ color: "var(--muted-foreground)" }}
          >
            AURA is a calm, focused habit tracker that helps you stay consistent.
            Track daily tasks, visualize your progress, and let your streaks
            do the talking.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-3">
            <Button size="default" onClick={() => navigate("/auth")} className="text-sm font-semibold h-10 px-6 gap-1.5">
              Start tracking <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="default" onClick={() => navigate("/auth")} className="text-sm font-semibold h-10 px-6">
              Learn more
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 border-t" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3" style={{ color: "var(--foreground)" }}>
              Everything you need to stay consistent
            </h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: "var(--muted-foreground)" }}>
              A focused toolkit built around clarity, not clutter.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: CheckCircle2,
                title: "Daily task tracking",
                desc: "Add tasks with priorities, check them off, and see your completion rate update in real-time.",
              },
              {
                icon: BarChart3,
                title: "Visual progress",
                desc: "A doughnut chart for today and a line chart for the month — always current, always clear.",
              },
              {
                icon: Flame,
                title: "Streak counting",
                desc: "AURA tracks consecutive high-completion days so you can watch your momentum grow.",
              },
              {
                icon: Calendar,
                title: "Any-date navigation",
                desc: "Review past days or plan ahead. Every day is stored and retrievable.",
              },
              {
                icon: TrendingUp,
                title: "Monthly insights",
                desc: "See your daily completion trends across the entire month at a glance.",
              },
              {
                icon: Sparkles,
                title: "Smart insights",
                desc: "AURA surfaces contextual tips based on your completion average and patterns.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="p-5 rounded-xl border transition hover:shadow-sm"
                style={{ borderColor: "var(--border)", background: "var(--background)" }}
              >
                <div className="p-2 rounded-lg w-fit mb-3" style={{ background: "var(--secondary)" }}>
                  <feature.icon className="w-4 h-4" style={{ color: "var(--ring)" }} />
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ color: "var(--foreground)" }}>{feature.title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ──────────────────────────────────────────────── */}
      <section className="py-16 px-6 md:px-10" style={{ background: "var(--background)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-2xl md:text-3xl font-extrabold tracking-tight leading-snug mb-4" style={{ color: "var(--foreground)" }}>
              &ldquo;The simplest habit tracker I&apos;ve ever used.
              <br className="hidden md:block" />
              No bloat, just results.&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                A
              </div>
              <div className="text-left">
                <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>AURA Beta User</p>
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Early adopter</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 border-t" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4" style={{ color: "var(--foreground)" }}>
            Ready to build your streak?
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
            Free to use. No credit card. Start in seconds.
          </p>
          <Button size="default" onClick={() => navigate("/auth")} className="text-sm font-semibold h-11 px-8 gap-1.5">
            Create your first habit <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="flex items-center justify-between px-6 md:px-10 h-12 border-t shrink-0 text-[10px]" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
        <span className="font-semibold tracking-wide">AURA &copy; {new Date().getFullYear()}</span>
        <span className="font-medium">Built with care</span>
      </footer>
    </div>
  );
}
