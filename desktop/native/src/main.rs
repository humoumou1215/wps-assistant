#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]
use fs2::FileExt;
use serde_json::{json, Value};
use std::{fs, path::PathBuf, process::Command, time::Duration};
use tao::{
    event::{Event, StartCause},
    event_loop::{ControlFlow, EventLoopBuilder},
};
use tray_icon::{
    menu::{AboutMetadata, CheckMenuItem, Menu, MenuEvent, MenuItem, PredefinedMenuItem},
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
    let parent = exe.parent().ok_or("找不到程序目录")?;
    #[cfg(target_os = "macos")]
    let resources = parent.parent().ok_or("应用目录不完整")?.join("Resources");
    #[cfg(target_os = "windows")]
    let resources = parent.join("resources");
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
                            && status["port"] == json!(self.port);
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
    // Small monochrome W: macOS renders it as a template, Windows as a tray bitmap.
    let mut rgba = vec![0; 24 * 24 * 4];
    for y in 4usize..20 {
        for x in 3usize..21 {
            let left = 3 + (y - 4) / 4;
            let right = 20 - (y - 4) / 4;
            let inner = 12 - (y - 4) / 4;
            if x.abs_diff(left) <= 1
                || x.abs_diff(right) <= 1
                || (y >= 10 && (x.abs_diff(inner) <= 1 || x.abs_diff(24 - inner) <= 1))
            {
                let offset = (y * 24 + x) * 4;
                rgba[offset..offset + 4].copy_from_slice(&[72, 92, 210, 255]);
            }
        }
    }
    Icon::from_rgba(rgba, 24, 24).expect("内置图标")
}
fn main() {
    let runtime = match runtime() {
        Ok(r) => r,
        Err(e) => {
            error(&e.to_string());
            return;
        }
    };
    // A native smoke command uses the exact packaged runtime without displaying a tray.
    if std::env::args().any(|a| a == "--smoke") {
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
    let logs = MenuItem::new("打开日志目录", true, None);
    let login = CheckMenuItem::new("登录时启动", true, runtime.login_enabled(), None);
    let quit = MenuItem::new("退出托盘（服务继续运行）", true, None);
    let quit_stop = MenuItem::new("停止服务并退出", false, None);
    let about = PredefinedMenuItem::about(
        Some("关于 WPS 助手"),
        Some(AboutMetadata {
            name: Some("WPS 助手".into()),
            version: Some(env!("CARGO_PKG_VERSION").into()),
            comments: Some("原生托盘 · 本机服务 · 浏览器界面".into()),
            ..Default::default()
        }),
    );
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
        &logs,
        &login,
        &about,
        &PredefinedMenuItem::separator(),
        &quit,
        &quit_stop,
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
                for item in [&stop, &restart, &quit_stop] {
                    item.set_enabled(!operating && running && managed && !busy);
                }
                register.set_enabled(!operating);
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
                if result["ok"] != true {
                    error(result["message"].as_str().unwrap_or("操作失败"));
                    if command.starts_with("login-") {
                        login.set_checked(runtime.login_enabled());
                    }
                } else {
                    if command.starts_with("login-") {
                        login.set_checked(runtime.login_enabled());
                    }
                    if command == "register" {
                        rfd::MessageDialog::new()
                            .set_title("WPS 助手")
                            .set_description("WPS 加载项已注册，可以重新打开 WPS。")
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
                if e.id == quit.id() {
                    *control = ControlFlow::Exit;
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
                } else if e.id == stop.id() || e.id == quit_stop.id() {
                    "stop"
                } else if e.id == restart.id() {
                    "restart"
                } else if e.id == register.id() {
                    "register"
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
                let exit = e.id == quit_stop.id();
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
