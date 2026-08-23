"use client";

import { getErrorMessage, post } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.password_confirm) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      const res = await post<{
        access_token: string;
        refresh_token: string;
        user: {
          id: number;
          name: string;
          email: string;
          phone?: string;
          role: { id: number; code: string; name: string };
        };
      }>("/auth/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      if (res.success && res.data) {
        saveSession(
          res.data.access_token,
          res.data.refresh_token,
          res.data.user,
        );
        router.push("/dashboard");
      } else {
        setError(res.message || "Registrasi gagal.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 0.875rem 0.75rem 2.75rem",
    background: "rgba(255,255,255,0.06)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "white",
    fontSize: "0.875rem",
    fontFamily: "'Montserrat', sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #25343F 0%, #1a2632 60%, #0F1419 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Montserrat', sans-serif",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(255,155,81,0.05)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "2.5rem",
          backdropFilter: "blur(20px)",
          position: "relative",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #FF9B51 0%, #FF7A1F 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "white",
                fontSize: "1rem",
                boxShadow: "0 8px 24px rgba(255,155,81,0.4)",
              }}
            >
              PsP
            </div>
            <span
              style={{ color: "white", fontWeight: 700, fontSize: "1.125rem" }}
            >
              Daftar Kandidat
            </span>
          </Link>
          <p
            style={{
              color: "#8BA3B5",
              fontSize: "0.875rem",
              marginTop: "0.5rem",
            }}
          >
            Buat akun untuk mengikuti seleksi
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "10px",
                padding: "0.875rem",
                marginBottom: "1.25rem",
                color: "#fca5a5",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <i className="lni lni-question-mark-circle" /> {error}
            </div>
          )}

          {[
            {
              name: "name",
              label: "Nama Lengkap",
              icon: "lni-user-4",
              type: "text",
              placeholder: "Budi Utomo",
            },
            {
              name: "email",
              label: "Email",
              icon: "lni-envelope-1",
              type: "email",
              placeholder: "budi@email.com",
            },
            {
              name: "phone",
              label: "No. Telepon",
              icon: "lni-phone",
              type: "tel",
              placeholder: "08xxxxxxxxxx",
            },
          ].map((field) => (
            <div key={field.name} style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#8BA3B5",
                  marginBottom: "0.375rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase" as const,
                }}
              >
                {field.label}
              </label>
              <div style={{ position: "relative" }}>
                <i
                  className={`lni ${field.icon}`}
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#8BA3B5",
                    fontSize: "1rem",
                  }}
                />
                <input
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.name as keyof typeof form]}
                  onChange={handleChange}
                  required={field.name !== "phone"}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                  }
                />
              </div>
            </div>
          ))}

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#8BA3B5",
                marginBottom: "0.375rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <i
                className="lni lni-locked-1"
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#8BA3B5",
                  fontSize: "1rem",
                }}
              />
              <input
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="Min. 8 karakter"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                style={{ ...inputStyle, paddingRight: "2.75rem" }}
                onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                }
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#8BA3B5",
                }}
              >
                <i className="lni lni-eye" />
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#8BA3B5",
                marginBottom: "0.375rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Konfirmasi Password
            </label>
            <div style={{ position: "relative" }}>
              <i
                className="lni lni-locked-1"
                style={{
                  position: "absolute",
                  left: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#8BA3B5",
                  fontSize: "1rem",
                }}
              />
              <input
                name="password_confirm"
                type={showPass ? "text" : "password"}
                placeholder="Ulangi password"
                value={form.password_confirm}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: loading
                ? "#94a3b8"
                : "linear-gradient(135deg, #FF9B51 0%, #FF7A1F 100%)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontWeight: 700,
              fontSize: "0.9375rem",
              fontFamily: "'Montserrat', sans-serif",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 16px rgba(255,155,81,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {loading ? (
              <>
                <i
                  className="lni lni-spinner-3"
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                Mendaftar...
              </>
            ) : (
              <>
                <i className="lni lni-check" /> Buat Akun
              </>
            )}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            color: "#8BA3B5",
            fontSize: "0.875rem",
          }}
        >
          Sudah punya akun?{" "}
          <Link
            href="/login"
            style={{
              color: "#FF9B51",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Masuk di sini
          </Link>
        </p>
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <Link
            href="/"
            style={{
              color: "#64748B",
              fontSize: "0.8rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <i className="lni lni-arrow-left" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
