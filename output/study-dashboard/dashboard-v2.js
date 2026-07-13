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

  const journeyKey = "gpters23-journey-status-v2";
  const journeyLabels = { wait: "대기", progress: "진행", done: "완료" };
  const journeyOrder = ["wait", "progress", "done"];
  const journeyCards = [...document.querySelectorAll("[data-journey-week]")];
  const savedJourney = readJson(journeyKey, {});

  function updateJourneySummary() {
    const points = journeyCards.reduce((sum, card) => {
      if (card.dataset.status === "done") return sum + 1;
      if (card.dataset.status === "progress") return sum + 0.5;
      return sum;
    }, 0);
    const percent = Math.round((points / journeyCards.length) * 100);
    const label = document.getElementById("journeyPercent");
    const bar = document.getElementById("journeyProgressBar");
    if (label) label.textContent = `${percent}%`;
    if (bar) bar.style.width = `${percent}%`;
  }

  function setJourneyStatus(card, status) {
    card.dataset.status = status;
    const button = card.querySelector("[data-journey-status]");
    if (button) button.textContent = journeyLabels[status];
  }

  journeyCards.forEach((card) => {
    const week = card.dataset.journeyWeek;
    setJourneyStatus(card, savedJourney[week] || card.dataset.defaultStatus || "wait");
    card.querySelector("[data-journey-status]")?.addEventListener("click", () => {
      const nextIndex = (journeyOrder.indexOf(card.dataset.status) + 1) % journeyOrder.length;
      setJourneyStatus(card, journeyOrder[nextIndex]);
      const state = Object.fromEntries(journeyCards.map((item) => [item.dataset.journeyWeek, item.dataset.status]));
      writeJson(journeyKey, state);
      updateJourneySummary();
    });
  });
  updateJourneySummary();

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
    const button = document.createElement("button");
    button.type = "button";
    button.className = "compare-toggle";
    button.dataset.compare = id;
    button.textContent = "비교 담기";
    button.setAttribute("aria-pressed", "false");
    button.title = "최대 3개 후보의 난이도와 기대 효과를 나란히 비교합니다.";
    card.appendChild(button);
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
})();
