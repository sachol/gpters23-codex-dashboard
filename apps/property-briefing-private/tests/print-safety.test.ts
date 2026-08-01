import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);
const component = readFileSync(
  new URL("../components/BriefingWorkspace.tsx", import.meta.url),
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

test("고객용 인쇄는 편집 상자 대신 전체 본문이 보이는 문서 구조를 사용한다", () => {
  assert.match(component, /className="print-only customer-print-document"/);
  assert.match(component, /function PrintField/);
  assert.match(printRules, /\.screen-only[\s\S]*display:\s*none\s*!important/);
  assert.match(printRules, /\.print-only\s*\{[\s\S]*display:\s*block/);
  assert.match(printRules, /\.print-field div\s*\{[\s\S]*white-space:\s*pre-wrap/);
  assert.match(printRules, /\.print-field div\s*\{[\s\S]*overflow:\s*visible/);
});

test("고객용 인쇄는 빈 표지 페이지 없이 제안서부터 출력한다", () => {
  assert.match(printRules, /\.hero[\s\S]*display:\s*none\s*!important/);
  assert.match(
    printRules,
    /\.output-panel\s*\{[\s\S]*break-inside:\s*auto/,
  );
  assert.match(component, /매수 목적별 매물 제안서/);
});
