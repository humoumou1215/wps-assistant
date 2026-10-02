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
        ...selectionText(text),
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
      ...selectionText(getProp(selection, "Text")),
      ...(typeof getProp(selection, "StoryType") === "number" ? { storyType: getProp(selection, "StoryType") } : {}),
    };
  }
  function selectionText(text) {
    if (typeof text !== "string") return {};
    // Match MAX_SELECTION_TEXT in src/selection.ts and taskpane-view.js.
    return { text: text.slice(0, 2000), ...(text.length > 2000 ? { textTruncated: true, textLength: text.length } : {}) };
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
  function navigateToRange(app, documentKey, location) {
    if (appType(app) !== "spreadsheet") throw new Error("目前仅支持表格区域定位");
    const sheetName = location?.sheet, address = location?.address;
    if (typeof sheetName !== "string" || !sheetName || sheetName.length > 31 || /[\[\]:*?/\\\x00-\x1f]/.test(sheetName)) throw new Error("工作表名称无效");
    const match = typeof address === "string" && /^([A-Z]{1,3})([1-9]\d{0,6})(?::([A-Z]{1,3})([1-9]\d{0,6}))?$/.exec(address);
    if (!match) throw new Error("定位区域无效");
    const column = name => [...name].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
    const c1 = column(match[1]), c2 = column(match[3] || match[1]), r1 = Number(match[2]), r2 = Number(match[4] || match[2]);
    if (c2 > 16384 || r2 > 1048576 || c1 > c2 || r1 > r2) throw new Error("定位区域超出有效范围");
    const workbook = enumerate(getProp(app, "Workbooks")).find(book => {
      const key = toStringValue(getProp(book, "FullName")) || `spreadsheet:${toStringValue(getProp(book, "Name"))}`;
      return key === documentKey;
    });
    if (!workbook) throw new Error("目标工作簿已关闭");
    const sheet = workbook.Worksheets.Item(sheetName);
    if (!sheet) throw new Error("目标工作表不存在");
    const range = sheet.Range(address);
    workbook.Activate();
    sheet.Activate();
    range.Select();
    // Goto scrolls off-screen destinations into view. Older hosts expose only Select.
    if (typeof app.Goto === "function") app.Goto(range, true);
    else {
      const win = getProp(app, "ActiveWindow");
      if (win) { win.ScrollRow = r1; win.ScrollColumn = c1; }
    }
    return { sheet: sheetName, address };
  }
  function boundDocument(app, type, documentKey) {
    const collection = getProp(app, { spreadsheet: "Workbooks", presentation: "Presentations", writer: "Documents" }[type]);
    const current = getProp(app, { spreadsheet: "ActiveWorkbook", presentation: "ActivePresentation", writer: "ActiveDocument" }[type]);
    const docs = enumerate(collection);
    if (current && !docs.includes(current)) docs.push(current);
    const doc = docs.find(item => (toStringValue(getProp(item, "FullName") || "") || `${type}:${toStringValue(getProp(item, "Name") || "")}`) === documentKey);
    if (!doc) throw new Error("目标文档已关闭");
    return doc;
  }
  const validIndex = value => Number.isSafeInteger(value) && value > 0 && value <= 2147483647;
  function uniqueTarget(items, label) {
    if (!items.length) throw new Error(label + "不存在");
    if (items.length !== 1) throw new Error(label + "有多个匹配，请使用明确的编号或 ID");
    return items[0];
  }
  function navigatePresentation(app, documentKey, location) {
    if ((!validIndex(location.slideId) && !validIndex(location.slide)) || (location.slideId !== undefined && location.slide !== undefined)) throw new Error("幻灯片位置无效");
    const pres = boundDocument(app, "presentation", documentKey);
    let slide;
    if (location.slideId !== undefined) {
      // SlideID survives slide reordering; never fall back to a page number.
      const matches = [];
      for (let i = 1; i <= getCount(pres.Slides); i++) { const item = itemAt(pres.Slides, i); if (getProp(item, "SlideID") === location.slideId) matches.push(item); }
      slide = uniqueTarget(matches, "幻灯片 ID " + location.slideId);
    } else {
      if (location.slide > getCount(pres.Slides)) throw new Error("目标幻灯片不存在");
      slide = itemAt(pres.Slides, location.slide);
      if (!slide) throw new Error("目标幻灯片不存在");
    }
    let shape;
    if (location.shapeId !== undefined || location.shapeName !== undefined || location.table || location.textTitle !== undefined) {
      if (location.shapeId !== undefined && !validIndex(location.shapeId)) throw new Error("形状 ID 无效");
      const shapes = [];
      for (let i = 1; i <= getCount(slide.Shapes); i++) { const item = itemAt(slide.Shapes, i); if (item) shapes.push(item); }
      const matches = shapes.filter(item => {
        if (location.shapeId !== undefined) return getProp(item, "Id") === location.shapeId;
        if (location.shapeName !== undefined) return getProp(item, "Name") === location.shapeName;
        if (location.table) return Boolean(getProp(item, "HasTable"));
        const text = safe(() => item.TextFrame.TextRange.Text, "");
        return getProp(item, "Name") === location.textTitle || (typeof text === "string" && text.split(/[\r\n]/)[0].trim() === location.textTitle);
      });
      shape = uniqueTarget(matches, location.table ? "目标表格" : "目标形状");
      if (typeof shape.Select !== "function") throw new Error("当前 WPS 不支持形状选择");
    }
    const targetWindow = itemAt(getProp(pres, "Windows"), 1);
    if (!targetWindow || typeof targetWindow.Activate !== "function") throw new Error("当前 WPS 不支持切换演示窗口");
    targetWindow.Activate();
    const win = getProp(app, "ActiveWindow"), view = getProp(win, "View");
    if (typeof view?.GotoSlide === "function") view.GotoSlide(Number(slide.SlideIndex));
    else if (typeof slide.Select === "function") slide.Select();
    else throw new Error("当前 WPS 不支持幻灯片定位");
    if (shape) shape.Select();
    return { slide: Number(slide.SlideIndex), slideId: Number(slide.SlideID), ...(shape ? { shapeId: Number(shape.Id), shapeName: toStringValue(shape.Name) } : {}), ref: location.ref };
  }
  function navigateWriter(app, documentKey, location) {
    const doc = boundDocument(app, "writer", documentKey);
    let range;
    if (location.rangeStart !== undefined) {
      if (![location.rangeStart, location.rangeEnd].every(n => Number.isSafeInteger(n) && n >= 0) || location.rangeEnd < location.rangeStart || location.rangeEnd > Number(doc.Content.End)) throw new Error("文字区域超出文档范围");
      range = doc.Range(location.rangeStart, location.rangeEnd);
    } else if (location.bookmark !== undefined) {
      if (!safe(() => doc.Bookmarks.Exists(location.bookmark), false)) throw new Error("目标书签不存在");
      range = doc.Bookmarks.Item(location.bookmark).Range;
    } else if (location.paragraph !== undefined || location.table !== undefined) {
      const index = location.paragraph !== undefined ? location.paragraph : location.table;
      const collection = location.paragraph !== undefined ? doc.Paragraphs : doc.Tables;
      if (!validIndex(index) || index > getCount(collection)) throw new Error("目标段落或表格不存在");
      range = itemAt(collection, index)?.Range;
    } else if (typeof location.heading === "string" && location.heading) {
      const matches = [];
      for (let i = 1; i <= getCount(doc.Paragraphs); i++) {
        const para = itemAt(doc.Paragraphs, i);
        if (toStringValue(getProp(para?.Range, "Text")).trim() === location.heading) matches.push({ para, index: i });
      }
      const heading = uniqueTarget(matches, "标题「" + location.heading + "」");
      range = heading.para.Range;
      if (location.afterHeading) {
        // Only the immediately following nonempty paragraph/table is a target.
        // A removed table must never silently redirect to the next section.
        let next;
        for (let i = heading.index + 1; i <= getCount(doc.Paragraphs); i++) {
          const para = itemAt(doc.Paragraphs, i);
          if (toStringValue(getProp(para?.Range, "Text")).trim()) { next = para.Range; break; }
        }
        if (!next) throw new Error("标题后没有目标段落或表格");
        const tables = [];
        for (let i = 1; i <= getCount(doc.Tables); i++) { const item = itemAt(doc.Tables, i); if (item?.Range && item.Range.Start === next.Start) tables.push(item); }
        if (location.afterHeading === "table") range = uniqueTarget(tables, "标题后的表格").Range;
        else {
          if (tables.length) throw new Error("标题后是表格，请使用表格目的地址");
          range = next;
        }
      }
    } else throw new Error("文字目的位置无效");
    if (!range || typeof range.Select !== "function") throw new Error("当前 WPS 不支持文字区域选择");
    doc.Activate();
    range.Select();
    // Selection normally scrolls automatically. Some hosts expose an explicit
    // scroll method; unsupported scrolling must not undo a successful selection.
    safe(() => app.ActiveWindow.ScrollIntoView(range, true), undefined);
    return { start: Number(range.Start), end: Number(range.End), ref: location.ref };
  }
  function navigateDocument(app, documentKey, location) {
    const type = appType(app);
    if (type === "spreadsheet" && !location?.kind) return navigateToRange(app, documentKey, location);
    if (type === "presentation" && location?.kind === type) return navigatePresentation(app, documentKey, location);
    if (type === "writer" && location?.kind === type) return navigateWriter(app, documentKey, location);
    throw new Error("目的位置与文档类型不匹配");
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
      if (message.type !== "request" || !["execute", "inspect", "navigate"].includes(message.method)) return;
      let payload;
      try {
        const docs = currentDocuments();
        if (!docs.some((doc) => doc.documentKey === message.documentKey)) throw new Error("The selected WPS document is no longer available in this Add-in context");
        if (message.method === "inspect") {
          send({ type: "response", id: message.id, payload: { success: true, result: docs.find(doc => doc.documentKey === message.documentKey) } });
          return;
        }
        const app = getApplication();
        if (message.method === "navigate") {
          const result = navigateDocument(app, message.documentKey, message.location);
          send({ type: "response", id: message.id, payload: { success: true, result } });
          send({ type: "documents", documents: currentDocuments() });
          return;
        }
        const wps = (typeof window !== "undefined" && window.wps) || app;
        const variable = message.variable;
        // Resolve on every execution, without activating a document or changing selection.
        // Application remains available for host APIs and existing saved rules.
        const wpsDocument = boundDocument(app, appType(app), message.documentKey);
        const run = new Function("Application", "wps", "variable", "wpsDocument", `"use strict"; return (async () => {\n${message.code}\n})()`);
        const result = await run(app, wps, variable, wpsDocument);
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
  const root = typeof window !== "undefined" ? window : globalThis;
  const events = [getProp(getProp(root, "wps"), "ApiEvent"), getProp(getApplication(), "ApiEvent")]
    .find(api => typeof getProp(api, "AddApiEventListener") === "function");
  for (const name of ["WindowSelectionChange", "SheetSelectionChange"]) {
    safe(() => events?.AddApiEventListener(name, publishDocuments), null);
  }
})();
