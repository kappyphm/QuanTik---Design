import Link from "next/link";
export default function NotFound() {
    return (<main className="not-found [padding:20vh_24px] text-center [color:#edf4ef] [line-height:1.7] [&_h1]:[font-size:32px] [&_a]:[display:inline-block] [&_a]:[margin-top:20px] [&_a]:[color:#ff914d]">
      <h1>Không tìm thấy trang</h1>
      <p>Quay lại không gian QuanTik để tiếp tục.</p>
      <Link href="/dashboard">Mở Dashboard →</Link>
    </main>);
}
