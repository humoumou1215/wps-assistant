#!/usr/bin/env python3
"""Generate synthetic manual WPS fixtures without writing into the source tree."""
import argparse
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
SCENARIOS = {
    "basic": ["build_excel.py", "build_writer.py", "build_ppt.py"],
    "eoy-2026": ["build_sources.py", "build_source_b.py", "build_target1.py", "build_target2.py"],
}
ACTIONS = {
    "verify": ["verify.py", "geom_check.py"],
    "truth": ["truth.py"],
    "answer-key": ["make_answer_key.py"],
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scenario", choices=SCENARIOS)
    parser.add_argument("action", choices=["generate", *ACTIONS])
    parser.add_argument("--output-dir", type=Path, help="Data directory; default: .dev/pressure-test/<scenario>")
    args = parser.parse_args()
    output = (args.output_dir or ROOT / ".dev" / "pressure-test" / args.scenario).resolve()
    if args.action != "generate" and args.scenario != "eoy-2026":
        parser.error("verify, truth and answer-key are only available for eoy-2026")
    if args.action == "generate":
        # Never silently overwrite a document that may have been edited in WPS.
        if output.exists() and any(output.iterdir()):
            parser.error("output directory is not empty; choose a new --output-dir to preserve existing documents")
        output.mkdir(parents=True, exist_ok=True)
        scripts = SCENARIOS[args.scenario]
    else:
        if not output.is_dir():
            parser.error("data directory does not exist; generate fixtures first or specify --output-dir")
        scripts = ACTIONS[args.action]
    source = Path(__file__).resolve().parent / args.scenario
    env = {**os.environ, "PYTHONUTF8": "1", "PYTHONDONTWRITEBYTECODE": "1"}
    for script in scripts:
        result = subprocess.run([sys.executable, "-X", "utf8", "-B", str(source / script)], cwd=output, env=env)
        if result.returncode:
            return result.returncode
    print(f"{args.scenario} {args.action}: {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
