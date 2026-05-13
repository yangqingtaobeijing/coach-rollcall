(function () {
  const STORAGE_KEY = "coach-rollcall:v1";
  const STATUS = {
    pending: "未点",
    arrived: "已到",
    absent: "未到"
  };

  const state = {
    title: "",
    people: [],
    filter: "all",
    search: "",
    draftRows: [],
    draftHeaders: [],
    deferredInstallPrompt: null
  };

  const els = {
    setupPanel: document.getElementById("setupPanel"),
    mappingPanel: document.getElementById("mappingPanel"),
    rollcallPanel: document.getElementById("rollcallPanel"),
    excelInput: document.getElementById("excelInput"),
    pasteInput: document.getElementById("pasteInput"),
    parsePasteButton: document.getElementById("parsePasteButton"),
    hasHeaderCheckbox: document.getElementById("hasHeaderCheckbox"),
    nameColumn: document.getElementById("nameColumn"),
    phoneColumn: document.getElementById("phoneColumn"),
    idColumn: document.getElementById("idColumn"),
    previewTable: document.querySelector("#previewTable tbody"),
    cancelImportButton: document.getElementById("cancelImportButton"),
    confirmImportButton: document.getElementById("confirmImportButton"),
    groupTitle: document.getElementById("groupTitle"),
    saveState: document.getElementById("saveState"),
    stats: document.getElementById("stats"),
    searchInput: document.getElementById("searchInput"),
    peopleList: document.getElementById("peopleList"),
    emptyState: document.getElementById("emptyState"),
    clearRoundButton: document.getElementById("clearRoundButton"),
    showImportButton: document.getElementById("showImportButton"),
    markVisibleArrivedButton: document.getElementById("markVisibleArrivedButton"),
    installButton: document.getElementById("installButton"),
    toast: document.getElementById("toast")
  };

  let saveTimer = 0;
  let toastTimer = 0;

  init();

  function init() {
    loadState();
    bindEvents();
    registerServiceWorker();
    render();
  }

  function bindEvents() {
    els.excelInput.addEventListener("change", handleFileImport);
    els.parsePasteButton.addEventListener("click", handlePasteImport);
    els.hasHeaderCheckbox.addEventListener("change", () => {
      buildColumnOptions();
      renderPreview();
    });
    [els.nameColumn, els.phoneColumn, els.idColumn].forEach((select) => {
      select.addEventListener("change", renderPreview);
    });
    els.cancelImportButton.addEventListener("click", resetImport);
    els.confirmImportButton.addEventListener("click", confirmImport);
    els.groupTitle.addEventListener("input", () => {
      state.title = els.groupTitle.value.trim();
      persistSoon();
    });
    els.searchInput.addEventListener("input", () => {
      state.search = els.searchInput.value.trim();
      renderPeople();
    });
    document.querySelectorAll(".segmented button").forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        renderFilterButtons();
        renderPeople();
      });
    });
    els.clearRoundButton.addEventListener("click", clearRound);
    els.showImportButton.addEventListener("click", () => {
      els.setupPanel.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    els.markVisibleArrivedButton.addEventListener("click", markVisibleArrived);
    els.peopleList.addEventListener("click", handlePeopleClick);
    els.installButton.addEventListener("click", installApp);
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.deferredInstallPrompt = event;
      els.installButton.hidden = false;
    });
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      state.title = saved.title || "";
      state.people = Array.isArray(saved.people) ? saved.people : [];
    } catch (error) {
      showToast("本地数据读取失败，请重新导入名单");
    }
  }

  function persistSoon() {
    clearTimeout(saveTimer);
    els.saveState.textContent = "正在保存...";
    saveTimer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        title: state.title,
        people: state.people
      }));
      els.saveState.textContent = "已保存在本机";
    }, 140);
  }

  function render() {
    const hasPeople = state.people.length > 0;
    els.setupPanel.hidden = hasPeople;
    els.rollcallPanel.hidden = !hasPeople;
    els.mappingPanel.hidden = true;
    els.groupTitle.value = state.title || "";
    renderStats();
    renderFilterButtons();
    renderPeople();
  }

  async function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
        defval: "",
        blankrows: false
      });
      prepareDraft(rows, file.name.replace(/\.[^.]+$/, ""));
    } catch (error) {
      showToast("Excel 解析失败，请确认文件格式正确");
    } finally {
      event.target.value = "";
    }
  }

  function handlePasteImport() {
    const text = els.pasteInput.value.trim();
    if (!text) {
      showToast("请先粘贴表格内容");
      return;
    }
    prepareDraft(parsePastedTable(text), "");
  }

  function prepareDraft(rows, defaultTitle) {
    const cleanRows = rows
      .map((row) => row.map((cell) => normalizeCell(cell)))
      .filter((row) => row.some(Boolean));

    if (cleanRows.length < 1) {
      showToast("没有识别到有效名单");
      return;
    }

    state.draftRows = cleanRows;
    state.draftHeaders = cleanRows[0];
    if (!state.title && defaultTitle) {
      state.title = defaultTitle;
    }

    buildColumnOptions();
    renderPreview();
    els.setupPanel.hidden = true;
    els.mappingPanel.hidden = false;
    els.rollcallPanel.hidden = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildColumnOptions() {
    const headers = getCurrentHeaders();
    [els.nameColumn, els.phoneColumn, els.idColumn].forEach((select) => {
      select.innerHTML = "";
      headers.forEach((header, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${columnName(index)} ${header || "空列"}`;
        select.appendChild(option);
      });
    });

    els.nameColumn.value = String(guessColumn(headers, ["姓名", "游客", "旅客", "客户", "name"], 0));
    els.phoneColumn.value = String(guessColumn(headers, ["手机", "电话", "联系方式", "mobile", "phone", "tel"], 1));
    els.idColumn.value = String(guessColumn(headers, ["身份证", "证件", "证号", "id"], 2));
  }

  function renderPreview() {
    const rows = buildPeopleFromDraft().slice(0, 8);
    els.previewTable.innerHTML = "";
    rows.forEach((person) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(person.name)}</td>
        <td>${escapeHtml(person.phone)}</td>
        <td>${escapeHtml(person.idLast4)}</td>
      `;
      els.previewTable.appendChild(tr);
    });
  }

  function confirmImport() {
    const people = buildPeopleFromDraft();
    if (!people.length) {
      showToast("没有可用人员，请检查字段选择");
      return;
    }

    state.people = people;
    state.title = state.title || "本次点名";
    state.search = "";
    els.searchInput.value = "";
    els.pasteInput.value = "";
    els.mappingPanel.hidden = true;
    els.rollcallPanel.hidden = false;
    els.setupPanel.hidden = true;
    els.groupTitle.value = state.title;
    persistSoon();
    renderStats();
    renderPeople();
    showToast(`已导入 ${people.length} 人`);
  }

  function buildPeopleFromDraft() {
    const start = els.hasHeaderCheckbox.checked ? 1 : 0;
    const nameIndex = Number(els.nameColumn.value);
    const phoneIndex = Number(els.phoneColumn.value);
    const idIndex = Number(els.idColumn.value);

    return state.draftRows
      .slice(start)
      .map((row, index) => {
        const name = normalizeName(row[nameIndex]);
        const phone = normalizePhone(row[phoneIndex]);
        const idNumber = normalizeId(row[idIndex]);
        return {
          id: makeId(name, phone, idNumber, index),
          name,
          phone,
          idLast4: idNumber.slice(-4),
          status: "pending"
        };
      })
      .filter((person) => person.name || person.phone);
  }

  function resetImport() {
    state.draftRows = [];
    state.draftHeaders = [];
    els.mappingPanel.hidden = true;
    els.setupPanel.hidden = false;
  }

  function clearRound() {
    if (!state.people.length) return;
    const ok = window.confirm("清空本轮点名标记？名单会保留。");
    if (!ok) return;
    state.people = state.people.map((person) => ({ ...person, status: "pending" }));
    state.filter = "all";
    persistSoon();
    renderStats();
    renderFilterButtons();
    renderPeople();
    showToast("本轮标记已清空");
  }

  function markVisibleArrived() {
    const visibleIds = new Set(getVisiblePeople().map((person) => person.id));
    if (!visibleIds.size) return;
    if (visibleIds.size > 1) {
      const ok = window.confirm(`将当前列表 ${visibleIds.size} 人全部设为已到？`);
      if (!ok) return;
    }
    state.people = state.people.map((person) => (
      visibleIds.has(person.id) ? { ...person, status: "arrived" } : person
    ));
    persistSoon();
    renderStats();
    renderPeople();
    showToast(`已将当前列表 ${visibleIds.size} 人设为已到`);
  }

  function handlePeopleClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const row = button.closest("[data-id]");
    const personId = row && row.dataset.id;
    if (!personId) return;
    const action = button.dataset.action;

    if (action === "arrived" || action === "absent") {
      updatePersonStatus(personId, action);
    }
  }

  function updatePersonStatus(personId, nextStatus) {
    state.people = state.people.map((person) => {
      if (person.id !== personId) return person;
      return {
        ...person,
        status: person.status === nextStatus ? "pending" : nextStatus
      };
    });
    persistSoon();
    renderStats();
    renderPeople();
  }

  function renderStats() {
    const total = state.people.length;
    const arrived = state.people.filter((person) => person.status === "arrived").length;
    const absent = state.people.filter((person) => person.status === "absent").length;
    const pending = state.people.filter((person) => person.status === "pending").length;
    const stats = [
      ["总人数", total],
      ["已到", arrived],
      ["未到", absent],
      ["未点", pending]
    ];
    els.stats.innerHTML = stats.map(([label, value]) => `
      <div class="stat">
        <strong>${value}</strong>
        <span>${label}</span>
      </div>
    `).join("");
  }

  function renderFilterButtons() {
    document.querySelectorAll(".segmented button").forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === state.filter);
    });
  }

  function renderPeople() {
    const people = getVisiblePeople();
    els.peopleList.innerHTML = "";
    els.emptyState.hidden = people.length > 0;

    const fragment = document.createDocumentFragment();
    people.forEach((person) => {
      const row = document.createElement("article");
      row.className = "person-row";
      row.dataset.id = person.id;
      row.innerHTML = `
        <div class="person-main">
          <div>
            <div class="person-name">${escapeHtml(person.name || "未命名")}</div>
            <div class="person-meta">
              <span>${escapeHtml(person.phone || "无手机号")}</span>
              <span>身份证后四位 ${escapeHtml(person.idLast4 || "----")}</span>
            </div>
          </div>
          <span class="badge ${person.status}">${STATUS[person.status]}</span>
        </div>
        <div class="person-actions">
          <button class="status-button arrived ${person.status === "arrived" ? "active" : ""}" data-action="arrived">已到</button>
          <button class="status-button absent ${person.status === "absent" ? "active" : ""}" data-action="absent">未到</button>
          <a class="dial-button" href="${person.phone ? `tel:${encodeURIComponent(person.phone)}` : "#"}" aria-label="拨打 ${escapeHtml(person.name)} 电话">拨号</a>
        </div>
      `;
      fragment.appendChild(row);
    });
    els.peopleList.appendChild(fragment);
  }

  function getVisiblePeople() {
    const keyword = state.search.toLowerCase();
    return state.people.filter((person) => {
      const byFilter = state.filter === "all" || person.status === state.filter;
      const haystack = `${person.name} ${person.phone} ${person.idLast4}`.toLowerCase();
      return byFilter && (!keyword || haystack.includes(keyword));
    });
  }

  function parsePastedTable(text) {
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
    const delimiter = text.includes("\t") ? "\t" : ",";
    return lines.map((line) => delimiter === "\t" ? line.split("\t") : parseCsvLine(line));
  }

  function parseCsvLine(line) {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && quoted && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  }

  function getCurrentHeaders() {
    if (!state.draftRows.length) return [];
    if (els.hasHeaderCheckbox.checked) {
      return state.draftRows[0];
    }
    const maxColumns = Math.max(...state.draftRows.map((row) => row.length));
    return Array.from({ length: maxColumns }, (_, index) => columnName(index));
  }

  function guessColumn(headers, candidates, fallback) {
    const index = headers.findIndex((header) => {
      const normalized = String(header).trim().toLowerCase();
      return candidates.some((candidate) => normalized.includes(candidate.toLowerCase()));
    });
    if (index >= 0) return index;
    return Math.min(fallback, Math.max(headers.length - 1, 0));
  }

  function normalizeCell(cell) {
    if (cell == null) return "";
    return String(cell).trim();
  }

  function normalizeName(value) {
    return normalizeCell(value).replace(/\s+/g, "");
  }

  function normalizePhone(value) {
    const text = normalizeCell(value);
    const match = text.match(/(?:\+?86[- ]?)?1[3-9]\d{9}/);
    return match ? match[0].replace(/^\+?86[- ]?/, "") : text.replace(/[^\d+]/g, "");
  }

  function normalizeId(value) {
    return normalizeCell(value).replace(/\s/g, "").toUpperCase();
  }

  function makeId(name, phone, idNumber, index) {
    return `${name || "n"}-${phone || "p"}-${idNumber.slice(-6) || index}-${index}`;
  }

  function columnName(index) {
    let n = index + 1;
    let name = "";
    while (n > 0) {
      const remainder = (n - 1) % 26;
      name = String.fromCharCode(65 + remainder) + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 2400);
  }

  async function installApp() {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    els.installButton.hidden = true;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {
        showToast("离线缓存注册失败，仍可在线使用");
      });
    });
  }
}());
