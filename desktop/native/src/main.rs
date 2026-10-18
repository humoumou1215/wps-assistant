#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]
use fs2::FileExt;
use serde_json::{json, Value};
use std::{
    fs,
    io::{Read, Seek, SeekFrom},
    path::{Path, PathBuf},
    process::Command,
    time::Duration,
};
use tao::{
    event::{Event, StartCause},
    event_loop::{ControlFlow, EventLoopBuilder},
};
use tray_icon::{
    menu::{CheckMenuItem, Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    Icon, TrayIconBuilder,
};

#[derive(Clone)]
struct Runtime {
    app: PathBuf,
    node: PathBuf,
    data: PathBuf,
    port: u16,
    exe: PathBuf,
}
enum UserEvent {
    Menu(MenuEvent),
    Status(Value),
    Done {
        command: String,
        result: Value,
        exit: bool,
    },
}
fn error(message: &str) {
    rfd::MessageDialog::new()
        .set_title("WPS 助手")
        .set_description(message)
        .set_level(rfd::MessageLevel::Error)
        .show();
}
/// 需要先退出 WPS 的操作以确认框征求同意；默认按钮是「否」，避免误点导致未保存的文档丢失。
#[cfg(target_os = "windows")]
fn confirm(message: &str) -> bool {
    #[link(name = "user32")]
    unsafe extern "system" {
        fn MessageBoxW(
            hwnd: *mut std::ffi::c_void,
            text: *const u16,
            caption: *const u16,
            flags: u32,
        ) -> i32;
    }
    let text: Vec<u16> = message.encode_utf16().chain(Some(0)).collect();
    let title: Vec<u16> = "WPS 助手".encode_utf16().chain(Some(0)).collect();
    // MB_YESNO | MB_ICONWARNING | MB_DEFBUTTON2. IDYES is 6.
    unsafe {
        MessageBoxW(std::ptr::null_mut(), text.as_ptr(), title.as_ptr(), 0x00000134) == 6
    }
}
#[cfg(target_os = "macos")]
fn confirm(message: &str) -> bool {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSAlert, NSAlertSecondButtonReturn, NSAlertStyle, NSApplication};
    use objc2_foundation::NSString;
    let mtm = MainThreadMarker::new().expect("确认窗口必须在主线程显示");
    let alert = NSAlert::new(mtm);
    alert.setAlertStyle(NSAlertStyle::Warning);
    alert.setMessageText(&NSString::from_str("WPS 助手"));
    alert.setInformativeText(&NSString::from_str(message));
    alert
        .addButtonWithTitle(&NSString::from_str("否"))
        .setKeyEquivalent(&NSString::from_str("\r"));
    alert
        .addButtonWithTitle(&NSString::from_str("是"))
        .setKeyEquivalent(&NSString::from_str(""));
    #[allow(deprecated)]
    NSApplication::sharedApplication(mtm).activateIgnoringOtherApps(true);
    alert.runModal() == NSAlertSecondButtonReturn
}
#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn confirm(_message: &str) -> bool {
    false
}
const APP_VERSION: &str = env!("WPS_ASSISTANT_VERSION");
/// 注册/移除加载项前必须先关闭已打开的文档：只有文档宿主退出时才重写 publish.xml。
/// 常驻的加载项辅助宿主（-Entry=EntryPoint）不计入前置条件，确认后由托盘代劳关闭文档。
const REGISTER_PROMPT: &str = "检测到 WPS 中还有已打开的文档，修复加载项注册需要先关闭它们。\n\n是否现在请求 WPS 关闭这些文档并继续？当前所属服务会短暂停止，操作结束后恢复；服务忙碌时无法继续。\n如果文档未在 15 秒内关闭，将提示手动处理。\n如果还有未保存的文档，请选择「否」，先在 WPS 中保存后再重试。";
const REMOVE_PROMPT: &str = "检测到 WPS 中还有已打开的文档，移除加载项注册需要先关闭它们。\n\n是否现在请求 WPS 关闭这些文档并继续？当前所属服务会短暂停止，操作结束后恢复；服务忙碌时无法继续。\n如果文档未在 15 秒内关闭，将提示手动处理。\n如果还有未保存的文档，请选择「否」，先在 WPS 中保存后再重试。";
#[cfg(target_os = "macos")]
fn show_about() {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSAlert, NSAlertStyle, NSApplication};
    use objc2_foundation::NSString;

    let mtm = MainThreadMarker::new().expect("关于窗口必须在主线程显示");
    let alert = NSAlert::new(mtm);
    alert.setAlertStyle(NSAlertStyle::Informational);
    alert.setMessageText(&NSString::from_str("关于 WPS 助手"));
    alert.setInformativeText(&NSString::from_str(&format!(
        "WPS 助手\n版本 {APP_VERSION}\n\n原生托盘 · 本机服务 · 浏览器界面"
    )));
    alert.addButtonWithTitle(&NSString::from_str("好"));
    // Accessory apps have no main window: activate explicitly so the alert is visible.
    #[allow(deprecated)]
    NSApplication::sharedApplication(mtm).activateIgnoringOtherApps(true);
    alert.runModal();
}
#[cfg(not(target_os = "macos"))]
fn show_about() {
    rfd::MessageDialog::new()
        .set_title("关于 WPS 助手")
        .set_description(format!(
            "WPS 助手\n版本 {APP_VERSION}\n\n原生托盘 · 本机服务 · 浏览器界面"
        ))
        .set_level(rfd::MessageLevel::Info)
        .show();
}
// 自解压单文件在可执行文件尾部追加 zlib 载荷和固定长度页脚；ZIP/文件夹形态没有页脚，
// 继续按可执行文件所在目录解析资源。格式与打包侧 desktop/build-sfx.mjs 成对维护。
const SFX_MAGIC: &[u8; 8] = b"WPSMCPX1";
const SFX_VERSION_LEN: usize = 24;
const SFX_FOOTER_LEN: usize = 8 + SFX_VERSION_LEN + 8;

