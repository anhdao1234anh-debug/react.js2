/** Escape ký tự đặc biệt để đưa chuỗi người dùng nhập vào RegExp an toàn (chống ReDoS/injection). */
export function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Regex tìm kiếm "chứa chuỗi", không phân biệt hoa thường. */
export function containsRegex(input) {
  return new RegExp(escapeRegex(input.trim()), 'i');
}

/** Lấy tên hiển thị mặc định từ email: "nguyen.van.a@x.com" -> "nguyen.van.a". */
export function nameFromEmail(email) {
  return String(email).split('@')[0].slice(0, 100) || 'User';
}
