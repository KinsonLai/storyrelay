import {
  parseBridgeRequest,
  bindBridgeCall,
  bridgeRisk,
  makeBootstrap,
  bridgeResult,
} from "./core.mjs";

const SITE_ORIGIN = __profile.origin;
const DS_ORIGIN = "https://chat.deepseek.com";
const KEY = "storyrelay-v1:",
  instance = crypto.randomUUID();
const read = (k) => GM_getValue(KEY + k, null),
  put = (k, v) => GM_setValue(KEY + k, v),
  del = (k) => GM_deleteValue(KEY + k);
if (![SITE_ORIGIN, DS_ORIGIN].includes(location.origin))
  throw Error("不支援的中繼來源。");
const host = document.createElement("div");
host.id = "storyrelay-bridge";
const root = host.attachShadow({ mode: "open" });
document.body.append(host);
root.innerHTML = `<style>:host{all:initial;position:fixed;right:16px;top:18px;z-index:2147483640;font:14px/1.55 system-ui;color:#eef0e6}details{width:330px;max-height:88vh;overflow:auto;background:#15221e;border:1px solid #647c67;border-radius:14px;box-shadow:0 8px 30px #0006}summary{cursor:pointer;padding:12px;font-weight:650}section{padding:0 14px 14px}p{margin:8px 0;color:#cdd8ca}button,select,textarea{font:inherit;box-sizing:border-box;width:100%;margin:4px 0;padding:9px;border-radius:7px;border:1px solid #687e68;background:#26362d;color:#f3f2e8}button{cursor:pointer;background:#ccd9bc;color:#142319}button.secondary{background:#26362d;color:#eee}button:disabled{opacity:.5;cursor:default}textarea{resize:vertical;min-height:90px}label{display:block;margin:6px 0}input{margin-right:7px}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto;background:#0d1712;padding:9px;font:12px/1.4 monospace}small{display:block;color:#b9cbb7}.error{color:#ffb9a6}.ok{color:#d7ecaa}</style><details open><summary>StoryRelay · 冒險中繼</summary><section id="panel"></section></details>`;
const panel = root.querySelector("#panel");
const status = document.createElement("p");
status.setAttribute("role", "status");
const log = document.createElement("pre");
log.hidden = true;
const detail = document.createElement("details");
const detailTitle = document.createElement("summary");
detailTitle.textContent = "查看詳情 / Details";
detail.append(detailTitle, log);
const report = (s, error = false) => {
  status.textContent = s;
  status.className = error ? "error" : "ok";
};
const show = (v) => {
  log.hidden = false;
  log.textContent = typeof v === "string" ? v : JSON.stringify(v, null, 2);
};
const button = (text, handler, secondary = false) => {
  const b = document.createElement("button");
  b.textContent = text;
  if (secondary) b.className = "secondary";
  b.addEventListener("click", (e) => {
    if (e.isTrusted)
      Promise.resolve(handler()).catch((err) => report(err.message, true));
  });
  return b;
};
const visibleText = (tag, text) => {
  const e = document.createElement(tag);
  e.textContent = text;
  return e;
};

