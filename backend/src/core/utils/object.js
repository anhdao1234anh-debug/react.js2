/** Lấy các key chỉ định từ object (bỏ qua key undefined). */
export function pick(source, keys) {
  const result = {};
  for (const key of keys) {
    if (source?.[key] !== undefined) result[key] = source[key];
  }
  return result;
}

/** Bỏ các key chỉ định khỏi object. */
export function omit(source, keys) {
  const exclude = new Set(keys);
  return Object.fromEntries(Object.entries(source ?? {}).filter(([key]) => !exclude.has(key)));
}

/** Bỏ các key có giá trị undefined (hữu ích khi build câu update / filter). */
export function compact(source) {
  return Object.fromEntries(
    Object.entries(source ?? {}).filter(([, value]) => value !== undefined),
  );
}
