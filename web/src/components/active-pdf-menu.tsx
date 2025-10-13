import React, { useEffect, useState } from "react";

export function ActivePdfMenu() {
  const [pdfText, setPdfText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPdfText = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8002/pdf-text");
      if (!res.ok) throw new Error("Gagal fetch PDF aktif");
      const data = await res.json();
      setPdfText(data.text || "");
    } catch (err: any) {
      setError(err.message || "Gagal fetch PDF aktif");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPdfText();
  }, []);

  return (
    <div className="border rounded p-3 bg-white mt-2">
      <div className="font-semibold mb-2">Menu PDF Aktif</div>
      {loading ? (
        <div className="text-xs text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-xs text-red-500">{error}</div>
      ) : pdfText ? (
        <pre className="text-xs whitespace-pre-wrap max-h-64 overflow-y-auto">{pdfText}</pre>
      ) : (
        <div className="text-xs text-gray-400">Belum ada PDF aktif</div>
      )}
      <button onClick={fetchPdfText} className="mt-2 text-xs underline text-blue-500">Refresh</button>
    </div>
  );
}
