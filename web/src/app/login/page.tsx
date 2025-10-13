"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan password wajib diisi");
      return;
    }
    localStorage.setItem("user", JSON.stringify({ username, role }));
    router.push("/call-agent");
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative" style={{ backgroundImage: 'url(https://www.verdict.co.uk/wp-content/uploads/2024/12/acquisition-shutterstock_2346696327.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center relative z-10">
        <div className="mb-6 flex flex-col items-center">
          <img src="https://www.softwareone.com/-/media/images/logos/softwareone-logo-blk.svg?iar=0&hash=6A277FF39328B4D79A071F4A9F95F301" alt="SoftwareOne Logo" className="w-32 h-auto mb-2" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-black mb-2 tracking-tight text-center whitespace-pre-line leading-tight">
            Interactive
            <br />
            Call Agent Login
          </h1>
          <p className="text-gray-500 text-sm">Masuk ke akun Anda untuk melanjutkan</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full">
          {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">Username</label>
            <input
              type="text"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1 font-medium text-gray-700">Login sebagai</label>
            <select
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition mb-2"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-xs text-gray-400">&copy; {new Date().getFullYear()} SoftwareOne. All rights reserved.</div>
      </div>
    </div>
  );
}
