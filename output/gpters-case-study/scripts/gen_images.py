from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch


ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "images"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)


def set_korean_font() -> None:
    plt.rcParams["font.family"] = ["Malgun Gothic", "DejaVu Sans"]
    plt.rcParams["axes.unicode_minus"] = False


def add_box(ax, x, y, w, h, title, body, color):
    box = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle="round,pad=0.025,rounding_size=0.025",
        linewidth=1.4,
        edgecolor="#243042",
        facecolor=color,
    )
    ax.add_patch(box)
    ax.text(x + w / 2, y + h * 0.63, title, ha="center", va="center", fontsize=15, fontweight="bold", color="#152033")
    ax.text(x + w / 2, y + h * 0.33, body, ha="center", va="center", fontsize=10.5, color="#334155", linespacing=1.35)


def add_arrow(ax, x1, y1, x2, y2):
    arrow = FancyArrowPatch(
        (x1, y1),
        (x2, y2),
        arrowstyle="-|>",
        mutation_scale=16,
        linewidth=1.6,
        color="#475569",
    )
    ax.add_patch(arrow)


def workflow_diagram():
    set_korean_font()
    fig, ax = plt.subplots(figsize=(14, 5.2), dpi=180)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 5.2)
    ax.axis("off")
    fig.patch.set_facecolor("#f8fafc")

    ax.text(
        0.45,
        4.75,
        "공부서류 기반 매물 브리핑 초안 에이전트",
        fontsize=22,
        fontweight="bold",
        color="#111827",
        ha="left",
    )
    ax.text(
        0.45,
        4.35,
        "입력자료를 검수 가능한 결과물 단위로 나누고, 고객 설명 초안과 사례글 기록까지 이어갑니다.",
        fontsize=11.5,
        color="#475569",
        ha="left",
    )

    boxes = [
        ("입력자료", "건축물대장\n등기부\n시세·현장 메모", "#e0f2fe"),
        ("Codex 정리", "핵심 수치 추출\n누락·충돌 표시", "#dcfce7"),
        ("중개사 검수", "원문 교차검증\n법적 판단 분리", "#fef3c7"),
        ("브리핑 초안", "고객 설명 문구\n확인 필요 사항", "#ede9fe"),
        ("사례글 기록", "소요 시간\n배운 점\nBefore/After", "#ffe4e6"),
    ]

    x0 = 0.45
    w = 2.25
    h = 1.5
    gap = 0.38
    y = 1.65

    for idx, (title, body, color) in enumerate(boxes):
        x = x0 + idx * (w + gap)
        add_box(ax, x, y, w, h, title, body, color)
        if idx < len(boxes) - 1:
            add_arrow(ax, x + w + 0.05, y + h / 2, x + w + gap - 0.05, y + h / 2)

    ax.text(
        0.45,
        0.55,
        "검수 원칙: 수치와 법적 판단은 단정하지 않고 '확인됨 / 추가 확인 필요 / 자료 없음'으로 분리",
        fontsize=11,
        color="#334155",
        ha="left",
    )

    fig.savefig(IMAGE_DIR / "workflow-diagram.png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)


def evidence_card():
    set_korean_font()
    fig, ax = plt.subplots(figsize=(10.5, 6), dpi=180)
    ax.set_xlim(0, 10.5)
    ax.set_ylim(0, 6)
    ax.axis("off")
    fig.patch.set_facecolor("#f8fafc")

    card = FancyBboxPatch(
        (0.55, 0.55),
        9.4,
        4.9,
        boxstyle="round,pad=0.04,rounding_size=0.06",
        linewidth=1.2,
        edgecolor="#1f2937",
        facecolor="#ffffff",
    )
    ax.add_patch(card)

    ax.text(0.95, 4.95, "현재 확보한 증거", fontsize=19, fontweight="bold", color="#111827", ha="left")
    rows = [
        ("과정 정보", "GPTERS 23기 일정·과제·최종 산출물 확인"),
        ("Goal-mode", "4주 장기 목표 생성"),
        ("Vercel", "CLI 54.20.1 설치 및 sachol 로그인 확인"),
        ("문서화", "운영 문서·입력 체크리스트·사례글 초안 작성"),
    ]

    y = 4.25
    for label, value in rows:
        ax.text(1.05, y, label, fontsize=12.5, fontweight="bold", color="#0f172a", ha="left")
        ax.text(2.75, y, value, fontsize=12.5, color="#334155", ha="left")
        ax.plot([1.0, 9.45], [y - 0.32, y - 0.32], color="#e2e8f0", linewidth=1)
        y -= 0.85

    ax.text(
        0.95,
        0.9,
        "다음 증거: 기존 방식 1회 실측 시간, Codex 적용 후 처리 시간, 실제 매물 브리핑 산출물",
        fontsize=10.8,
        color="#475569",
        ha="left",
    )

    fig.savefig(IMAGE_DIR / "evidence-card.png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)


def goal_alignment_board():
    set_korean_font()
    fig, ax = plt.subplots(figsize=(14, 8.8), dpi=180)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8.8)
    ax.axis("off")
    fig.patch.set_facecolor("#f8fafc")

    ax.text(
        0.45,
        8.25,
        "GPTERS 23기 목표 대비 현재 정렬 상태",
        fontsize=23,
        fontweight="bold",
        color="#111827",
        ha="left",
    )
    ax.text(
        0.45,
        7.85,
        "운영 구조와 산출물 초안은 준비됐고, 실제 업무 데이터와 Before/After 실측이 다음 병목입니다.",
        fontsize=11.5,
        color="#475569",
        ha="left",
    )

    headers = ["목표 구성요소", "현재 산출물", "상태", "다음 판단 기준"]
    col_x = [0.45, 3.55, 8.35, 10.15]
    col_w = [2.75, 4.45, 1.45, 3.2]
    y_top = 7.15
    row_h = 0.78

    for x, w, header in zip(col_x, col_w, headers):
        rect = FancyBboxPatch(
            (x, y_top),
            w,
            0.48,
            boxstyle="round,pad=0.015,rounding_size=0.025",
            linewidth=0,
            facecolor="#1f2937",
        )
        ax.add_patch(rect)
        ax.text(x + 0.12, y_top + 0.24, header, fontsize=10.2, fontweight="bold", color="#ffffff", va="center")

    rows = [
        ("4주 운영 체계", "README, AGENTS, 진행표,\n일일 로그 도구, 대시보드", "완료", "매일 로그가 계속 쌓이는가", "#dff5f0", "#0f766e"),
        ("Week 1 제출", "제출본, 후보 평가표,\n빠른 답변 템플릿", "입력대기", "반복 업무 5개와 시간 입력", "#fff1d6", "#b45309"),
        ("에이전트 시스템", "매물 브리핑 지시서,\n샘플 입력/출력", "초안완료", "실제 매물 1건으로 검증", "#e8f0ff", "#2563eb"),
        ("Before/After 측정", "실측 프로토콜,\n측정표 생성 스크립트", "입력대기", "기존 방식과 Codex 방식 실측", "#fff1d6", "#b45309"),
        ("GPTERS 사례글", "사례글 초안,\n증거 장부, 이미지 2장", "진행중", "실측 결과와 시행착오 반영", "#eee7ff", "#6d28d9"),
        ("최종 발표 자료", "6장 HTML 슬라이드,\n3분 발표 대본", "초안완료", "수치와 산출물 캡처 보강", "#e8f0ff", "#2563eb"),
        ("법적·수치 검수", "금지 표현, 교차검증,\n비식별 기준", "준비됨", "실제 자료 적용 시 누락 없는가", "#dff5f0", "#0f766e"),
    ]

    y = 6.35
    for idx, (goal, artifact, status, next_step, fill, color) in enumerate(rows):
        bg = "#ffffff" if idx % 2 == 0 else "#fbfcfd"
        ax.add_patch(
            FancyBboxPatch(
                (0.45, y - 0.1),
                12.9,
                row_h,
                boxstyle="round,pad=0.01,rounding_size=0.02",
                linewidth=0.8,
                edgecolor="#d7dde5",
                facecolor=bg,
            )
        )
        ax.text(col_x[0] + 0.12, y + 0.3, goal, fontsize=10.6, fontweight="bold", color="#17202a", va="center")
        ax.text(col_x[1] + 0.12, y + 0.3, artifact, fontsize=9.5, color="#334155", va="center", linespacing=1.25)

        pill = FancyBboxPatch(
            (col_x[2] + 0.06, y + 0.08),
            1.18,
            0.38,
            boxstyle="round,pad=0.02,rounding_size=0.06",
            linewidth=0,
            facecolor=fill,
        )
        ax.add_patch(pill)
        ax.text(col_x[2] + 0.65, y + 0.27, status, fontsize=9.1, fontweight="bold", color=color, ha="center", va="center")
        ax.text(col_x[3] + 0.12, y + 0.3, next_step, fontsize=9.5, color="#334155", va="center")
        y -= row_h

    callout = FancyBboxPatch(
        (0.55, 0.35),
        12.7,
        0.42,
        boxstyle="round,pad=0.02,rounding_size=0.04",
        linewidth=1,
        edgecolor="#9bd3c8",
        facecolor="#dff5f0",
    )
    ax.add_patch(callout)
    ax.text(
        0.75,
        0.56,
        "정렬 판단: 목표 방향과 부합 | 완료: 운영 구조·지시서·샘플·제출/발표 초안 | 남은 병목: 실제 반복 업무 5개와 Before/After 실측",
        fontsize=10.4,
        fontweight="bold",
        color="#07534d",
        ha="left",
        va="center",
    )

    fig.savefig(IMAGE_DIR / "goal-alignment-board.png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)


if __name__ == "__main__":
    workflow_diagram()
    evidence_card()
    goal_alignment_board()
    print(f"Generated images in {IMAGE_DIR}")