/// 读取尾部页脚；不是自解压包时返回 None。载荷长度只用于定位，非法值按非自解压处理。
fn embedded_archive(exe: &Path) -> Option<(String, u64)> {
    let total = fs::metadata(exe).ok()?.len();
    if total < SFX_FOOTER_LEN as u64 {
        return None;
    }
    let mut footer = [0u8; SFX_FOOTER_LEN];
    let mut file = fs::File::open(exe).ok()?;
    file.seek(SeekFrom::End(-(SFX_FOOTER_LEN as i64))).ok()?;
    file.read_exact(&mut footer).ok()?;
    if &footer[..8] != SFX_MAGIC {
        return None;
    }
    let raw = &footer[8..8 + SFX_VERSION_LEN];
    let end = raw.iter().position(|b| *b == 0).unwrap_or(SFX_VERSION_LEN);
    let version = String::from_utf8(raw[..end].to_vec()).ok()?;
    let payload = u64::from_le_bytes(footer[8 + SFX_VERSION_LEN..].try_into().ok()?);
    if version.is_empty() || payload == 0 || payload > total - SFX_FOOTER_LEN as u64 {
        return None;
    }
    Some((version, payload))
}

/// 把内嵌载荷落盘到用户目录后返回程序根；同版本已存在时直接复用，不重复解压。
fn materialize_package(
    exe: &Path,
    version: &str,
    payload_len: u64,
) -> Result<PathBuf, Box<dyn std::error::Error>> {
    // 用户目录一定可写；程序放在 exe 旁边会在只读位置或 U 盘上失败。
    let root = std::env::var_os("WPS_MCP_EXTRACT_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            dirs::data_local_dir()
                .expect("用户目录不可用")
                .join("WPS Assistant")
        });
    let target = root.join(version);
    let marker = target.join("resources").join("portable.json");
    if marker.is_file() {
        return Ok(target);
    }
    fs::create_dir_all(&root)?;
    // 先解到同目录的临时位置再整体改名，中断不会留下半个可以误用的包。
    let staging = root.join(format!("{version}.incomplete-{}", std::process::id()));
    let _ = fs::remove_dir_all(&staging);
    fs::create_dir_all(&staging)?;
    let start = fs::metadata(exe)?.len() - SFX_FOOTER_LEN as u64 - payload_len;
    let mut file = fs::File::open(exe)?;
    file.seek(SeekFrom::Start(start))?;
    let mut archive = flate2::read::ZlibDecoder::new(file.take(payload_len));
    // 条目流：[u32 路径长度][路径][u64 内容长度][u8 标志][内容]，路径用正斜杠且相对包根。
    // 标志位 0 表示可执行：fs::write 默认不带可执行位，不恢复的话 node 这类文件会起不来。
    loop {
        let mut header = [0u8; 4];
        match archive.read_exact(&mut header) {
            Ok(()) => {}
            Err(e) if e.kind() == std::io::ErrorKind::UnexpectedEof => break,
            Err(e) => return Err(e.into()),
        }
        let mut name = vec![0u8; u32::from_le_bytes(header) as usize];
        archive.read_exact(&mut name)?;
        let name = String::from_utf8(name)?;
        if name.is_empty()
            || name.starts_with('/')
            || name.split('/').any(|part| part.is_empty() || part == "..")
        {
            return Err("自解压包条目路径非法".into());
        }
        let mut size = [0u8; 8];
        archive.read_exact(&mut size)?;
        let mut flags = [0u8; 1];
        archive.read_exact(&mut flags)?;
        let path = staging.join(name.replace('/', std::path::MAIN_SEPARATOR_STR));
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut content = vec![0u8; u64::from_le_bytes(size) as usize];
        archive.read_exact(&mut content)?;
        fs::write(&path, &content)?;
        #[cfg(unix)]
        if flags[0] & 1 == 1 {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&path, fs::Permissions::from_mode(0o755))?;
        }
    }
    if !staging.join("resources").join("portable.json").is_file() {
        return Err("自解压内容不完整，请重新下载".into());
    }
    match fs::rename(&staging, &target) {
        Ok(()) => Ok(target),
        // 另一个实例可能先完成落盘，直接复用它已经写好的结果。
        Err(_) if marker.is_file() => {
            let _ = fs::remove_dir_all(&staging);
            Ok(target)
        }
        Err(e) => Err(e.into()),
    }
}
fn runtime() -> Result<Runtime, Box<dyn std::error::Error>> {
    // Explicit options let Windows login startup preserve a custom local deployment.
    for arg in std::env::args().skip(1) {
        for (prefix, key) in [
            ("--port=", "WPS_MCP_PORT"),
            ("--data-dir=", "WPS_MCP_DATA_DIR"),
            ("--addins-dir=", "WPS_MCP_ADDINS_DIR"),
            ("--addin-enable=", "WPS_MCP_ADDIN_ENABLE"),
        ] {
            if let Some(value) = arg.strip_prefix(prefix) {
                std::env::set_var(key, value);
            }
        }
    }
    let exe = dunce::canonicalize(std::env::current_exe()?)?;
    // 自解压包先把资源落盘再按落盘目录解析；ZIP/文件夹形态仍用可执行文件所在目录。
    let extracted = match embedded_archive(&exe) {
        Some((version, payload_len)) => Some(materialize_package(&exe, &version, payload_len)?),
        None => None,
    };
    #[cfg(target_os = "macos")]
    let resources = match &extracted {
        Some(root) => root.join("resources"),
        None => exe
            .parent()
            .and_then(Path::parent)
            .ok_or("应用目录不完整")?
            .join("Resources"),
    };
    #[cfg(target_os = "windows")]
    let resources = match &extracted {
        Some(root) => root.join("resources"),
        None => exe.parent().ok_or("找不到程序目录")?.join("resources"),
    };
    let app = resources.join("app");
    let node = resources
        .join("runtime")
        .join(if cfg!(windows) { "node.exe" } else { "node" });
    if !node.is_file() || !app.join("dist/src/desktop-runtime.js").is_file() {
        return Err("程序资源不完整，请重新解压整个免安装包".into());
    }
    let data = std::env::var_os("WPS_MCP_DATA_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| dirs::config_dir().expect("用户目录不可用").join("wps-mcp"));
    fs::create_dir_all(&data)?;
    let data = dunce::canonicalize(data)?;
    std::env::set_var("WPS_MCP_DATA_DIR", &data);
    let port: u16 = std::env::var("WPS_MCP_PORT")
        .unwrap_or_else(|_| "18766".into())
        .parse()?;
    if port < 1025 {
        return Err("无效的服务端口".into());
    }
    Ok(Runtime {
        app: dunce::canonicalize(app)?,
        node,
        data,
        port,
        exe,
    })
}
impl Runtime {
    fn run(&self, command: &str) -> Value {
        let mut child = Command::new(&self.node);
        child
            .env("WPS_MCP_DESKTOP_PARENT_PID", std::process::id().to_string())
            .arg(self.app.join("dist/src/desktop-runtime.js"))
            .arg(command)
            .arg(&self.exe);
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            child.creation_flags(0x08000000);
        }
        match child.output() {
            Ok(output) => serde_json::from_slice(&output.stdout).unwrap_or_else(
                |_| json!({"ok": false, "message": "控制程序没有正常返回，请检查日志"}),
            ),
            Err(e) => json!({"ok": false, "message": format!("无法运行随包提供的 Node：{e}")}),
        }
    }
    fn status(&self) -> Value {
        let agent = ureq::AgentBuilder::new()
            .timeout(Duration::from_secs(2))
            .build();
        let base = format!("http://127.0.0.1:{}", self.port);
        let mut result: Value = match agent
            .get(&format!("{base}/health"))
            .call()
            .and_then(|r| r.into_json().map_err(Into::into))
        {
            Ok(v) => v,
            Err(_) => json!({"ok": false}),
        };
        let meta = fs::read(self.data.join("desktop-service.json"))
            .ok()
            .and_then(|b| serde_json::from_slice::<Value>(&b).ok());
        result["managed"] = json!(false);
        if let Some(meta) = meta {
            if let Some(token) = meta["token"].as_str() {
                if let Ok(response) = agent
                    .get(&format!("{base}/api/desktop/status"))
                    .set("Authorization", &format!("Bearer {token}"))
                    .call()
                {
                    if let Ok(status) = response.into_json::<Value>() {
                        let managed = status["instanceId"] == meta["instanceId"]
                            && status["pid"] == meta["pid"]
                            && status["appDir"] == json!(self.app)
                            && status["dataDir"] == json!(self.data)
                            && status["port"] == json!(self.port)
                            && status["parentPid"] == json!(std::process::id());
                        result["managed"] = json!(managed);
                        result["busy"] = status["busy"].clone();
                    }
                }
            }
        }
        result
    }
    fn login_enabled(&self) -> bool {
        #[cfg(target_os = "macos")]
        {
            dirs::home_dir()
                .map(|p| {
                    p.join("Library/LaunchAgents/com.local.wps-assistant.tray.plist")
                        .is_file()
                })
                .unwrap_or(false)
        }
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            Command::new("reg.exe")
                .args([
                    "query",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    "WpsAssistantTray",
                ])
                .creation_flags(0x08000000)
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false)
        }
    }
}
fn icon() -> Icon {
    // Exported from the same bear artwork as the web and application icons.
    // macOS uses a 22pt monochrome template at 2x; Windows uses a color bitmap.
    #[cfg(target_os = "macos")]
    let (rgba, size) = (include_bytes!("../../icons/tray-macos.rgba").to_vec(), 44);
    #[cfg(not(target_os = "macos"))]
    let (rgba, size) = (include_bytes!("../../icons/tray-windows.rgba").to_vec(), 32);
    Icon::from_rgba(rgba, size, size).expect("内置小熊图标")
}
fn main() {
    if std::env::args().any(|a| a == "--version") {
        println!("{APP_VERSION}");
        return;
    }
    let about_only = std::env::args().any(|a| a == "--about");
    let smoke = std::env::args().any(|a| a == "--smoke");
    let runtime = match runtime() {
        Ok(r) => r,
        Err(e) => {
            // 构建期的 smoke 不能弹窗：解压失败时要立刻以非零码结束并说明原因，
            // 否则自动化验证会卡在这个模态对话框上直到超时。
            if smoke {
                eprintln!("{e}");
                std::process::exit(1);
            }
            error(&e.to_string());
            return;
        }
    };
    // A native smoke command uses the exact packaged runtime without displaying a tray.
    if smoke {
        let result = Command::new(&runtime.node).arg("--version").output();
        std::process::exit(if result.map(|o| o.status.success()).unwrap_or(false) {
            0
        } else {
            1
        });
    }
    let lock = match fs::OpenOptions::new()
        .create(true)
        .truncate(false)
        .read(true)
        .write(true)
        .open(runtime.data.join("desktop-tray.lock"))
    {
        Ok(file) => file,
        Err(e) => {
            error(&e.to_string());
            return;
        }
    };
    if lock.try_lock_exclusive().is_err() {
        return;
    }
    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();
    #[cfg(target_os = "macos")]
    let event_loop = {
        use tao::platform::macos::{ActivationPolicy, EventLoopExtMacOS};
        let mut event_loop = event_loop;
        event_loop.set_activation_policy(ActivationPolicy::Accessory);
        event_loop.set_dock_visibility(false);
        event_loop.set_activate_ignoring_other_apps(false);
        event_loop
    };
    let proxy = event_loop.create_proxy();
    let menu_proxy = proxy.clone();
    MenuEvent::set_event_handler(Some(move |e| {
        let _ = menu_proxy.send_event(UserEvent::Menu(e));
    }));
    let menu = Menu::new();
    let state = MenuItem::new("正在启动…", false, None);
    let chat = MenuItem::new("打开助手", true, None);
    let vars = MenuItem::new("打开变量管理", true, None);
    let settings = MenuItem::new("模型设置", true, None);
    let debug = MenuItem::new("MCP 接口调试", true, None);
    let guide = MenuItem::new("MCP 配置引导", true, None);
    let start = MenuItem::new("启动服务", false, None);
    let stop = MenuItem::new("停止服务", false, None);
    let restart = MenuItem::new("重启服务", false, None);
    let register = MenuItem::new("修复 WPS 加载项注册", true, None);
    let unregister = MenuItem::new("移除 WPS 加载项注册", true, None);
    let logs = MenuItem::new("打开日志目录", true, None);
    let login = CheckMenuItem::new("登录时启动", true, runtime.login_enabled(), None);
    let quit = MenuItem::new("退出 WPS 助手", false, None);
    let about = MenuItem::new("关于 WPS 助手", true, None);
    menu.append_items(&[
        &state,
        &PredefinedMenuItem::separator(),
        &chat,
        &vars,
        &settings,
        &debug,
        &guide,
        &PredefinedMenuItem::separator(),
        &start,
        &stop,
        &restart,
        &register,
        &unregister,
        &logs,
        &login,
        &about,
        &PredefinedMenuItem::separator(),
        &quit,
    ])
    .expect("托盘菜单");
    let mut tray = None;
    let mut operating = true;
    let mut last = json!({"ok": false});
    event_loop.run(move |event, _, control| {
        // Keep the single-instance file open throughout the event loop.
        let _keep_lock = &lock;
        *control = ControlFlow::Wait;
        match event {
            Event::NewEvents(StartCause::Init) => {
                if about_only {
                    show_about();
                    *control = ControlFlow::Exit;
                    return;
                }
                let builder = TrayIconBuilder::new()
                    .with_menu(Box::new(menu.clone()))
                    .with_tooltip("WPS 助手")
                    .with_icon(icon());
                #[cfg(target_os = "macos")]
                let builder = builder.with_icon_templated(icon());
                match builder.build() {
                    Ok(icon) => tray = Some(icon),
                    Err(e) => {
                        error(&e.to_string());
                        *control = ControlFlow::Exit;
                        return;
                    }
                }
                #[cfg(target_os = "macos")]
                {
                    let rl = objc2_core_foundation::CFRunLoop::main().unwrap();
                    objc2_core_foundation::CFRunLoop::wake_up(&rl);
                }
                let runtime = runtime.clone();
                let proxy = proxy.clone();
                std::thread::spawn(move || {
                    let result = runtime.run("initialize");
                    let _ = proxy.send_event(UserEvent::Done {
                        command: "initialize".into(),
                        result,
                        exit: false,
                    });
                    loop {
                        if proxy
                            .send_event(UserEvent::Status(runtime.status()))
                            .is_err()
                        {
                            break;
                        }
                        std::thread::sleep(Duration::from_secs(4));
                    }
                });
            }
            Event::UserEvent(UserEvent::Status(status)) => {
                last = status;
                let running = last["ok"] == true;
                let managed = last["managed"] == true;
                let busy = last["busy"] == true;
                let text = if operating {
                    "正在处理…".into()
                } else if running {
                    format!(
                        "{} · WPS {} · 文档 {}",
                        if busy {
                            "服务忙碌"
                        } else if managed {
                            "服务运行中"
                        } else {
                            "外部服务运行中"
                        },
                        last["connections"],
                        last["documents"]
                    )
                } else {
                    "服务已停止".into()
                };
                state.set_text(&text);
                if let Some(tray) = &tray {
                    let _ = tray.set_tooltip(Some(&text));
                }
                start.set_enabled(!operating && !running);
                for item in [&stop, &restart] {
                    item.set_enabled(!operating && running && managed && !busy);
                }
                quit.set_enabled(!operating && !(running && managed && busy));
                for item in [&register, &unregister] {
                    item.set_enabled(!operating && !busy);
                }
                login.set_enabled(!operating);
                for item in [&chat, &vars, &settings, &debug, &guide] {
                    item.set_enabled(running);
                }
            }
            Event::UserEvent(UserEvent::Done {
                command,
                result,
                exit,
            }) => {
                operating = false;
                if command.starts_with("login-") {
                    login.set_checked(runtime.login_enabled());
                }
                // 注册和移除都要先关闭已打开的文档：把「请关闭文档」报错换成确认框，同意后由托盘关闭并自动重试。
                if (command == "register" || command == "unregister") && result["reason"] == "wps-running" {
                    let prompt = if command == "unregister" { REMOVE_PROMPT } else { REGISTER_PROMPT };
                    if confirm(prompt) {
                        operating = true;
                        let _ = proxy.send_event(UserEvent::Status(last.clone()));
                        let runtime = runtime.clone();
                        let proxy = proxy.clone();
                        std::thread::spawn(move || {
                            let result = {
                                let retried = runtime.run(&format!("{command}-close-wps"));
                                // 关闭后文档又可能被打开；此时不再追问，直接给出可照做的提示。
                                if retried["reason"] == "wps-running" {
                                    let action = if command == "unregister" { "移除加载项注册" } else { "加载项注册" };
                                    let message = format!("WPS 关闭后又打开了文档，{action}仍未完成。请手动关闭 WPS 中已打开的文档后重试。");
                                    json!({ "ok": false, "message": message })
                                } else {
                                    retried
                                }
                            };
                            let _ = proxy.send_event(UserEvent::Done {
                                command,
                                result,
                                exit: false,
                            });
                        });
                    } else {
                        let _ = proxy.send_event(UserEvent::Status(last.clone()));
                    }
                    return;
                }
                if result["ok"] != true {
                    error(result["message"].as_str().unwrap_or("操作失败"));
                } else {
                    if command == "register" || command == "unregister" {
                        rfd::MessageDialog::new()
                            .set_title("WPS 助手")
                            .set_description(result["message"].as_str().unwrap_or("操作完成。"))
                            .show();
                    }
                    if exit {
                        *control = ControlFlow::Exit;
                        return;
                    }
                }
                let _ = proxy.send_event(UserEvent::Status(last.clone()));
            }
            Event::UserEvent(UserEvent::Menu(e)) => {
                if e.id == about.id() {
                    show_about();
                    return;
                }
                if e.id == logs.id() {
                    if let Err(e) = fs::create_dir_all(runtime.data.join("logs"))
                        .and_then(|_| open::that(runtime.data.join("logs")))
                    {
                        error(&e.to_string());
                    }
                    return;
                }
                for (item, path) in [
                    (&chat, "taskpane.html#chat"),
                    (&vars, "taskpane.html#vars"),
                    (&settings, "taskpane.html#settings"),
                    (&debug, "mcp-debug.html"),
                    (&guide, "mcp-guide.html"),
                ] {
                    if e.id == item.id() {
                        if let Err(e) =
                            open::that(format!("http://127.0.0.1:{}/addon/{path}", runtime.port))
                        {
                            error(&e.to_string());
                        }
                        return;
                    }
                }
                if operating {
                    return;
                }
                let command = if e.id == start.id() {
                    "start"
                } else if e.id == stop.id() {
                    "stop"
                } else if e.id == quit.id() {
                    "quit"
                } else if e.id == restart.id() {
                    "restart"
                } else if e.id == register.id() {
                    "register"
                } else if e.id == unregister.id() {
                    "unregister"
                } else if e.id == login.id() {
                    if login.is_checked() {
                        "login-on"
                    } else {
                        "login-off"
                    }
                } else {
                    return;
                };
                operating = true;
                let exit = e.id == quit.id();
                let runtime = runtime.clone();
                let proxy = proxy.clone();
                let command = command.to_owned();
                let _ = proxy.send_event(UserEvent::Status(last.clone()));
                std::thread::spawn(move || {
                    let result = runtime.run(&command);
                    let _ = proxy.send_event(UserEvent::Done {
                        command,
                        result,
                        exit,
                    });
                });
            }
            _ => {}
        }
    });
}
