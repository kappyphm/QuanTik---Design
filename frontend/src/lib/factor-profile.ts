import type { AnalysisVisuals, ScanResult } from './mock-data';
export type Factor = { label: string; score: number | null; raw: string; rule: string; reading: string };
const number = (v: string | null | undefined) => v == null || !v.trim() || !Number.isFinite(Number(v)) ? null : Number(v);
const scale = (v: number | null, min: number, max: number) => v == null ? null : Math.round(Math.max(0, Math.min(100, (v-min)/(max-min)*100)));
export function factorProfile(result: ScanResult, report: AnalysisVisuals): Factor[] {
  const m=result.metrics, hurst=number(m.AA), sharpe=number(m.N), forecast=number(m.AG);
  return [
    {label:'Xu hướng', score:scale(report.performance.er,0,1), raw:`ER ${report.performance.er.toFixed(2)}`, rule:'ER × 100; đo độ liền mạch, không đo chiều tăng.', reading:`Hiệu suất đường đi ${report.performance.er.toFixed(2)}; đọc chiều giá cùng HMM.`},
    {label:'Độ bền xu hướng', score:scale(hurst,0,1), raw:`Hurst ${hurst ?? '—'}`, rule:'Hurst × 100; không thay thế RSI hay momentum.', reading:hurst==null?'Chưa có Hurst.':hurst>.55?'Chuỗi nghiêng về tính duy trì; xu hướng có thể tăng hoặc giảm.':hurst<.45?'Chuỗi nghiêng về hồi quy; cần thận trọng với việc đuổi giá.':'Cấu trúc gần ngẫu nhiên, tín hiệu duy trì chưa rõ.'},
    {label:'Dòng tiền', score:scale(report.performance.cmf,-1,1), raw:`CMF ${report.performance.cmf.toFixed(2)}`, rule:'(CMF + 1) × 50; CMF = 0 tương ứng 50 điểm.', reading:report.performance.cmf>0?'Giá và khối lượng nghiêng về áp lực mua.':report.performance.cmf<0?'Giá và khối lượng nghiêng về áp lực bán.':'Dòng tiền đang cân bằng.'},
    {label:'Sức mạnh tương đối', score:scale(report.performance.relativeStrengthPct,-10,10), raw:`${report.performance.relativeStrengthPct.toFixed(2)} điểm %`, rule:'Ánh xạ −10…+10 điểm % sang 0…100, chặn hai đầu.', reading:report.performance.relativeStrengthPct>=0?'Lợi suất mẫu đang vượt VN-Index.':'Lợi suất mẫu đang kém VN-Index.'},
    {label:'Hiệu quả rủi ro', score:scale(sharpe,-1,2), raw:`Sharpe ${sharpe ?? '—'}`, rule:'Ánh xạ Sharpe −1…2 sang 0…100, chặn hai đầu.', reading:sharpe==null?'Chưa có Sharpe.':sharpe>=1?'Lợi suất điều chỉnh theo biến động tương đối thuận lợi trong mẫu.':sharpe>0?'Hiệu suất điều chỉnh rủi ro dương nhưng còn hạn chế.':'Hiệu suất điều chỉnh rủi ro chưa thuận lợi.'},
    {label:'Dự báo sau phí', score:scale(forecast,-5,5), raw:`${forecast ?? '—'}%`, rule:'Ánh xạ lợi suất sau phí −5…+5% sang 0…100, chặn hai đầu.', reading:forecast==null?'Chưa có dự báo sau phí.':forecast>0?'Kịch bản tổng hợp sau phí dương; cần đối chiếu dải rủi ro.':'Kịch bản tổng hợp sau phí chưa tích cực.'},
  ];
}
export function drawdownSeries(prices: number[]) {
  let peak = -Infinity;
  return prices.map(price => {peak=Math.max(peak,price); return peak>0?(price/peak-1)*100:0;});
}
