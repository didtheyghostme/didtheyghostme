type ClickEvent = {
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
};

export type ClickType = "row_clicked" | "cmd_clicked" | "right_clicked" | "middle_clicked" | "shift_clicked";

type StrictExtract<T, U extends T> = Extract<T, U>;

type OnClickType = StrictExtract<ClickType, "row_clicked" | "cmd_clicked" | "shift_clicked">;

export function getClickType(e: ClickEvent): OnClickType {
  if (e.shiftKey) return "shift_clicked";
  if (e.metaKey || e.ctrlKey) return "cmd_clicked";

  return "row_clicked";
}

// For onMouseDown - checks for middle click
export function isMiddleClick(e: React.MouseEvent): boolean {
  return e.button === 1;
}
