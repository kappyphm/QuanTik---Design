export type ScreeningSlot = "ALL" | "AM" | "PM";
export type ScreeningGroup = "OVERALL" | "STRONG" | "ACCUMULATION" | "DISTRIBUTION" | "ALL";
export type ScreeningRun = { id: string; target_session: string; slot: "AM" | "PM"; status: string; reason: string | null; published_at: number | null };
export type ScreeningLatest = ScreeningRun & {
  summary: { input_mode: string; source_mode: string; expected_symbols: number; ready_symbols: number; history_coverage_ratio: number; ranking_counts: Partial<Record<ScreeningGroup, number>>; validation_scope?: string };
  stale: boolean; stale_reasons: string[]; calendar_status: string; latest_attempt: ScreeningRun | null;
};
export type ScreeningItem = {
  symbol: string; exchange: string | null; overall_score: number; ranking_eligible: boolean;
  groups: Record<string, { score: number; coverage_ratio: number; true_count: number; false_count: number; unavailable_count: number; ranking_eligible: boolean;
    criteria: Record<string, { state: "TRUE" | "FALSE" | "UNAVAILABLE"; detail: string; reason_codes: string[]; minimum_bars: number }> }>;
  assessment: { status: string; signal_code?: string; recommendation?: string; adjusted_signal?: string };
  price_summary: Record<string, number | null>; volume_context: { observed_at?: string | null; input_mode: string };
  warnings: string[]; rejection_reasons: string[]; ranks: Record<string, number | null>;
};
export type ScreeningResults = { run_id: string; group: ScreeningGroup; items: ScreeningItem[]; next_cursor: string | null };
export const groupLabels: Record<ScreeningGroup, string> = { OVERALL: "Tổng hợp", STRONG: "Sức mạnh", ACCUMULATION: "Tích lũy", DISTRIBUTION: "Cảnh báo phân phối", ALL: "Toàn bộ mã" };
export const screeningReason = (code: string | null | undefined) => ({
  TASK_DEADLINE: "Ca quét đã quá hạn xử lý", SCREENING_DEADLINE: "Ca quét đã quá hạn công bố", MANIFEST_NOT_READY: "Đang chờ dữ liệu thị trường",
  HISTORY_NOT_READY: "Đang chờ lịch sử giá", UNIVERSE_NOT_VALIDATED: "Danh sách mã chưa được kiểm định", LIVE_DATA_NOT_VALIDATED: "Dữ liệu chưa đạt kiểm định",
  SCREENING_COVERAGE_NOT_READY: "Độ phủ dữ liệu chưa đạt", SCREENING_ZERO_ELIGIBLE: "Chưa có mã đủ điều kiện xếp hạng", PM_DATA_NOT_COMPLETED: "Đang chờ dữ liệu cuối ngày",
  LATEST_RUN_UNAVAILABLE: "Ca mới nhất chưa công bố thành công", EXPECTED_SLOT_UNPUBLISHED: "Chưa có kết quả cho ca dự kiến gần nhất",
  CALENDAR_OUT_OF_RANGE: "Lịch giao dịch cần cập nhật", PUBLICATION_AGE: "Bản công bố đã cũ", INSUFFICIENT_HISTORY: "Chưa đủ lịch sử giá",
  CORPORATE_ACTION_ADJUSTMENT_UNVERIFIED: "Điều chỉnh giá do sự kiện doanh nghiệp chưa được xác minh",
  NONFINITE_BARS: "Dữ liệu giá hoặc khối lượng không hợp lệ", INPUT_UNAVAILABLE: "Thiếu dữ liệu đầu vào", INVALID_OR_MISSING_BARS: "Thiếu dữ liệu giá",
  NO_COMPARISON_SESSIONS: "Chưa đủ phiên tăng và giảm để so sánh",
  DISTRIBUTION_COVERAGE_INCOMPLETE: "Chưa đủ chỉ tiêu phân phối", INSUFFICIENT_HISTORY_OR_LIQUIDITY: "Chưa đủ lịch sử hoặc thanh khoản",
} as Record<string, string>)[code || ""] || (code ? `Trạng thái dữ liệu: ${code}` : "Đang chờ dữ liệu hoặc xử lý");
