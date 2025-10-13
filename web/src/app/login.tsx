"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		// Persist a simple 'user' object in localStorage used by AuthGuard
		const user = { name: name || "Guest", phone: phone || "" };
		if (typeof window !== "undefined") {
			localStorage.setItem("user", JSON.stringify(user));
		}
		// Redirect to root/dashboard
		router.replace("/");
	}

	return (
		<div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
			<main style={{ width: 420, padding: 24, boxShadow: "0 6px 18px rgba(0,0,0,0.08)", borderRadius: 8 }}>
				<h1 style={{ marginBottom: 12 }}>Login</h1>
				<form onSubmit={handleSubmit}>
					<label style={{ display: "block", marginBottom: 8 }}>
						Name
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
							style={{ width: "100%", padding: 8, marginTop: 6 }}
						/>
					</label>

					<label style={{ display: "block", marginBottom: 12 }}>
						Phone
						<input
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="628123456789"
							style={{ width: "100%", padding: 8, marginTop: 6 }}
						/>
					</label>

					<div style={{ display: "flex", gap: 8 }}>
						<button type="submit" style={{ padding: "8px 12px" }}>
							Sign in
						</button>
						<button
							type="button"
							onClick={() => {
								if (typeof window !== "undefined") {
									localStorage.removeItem("user");
								}
								setName("");
								setPhone("");
							}}
							style={{ padding: "8px 12px" }}
						>
							Clear localStorage
						</button>
					</div>
				</form>
			</main>
		</div>
	);
}
