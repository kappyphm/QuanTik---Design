import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <h1>Không tìm thấy trang</h1>
      <p>Quay lại không gian QuanTik để tiếp tục.</p>
      <Link href="/dashboard">Mở Dashboard →</Link>
    </main>
  );
}
