import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Check, Flame, BarChart3, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { Id } from "@/convex/_generated/dataModel";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Low: { bg: "bg-emerald-50", text: "text-emerald-700", label: "🌱 Low" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700", label: "⚡ Medium" },
  High: { bg: "bg-rose-50", text: "text-rose-700", label: "🔥 High" },
};

/* -------------------------------------------------------------------------- */
/*  HabitDetail                                                                */
/* -------------------------------------------------------------------------- */

export default function HabitDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const today = toLocalDateStr(new Date());

  // Get all tasks across a wide date range (last 90 days)
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return toLocalDateStr(d);
  }, []);

  const allTasks = useQuery(api.tasks.listByDateRange, { startDate, endDate: today });

  // Find all instances of this task text (same task appears on multiple days)
  const thisTask = useMemo(() => {
    if (!allTasks) return null;
    return allTasks.find((t) => t._id === taskId);
  }, [allTasks, taskId]);

  // Get all occurrences of the same task name across all days
  const taskHistory = useMemo(() => {
    if (!allTasks || !thisTask) return [];
    return allTasks
      .filter((t) => t.text === thisTask.text)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allTasks, thisTask]);

  // Compute stats
  const stats = useMemo(() => {
    if (taskHistory.length === 0) return { totalDays: 0, completedDays: 0, rate: 0, currentStreak: 0 };
    const completedDays = taskHistory.filter((t) => t.completed).length;
    const rate = Math.round((completedDays / taskHistory.length) * 100);

    // Current streak (consecutive completed days counting back from today)
    let streak = 0;
    const sorted = [...taskHistory].sort((a, b) => b.date.localeCompare(a.date));
    for (const t of sorted) {
      if (t.completed) streak++;
      else break;
    }

    return { totalDays: taskHistory.length, completedDays, rate, currentStreak: streak };
  }, [taskHistory]);

  // Bar chart data — last 30 entries
  const chartData = useMemo(() => {
    return taskHistory.slice(0, 30).reverse().map((t) => ({
      date: formatShortDate(t.date),
      completed: t.completed ? 1 : 0,
      label: t.completed ? "Done" : "Missed",
    }));
  }, [taskHistory]);

  if (!thisTask) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--background)" }}>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Task not found.</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-3 h-3 mr-1" /> Back to dashboard
        </Button>
      </div>
    );
  }

  const priorityStyle = PRIORITY_STYLES[thisTask.priority] ?? PRIORITY_STYLES.Medium;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-5 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-[11px] font-semibold h-7 px-2 gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </Button>
          <div className="w-px h-4" style={{ background: "var(--border)" }} />
          <div>
            <h1 className="font-extrabold text-[14px] leading-none tracking-tight truncate max-w-[200px] md:max-w-[400px]" style={{ color: "var(--foreground)" }}>{thisTask.text}</h1>
            <p className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>{thisTask.priority} priority</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }} className="text-[11px] font-semibold h-7 px-2 gap-1">
          <span className="sr-only">Sign out</span>
        </Button>
      </header>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-auto p-5 gap-5">

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-4 gap-3"
        >
          <div className="rounded-xl p-3 border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md" style={{ background: "var(--primary)" }}>
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "var(--muted-foreground)" }}>Completion</p>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>{stats.rate}%</p>
          </div>

          <div className="rounded-xl p-3 border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md" style={{ background: "oklch(0.95 0.03 155)" }}>
                <BarChart3 className="w-3.5 h-3.5" style={{ color: "oklch(0.45 0.12 155)" }} />
              </div>
              <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "var(--muted-foreground)" }}>Days tracked</p>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>{stats.totalDays}</p>
          </div>

          <div className="rounded-xl p-3 border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md" style={{ background: "oklch(0.95 0.03 60)" }}>
                <Flame className="w-3.5 h-3.5" style={{ color: "oklch(0.60 0.14 60)" }} />
              </div>
              <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "var(--muted-foreground)" }}>Current streak</p>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>{stats.currentStreak}<span className="text-sm font-bold ml-0.5" style={{ color: "var(--muted-foreground)" }}>d</span></p>
          </div>

          <div className="rounded-xl p-3 border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md" style={{ background: "oklch(0.94 0.02 265)" }}>
                <Calendar className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
              </div>
              <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "var(--muted-foreground)" }}>Priority</p>
            </div>
            <p className="text-lg font-extrabold" style={{ color: "var(--foreground)" }}>{priorityStyle.label}</p>
          </div>
        </motion.div>

        {/* Completion chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <h2 className="text-[13px] font-bold mb-1" style={{ color: "var(--foreground)" }}>Completion history</h2>
          <p className="text-[10px] font-medium mb-4" style={{ color: "var(--muted-foreground)" }}>Last 30 tracked days</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(0, Math.floor(chartData.length / 6))}
                />
                <YAxis
                  domain={[0, 1]}
                  ticks={[0, 1]}
                  tickFormatter={(v) => v === 1 ? "✓" : ""}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    color: "var(--foreground)",
                  }}
                  formatter={(_value: number, _name: string, props: { payload?: { label?: string } }) => [props.payload?.label ?? "", "Status"]}
                />
                <Bar dataKey="completed" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.completed ? "var(--chart-1)" : "oklch(0.92 0.01 20)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Day-by-day log */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-xl border"
          style={{ borderColor: "var(--border)", background: "var(--card)" }}
        >
          <div className="p-4 pb-2">
            <h2 className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>Day-by-day log</h2>
            <p className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Every recorded occurrence</p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {taskHistory.length === 0 && (
              <p className="text-[11px] font-medium p-4" style={{ color: "var(--muted-foreground)" }}>No history yet.</p>
            )}
            {taskHistory.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between px-4 py-2 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: entry.completed ? "var(--primary)" : "oklch(0.92 0.01 20)",
                      color: entry.completed ? "white" : "var(--muted-foreground)",
                    }}
                  >
                    {entry.completed ? "✓" : "—"}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                    {new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <span className="text-[10px] font-semibold" style={{ color: entry.completed ? "oklch(0.45 0.12 155)" : "var(--muted-foreground)" }}>
                  {entry.completed ? "Completed" : "Missed"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
