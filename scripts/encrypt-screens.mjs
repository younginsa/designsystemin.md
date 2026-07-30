// 스크린샷 암호화 — AES-256-GCM, 키는 PBKDF2(비밀번호)로 유도.
// 사용: node scripts/encrypt-screens.mjs <password> <srcDir> <outDir>
// 출력 파일 = [iv 12B][ciphertext||gcmTag] — 브라우저 WebCrypto가 그대로 복호화한다.
import { webcrypto as crypto } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";

const [password, srcDir, outDir] = process.argv.slice(2);
if (!password || !srcDir || !outDir) {
  console.error("usage: node encrypt-screens.mjs <password> <srcDir> <outDir>");
  process.exit(1);
}

const SALT = new TextEncoder().encode("hinas-ds-2026");
const ITERS = 120000;

const baseKey = await crypto.subtle.importKey(
  "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt: SALT, iterations: ITERS, hash: "SHA-256" },
  baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);

mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(srcDir).filter((f) => f.endsWith(".jpg"))) {
  const data = readFileSync(join(srcDir, f));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0); out.set(ct, iv.length);
  writeFileSync(join(outDir, basename(f) + ".enc"), out);
}
console.log("encrypted", readdirSync(outDir).length, "files →", outDir);
