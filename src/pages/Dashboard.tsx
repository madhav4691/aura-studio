import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { LogOut, Calendar, Target, Flame, Gauge, Sparkles, ClipboardList, Plus, Trash2, Check, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Low: { bg: "bg-emerald-50", text: "text-emerald-700", label: "🌱 Low" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700", label: "⚡ Medium" },
  High: { bg: "bg-rose-50", text: "text-rose-700", label: "🔥 High" },
};

/* -------------------------------------------------------------------------- */
/*  Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export default function Dashboard() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const today = toLocalDateStr(new Date());
  const [activeDate, setActiveDate] = useState(today);
  const [taskInput, setTaskInput] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");

  // Convex mutations
  const addTask = useMutation(api.tasks.addTask);
  const toggleTask = useMutation(api.tasks.toggleTask);
  const removeTask = useMutation(api.tasks.removeTask);
  const clearAll = useMutation(api.tasks.clearAll);

  // Convex queries
  const dayTasks = useQuery(api.tasks.listByDate, { date: activeDate });

  // Monthly tasks for the chart
  const monthStart = useMemo(() => {
    const d = new Date(activeDate + "T00:00:00");
    return toLocalDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [activeDate]);
  const monthEnd = useMemo(() => {
    const d = new Date(activeDate + "T00:00:00");
    return toLocalDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  }, [activeDate]);
  const monthTasks = useQuery(api.tasks.listByDateRange, { startDate: monthStart, endDate: monthEnd });

  // Group month tasks by date
  const tasksByDate = useMemo(() => {
    if (!monthTasks) return {} as Record<string, (typeof monthTasks extends Array<infer T> ? T : never)[]>;
    type TaskDoc = (typeof monthTasks)[number];
    const map: Record<string, TaskDoc[]> = {};
    for (const t of monthTasks) {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    }
    return map;
  }, [monthTasks]);

  // Daily stats
  const completedCount = useMemo(
    () => (dayTasks ?? []).filter((t) => t.completed).length,
    [dayTasks]
  );
  const totalCount = dayTasks?.length ?? 0;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Pie chart data
  const pieData = useMemo(() => {
    if (totalCount === 0) return [{ name: "empty", value: 1 }];
    return [
      { name: "Completed", value: completedCount },
      { name: "Pending", value: totalCount - completedCount },
    ];
  }, [completedCount, totalCount]);

  // Monthly chart data
  const monthlyChartData = useMemo(() => {
    const d = new Date(activeDate + "T00:00:00");
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const data: { day: number; rate: number | null }[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const ds = toLocalDateStr(new Date(d.getFullYear(), d.getMonth(), i));
      const dayTasksArr = tasksByDate[ds] ?? [];
      if (dayTasksArr.length > 0) {
        const done = dayTasksArr.filter((t) => t.completed).length;
        data.push({ day: i, rate: Math.round((done / dayTasksArr.length) * 100) });
      } else {
        data.push({ day: i, rate: null });
      }
    }
    return data;
  }, [activeDate, tasksByDate]);

  // Stats: streak, monthly average, insight
  const { streak, monthlyAvg, insight } = useMemo(() => {
    const activeDays = Object.keys(tasksByDate).length;
    let sum = 0;
    for (const tasks of Object.values(tasksByDate)) {
      const done = tasks.filter((t) => t.completed).length;
      sum += tasks.length > 0 ? (done / tasks.length) * 100 : 0;
    }
    const avg = activeDays === 0 ? 0 : Math.round(sum / activeDays);

    let streakCount = 0;
    const checkDate = new Date();
    while (true) {
      const checkStr = toLocalDateStr(checkDate);
      const tasks = tasksByDate[checkStr];
      if (tasks && tasks.length > 0) {
        const rate = (tasks.filter((t) => t.completed).length / tasks.length) * 100;
        if (rate >= 50) {
          streakCount++;
        } else {
          break;
        }
      } else {
        if (checkStr !== today) break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
      if (streakCount > 365) break;
    }

    let insightText = "Add your first task to begin tracking.";
    if (activeDays > 0 && avg > 75) {
      insightText = `Excellent consistency — your average is ${avg}%. Keep it up.`;
    } else if (activeDays > 0 && avg > 40) {
      insightText = "Good progress. Try tackling high-priority tasks earlier in the day.";
    } else if (activeDays > 0) {
      insightText = "Let's build momentum — complete at least one task today.";
    }

    return { streak: streakCount, monthlyAvg: avg, insight: insightText };
  }, [tasksByDate, today]);

  // Handlers
  const handleAdd = useCallback(async () => {
    const text = taskInput.trim();
    if (!text) return;
    await addTask({ date: activeDate, text, priority });
    setTaskInput("");
  }, [taskInput, activeDate, priority, addTask]);

  const handleToggle = useCallback(
    async (e: React.MouseEvent, taskId: Id<"tasks">) => {
      e.stopPropagation();
      await toggleTask({ taskId });
    },
    [toggleTask]
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent, taskId: Id<"tasks">) => {
      e.stopPropagation();
      await removeTask({ taskId });
    },
    [removeTask]
  );

  const handleClearAll = useCallback(async () => {
    if (window.confirm("This will delete all your data. Continue?")) {
      await clearAll();
    }
  }, [clearAll]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  const goToToday = useCallback(() => setActiveDate(today), [today]);

  useEffect(() => {
    setActiveDate(toLocalDateStr(new Date()));
  }, []);

  const displayDateText =
    activeDate === today
      ? `Today — ${formatDisplayDate(activeDate)}`
      : formatDisplayDate(activeDate);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-5 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: "var(--primary)" }}>
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-[14px] leading-none tracking-tight" style={{ color: "var(--foreground)" }}>Mad Productive</h1>
            <p className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
            <Calendar className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="date"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="bg-transparent text-[11px] font-semibold cursor-pointer outline-none"
              style={{ color: "var(--foreground)" }}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-[11px] font-semibold h-7 px-2.5"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-[11px] font-semibold h-7 px-2 gap-1"
          >
            <LogOut className="w-3 h-3" />
          </Button>
        </div>
      </header>

      {/* ── MAIN BODY ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* ── TOP HALF ──────────────────────────────────────────────── */}
        <div className="h-1/2 flex border-b overflow-hidden" style={{ borderColor: "var(--border)" }}>

          {/* TODO PANEL */}
          <section className="w-2/3 p-4 flex flex-col border-r overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-2.5 shrink-0">
              <div>
                <h2 className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>{displayDateText}</h2>
                <p className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Your daily action items</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>
                {completedCount}/{totalCount}
              </span>
            </div>

            {/* Input row */}
            <div className="flex gap-2 p-1 rounded-lg border mb-2.5 shrink-0" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
              <input
                type="text"
                placeholder="Add a new task..."
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="flex-1 bg-transparent px-2 text-sm placeholder-muted-foreground outline-none"
                style={{ color: "var(--foreground)" }}
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "Low" | "Medium" | "High")}
                className="bg-white border rounded-md text-[10px] font-semibold px-2 py-1 outline-none"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                <option value="Low">🌱 Low</option>
                <option value="Medium">⚡ Medium</option>
                <option value="High">🔥 High</option>
              </select>
              <Button
                size="sm"
                onClick={handleAdd}
                className="text-[11px] font-semibold h-7 px-3 gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto pr-1">
              {totalCount === 0 && (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-xl" style={{ borderColor: "var(--border)" }}>
                  <ClipboardList className="w-6 h-6 mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
                  <p className="text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>No tasks yet — add one above to get started.</p>
                </div>
              )}
              <ul className="space-y-1.5">
                <AnimatePresence>
                  {(dayTasks ?? []).map((task) => (
                    <motion.li
                      key={task._id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18 }}
                      className="group flex items-center justify-between p-2 rounded-lg border transition cursor-pointer hover:shadow-sm"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--card)",
                        opacity: task.completed ? 0.55 : 1,
                      }}
                      onClick={() => navigate(`/dashboard/${task._id}`)}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          onClick={(e) => handleToggle(e, task._id)}
                          className="w-5 h-5 shrink-0 flex items-center justify-center rounded-md border-2 transition"
                          style={{
                            borderColor: task.completed ? "var(--primary)" : "var(--border)",
                            background: task.completed ? "var(--primary)" : "transparent",
                            color: task.completed ? "white" : "transparent",
                          }}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <span
                          className="text-sm font-medium truncate"
                          style={{
                            color: task.completed ? "var(--muted-foreground)" : "var(--foreground)",
                            textDecoration: task.completed ? "line-through" : "none",
                          }}
                        >
                          {task.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority].bg} ${PRIORITY_STYLES[task.priority].text}`}>
                          {PRIORITY_STYLES[task.priority].label}
                        </span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition" style={{ color: "var(--muted-foreground)" }} />
                        <button
                          onClick={(e) => handleDelete(e, task._id)}
                          className="transition hover:opacity-70"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </section>

          {/* PIE CHART PANEL */}
          <section className="w-1/3 p-4 flex flex-col items-center justify-center">
            <h2 className="text-[13px] font-bold mb-0.5" style={{ color: "var(--foreground)" }}>Today&apos;s progress</h2>
            <p className="text-[10px] font-medium mb-3" style={{ color: "var(--muted-foreground)" }}>Live completion rate</p>

            <div className="relative w-36 h-36 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="75%"
                    outerRadius="100%"
                    dataKey="value"
                    strokeWidth={0}
                    isAnimationActive={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={
                          index === 0
                            ? "var(--chart-1)"
                            : totalCount === 0
                              ? "var(--border)"
                              : "var(--secondary)"
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center pointer-events-none">
                <span className="text-xl font-extrabold" style={{ color: "var(--foreground)" }}>{percent}%</span>
                <span className="text-[8px] uppercase tracking-widest font-bold" style={{ color: "var(--muted-foreground)" }}>Done</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 mt-4 text-center">
              <div className="p-2 rounded-lg" style={{ background: "oklch(0.95 0.03 155)" }}>
                <div className="font-bold text-sm" style={{ color: "oklch(0.45 0.12 155)" }}>{completedCount}</div>
                <div className="text-[8px] uppercase tracking-widest font-bold" style={{ color: "oklch(0.55 0.10 155)" }}>Completed</div>
              </div>
              <div className="p-2 rounded-lg" style={{ background: "oklch(0.95 0.02 20)" }}>
                <div className="font-bold text-sm" style={{ color: "oklch(0.55 0.15 20)" }}>{totalCount - completedCount}</div>
                <div className="text-[8px] uppercase tracking-widest font-bold" style={{ color: "oklch(0.60 0.12 20)" }}>Pending</div>
              </div>
            </div>
          </section>
        </div>

        {/* ── BOTTOM HALF ──────────────────────────────────────────── */}
        <div className="h-1/2 flex overflow-hidden">

          {/* MONTHLY GRAPH */}
          <section className="w-2/3 p-4 flex flex-col border-r" style={{ borderColor: "var(--border)" }}>
            <div className="flex justify-between items-start mb-2 shrink-0">
              <div>
                <h2 className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>Monthly progress</h2>
                <p className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Daily completion trend this month</p>
              </div>
            </div>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    tickCount={6}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                    }}
                    formatter={(value: number) => [`${value}%`, "Completion"]}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 1.5 }}
                    activeDot={{ r: 4 }}
                    connectNulls
                    fill="url(#areaGrad)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* STATS PANEL */}
          <section className="w-1/3 p-4 flex flex-col gap-2.5">
            <h2 className="text-[13px] font-bold mb-0.5" style={{ color: "var(--foreground)" }}>Overview</h2>

            {/* Streak */}
            <div className="rounded-lg p-2.5 flex items-center justify-between border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md" style={{ background: "oklch(0.95 0.03 60)" }}>
                  <Flame className="w-3.5 h-3.5" style={{ color: "oklch(0.60 0.14 60)" }} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "var(--muted-foreground)" }}>Streak</p>
                  <h4 className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>{streak} Day{streak === 1 ? "" : "s"}</h4>
                </div>
              </div>
            </div>

            {/* Month Average */}
            <div className="rounded-lg p-2.5 flex items-center justify-between border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md" style={{ background: "oklch(0.94 0.02 265)" }}>
                  <Gauge className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "var(--muted-foreground)" }}>Month avg</p>
                  <h4 className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>{monthlyAvg}%</h4>
                </div>
              </div>
            </div>

            {/* Insight */}
            <div className="rounded-lg p-2.5 border" style={{ borderColor: "oklch(0.88 0.02 265)", background: "oklch(0.96 0.015 265)" }}>
              <p className="text-[11px] font-bold flex items-center gap-1 mb-1" style={{ color: "var(--primary)" }}>
                <Sparkles className="w-3 h-3" /> Insight
              </p>
              <p className="text-[10px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                {insight}
              </p>
            </div>

            {/* Clear data */}
            <button
              onClick={handleClearAll}
              className="mt-auto text-[10px] font-semibold flex items-center justify-center gap-1 transition hover:opacity-70"
              style={{ color: "var(--muted-foreground)" }}
            >
              <RotateCcw className="w-3 h-3" />
              Reset all data
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
