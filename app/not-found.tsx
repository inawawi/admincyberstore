import Link from "next/link";
import { Icon } from "@/components/icon";

export default function NotFound() {
  return <main className="center-state"><div className="state-icon"><Icon name="CircleHelp" size={32} /></div><h1>Halaman tidak ditemukan</h1><p>Alamat yang Anda buka tidak tersedia di Cyber Store.</p><Link className="primary-button" href="/admin">Kembali ke dashboard</Link></main>;
}
