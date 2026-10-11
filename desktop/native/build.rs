fn main() {
    println!("cargo:rerun-if-changed=../icons/tray-macos.rgba");
    println!("cargo:rerun-if-changed=../icons/tray-windows.rgba");
    println!("cargo:rerun-if-changed=../icons/app.ico");
    let package = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../package.json");
    println!("cargo:rerun-if-changed={}", package.display());
    let value: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(package).expect("package.json"))
            .expect("package JSON");
    let version = value["version"].as_str().expect("application version");
    assert_eq!(
        version,
        std::env::var("CARGO_PKG_VERSION").unwrap(),
        "Run npm run version:sync before building the tray"
    );
    println!("cargo:rustc-env=WPS_ASSISTANT_VERSION={version}");
    #[cfg(target_os = "windows")]
    winresource::WindowsResource::new()
        .set_icon("../icons/app.ico")
        .set("ProductName", "WPS Assistant")
        .set("FileDescription", "WPS Assistant")
        .compile()
        .expect("compile Windows application icon");
}
