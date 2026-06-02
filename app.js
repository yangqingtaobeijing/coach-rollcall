(function () {
  const CHECKLIST_KEY = "earthquake-guide:checks:v1";

  const scenarios = {
    city: {
      title: "城市街区",
      visual: "玻璃、招牌、车流是主要风险",
      risks: ["玻璃幕墙", "广告牌", "高空坠物", "拥挤道路"],
      during: [
        "如果在室内，立即趴下、掩护、稳住，远离窗户和外墙。",
        "如果在室外，迅速移动到空旷处，避开楼体外立面、路灯、树木、电线杆和围墙。",
        "在人群密集处不要逆行奔跑，保护头颈，沿安全方向缓慢移动。"
      ],
      after: [
        "震动停止后再撤离，避开玻璃碎片、坠落物和受损外墙。",
        "不要围观受损建筑、燃气泄漏点和救援通道。",
        "关注当地官方应急信息，按社区或现场人员指引前往避难场所。"
      ],
      warning: [
        "不要躲在建筑物门口、广告牌下、天桥下或狭窄巷道内。",
        "闻到燃气味时不要开关电器或使用明火，撤离后报警。"
      ]
    },
    rural: {
      title: "农村与山区",
      visual: "房屋结构、山体和河岸要重点判断",
      risks: ["土坯房", "山体滑坡", "落石", "堰塞湖"],
      during: [
        "在室内时先就地避险，远离土墙、房梁、炉灶和悬挂物。",
        "若身处空旷院落，避开围墙、牲畜棚、柴草垛、电线和老旧附属房。",
        "在山坡、崖边、沟谷时尽快向开阔高处移动，远离落石路线。"
      ],
      after: [
        "不要立即返回裂缝明显、墙体倾斜或屋顶受损的房屋。",
        "检查燃气罐、柴火、取暖设备和电线，避免次生火灾。",
        "暴雨或河水异常上涨时，警惕滑坡、泥石流和堰塞湖风险。"
      ],
      warning: [
        "老旧土木结构房屋余震中更容易倒塌。",
        "山区道路可能被落石阻断，撤离时不要贴山体行走。"
      ]
    },
    highrise: {
      title: "高层建筑",
      visual: "先稳住，再走楼梯有序撤离",
      risks: ["长周期摇晃", "电梯停运", "玻璃坠落", "楼梯拥堵"],
      during: [
        "不要冲向楼梯或电梯，先在结实桌下、承重墙附近或内侧角落保护头颈。",
        "远离落地窗、阳台、外墙、吊灯、柜体和大型屏幕。",
        "如果在电梯内，按下所有楼层按钮，停靠后立即离开电梯。"
      ],
      after: [
        "震动停止后穿鞋，带应急包，从安全楼梯撤离。",
        "不要使用电梯，不要在楼梯间推挤或停留拍摄。",
        "下楼后远离建筑外墙，防止玻璃和外立面材料坠落。"
      ],
      warning: [
        "高层摇晃时间可能更长，不代表建筑必然倒塌。",
        "若楼梯间受损或有浓烟，退回相对安全区域等待救援。"
      ]
    },
    lowrise: {
      title: "低层建筑",
      visual: "判断出口距离，但不冒险穿越危险区",
      risks: ["砖墙倒塌", "屋顶坠落", "烟囱水塔", "门廊结构"],
      during: [
        "如果距离安全出口很近且外部开阔，可快速到空旷处；否则先就地避险。",
        "室内避开外墙、窗户、柜子、炉具和可能倒塌的隔墙。",
        "不要躲在门框下，现代建筑门框并不一定更安全。"
      ],
      after: [
        "震停后从安全出口撤离，避开瓦片、烟囱、围墙和电线。",
        "关闭火源和燃气，确认家人情况后转移到空旷处。",
        "房屋出现明显裂缝、倾斜、异响时不要返回。"
      ],
      warning: [
        "低层建筑不等于安全，未经抗震设防的砖混、土木结构风险更高。",
        "余震前不要在受损房屋内清点财物。"
      ]
    },
    vehicle: {
      title: "驾车或公交",
      visual: "停车避开桥隧、电线和高架",
      risks: ["桥梁高架", "隧道", "交通事故", "道路塌陷"],
      during: [
        "驾驶时缓慢减速，靠路边安全处停车，避开桥梁、高架、隧道、山体和电线。",
        "停车后拉手刹，留在车内，打开应急灯，等待强震结束。",
        "公交或地铁内抓牢扶手，听从工作人员指挥，不擅自破窗或跳车。"
      ],
      after: [
        "确认道路状况后再行驶，避开裂缝、积水、塌方和救援通道。",
        "如果车辆被困，保留电量，用手机、喇叭、灯光或哨子求助。",
        "收听交通广播或官方通告，不盲目驶向灾区核心区域。"
      ],
      warning: [
        "不要停在桥下、高架下、楼体旁、树下或电线杆旁。",
        "震后道路承载能力可能下降，不要强行通过受损桥梁。"
      ]
    },
    coast: {
      title: "沿海地区",
      visual: "强震后立即考虑海啸撤离",
      risks: ["海啸", "港口设施", "液化地基", "堤岸坍塌"],
      during: [
        "先完成就地避险，保护头颈，远离玻璃和重物。",
        "如果强震持续时间长或站立困难，震后立即向高处或内陆撤离。",
        "在港口、码头、海滩、河口附近，不要留下观察海面变化。"
      ],
      after: [
        "沿海啸疏散标识前往高地，优先步行，避免道路拥堵。",
        "等待官方解除海啸警报后再返回海边或港口。",
        "远离液化喷砂、岸坡裂缝和受损堤防。"
      ],
      warning: [
        "海水异常退去可能是危险信号，不是捡拾海产品的机会。",
        "第一波海啸不一定最大，警报解除前不要返回。"
      ]
    }
  };

  const scenarioCard = document.getElementById("scenarioCard");
  const tabButtons = document.querySelectorAll("[data-scenario]");
  const checklistInputs = document.querySelectorAll("[data-check]");
  const backTopButton = document.getElementById("backTopButton");

  let animationFrame = 0;

  init();

  function init() {
    bindScenarioTabs();
    bindChecklist();
    bindBackTop();
    renderScenario("city");
    startSeismograph();
    registerServiceWorker();
  }

  function bindScenarioTabs() {
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.scenario;
        tabButtons.forEach((item) => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-selected", String(active));
        });
        renderScenario(id);
      });
    });
  }

  function bindChecklist() {
    const saved = readChecks();
    checklistInputs.forEach((input) => {
      input.checked = saved.includes(input.dataset.check);
      input.addEventListener("change", saveChecks);
    });
  }

  function bindBackTop() {
    backTopButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function renderScenario(id) {
    const scenario = scenarios[id];
    scenarioCard.innerHTML = `
      <div class="scenario-visual">
        <strong>${escapeHtml(scenario.visual)}</strong>
      </div>
      <div class="scenario-content">
        <div>
          <p class="eyebrow">当前场景</p>
          <h3>${escapeHtml(scenario.title)}</h3>
        </div>
        <div class="risk-meter">
          ${scenario.risks.map((risk) => `<span>${escapeHtml(risk)}</span>`).join("")}
        </div>
        <div class="action-columns">
          ${renderActionBlock("震时动作", scenario.during)}
          ${renderActionBlock("震后撤离", scenario.after)}
          ${renderActionBlock("特别风险", scenario.warning)}
        </div>
      </div>
    `;
  }

  function renderActionBlock(title, items) {
    return `
      <div>
        <h4>${escapeHtml(title)}</h4>
        <ul>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  function startSeismograph() {
    const canvas = document.getElementById("seismoCanvas");
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function draw(time) {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height * 0.52;
      context.clearRect(0, 0, width, height);
      context.lineWidth = 4;
      context.strokeStyle = "#d6a642";
      context.beginPath();

      for (let x = 0; x <= width; x += 4) {
        const phase = (x * 0.028) + (time * 0.006);
        const burst = Math.sin((x + time * 0.04) * 0.018) > 0.55 ? 1.8 : 0.6;
        const amplitude = (16 + 46 * Math.sin(x * 0.012) ** 2) * burst;
        const y = centerY + Math.sin(phase) * amplitude + Math.sin(phase * 2.6) * 12;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }

      context.shadowColor = "rgba(214, 166, 66, 0.55)";
      context.shadowBlur = 18;
      context.stroke();
      context.shadowBlur = 0;

      if (!reducedMotion) {
        animationFrame = requestAnimationFrame(draw);
      }
    }

    draw(0);
  }

  function readChecks() {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function saveChecks() {
    const checked = Array.from(checklistInputs)
      .filter((input) => input.checked)
      .map((input) => input.dataset.check);
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checked));
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.addEventListener("beforeunload", () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  });
}());
