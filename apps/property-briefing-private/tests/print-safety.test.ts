import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);
const printRules = css.slice(css.indexOf("@media print"));

test("고객용 인쇄는 입력·근거 원장·계약별 대조·승인 기록을 제외한다", () => {
  for (const selector of [
    "#step-1",
    "#step-2",
    "#step-3",
    "#step-5",
    ".internal-only",
  ]) {
    assert.match(
      printRules,
      new RegExp(selector.replace(/[.#-]/g, "\\$&")),
      `${selector}가 인쇄 제외 규칙에 없습니다.`,
    );
  }
});

test("샘플 경고는 인쇄 제외 대상으로 지정하지 않는다", () => {
  const hiddenSelectorBlock =
    printRules.match(/[\s\S]*?\{\s*display:\s*none\s*!important;/)?.[0] ?? "";
  assert.equal(hiddenSelectorBlock.includes(".sample-warning"), false);
});
