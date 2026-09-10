"use client";
import { Icon } from "@/components/icon";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="center-state"><div className="state-icon error"><Icon name="AlertTriangle" size={32} /></div><h1>Ada yang tidak beres</h1><p>Permintaan tidak dapat diproses. Periksa koneksi database lalu coba lagi.</p><button className="primary-button" onClick={reset}><Icon name="RefreshCw" size={17} />Coba lagi</button></main>;
}
