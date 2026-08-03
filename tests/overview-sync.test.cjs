const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const dashboardPath = path.join(__dirname, "..", "output", "study-dashboard");
const html = fs.readFileSync(path.join(dashboardPath, "index.html"), "utf8");
const script = fs.readFileSync(path.join(dashboardPath, "dashboard-v2.js"), "utf8");
const styles = fs.readFileSync(path.join(dashboardPath, "dashboard-v2.css"), "utf8");
const { groupOverviewTasks, summarizeTasks, summarizePhases } = require("../output/study-dashboard/dashboard-v2.js");

test("overview stages expose all four weekly synchronization targets", () => {
  for (const weekId of ["week1", "week2", "week3", "week4"]) {
    assert.match(html, new RegExp(`data-overview-week="${weekId}"`));
  }
  assert.match(html, /id="overviewTodayActions"/);
  assert.match(html, /id="overviewUpcomingActions"/);
  assert.match(html, /id="overviewCompletedActions"/);
  assert.doesNotMatch(html, /추천 조합 1~3순위 확인/);
});

test("current flow and curriculum expose DB synchronization targets", () => {
  for (const key of ["plan", "execute", "verify", "expand"]) assert.match(html, new RegExp(`data-overview-phase="${key}"`));
  for (const weekId of ["week1", "week2", "week3", "week4"]) assert.match(html, new RegExp(`data-curriculum-week="${weekId}"`));
  assert.match(html, /id="overviewFlowTitle"/);
  assert.match(html, /id="overviewFlowContext"/);
});

test("weekly summary reports waiting, progress, and done from the same six tasks", () => {
  assert.deepEqual(summarizeTasks(Array(6).fill({ completed: false })), {
    completed: 0,
    total: 6,
    status: "wait",
  });
  assert.deepEqual(summarizeTasks([
    { completed: true }, { completed: true },
    { completed: false }, { completed: false }, { completed: false }, { completed: false },
  ]), { completed: 2, total: 6, status: "progress" });
  assert.deepEqual(summarizeTasks(Array(6).fill({ completed: true })), {
    completed: 6,
    total: 6,
    status: "done",
  });
});

test("Week 2 phase cards reconcile to the same 4 of 6 tasks", () => {
  const summaries = summarizePhases([
    { phaseKey: "plan", completed: true },
    { phaseKey: "execute", completed: true },
    { phaseKey: "verify", completed: true },
    { phaseKey: "verify", completed: true },
    { phaseKey: "verify", completed: false },
    { phaseKey: "expand", completed: false },
  ]);
  assert.deepEqual(summaries.plan, { completed: 1, total: 1, status: "done" });
  assert.deepEqual(summaries.execute, { completed: 1, total: 1, status: "done" });
  assert.deepEqual(summaries.verify, { completed: 2, total: 3, status: "progress" });
  assert.deepEqual(summaries.expand, { completed: 0, total: 1, status: "wait" });
});

test("current-week tasks split into today, upcoming, and collapsed completed work", () => {
  const groups = groupOverviewTasks([
    { key: "plan", completed: true, actionDate: "" },
    { key: "execute", completed: true, actionDate: "" },
    { key: "challenge", completed: false, actionDate: "" },
    { key: "feedback", completed: false, actionDate: "2026-08-05" },
    { key: "expand", completed: false, actionDate: "" },
  ], "2026-08-01");

  assert.deepEqual(groups.completed.map((task) => task.key), ["plan", "execute"]);
  assert.deepEqual(groups.today.map((task) => task.key), ["challenge", "expand"]);
  assert.deepEqual(groups.upcoming.map((task) => task.key), ["feedback"]);
});

test("overview renderer is invoked by loop updates and respects cloud editability", () => {
  assert.match(script, /renderOverview\(weekSummaries, currentWeek\)/);
  assert.match(script, /task\.input\.dispatchEvent\(new Event\("change"/);
  assert.match(script, /checkbox\.disabled = task\.input\.disabled/);
  assert.match(script, /renderCurrentFlow\(currentWeek\)/);
  assert.match(script, /renderCurriculumAlignment\(weekSummaries, currentWeek\)/);
  assert.match(script, /data-overview-phase-status/);
  assert.match(styles, /\.overview-phase-card\[data-status="progress"\]/);
  assert.match(script, /function setCloudEditable[\s\S]*?updateLoopDashboard\(\);/);
  assert.match(styles, /\.overview-completed li[\s\S]*?text-decoration: line-through/);
});
