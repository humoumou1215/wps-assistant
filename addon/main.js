(() => {
  const pageUrl = typeof location !== "undefined"
    ? new URL(location.href)
    : new URL("http://127.0.0.1:18766/addons/et/");
  const BRIDGE_URL = (() => {
    const url = new URL("/ws", pageUrl);
    url.protocol = pageUrl.protocol === "https:" ? "wss:" : "ws:";
    const portOverride = pageUrl.searchParams.get("bridgePort");
    if (portOverride && /^\d+$/.test(portOverride)) url.port = portOverride;
    return url.toString();
  })();
  const $status = typeof document !== "undefined" ? document.getElementById("status") : null;
  const $details = typeof document !== "undefined" ? document.getElementById("details") : null;
  const $dot = typeof document !== "undefined" ? document.getElementById("dot") : null;
  const hostFromUrl = typeof location !== "undefined" ? ["et", "wpp", "wps"].find((type) => location.pathname.includes(`/${type}/`)) : null;
  const onlyDocumentPath = pageUrl.searchParams.get("onlyDocument");
  let socket;
  let retryTimer;

  const getApplication = () => {
    const g = typeof window !== "undefined" ? window : globalThis;
    const wps = g.wps;
    if (wps && hostFromUrl) {
      const factory = { et: "EtApplication", wps: "WpsApplication", wpp: "WppApplication" }[hostFromUrl];
      try { if (typeof wps[factory] === "function") return wps[factory](); } catch (_) {}
    }
    return g.Application || wps?.Application || wps;
  };
  const safe = (fn, fallback) => { try { const value = fn(); return value == null ? fallback : value; } catch { return fallback; } };
  const getProp = (object, key) => safe(() => object?.[key], undefined);
  const toStringValue = (value) => safe(() => String(value), "");
  const normalizePath = (value) => toStringValue(value).replace(/^\/private\//, "/");
  const getCount = (collection) => Number(safe(() => collection?.Count, 0)) || 0;

  function appType(app) {
    if (hostFromUrl === "et") return "spreadsheet";
    if (hostFromUrl === "wpp") return "presentation";
    if (hostFromUrl === "wps") return "writer";
    const name = toStringValue(getProp(app, "Name")).toLowerCase();
    if (name.includes("演示") || name.includes("presentation") || getProp(app, "ActivePresentation")) return "presentation";
    if (name.includes("表格") || name.includes("spreadsheet") || getProp(app, "ActiveWorkbook")) return "spreadsheet";
    return "writer";
  }
  function itemAt(collection, index) {
    return safe(() => typeof collection?.Item === "function" ? collection.Item(index) : collection?.Item?.(index), undefined);
  }
  function enumerate(collection) {
    const out = [];
    const count = Math.min(getCount(collection), 500);
    for (let i = 1; i <= count; i++) { const item = itemAt(collection, i); if (item) out.push(item); }
    return out;
  }
  function selectionInfo(app, type) {
    if (type === "spreadsheet") {
      const selection = getProp(app, "Selection") || getProp(app, "ActiveCell");
      const sheet = getProp(app, "ActiveSheet");
      const address = safe(() => {
        const member = selection?.Address;
        return typeof member === "function" ? selection.Address() : member;
      }, undefined);
      return {
        ...(getProp(sheet, "Name") ? { sheet: toStringValue(getProp(sheet, "Name")) } : {}),
        ...(address !== undefined ? { address: toStringValue(address) } : {}),
        ...(getCount(getProp(selection, "Areas")) > 1 ? { areas: enumerate(getProp(selection, "Areas")).map(area => ({ address: toStringValue(safe(() => typeof area.Address === "function" ? area.Address() : area.Address, "")) })) } : {}),
      };
    }
    if (type === "presentation") {
      const windowObject = getProp(app, "ActiveWindow");
      const selection = getProp(windowObject, "Selection") || getProp(app, "Selection");
      const slide = getProp(getProp(windowObject, "View"), "Slide");
      const shapes = getProp(selection, "ShapeRange");
      const shapeNames = [];
      const shapeIds = [];
      for (const shape of enumerate(shapes)) {
        const name = getProp(shape, "Name");
        if (name) shapeNames.push(toStringValue(name));
        const id = getProp(shape, "Id");
        if (typeof id === "number") shapeIds.push(id);
      }
      // TextRange2 can return placeholder text on macOS. Only use TextRange
      // when WPS explicitly reports a text selection (ppSelectionText = 3).
      const nativeType = Number(getProp(selection, "Type"));
      const range = nativeType === 3 ? getProp(selection, "TextRange") : undefined;
      const text = getProp(range, "Text"), start = getProp(range, "Start"), length = getProp(range, "Length");
      return {
        type: nativeType === 3 ? "text" : shapeNames.length ? "shape" : "none",
        ...(nativeType ? { nativeType } : {}),
        ...(getProp(slide, "SlideIndex") !== undefined ? { slide: Number(getProp(slide, "SlideIndex")) } : {}),
        ...(getProp(slide, "SlideID") !== undefined ? { slideId: Number(getProp(slide, "SlideID")) } : {}),
        ...(shapeNames.length ? { shapeNames } : {}),
        ...(shapeIds.length ? { shapeIds } : {}),
        ...(typeof text === "string" ? { text } : {}),
        ...(typeof start === "number" ? { start } : {}),
        ...(typeof length === "number" ? { length } : {}),
      };
    }
    const selection = getProp(app, "Selection");
    if (!selection) return { type: "none" };
    const start = getProp(selection, "Start"), end = getProp(selection, "End");
    return {
      type: typeof start === "number" && start === end ? "caret" : "text",
      ...(getProp(selection, "Type") !== undefined ? { nativeType: getProp(selection, "Type") } : {}),
      ...(typeof start === "number" ? { start } : {}),
      ...(typeof end === "number" ? { end } : {}),
      ...(typeof getProp(selection, "Text") === "string" ? { text: getProp(selection, "Text") } : {}),
      ...(typeof getProp(selection, "StoryType") === "number" ? { storyType: getProp(selection, "StoryType") } : {}),
    };
  }
  function describeDocument(doc, type, app) {
    if (!doc) return null;
    const fullName = toStringValue(getProp(doc, "FullName") || "");
    const name = toStringValue(getProp(doc, "Name") || fullName);
    if (!name) return null;
    const active = type === "spreadsheet" ? getProp(app, "ActiveWorkbook") : type === "presentation" ? getProp(app, "ActivePresentation") : getProp(app, "ActiveDocument");
    const isActive = active === doc || (fullName && fullName === toStringValue(getProp(active, "FullName")));
    const current = isActive ? selectionInfo(app, type) : {};
    const selection = current;
    return {
      documentKey: fullName || `${type}:${name}`,
      type,
      selectionVersion: 2,
      name: name.split(/[\\/]/).pop() || name,
      ...(fullName ? { path: fullName } : {}),
      ...(current.sheet ? { activeSheet: current.sheet } : {}),
      ...(current.slide !== undefined ? { activeSlide: current.slide } : {}),
      ...(isActive ? { selection } : {}),
    };
  }
  function currentDocuments() {
    const app = getApplication();
    const type = appType(app);
    const current = type === "spreadsheet"
      ? getProp(app, "ActiveWorkbook")
      : type === "presentation"
        ? getProp(app, "ActivePresentation")
        : getProp(app, "ActiveDocument");
    const collection = type === "spreadsheet"
      ? getProp(app, "Workbooks")
      : type === "presentation"
        ? getProp(app, "Presentations")
        : getProp(app, "Documents");
    const list = enumerate(collection);
    if (current && !list.includes(current)) list.unshift(current);
    if (!current && list.length === 0) return [];
    const documents = (list.length ? list : [current]).map((doc) => describeDocument(doc, type, app)).filter(Boolean);
    if (!onlyDocumentPath) return documents;
    const expectedPath = normalizePath(onlyDocumentPath);
    const expectedName = onlyDocumentPath.split(/[\\/]/).pop();
    return documents.filter((doc) => (doc.path && normalizePath(doc.path) === expectedPath) || doc.name === expectedName);
  }
  function setState(connected, message, docs = []) {
    if ($dot) $dot.classList.toggle("ok", connected);
    if ($status) $status.textContent = message;
    if ($details) $details.textContent = docs.length
      ? docs.map((d) => `${d.type}: ${d.name}${d.path ? ` — ${d.path}` : ""}`).join("\n")
      : "Open a WPS document and keep this Add-in loaded.";
  }
  function send(obj) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(obj)); }
  function connect() {
    clearTimeout(retryTimer);
    socket = new WebSocket(BRIDGE_URL);
    socket.addEventListener("open", () => {
      const docs = currentDocuments();
      send({ type: "register", hostType: appType(getApplication()), documents: docs });
      setState(true, "Connected to the local MCP bridge", docs);
    });
    socket.addEventListener("message", async (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === "registered") {
        const docs = currentDocuments();
        setState(true, `${docs.length} WPS document(s) available`, docs);
        return;
      }
      if (message.type !== "request" || !["execute", "inspect"].includes(message.method)) return;
      let payload;
      try {
        const docs = currentDocuments();
        if (!docs.some((doc) => doc.documentKey === message.documentKey)) throw new Error("The selected WPS document is no longer available in this Add-in context");
        if (message.method === "inspect") {
          send({ type: "response", id: message.id, payload: { success: true, result: docs.find(doc => doc.documentKey === message.documentKey) } });
          return;
        }
        const app = getApplication();
        const wps = (typeof window !== "undefined" && window.wps) || app;
        const variable = message.variable;
        const run = new Function("Application", "wps", "variable", `"use strict"; return (async () => {\n${message.code}\n})()`);
        const result = await run(app, wps, variable);
        const json = JSON.stringify(result);
        if (json === undefined) throw new Error("Code returned undefined (return a JSON-serializable value)");
        payload = { success: true, result: JSON.parse(json) };
      } catch (error) {
        payload = { success: false, error: error?.message || String(error) };
      }
      send({ type: "response", id: message.id, payload });
    });
    socket.addEventListener("close", () => {
      setState(false, "Bridge disconnected — retrying…", []);
      retryTimer = setTimeout(connect, 1500);
    });
    socket.addEventListener("error", () => setState(false, `Cannot connect to ${new URL(BRIDGE_URL).host}`, []));
  }
  if (typeof WebSocket !== "undefined") connect();
  if (typeof window !== "undefined") {
    window.WpsMcpOnLoad = () => true;
    const localPanes = {};
    function showPane(page) {
      try {
        const app = getApplication();
        const host = (app?.CreateTaskPane || app?.CreateTaskpane) ? app : window.wps;
        const getPane = id => safe(() => host.GetTaskPane ? host.GetTaskPane(id) : host.GetTaskpane(id), null);
        const key = "wps-mcp-pane-" + page;
        const storage = app?.PluginStorage || window.wps?.PluginStorage;
        const saved = safe(() => storage?.getItem(key), localPanes[page]);
        let pane = saved == null ? null : getPane(saved);
        if (!pane) {
          const url = new URL(page === "status" ? "/addon/status.html" : "/addon/taskpane.html", pageUrl);
          if (page !== "status") url.searchParams.set("page", page);
          const port = new URL(BRIDGE_URL).port;
          if (port && /^\d+$/.test(port)) url.port = port;
          const create = host?.CreateTaskPane || host?.CreateTaskpane;
          const created = create?.call(host, url.toString(), page === "status" ? "WPS MCP Bridge" : "WPS 助手");
          pane = typeof created === "number" || typeof created === "string" ? getPane(created) : created;
          if (!pane) throw new Error("当前 WPS 环境无法创建任务窗格");
          const id = safe(() => pane.ID, safe(() => pane.Id, undefined));
          if (id !== undefined) { localPanes[page] = id; safe(() => storage?.setItem(key, String(id)), null); }
        }
        safe(() => { pane.DockPosition = 2; if (!Number(pane.Width || 0)) pane.Width = 400; }, null);
        pane.Visible = true;
      } catch (error) { if (typeof alert === "function") alert(error?.message || String(error)); }
      return true;
    }
    window.WpsMcpShowStatus = () => showPane("status");
    window.WpsMcpShowAssistant = () => showPane("chat");
    window.WpsMcpShowVariables = () => showPane("vars");
  }
  function publishDocuments() {
    if (socket?.readyState !== WebSocket.OPEN) return;
    const docs = currentDocuments();
    send({ type: "documents", documents: docs });
    setState(true, `${docs.length} WPS document(s) available`, docs);
  }
  if (typeof setInterval !== "undefined") setInterval(publishDocuments, 750);
  const events = getProp(getApplication(), "ApiEvent");
  for (const name of ["WindowSelectionChange", "SheetSelectionChange"]) {
    safe(() => events?.AddApiEventListener(name, publishDocuments), null);
  }
})();
