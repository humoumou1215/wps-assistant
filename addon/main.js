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
  const STATUS_URL = new URL("/addon/status.html", pageUrl);
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
      };
    }
    if (type === "presentation") {
      const windowObject = getProp(app, "ActiveWindow");
      const selection = getProp(windowObject, "Selection") || getProp(app, "Selection");
      const slide = getProp(getProp(windowObject, "View"), "Slide");
      const shapes = getProp(selection, "ShapeRange");
      const shapeNames = [];
      for (const shape of enumerate(shapes)) {
        const name = getProp(shape, "Name");
        if (name) shapeNames.push(toStringValue(name));
      }
      return {
        ...(getProp(slide, "SlideIndex") !== undefined ? { slide: Number(getProp(slide, "SlideIndex")) } : {}),
        ...(shapeNames.length ? { shapeNames } : {}),
      };
    }
    const selection = getProp(app, "Selection");
    return { ...(getProp(selection, "Type") !== undefined ? { type: getProp(selection, "Type") } : {}) };
  }
  function describeDocument(doc, type, app) {
    if (!doc) return null;
    const fullName = toStringValue(getProp(doc, "FullName") || "");
    const name = toStringValue(getProp(doc, "Name") || fullName);
    if (!name) return null;
    const current = selectionInfo(app, type);
    const selection = type === "spreadsheet"
      ? { ...(current.sheet ? { sheet: current.sheet } : {}), ...(current.address ? { address: current.address } : {}) }
      : type === "presentation"
        ? { type: current.shapeNames?.length ? "shape" : "none", ...(current.shapeNames ? { shapeNames: current.shapeNames } : {}) }
        : current;
    return {
      documentKey: fullName || `${type}:${name}`,
      type,
      name: name.split(/[\\/]/).pop() || name,
      ...(fullName ? { path: fullName } : {}),
      ...(current.sheet ? { activeSheet: current.sheet } : {}),
      ...(current.slide !== undefined ? { activeSlide: current.slide } : {}),
      selection,
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
      if (message.type !== "request" || message.method !== "execute") return;
      let payload;
      try {
        const docs = currentDocuments();
        if (!docs.some((doc) => doc.documentKey === message.documentKey)) throw new Error("The selected WPS document is no longer available in this Add-in context");
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
    window.WpsMcpShowStatus = () => {
      try {
        const pane = getApplication()?.CreateTaskPane?.(STATUS_URL.toString(), "WPS MCP Bridge");
        if (pane) pane.Visible = true;
        else if (typeof alert === "function") alert("WPS MCP Bridge is running; use the MCP client to run tools.");
      } catch (error) { if (typeof alert === "function") alert(error?.message || String(error)); }
      return true;
    };
  }
  if (typeof setInterval !== "undefined") setInterval(() => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    const docs = currentDocuments();
    send({ type: "documents", documents: docs });
    setState(true, `${docs.length} WPS document(s) available`, docs);
  }, 2500);
})();
