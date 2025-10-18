"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";

const TOGGLE_CLASSES =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-lg shadow-sm transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus-visible:outline-neutral-400";

export function ModeToggle() {
  // resolvedTheme -> 기본 시스템 테마 저장
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // useCallback : 함수를 메모이제이션(memoization)
  // resolvedTheme, setTheme 변경, useCallback은 새 인스턴스를 생성만.. 실행 X
  /**
   * 클릭 → 테마 변경 → resolvedTheme 변경 → 렌더링 → useCallback 의존성이 바뀌었기 때문에 새로운 함수 생성 : 실행은 X ( 클릭 할때만 실행 )
   */
  const handleToggle = useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    console.log("테마 변경됨!!!!!!!!!!!");
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  console.log("handleToggle",handleToggle);
  
  console.log("resolvedTheme:", resolvedTheme);

  const icon = resolvedTheme === "dark" ? "\u{1F31E}" : "\u{1F319}";
  const label =
    resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  if (!isMounted) {
    return null;
  }
  // dark mode icon toggle button
  return (
    <button
      type="button"
      onClick={handleToggle}
      className={TOGGLE_CLASSES}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
