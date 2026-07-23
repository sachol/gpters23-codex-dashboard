(() => {
  "use strict";

  const readJson = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The dashboard still works for the current session.
    }
  };

  const journeyLabels = { wait: "대기", progress: "진행", done: "완료" };
  const journeyCards = [...document.querySelectorAll("[data-journey-week]")];
  const loopTaskKey = "gpters23-weekly-loop-tasks-v1";
  const loopNoteKey = "gpters23-weekly-loop-notes-v1";
  const loopWeeks = [...document.querySelectorAll("[data-loop-week]")];
  const savedLoopTasks = readJson(loopTaskKey, {});
  const savedLoopNotes = readJson(loopNoteKey, {});

  loopWeeks.forEach((week) => {
    const weekId = week.dataset.loopWeek;
    week.querySelectorAll("[data-loop-task]").forEach((input) => {
      if (Object.prototype.hasOwnProperty.call(savedLoopTasks[weekId] || {}, input.dataset.loopTask)) {
        input.checked = Boolean(savedLoopTasks[weekId][input.dataset.loopTask]);
      }
    });
    week.querySelectorAll("[data-loop-note]").forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(savedLoopNotes[weekId] || {}, field.dataset.loopNote)) {
        field.value = savedLoopNotes[weekId][field.dataset.loopNote];
      }
    });
  });

  function collectLoopTasks() {
    return Object.fromEntries(loopWeeks.map((week) => [
      week.dataset.loopWeek,
      Object.fromEntries([...week.querySelectorAll("[data-loop-task]")].map((input) => [input.dataset.loopTask, input.checked]))
    ]));
  }

  function collectLoopNotes() {
    return Object.fromEntries(loopWeeks.map((week) => [
      week.dataset.loopWeek,
      Object.fromEntries([...week.querySelectorAll("[data-loop-note]")].map((field) => [field.dataset.loopNote, field.value]))
    ]));
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function setWidth(id, percent) {
    const element = document.getElementById(id);
    if (element) element.style.width = `${percent}%`;
  }

  function updateLoopDashboard() {
    const allTasks = loopWeeks.flatMap((week) => [...week.querySelectorAll("[data-loop-task]")]);
    const completedTotal = allTasks.filter((input) => input.checked).length;
    const overallPercent = allTasks.length ? Math.round((completedTotal / allTasks.length) * 100) : 0;
    let currentWeek = null;
    let nextTask = null;

    loopWeeks.forEach((week) => {
      const tasks = [...week.querySelectorAll("[data-loop-task]")];
      const completed = tasks.filter((input) => input.checked).length;
      const status = completed === 0 ? "wait" : completed === tasks.length ? "done" : "progress";
      const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
      const weekId = week.dataset.loopWeek;
      const journeyCard = journeyCards.find((card) => card.dataset.journeyWeek === weekId);

      week.dataset.status = status;
      const count = week.querySelector("[data-loop-count]");
      const statusLabel = week.querySelector("[data-loop-status]");
      const progress = week.querySelector("[data-loop-progress]");
      if (count) count.textContent = `${completed}/${tasks.length}`;
      if (statusLabel) statusLabel.textContent = journeyLabels[status];
      if (progress) progress.style.width = `${percent}%`;

      if (journeyCard) {
        journeyCard.dataset.status = status;
        const button = journeyCard.querySelector("[data-journey-status]");
        if (button) button.textContent = journeyLabels[status];
      }

      if (!currentWeek && status !== "done") {
        currentWeek = { week, completed, total: tasks.length };
        nextTask = tasks.find((input) => !input.checked)?.closest(".loop-task")?.querySelector(".loop-task-text")?.textContent.trim();
      }
    });

    setText("loopCompletion", `${completedTotal}/${allTasks.length}`);
    setText("journeyPercent", `${overallPercent}%`);
    setText("heroProgressLabel", `${completedTotal}/${allTasks.length} 완료`);
    setWidth("journeyProgressBar", overallPercent);
    setWidth("heroProgressBar", overallPercent);

    if (currentWeek) {
      const weekName = currentWeek.week.querySelector(".loop-week-head span")?.textContent.split("·")[0].trim() || "현재 주차";
      setText("loopCurrentWeek", `${weekName} · ${currentWeek.completed}/${currentWeek.total}`);
      setText("loopNextAction", `${weekName} · ${nextTask || "다음 실험 확인"}`);
      setText("heroStatus", `${weekName} 실행 중`);
      setText("heroNextAction", nextTask || "실행 루프 확인");
    } else {
      setText("loopCurrentWeek", "4주 루프 완료");
      setText("loopNextAction", "검증 결과를 실무와 강의에 계속 확장");
      setText("heroStatus", "4주 루프 완료");
      setText("heroNextAction", "후속 자동화 운영");
    }
  }

  loopWeeks.forEach((week) => {
    week.querySelectorAll("[data-loop-task]").forEach((input) => {
      input.addEventListener("change", () => {
        writeJson(loopTaskKey, collectLoopTasks());
        updateLoopDashboard();
      });
    });
    week.querySelectorAll("[data-loop-note]").forEach((field) => {
      field.addEventListener("input", () => writeJson(loopNoteKey, collectLoopNotes()));
    });
  });

  journeyCards.forEach((card) => {
    card.querySelector("[data-journey-status]")?.addEventListener("click", () => {
      document.querySelector('[data-target="weekly-routine"]')?.click();
      setTimeout(() => document.getElementById(`loop-${card.dataset.journeyWeek}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    });
  });

  document.getElementById("loopExport")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const summary = loopWeeks.flatMap((week) => {
      const heading = week.querySelector(".loop-week-head div:first-child")?.innerText.replace(/\n/g, " · ") || week.dataset.loopWeek;
      const topic = week.querySelector('[data-loop-note="topic"]')?.value.trim();
      const taskLines = [...week.querySelectorAll(".loop-task")].map((task) => {
        const input = task.querySelector("[data-loop-task]");
        const phase = task.querySelector("b")?.textContent.trim();
        const label = task.querySelector(".loop-task-text")?.textContent.trim();
        return `- [${input.checked ? "완료" : "대기"}] ${phase}: ${label}`;
      });
      const notes = [...week.querySelectorAll("[data-loop-note]")]
        .filter((field) => field.dataset.loopNote !== "topic" && field.value.trim())
        .map((field) => `- ${field.closest("label")?.querySelector("span")?.textContent.trim()}: ${field.value.trim()}`);
      return [`[${heading}]`, `주제: ${topic || "미정"}`, ...taskLines, ...notes, ""];
    }).join("\n");
    const exportText = `GPTERS 23기 Codex 실행 루프 업데이트\n전체 진행: ${document.getElementById("loopCompletion")?.textContent}\n\n${summary}`;

    try {
      await navigator.clipboard.writeText(exportText);
      button.textContent = "복사 완료";
    } catch {
      button.textContent = "복사 실패";
    }
    setTimeout(() => {
      button.textContent = "진행 요약 복사";
    }, 1600);
  });

  updateLoopDashboard();

  const candidateData = {
    briefing: { domain: "brokerage", difficulty: 60, effect: 95, label: "중개업무" },
    checklist: { domain: "brokerage", difficulty: 55, effect: 90, label: "중개업무" },
    "ad-copy": { domain: "brokerage", difficulty: 35, effect: 88, label: "중개업무" },
    "follow-up": { domain: "brokerage", difficulty: 35, effect: 85, label: "중개업무" },
    "auction-docs": { domain: "auction", difficulty: 68, effect: 94, label: "법원경매" },
    "auction-rights": { domain: "auction", difficulty: 82, effect: 92, label: "법원경매" },
    "auction-bid-table": { domain: "auction", difficulty: 72, effect: 90, label: "법원경매" },
    "lecture-outline": { domain: "education", difficulty: 45, effect: 92, label: "AI 강의" },
    "prompt-kit": { domain: "education", difficulty: 42, effect: 90, label: "AI 강의" },
    faq: { domain: "education", difficulty: 32, effect: 80, label: "AI 강의" }
  };

  const candidateDetailKey = "gpters23-candidate-details-v1";
  const savedCandidateDetails = readJson(candidateDetailKey, {});
  const candidateCards = [...document.querySelectorAll(".candidate-card[data-candidate]")];
  const domainButtons = [...document.querySelectorAll("[data-domain-filter]")];
  const searchInput = document.getElementById("candidateSearch");
  const difficultyFilter = document.getElementById("difficultyFilter");
  const weekFilter = document.getElementById("candidateWeekFilter");
  const selectedOnly = document.getElementById("selectedOnlyFilter");
  const resultCount = document.getElementById("candidateResultCount");
  let activeDomain = "all";
  let compared = [];

  const difficultyBand = (score) => score <= 40 ? "easy" : score <= 65 ? "medium" : "hard";
  const difficultyLabel = (score) => score <= 40 ? "쉬움" : score <= 65 ? "보통" : "높음";

  candidateCards.forEach((card) => {
    const id = card.dataset.candidate;
    const meta = candidateData[id];
    if (!meta) return;
    card.dataset.domain = meta.domain;
    card.dataset.difficulty = difficultyBand(meta.difficulty);
    const savedDetail = savedCandidateDetails[id] || {};
    const details = document.createElement("div");
    details.className = "candidate-db-fields";
    details.innerHTML = `
      <label><span>회당 시간(분)</span><input type="number" min="0" max="1440" step="1" inputmode="numeric" data-candidate-meta="estimatedMinutes" aria-label="${id} 회당 예상 시간"></label>
      <label><span>월 발생 횟수</span><input type="number" min="0" max="1000" step="1" inputmode="numeric" data-candidate-meta="monthlyFrequency" aria-label="${id} 월 발생 횟수"></label>
      <label><span>공개 사례화</span><select data-candidate-meta="publicCase" aria-label="${id} 공개 사례화 가능 여부"><option value="">미정</option><option value="true">가능</option><option value="false">비공개</option></select></label>
    `;
    details.querySelector('[data-candidate-meta="estimatedMinutes"]').value = savedDetail.estimatedMinutes ?? "";
    details.querySelector('[data-candidate-meta="monthlyFrequency"]').value = savedDetail.monthlyFrequency ?? "";
    details.querySelector('[data-candidate-meta="publicCase"]').value = savedDetail.publicCase ?? "";
    card.appendChild(details);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "compare-toggle";
    button.dataset.compare = id;
    button.textContent = "비교 담기";
    button.setAttribute("aria-pressed", "false");
    button.title = "최대 3개 후보의 난이도와 기대 효과를 나란히 비교합니다.";
    card.appendChild(button);
  });

  function collectCandidateDetails() {
    return Object.fromEntries(candidateCards.map((card) => [
      card.dataset.candidate,
      Object.fromEntries([...card.querySelectorAll("[data-candidate-meta]")].map((field) => [
        field.dataset.candidateMeta,
        field.value
      ]))
    ]));
  }

  candidateCards.forEach((card) => {
    card.querySelectorAll("[data-candidate-meta]").forEach((field) => {
      field.addEventListener(field.tagName === "SELECT" ? "change" : "input", () => {
        writeJson(candidateDetailKey, collectCandidateDetails());
      });
    });
  });

  function applyCandidateFilters() {
    const query = (searchInput?.value || "").trim().toLocaleLowerCase("ko-KR");
    const selectedDifficulty = difficultyFilter?.value || "all";
    const selectedWeek = weekFilter?.value || "all";
    let visible = 0;

    candidateCards.forEach((card) => {
      const choice = card.querySelector("[data-choice]");
      const week = card.querySelector("[data-week]")?.value || "";
      const matchesDomain = activeDomain === "all" || card.dataset.domain === activeDomain;
      const matchesDifficulty = selectedDifficulty === "all" || card.dataset.difficulty === selectedDifficulty;
      const matchesWeek = selectedWeek === "all"
        || (selectedWeek === "unassigned" ? !week : week === selectedWeek);
      const matchesSelected = !selectedOnly?.checked || Boolean(choice?.checked);
      const matchesSearch = !query || card.textContent.toLocaleLowerCase("ko-KR").includes(query);
      const show = matchesDomain && matchesDifficulty && matchesWeek && matchesSelected && matchesSearch;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (resultCount) resultCount.textContent = `${visible}개 후보`;
  }

  domainButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeDomain = button.dataset.domainFilter;
      domainButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      applyCandidateFilters();
    });
  });

  [searchInput, difficultyFilter, weekFilter, selectedOnly].forEach((control) => {
    control?.addEventListener(control === searchInput ? "input" : "change", applyCandidateFilters);
  });
  document.querySelectorAll("[data-choice], [data-week]").forEach((control) => {
    control.addEventListener("change", applyCandidateFilters);
  });

  document.getElementById("candidateFilterReset")?.addEventListener("click", () => {
    activeDomain = "all";
    domainButtons.forEach((button) => {
      const active = button.dataset.domainFilter === "all";
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (searchInput) searchInput.value = "";
    if (difficultyFilter) difficultyFilter.value = "all";
    if (weekFilter) weekFilter.value = "all";
    if (selectedOnly) selectedOnly.checked = false;
    applyCandidateFilters();
  });

  const comparePanel = document.getElementById("comparePanel");
  const compareTable = document.getElementById("compareTable");

  function renderComparison() {
    document.querySelectorAll("[data-compare]").forEach((button) => {
      const active = compared.includes(button.dataset.compare);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active ? "비교에서 빼기" : "비교 담기";
    });
    if (!comparePanel || !compareTable) return;
    comparePanel.hidden = compared.length === 0;
    if (!compared.length) {
      compareTable.innerHTML = "";
      return;
    }

    const headers = compared.map((id) => `<th scope="col">${document.querySelector(`[data-candidate="${id}"] > strong`)?.textContent || id}</th>`).join("");
    const row = (label, getter) => `<tr><th scope="row">${label}</th>${compared.map((id) => `<td>${getter(id)}</td>`).join("")}</tr>`;
    compareTable.innerHTML = `<thead><tr><th scope="col">비교 기준</th>${headers}</tr></thead><tbody>
      ${row("업무 영역", (id) => candidateData[id].label)}
      ${row("난이도", (id) => `<span class="compare-score">${difficultyLabel(candidateData[id].difficulty)} ${candidateData[id].difficulty}</span>`)}
      ${row("기대 효과", (id) => `<span class="compare-score">${candidateData[id].effect}</span>`)}
      ${row("배치 주차", (id) => {
        const value = document.querySelector(`[data-week="${id}"]`)?.value;
        return value ? value.replace("week", "Week ") : "미정";
      })}
      ${row("선택 상태", (id) => document.querySelector(`[data-choice="${id}"]`)?.checked ? "선택됨" : "미선택")}
    </tbody>`;
  }

  document.querySelectorAll("[data-compare]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.compare;
      if (compared.includes(id)) {
        compared = compared.filter((item) => item !== id);
      } else if (compared.length < 3) {
        compared = [...compared, id];
      } else {
        button.textContent = "최대 3개";
        setTimeout(renderComparison, 900);
        return;
      }
      renderComparison();
    });
  });
  document.getElementById("compareClear")?.addEventListener("click", () => {
    compared = [];
    renderComparison();
  });
  document.querySelectorAll("[data-choice], [data-week]").forEach((control) => control.addEventListener("change", renderComparison));
  applyCandidateFilters();

  const performanceKey = "gpters23-performance-v2";
  const performanceRows = [...document.querySelectorAll("[data-performance-week]")];
  const savedPerformance = readJson(performanceKey, {});

  function collectPerformance() {
    return Object.fromEntries(performanceRows.map((row) => {
      const values = {};
      row.querySelectorAll("[data-field]").forEach((input) => {
        values[input.dataset.field] = input.type === "checkbox" ? input.checked : input.value;
      });
      return [row.dataset.performanceWeek, values];
    }));
  }

  function updatePerformance() {
    let measured = 0;
    let totalSaved = 0;
    let totalRate = 0;
    let artifacts = 0;

    performanceRows.forEach((row) => {
      const before = Number(row.querySelector('[data-field="before"]')?.value);
      const after = Number(row.querySelector('[data-field="after"]')?.value);
      const result = row.querySelector("[data-result]");
      const bar = row.querySelector(".result-bar span");
      const hasMeasurement = before > 0 && after >= 0;
      if (hasMeasurement) {
        const saved = before - after;
        const rate = Math.round((saved / before) * 100);
        measured += 1;
        totalSaved += saved;
        totalRate += rate;
        if (result) result.textContent = saved >= 0 ? `${saved}분 · ${rate}% 절감` : `${Math.abs(saved)}분 증가`;
        if (bar) bar.style.width = `${Math.max(0, Math.min(100, rate))}%`;
      } else {
        if (result) result.textContent = "측정 전";
        if (bar) bar.style.width = "0%";
      }
      if (row.querySelector('[data-field="done"]')?.checked) {
        artifacts += Number(row.querySelector('[data-field="artifacts"]')?.value) || 0;
      }
    });

    document.getElementById("measuredCount").textContent = `${measured}건`;
    document.getElementById("savedMinutes").textContent = `${totalSaved}분`;
    document.getElementById("savedRate").textContent = `${measured ? Math.round(totalRate / measured) : 0}%`;
    document.getElementById("artifactCount").textContent = `${artifacts}개`;
    writeJson(performanceKey, collectPerformance());
  }

  performanceRows.forEach((row) => {
    const values = savedPerformance[row.dataset.performanceWeek] || {};
    row.querySelectorAll("[data-field]").forEach((input) => {
      if (!Object.prototype.hasOwnProperty.call(values, input.dataset.field)) return;
      if (input.type === "checkbox") input.checked = Boolean(values[input.dataset.field]);
      else input.value = values[input.dataset.field];
    });
    row.querySelectorAll("[data-field]").forEach((input) => input.addEventListener("input", updatePerformance));
    row.querySelectorAll("[data-field]").forEach((input) => input.addEventListener("change", updatePerformance));
  });

  document.getElementById("performanceReset")?.addEventListener("click", () => {
    performanceRows.forEach((row) => {
      row.querySelector('[data-field="before"]').value = "";
      row.querySelector('[data-field="after"]').value = "";
      row.querySelector('[data-field="artifacts"]').value = "0";
      row.querySelector('[data-field="done"]').checked = false;
    });
    updatePerformance();
  });
  updatePerformance();

  const sessionDates = {
    week1: "2026-07-22",
    week2: "2026-07-29",
    week3: "2026-08-05",
    week4: "2026-08-12"
  };
  const cloudLastSyncKey = "gpters23-cloud-last-sync-v1";
  const cloudPanel = document.getElementById("cloudSyncPanel");
  const cloudStatus = document.getElementById("cloudStatus");
  const cloudStatusDetail = document.getElementById("cloudStatusDetail");
  const cloudLoad = document.getElementById("cloudLoad");
  const cloudLogin = document.getElementById("cloudLogin");
  const cloudSave = document.getElementById("cloudSave");
  const cloudDialog = document.getElementById("cloudLoginDialog");
  const cloudLoginForm = document.getElementById("cloudLoginForm");
  const cloudPassword = document.getElementById("cloudPassword");
  const cloudLoginMessage = document.getElementById("cloudLoginMessage");
  let cloudState = null;
  let cloudConfigured = false;
  let cloudAuthenticated = false;
  let cloudBusy = false;

  function setCloudStatus(state, title, detail) {
    if (cloudPanel) cloudPanel.dataset.state = state;
    if (cloudStatus) cloudStatus.textContent = title;
    if (cloudStatusDetail) cloudStatusDetail.textContent = detail;
  }

  function setCloudEditable(enabled) {
    const controls = [
      ...loopWeeks.flatMap((week) => [...week.querySelectorAll("[data-loop-task], [data-loop-note]")]),
      ...performanceRows.flatMap((row) => [...row.querySelectorAll("[data-field]")]),
      ...candidateCards.flatMap((card) => [...card.querySelectorAll("[data-choice], [data-week], [data-candidate-meta]")])
    ];
    controls.forEach((control) => {
      control.disabled = !enabled;
      control.dataset.cloudEditable = "";
    });
    if (cloudSave) cloudSave.disabled = !enabled || cloudBusy || !cloudConfigured;
    if (cloudLogin) cloudLogin.textContent = cloudAuthenticated && cloudConfigured ? "관리자 로그아웃" : "관리자 편집";
  }

  function nullableNumber(value) {
    if (value === "" || value == null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function collectDashboardState() {
    const cloudWeekly = new Map((cloudState?.weekly || []).map((row) => [row.weekId, row]));
    const weekly = loopWeeks.map((week) => {
      const weekId = week.dataset.loopWeek;
      const performanceRow = performanceRows.find((row) => row.dataset.performanceWeek === weekId);
      return {
        weekId,
        sessionDate: sessionDates[weekId],
        topic: week.querySelector('[data-loop-note="topic"]')?.value.trim() || "",
        tasks: Object.fromEntries([...week.querySelectorAll("[data-loop-task]")].map((input) => [
          input.dataset.loopTask,
          input.checked
        ])),
        result: week.querySelector('[data-loop-note="result"]')?.value.trim() || "",
        feedback: week.querySelector('[data-loop-note="feedback"]')?.value.trim() || "",
        nextExperiment: week.querySelector('[data-loop-note="next"]')?.value.trim() || "",
        beforeMinutes: nullableNumber(performanceRow?.querySelector('[data-field="before"]')?.value),
        afterMinutes: nullableNumber(performanceRow?.querySelector('[data-field="after"]')?.value),
        artifactsCount: nullableNumber(performanceRow?.querySelector('[data-field="artifacts"]')?.value) || 0,
        caseDone: Boolean(performanceRow?.querySelector('[data-field="done"]')?.checked),
        revisionNo: Number(cloudWeekly.get(weekId)?.revisionNo) || 0
      };
    });

    const candidates = candidateCards.map((card) => {
      const publicCaseValue = card.querySelector('[data-candidate-meta="publicCase"]')?.value || "";
      return {
        candidateId: card.dataset.candidate,
        candidateName: card.querySelector(":scope > strong")?.textContent.trim() || card.dataset.candidate,
        domain: candidateData[card.dataset.candidate].domain,
        selected: Boolean(card.querySelector("[data-choice]")?.checked),
        assignedWeek: card.querySelector("[data-week]")?.value || "",
        estimatedMinutes: nullableNumber(card.querySelector('[data-candidate-meta="estimatedMinutes"]')?.value),
        monthlyFrequency: nullableNumber(card.querySelector('[data-candidate-meta="monthlyFrequency"]')?.value),
        publicCase: publicCaseValue === "" ? null : publicCaseValue === "true"
      };
    });

    return { weekly, candidates, deviceLabel: "office-chrome" };
  }

  function comparableState(state) {
    return JSON.stringify({
      weekly: (state?.weekly || []).map((row) => ({
        weekId: row.weekId,
        sessionDate: row.sessionDate,
        topic: row.topic || "",
        tasks: row.tasks,
        result: row.result || "",
        feedback: row.feedback || "",
        nextExperiment: row.nextExperiment || "",
        beforeMinutes: row.beforeMinutes ?? null,
        afterMinutes: row.afterMinutes ?? null,
        artifactsCount: Number(row.artifactsCount) || 0,
        caseDone: Boolean(row.caseDone)
      })),
      candidates: (state?.candidates || []).map((row) => ({
        candidateId: row.candidateId,
        candidateName: row.candidateName,
        domain: row.domain,
        selected: Boolean(row.selected),
        assignedWeek: row.assignedWeek || "",
        estimatedMinutes: row.estimatedMinutes ?? null,
        monthlyFrequency: row.monthlyFrequency ?? null,
        publicCase: row.publicCase ?? null
      }))
    });
  }

  function applyCloudState(state, meta = {}) {
    cloudState = state;
    const weeklyById = new Map((state.weekly || []).map((row) => [row.weekId, row]));
    loopWeeks.forEach((week) => {
      const row = weeklyById.get(week.dataset.loopWeek);
      if (!row) return;
      week.querySelectorAll("[data-loop-task]").forEach((input) => {
        input.checked = Boolean(row.tasks?.[input.dataset.loopTask]);
      });
      const noteValues = {
        topic: row.topic || "",
        result: row.result || "",
        feedback: row.feedback || "",
        next: row.nextExperiment || ""
      };
      week.querySelectorAll("[data-loop-note]").forEach((field) => {
        field.value = noteValues[field.dataset.loopNote] || "";
      });
      const performanceRow = performanceRows.find((item) => item.dataset.performanceWeek === row.weekId);
      if (performanceRow) {
        performanceRow.querySelector('[data-field="topic"]').value = row.topic || "";
        performanceRow.querySelector('[data-field="before"]').value = row.beforeMinutes ?? "";
        performanceRow.querySelector('[data-field="after"]').value = row.afterMinutes ?? "";
        performanceRow.querySelector('[data-field="artifacts"]').value = row.artifactsCount ?? 0;
        performanceRow.querySelector('[data-field="done"]').checked = Boolean(row.caseDone);
      }
    });

    const candidateById = new Map((state.candidates || []).map((row) => [row.candidateId, row]));
    candidateCards.forEach((card) => {
      const row = candidateById.get(card.dataset.candidate);
      if (!row) return;
      card.querySelector("[data-choice]").checked = Boolean(row.selected);
      card.querySelector("[data-week]").value = row.assignedWeek || "";
      card.querySelector('[data-candidate-meta="estimatedMinutes"]').value = row.estimatedMinutes ?? "";
      card.querySelector('[data-candidate-meta="monthlyFrequency"]').value = row.monthlyFrequency ?? "";
      card.querySelector('[data-candidate-meta="publicCase"]').value = row.publicCase == null ? "" : String(row.publicCase);
    });

    writeJson(loopTaskKey, collectLoopTasks());
    writeJson(loopNoteKey, collectLoopNotes());
    writeJson(performanceKey, collectPerformance());
    writeJson(candidateDetailKey, collectCandidateDetails());
    localStorage.setItem(
      "gpters23-candidate-choices-v2",
      JSON.stringify(Object.fromEntries(candidateCards.map((card) => [card.dataset.candidate, card.querySelector("[data-choice]").checked])))
    );
    localStorage.setItem(
      "gpters23-candidate-weeks-v2",
      JSON.stringify(Object.fromEntries(candidateCards.map((card) => [card.dataset.candidate, card.querySelector("[data-week]").value])))
    );
    localStorage.setItem(cloudLastSyncKey, meta.readAt || new Date().toISOString());

    updateLoopDashboard();
    updatePerformance();
    applyCandidateFilters();
    renderComparison();
    candidateCards.forEach((card) => card.classList.toggle("selected", card.querySelector("[data-choice]").checked));
    const selectedCount = candidateCards.filter((card) => card.querySelector("[data-choice]").checked).length;
    setText("selectedCount", `${selectedCount}개 선택`);
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = { ok: false, error: "서버 응답을 읽지 못했습니다." };
    }
    return { response, data };
  }

  async function loadCloudState(force = false) {
    if (!cloudConfigured || cloudBusy) return;
    cloudBusy = true;
    if (cloudLoad) cloudLoad.disabled = true;
    setCloudStatus("checking", "Google Sheets 불러오는 중", "현재 브라우저의 임시 저장 내용은 유지됩니다.");
    try {
      const { response, data } = await requestJson("/api/state");
      if (!response.ok || !data.state) throw new Error(data.error || "클라우드 데이터를 불러오지 못했습니다.");
      const localState = collectDashboardState();
      cloudState = data.state;
      const hasPreviousSync = Boolean(localStorage.getItem(cloudLastSyncKey));
      const differs = comparableState(localState) !== comparableState(data.state);
      if (!force && differs && !hasPreviousSync) {
        setCloudStatus("draft", "로컬 초안이 있습니다", "관리자 로그인 후 저장하거나 클라우드 불러오기를 선택하세요.");
      } else {
        applyCloudState(data.state, data.meta || {});
        setCloudStatus("connected", "Google Sheets 연결됨", `마지막 불러오기 ${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`);
      }
    } catch (error) {
      setCloudStatus("error", "클라우드 불러오기 실패", error.message);
    } finally {
      cloudBusy = false;
      if (cloudLoad) cloudLoad.disabled = false;
      setCloudEditable(cloudAuthenticated);
    }
  }

  async function initializeCloud() {
    if (location.protocol === "file:") {
      cloudConfigured = false;
      cloudAuthenticated = true;
      setCloudStatus("draft", "로컬 파일 모드", "Vercel 주소에서 열면 Google Sheets와 연결됩니다.");
      if (cloudLoad) cloudLoad.disabled = true;
      if (cloudLogin) cloudLogin.disabled = true;
      setCloudEditable(true);
      return;
    }

    try {
      const [sessionResult, stateResult] = await Promise.all([
        requestJson("/api/session"),
        requestJson("/api/state")
      ]);
      if (stateResult.response.status === 503) {
        cloudConfigured = false;
        cloudAuthenticated = true;
        setCloudStatus("draft", "클라우드 설정 전", "현재는 이 브라우저에 임시 저장됩니다.");
        if (cloudLoad) cloudLoad.disabled = true;
        if (cloudLogin) cloudLogin.disabled = true;
        setCloudEditable(true);
        return;
      }
      if (!stateResult.response.ok || !stateResult.data.state) {
        throw new Error(stateResult.data.error || "Google Sheets 연결을 확인하지 못했습니다.");
      }
      cloudConfigured = true;
      cloudAuthenticated = Boolean(sessionResult.data.authenticated);
      cloudState = stateResult.data.state;
      const localState = collectDashboardState();
      const hasPreviousSync = Boolean(localStorage.getItem(cloudLastSyncKey));
      const differs = comparableState(localState) !== comparableState(cloudState);
      if (differs && !hasPreviousSync) {
        setCloudStatus("draft", "로컬 초안이 있습니다", "관리자 로그인 후 저장하거나 클라우드 값을 불러오세요.");
      } else {
        applyCloudState(cloudState, stateResult.data.meta || {});
        setCloudStatus("connected", "Google Sheets 연결됨", cloudAuthenticated ? "관리자 편집 가능" : "읽기 전용");
      }
      setCloudEditable(cloudAuthenticated);
    } catch (error) {
      cloudConfigured = false;
      cloudAuthenticated = true;
      setCloudStatus("error", "로컬 저장 모드", "클라우드 연결 실패로 브라우저 임시 저장을 사용합니다.");
      if (cloudLoad) cloudLoad.disabled = true;
      if (cloudLogin) cloudLogin.disabled = true;
      setCloudEditable(true);
    }
  }

  cloudLoad?.addEventListener("click", () => loadCloudState(true));

  cloudLogin?.addEventListener("click", async () => {
    if (!cloudConfigured || cloudBusy) return;
    if (cloudAuthenticated) {
      cloudBusy = true;
      try {
        await requestJson("/api/session", { method: "DELETE", body: "{}" });
        cloudAuthenticated = false;
        setCloudEditable(false);
        setCloudStatus("connected", "Google Sheets 연결됨", "관리자 로그아웃 · 읽기 전용");
      } finally {
        cloudBusy = false;
      }
      return;
    }
    if (cloudLoginMessage) cloudLoginMessage.textContent = "";
    if (cloudPassword) cloudPassword.value = "";
    cloudDialog?.showModal();
    setTimeout(() => cloudPassword?.focus(), 40);
  });

  document.getElementById("cloudLoginClose")?.addEventListener("click", () => cloudDialog?.close());
  document.getElementById("cloudLoginCancel")?.addEventListener("click", () => cloudDialog?.close());

  cloudLoginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!cloudPassword?.value || cloudBusy) return;
    cloudBusy = true;
    if (cloudLoginMessage) cloudLoginMessage.textContent = "확인 중입니다.";
    try {
      const { response, data } = await requestJson("/api/session", {
        method: "POST",
        body: JSON.stringify({ password: cloudPassword.value })
      });
      if (!response.ok) throw new Error(data.error || "로그인하지 못했습니다.");
      cloudAuthenticated = true;
      setCloudEditable(true);
      setCloudStatus("connected", "관리자 편집 모드", "변경 후 저장 버튼을 눌러 Google Sheets에 반영하세요.");
      cloudDialog?.close();
    } catch (error) {
      if (cloudLoginMessage) cloudLoginMessage.textContent = error.message;
    } finally {
      cloudBusy = false;
      setCloudEditable(cloudAuthenticated);
    }
  });

  cloudSave?.addEventListener("click", async () => {
    if (!cloudAuthenticated || cloudBusy) return;
    cloudBusy = true;
    setCloudEditable(true);
    if (cloudSave) {
      cloudSave.disabled = true;
      cloudSave.textContent = "저장 중";
    }
    setCloudStatus("checking", "Google Sheets 저장 중", "수정 이력도 함께 기록합니다.");
    try {
      const { response, data } = await requestJson("/api/state", {
        method: "PUT",
        body: JSON.stringify(collectDashboardState())
      });
      if (!response.ok || !data.state) throw new Error(data.error || "저장하지 못했습니다.");
      applyCloudState(data.state, data.meta || {});
      setCloudStatus("connected", "Google Sheets 저장 완료", new Date().toLocaleString("ko-KR"));
    } catch (error) {
      setCloudStatus("error", "클라우드 저장 실패", error.message);
    } finally {
      cloudBusy = false;
      if (cloudSave) cloudSave.textContent = "변경사항 저장";
      setCloudEditable(cloudAuthenticated);
    }
  });

  initializeCloud();
})();
