import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const sourcePackage = new URL("../package.json", import.meta.url);
const packageUrl = existsSync(sourcePackage) ? sourcePackage : new URL("../../package.json", import.meta.url);
export const APP_VERSION: string = JSON.parse(await readFile(packageUrl, "utf8")).version;
