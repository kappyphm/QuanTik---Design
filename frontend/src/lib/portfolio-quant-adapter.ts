/**
 * Tham số phương sai cho mô phỏng: phương sai khởi đầu ước lượng từ phương sai
 * mẫu của chuỗi lợi suất thật của chính mã đó (đăng ký khi nạp dữ liệu thị
 * trường). Hệ số GARCH alpha/beta là giả định chuẩn, không phải hệ số được fit
 * từ báo cáo Quant; HMM không được tính ở trang này.
 */
const variances = new Map<string, number>();

export function registerQuantVariance(symbol: string, variance: number) {
  variances.set(symbol, variance);
}

export function quantModel(symbol: string) {
  const variance = variances.get(symbol);
  if (typeof variance !== "number" || !Number.isFinite(variance) || variance <= 0) throw new Error(`Thiếu thống kê giá cho ${symbol}.`);
  const alpha = 0.05, beta = 0.93;
  return {
    alpha, beta, omega: variance * (1 - alpha - beta), variance,
    hmm: null as { bull: number; sideways: number; bear: number } | null,
    source: "Phương sai ước lượng từ chuỗi giá thật; hệ số GARCH là giả định chuẩn.",
  };
}
