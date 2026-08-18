import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/** Get all tasks for a given user and date. */
export const listByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("tasks")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", args.date)
      )
      .collect();
  },
});

/** Get all tasks for a user within a date range (for monthly chart). */
export const listByDateRange = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
      .then((tasks) =>
        tasks.filter((t) => t.date >= args.startDate && t.date <= args.endDate)
      );
  },
});

/** Add a new task. */
export const addTask = mutation({
  args: {
    date: v.string(),
    text: v.string(),
    priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("tasks", {
      userId,
      date: args.date,
      text: args.text,
      priority: args.priority,
      completed: false,
    });
  },
});

/** Toggle task completion. */
export const toggleTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    await ctx.db.patch(args.taskId, { completed: !task.completed });
  },
});

/** Delete a task. */
export const removeTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});

/** Delete all tasks for a user. */
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
  },
});