if (location.origin === SITE_ORIGIN) {
  panel.append(
    visibleText(
      "p",
      "在同一個 Chrome 保持此頁登入，工具只送到本站登入保護的中繼入口。此頁不需要 API key。",
    ),
  );
  let active = false,
    busy = false,
    controller = null;
  const seen = new Set();
  const activateRelay = () => {
    active = true;
    put("leader", { id: instance, expires: Date.now() + 120000 });
    report("世界已就緒，回到 DeepSeek 即可連接。");
  };
  const activate = button("啟用此頁作為 MCP 中繼", activateRelay);
  const pause = button(
    "停止中繼",
    () => {
      active = false;
      if (read("leader")?.id === instance) del("leader");
      controller?.abort();
      report("中繼已停止。進行中的提交請查收據，勿換鍵重放。");
    },
    true,
  );
  const login = document.createElement("a");
  login.href = "/signin-with-chatgpt?return_to=%2Fdeepseek";
  login.target = "_top";
  login.textContent = "登入／重新登入世界站";
  login.style.color = "#e2cb94";
  panel.append(login, activate, pause, status, detail);
  report("尚未啟用；只在需要遊玩時開啟。");
  setInterval(() => {
    if (!active) return;
    if (read("leader")?.id !== instance) {
      active = false;
      report("另一個世界分頁已接管中繼。", true);
      return;
    }
    put("leader", { id: instance, expires: Date.now() + 120000 });
  }, 3000);
  const handle = async (req) => {
    if (
      !__srEnabled ||
      !active ||
      read("leader")?.id !== instance ||
      !req ||
      req.leader !== instance ||
      req.expires < Date.now() ||
      seen.has(req.id)
    )
      return;
    if (
      typeof req.id !== "string" ||
      !/^https:\/\/chat\.deepseek\.com\//.test(req.source) ||
      !["tools/list", "tools/call"].includes(req.method)
    )
      return;
    if (
      req.method === "tools/call" &&
      (!req.params ||
        typeof req.params.name !== "string" ||
        !req.params.arguments ||
        typeof req.params.arguments !== "object")
    )
      return;
    const quiet = [
      "list_if_branches",
      "get_scene_recovery",
      "get_adventure_context",
      "read_operation_guide",
      "corpus_info",
    ];
    if (req.method === "tools/call" && !quiet.includes(req.params.name)) {
      const lease = read("client");
      if (
        lease?.id !== req.client ||
        lease?.nonce !== req.nonce ||
        lease?.expires < Date.now()
      )
        return;
    }
    const reply = (value) => put("response:" + req.id, value);
    if (busy) {
      reply({ error: "中繼忙碌，請等目前操作完成。" });
      return;
    }
    seen.add(req.id);
    if (seen.size > 120) seen.delete(seen.values().next().value);
    busy = true;
    report("處理 " + (req.params?.name ?? req.method) + "…");
    controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);
    try {
      const response = await fetch(__profile.endpoint, {
        method: "POST",
        credentials: "same-origin",
        mode: "same-origin",
        redirect: "error",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: req.id,
          method: req.method,
          params: req.params,
        }),
        signal: controller.signal,
      });
      if (!response.ok)
        throw Error(
          response.status === 401 || response.status === 403
            ? "請在同一 Chrome 登入有權使用此世界站點的帳戶。"
            : "MCP HTTP " + response.status + "；若為提交請以原鍵查收據。",
        );
      const raw = await response.text();
      if (raw.length > 130000) throw Error("MCP回應過大，請使用分頁。");
      const envelope = JSON.parse(raw);
      reply({ envelope });
      report("已回傳 " + (req.params?.name ?? req.method) + " 的實際結果。");
    } catch (e) {
      reply({
        error:
          e.name === "AbortError"
            ? "MCP等待逾時；結果未確認，請保留原提交鍵查收據。"
            : e.message,
      });
      report("未能確認本次結果，請查看 DeepSeek 中繼面板。", true);
    } finally {
      clearTimeout(timeout);
      controller = null;
      busy = false;
    }
  };
  GM_addValueChangeListener(KEY + "request", (_k, _old, value) => {
    handle(value);
  });
  activateRelay();
} else {
  let tools = [],
    run = null,
    inflight = false,
    lastResult = null,
    lastSeenText = "",
    lastChanged = 0,
    pendingApproval = null;
  const nativeInput = () => document.querySelector("textarea[placeholder]");
  const messages = () =>
    Array.from(document.querySelectorAll(".ds-assistant-message-main-content"));
  const nativePrimary = () =>
    nativeInput()?.parentElement?.parentElement?.querySelector(
      ".ds-button--primary",
    );
  const rpc = async (method, params) => {
    if (!__srEnabled) throw Error("世界已中斷，請重新連接。");
    const leader = read("leader");
    if (!leader || leader.expires < Date.now())
      throw Error(
        "請先在同一 Chrome 開啟世界站並按「啟用此頁作為 MCP 中繼」。",
      );
    const id = crypto.randomUUID(),
      key = KEY + "response:" + id;
    return new Promise((resolve, reject) => {
      let listener;
      const cleanup = () => {
        clearTimeout(timer);
        if (listener !== undefined) GM_removeValueChangeListener(listener);
        GM_deleteValue(key);
        if (read("request")?.id === id) del("request");
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(Error("中繼等待逾時；提交結果未確認，保留原鍵查收據。"));
      }, 45000);
      listener = GM_addValueChangeListener(key, (_key, _old, response) => {
        if (!response) return;
        cleanup();
        if (response.error) reject(Error(response.error));
        else resolve(response.envelope);
      });
      put("request", {
        id,
        leader: leader.id,
        client: instance,
        nonce: run?.nonce ?? null,
        expires: Date.now() + 45000,
        source: location.origin + location.pathname,
        method,
        params,
      });
    });
  };
  const call = async (name, args) =>
    bridgeResult(await rpc("tools/call", { name, arguments: args }), name);
  const stop = (reason = "本回合已停止。") => {
    if (read("client")?.id === instance) del("client");
    if (run) run.active = false;
    pendingApproval = null;
    approve.hidden = true;
    for (const control of [branchSelect, action, autoCommit, connect, start])
      control.disabled = false;
    autoCommit.checked = false;
    report(reason);
  };
  const sendText = async (text) => {
    if (text.length > 72000)
      throw Error(
        "內容超過單次網頁回傳預算；已保留結果，請改用分頁或手動查閱。",
      );
    const input = nativeInput();
    if (!input) throw Error("找不到 DeepSeek 輸入框；請先完成登入。");
    if (input.value.trim())
      throw Error(
        "DeepSeek 輸入框已有未送文字，請先處理，避免被工具結果覆蓋。",
      );
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    ).set.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    await new Promise((resolve) => setTimeout(resolve, 180));
    const primary = nativePrimary();
    if (autoSend.checked) {
      if (!primary || primary.classList.contains("ds-button--disabled"))
        throw Error("工具內容已填入；請手動按 DeepSeek 送出。");
      primary.click();
    } else report("內容已填入 DeepSeek，請手動送出。");
  };
  const branchSelect = document.createElement("select");
  branchSelect.setAttribute("aria-label", "遊戲分支");
  branchSelect.append(new Option("先連接以讀取分支", ""));
  const action = document.createElement("textarea");
  action.placeholder = "本回合玩家行動";
  action.setAttribute("aria-label", "本回合玩家行動");
  const autoSend = document.createElement("input");
  autoSend.type = "checkbox";
  autoSend.checked = true;
  const sendLabel = document.createElement("label");
  sendLabel.append(autoSend, document.createTextNode("自動送出協議與工具結果"));
  const autoCommit = document.createElement("input");
  autoCommit.type = "checkbox";
  const commitLabel = document.createElement("label");
  commitLabel.append(
    autoCommit,
    document.createTextNode("允許本回合自動提交到所選分支"),
  );
  let connecting = false;
  const connect = button("連接世界 MCP", async () => {
    if (connecting) return;
    connecting = true;
    connect.disabled = true;
    report("正在讀取 MCP 工具與分支…");
    try {
      if (run?.active) throw Error("請先停止目前回合再重新連接。");
      await chrome.runtime.sendMessage({ type: "OPEN_WORLD" });
      for (
        let n = 0;
        n < 20 && (!read("leader") || read("leader").expires < Date.now());
        n++
      )
        await new Promise((r) => setTimeout(r, 500));
      const envelope = await rpc("tools/list", {});
      if (!Array.isArray(envelope.result?.tools))
        throw Error("未取得工具清單。");
      tools = envelope.result.tools;
      const r = await call("list_if_branches", {});
      if (r.isError) throw Error(r.result.message ?? JSON.stringify(r.result));
      branchSelect.replaceChildren(new Option("請明確選擇一條遊戲分支", ""));
      if (r.result.main)
        branchSelect.append(
          new Option(
            "正式線 · 第" + r.result.main.revision + "版",
            r.result.main.branch_id,
          ),
        );
      for (const b of r.result.if_branches ?? [])
        branchSelect.append(
          new Option(b.name + " · 第" + b.revision + "版", b.branch_id),
        );
      report("已取得 " + tools.length + " 個工具；請選分支及輸入玩家行動。");
    } finally {
      connecting = false;
      connect.disabled = Boolean(run?.active);
    }
  });
  const start = button("開始本回合", async () => {
    if (inflight || run?.active) throw Error("本回合仍在執行，請先停止。");
    if (!tools.length || !branchSelect.value || !action.value.trim())
      throw Error("請先連接、選分支並輸入本回合行動。");
    if (action.value.length > 2000) throw Error("玩家行動最多2000字。");
    const lease = read("client");
    if (lease && lease.id !== instance && lease.expires > Date.now())
      throw Error("另一個 DeepSeek 分頁仍在執行，請先停止該回合。");
    run = {
      nonce: crypto.randomUUID(),
      branch: branchSelect.value,
      action: action.value,
      active: true,
      autoCommit: autoCommit.checked,
      baselineText: messages().at(-1)?.innerText ?? "",
      path: location.pathname,
      calls: new Map(),
      count: 0,
      roundTrips: 0,
      committed: false,
    };
    for (const control of [branchSelect, action, autoCommit, connect, start])
      control.disabled = true;
    put("client", {
      id: instance,
      nonce: run.nonce,
      expires: Date.now() + 120000,
    });
    lastSeenText = "";
    lastChanged = Date.now();
    try {
      await sendText(makeBootstrap(run, tools));
      report("已開始本回合；等待 DeepSeek 工具請求。");
    } catch (e) {
      stop(e.message);
      throw e;
    }
  });
  const approve = button("確認執行上方寫入操作", async () => {
    if (!pendingApproval || !run?.active) return;
    const work = pendingApproval;
    pendingApproval = null;
    approve.hidden = true;
    detail.open = false;
    await execute(work.packet, work.bound, true);
  });
  approve.hidden = true;
  const execute = async (packet, bound, approved = false) => {
    if (!run?.active || inflight) return;
    const currentRun = run,
      risk = bridgeRisk(bound.name, tools);
    if (
      !approved &&
      (risk === "control" || (risk === "commit" && !currentRun.autoCommit))
    ) {
      pendingApproval = { packet, bound };
      detail.open = true;
      show({
        分支: currentRun.branch,
        工具: bound.name,
        正文: bound.arguments.narration,
        摘要: bound.arguments.summary,
        變更: bound.arguments.changes,
        目標版本: bound.arguments.target_revision,
        新分支名稱: bound.arguments.name,
        分歧意圖: bound.arguments.premise,
      });
      approve.hidden = false;
      report("請檢查提案正文與變更後確認。");
      return;
    }
    const signature = JSON.stringify(bound),
      prior = currentRun.calls.get(packet.call_id);
    if (prior && prior.signature !== signature)
      throw Error("同一call_id不能改成另一個請求。");
    if (!prior && currentRun.count >= 16)
      throw Error("本回合已達16次工具上限，請檢查狀態後另開玩家回合。");
    if (currentRun.roundTrips++ >= 24)
      throw Error("本回合工具往返已達上限，請停止後查閱狀態。");
    inflight = true;
    approve.hidden = true;
    report("執行 " + bound.name + "…");
    try {
      let response = prior?.response;
      if (!response) {
        currentRun.count++;
        put("last_request", {
          branch: currentRun.branch,
          nonce: currentRun.nonce,
          tool: bound.name,
          arguments: bound.arguments,
          call_id: packet.call_id,
          created_at: new Date().toISOString(),
          status: "pending",
        });
        response = await call(bound.name, bound.arguments);
        currentRun.calls.set(packet.call_id, { signature, response });
        put("last_request", {
          branch: currentRun.branch,
          nonce: currentRun.nonce,
          tool: bound.name,
          idempotency_key: bound.arguments.idempotency_key,
          call_id: packet.call_id,
          status: response.result?.committed ? "committed" : "returned",
        });
      }
      if (!currentRun.active || run !== currentRun) {
        lastResult = response;
        show(response);
        report("回合已停止；已保留實際結果，請查看收據。");
        return;
      }
      if (response.result?.committed) {
        currentRun.committed = true;
        report(
          "雲端已提交第" +
            response.result.revision +
            "版；等待 DeepSeek 敘述。",
        );
      }
      lastResult = response;
      show({
        工具: bound.name,
        isError: response.isError,
        committed: response.result?.committed,
        revision: response.result?.revision,
        錯誤: response.isError ? response.result : undefined,
      });
      currentRun.baselineText = messages().at(-1)?.innerText ?? "";
      lastSeenText = "";
      const reply =
        "STORYRELAY_MCP_RESULT_V1\n" +
        JSON.stringify({
          nonce: currentRun.nonce,
          call_id: packet.call_id,
          request_reference: {
            branch_id: currentRun.branch,
            idempotency_key: bound.arguments.idempotency_key,
          },
          ...response,
        }) +
        "\n這是真正的MCP結果，不是玩家新行動。若isError先依錯誤修正，不假裝成功；只在原授權內繼續。需要下一工具時依原協議輸出；完成且有committed收據後寫場景及snapshot。";
      await sendText(reply);
      if (risk === "control")
        stop("分支控制操作已回傳；請先核對結果，再明確選擇分支開始下一回合。");
    } catch (e) {
      show({
        工具: bound.name,
        參數: bound.arguments,
        錯誤: e.message,
        提醒: "結果未確認；保留原鍵查收據，不換鍵重放。",
      });
      stop("工具結果未確認，請按「查回上次提交」。");
      report(e.message, true);
    } finally {
      inflight = false;
    }
  };
  const poll = async (force = false) => {
    if (!run?.active || inflight || pendingApproval) return;
    if (read("client")?.id !== instance) {
      stop("另一個對話已接管中繼。");
      return;
    }
    if (run.path === "/" && location.pathname.startsWith("/a/chat/s/"))
      run.path = location.pathname;
    if (run.path !== location.pathname) {
      stop("對話網址已改變，已停止工具執行。");
      return;
    }
    const last = messages().at(-1);
    if (!last) return;
    const text = last.innerText;
    if (text === run.baselineText) return;
    if (text !== lastSeenText) {
      lastSeenText = text;
      lastChanged = Date.now();
      if (!force) return;
    }
    const primary = nativePrimary(),
      idle =
        primary?.classList.contains("ds-button--disabled") &&
        !nativeInput()?.value;
    if (!force && (!idle || Date.now() - lastChanged < 1800)) return;
    try {
      let source = text;
      const code = last.querySelector("pre code,pre");
      if (text.trim().startsWith("STORYRELAY_MCP_REQUEST_V1") && code)
        source = "STORYRELAY_MCP_REQUEST_V1\n" + code.textContent;
      const packet = parseBridgeRequest(source, run.nonce);
      if (!packet) {
        stop(
          run.committed
            ? "本回合完成，雲端提交已有收據。"
            : "DeepSeek已回覆；本回合尚無提交收據。",
        );
        return;
      }
      const bound = bindBridgeCall(packet, run, tools);
      await execute(packet, bound);
    } catch (e) {
      stop("工具請求未執行。");
      report(e.message, true);
      show("請修正工具請求後重新核對。沒有由本機編造或改寫存檔。");
    }
  };
  const recover = button(
    "查回上次提交",
    async () => {
      const last = read("last_request");
      if (!last?.branch) throw Error("本機沒有上次請求紀錄。");
      const r = await call("get_scene_recovery", {
        branch_id: last.branch,
        ...(last.idempotency_key || last.arguments?.idempotency_key
          ? {
              idempotency_key:
                last.idempotency_key ?? last.arguments.idempotency_key,
            }
          : {}),
      });
      lastResult = r;
      show(r);
      report(
        r.result?.submission?.status === "committed"
          ? "已找回真實成功收據。"
          : "已讀恢復資料；未確認前不要換鍵重放。",
      );
    },
    true,
  );
  const resend = button(
    "將上次結果送回 DeepSeek",
    async () => {
      if (!lastResult) throw Error("目前沒有可回傳結果。");
      await sendText(
        "STORYRELAY_MCP_RESULT_V1\n" +
          JSON.stringify(lastResult) +
          "\n請以實際回覆核對提交狀態，不把未確認內容當已發生。",
      );
    },
    true,
  );
  panel.append(
    visibleText("small", "網頁對話中繼 · 無模型 API key"),
    connect,
    branchSelect,
    action,
    sendLabel,
    commitLabel,
    start,
    button("停止本回合", () => stop(), true),
    button("手動讀取完成的工具請求", () => poll(true), true),
    status,
    detail,
    approve,
    recover,
    resend,
    visibleText(
      "small",
      "只在點「開始」後讀取本回合新回覆。上次未確認請求保留於本機，用於查收據；不讀取登入憑證。",
    ),
  );
  report("先在世界站啟用中繼，再按「連接」。");
  setInterval(() => {
    if (run?.active && read("client")?.id === instance)
      put("client", {
        id: instance,
        nonce: run.nonce,
        expires: Date.now() + 120000,
      });
    poll().catch((e) => report(e.message, true));
  }, 800);
}
