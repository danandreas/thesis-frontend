"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTheme } from "@/hooks/useTheme";
import { get, getErrorMessage, post } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Option {
  id: number;
  option_text: string;
  display_order: number;
}
interface Question {
  question_id: number;
  question_text: string;
  options: Option[];
}
interface RequirementInfo {
  recruitment_requirement_id: number;
  name: string;
  value_type: string; // 'numeric' | 'scale' | 'count' | 'boolean'
  min_value: number;
  max_value: number;
  unit: string | null;
  is_mandatory: boolean;
}
interface AssessmentData {
  application_id: number;
  position_title: string;
  total_questions: number;
  questions: Question[];
  requirements: RequirementInfo[]; // requirements dari rekrutmen
}

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { isDark } = useTheme();
  const appId = Number(params.id);

  const surface = isDark ? "#1A2332" : "#ffffff";
  const border = isDark ? "#2A3A4A" : "#E2E8F0";
  const textMain = isDark ? "#E2EAF0" : "#25343F";
  const textMut = isDark ? "#8BA3B5" : "#64748B";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC";

  const [data, setData] = useState<AssessmentData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [reqValues, setReqValues] = useState<Record<number, string>>({}); // recruitment_requirement_id → value
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // Fetch questions (berisi application_id → position_id → recruitment_id → requirements)
        const res = await get<AssessmentData>(
          `/content/applications/${appId}/questions`,
        );
        if (res.success && res.data) {
          setData(res.data);
          // Init reqValues dengan string kosong untuk semua requirements
          const init: Record<number, string> = {};
          (res.data.requirements || []).forEach((r) => {
            init[r.recruitment_requirement_id] = "";
          });
          setReqValues(init);
        } else {
          setError(res.message || "Gagal memuat pertanyaan.");
        }
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [appId]);

  const handleAnswer = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleReqValue = (rrId: number, val: string) => {
    setReqValues((prev) => ({ ...prev, [rrId]: val }));
  };

  const answeredCount = Object.keys(answers).length;
  const totalQ = data?.total_questions || 0;
  const requirements = data?.requirements || [];
  const mandatoryReqs = requirements.filter((r) => r.is_mandatory);
  const progress = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;

  const handleSubmit = async () => {
    // Validasi semua pertanyaan dijawab
    if (answeredCount < totalQ) {
      setError(
        `Harap jawab semua pertanyaan. Masih ada ${totalQ - answeredCount} pertanyaan yang belum dijawab.`,
      );
      return;
    }
    // Validasi semua requirement wajib diisi
    for (const mr of mandatoryReqs) {
      if (
        !reqValues[mr.recruitment_requirement_id] &&
        reqValues[mr.recruitment_requirement_id] !== "0"
      ) {
        setError(`Syarat wajib "${mr.name}" harus diisi.`);
        return;
      }
    }

    setError("");
    setSubmitting(true);
    try {
      const answerList = Object.entries(answers).map(([qId, optId]) => ({
        question_id: Number(qId),
        option_id: optId,
      }));

      // Bug #8 fix: kirim requirements yang sudah diisi (bukan hardcode [])
      const requirementList = requirements
        .filter((r) => reqValues[r.recruitment_requirement_id] !== "")
        .map((r) => ({
          recruitment_requirement_id: r.recruitment_requirement_id,
          raw_value: parseFloat(reqValues[r.recruitment_requirement_id]) || 0,
        }));

      await post(`/content/applications/${appId}/submit`, {
        answers: answerList,
        requirements: requirementList,
      });
      router.push("/dashboard/my-applications");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: inputBg,
    border: `1.5px solid ${border}`,
    borderRadius: "10px",
    color: textMain,
    fontSize: "0.875rem",
    fontFamily: "'Montserrat', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  if (loading)
    return (
      <DashboardLayout>
        <div style={{ padding: "3rem", textAlign: "center", color: textMut }}>
          <i
            className="lni lni-spinner-3"
            style={{
              fontSize: "2rem",
              animation: "spin 1s linear infinite",
              display: "block",
              marginBottom: "0.75rem",
            }}
          />
          Memuat pertanyaan asesmen...
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      {/* Header & Progress */}
      <div
        style={{
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: "16px",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          position: "sticky",
          top: "72px",
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div>
            <h1
              style={{ fontSize: "1.125rem", fontWeight: 800, color: textMain }}
            >
              Form Asesmen
            </h1>
            <p style={{ fontSize: "0.8rem", color: textMut }}>
              {data?.position_title}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{ fontSize: "1.5rem", fontWeight: 900, color: "#FF9B51" }}
            >
              {answeredCount}
            </span>
            <span style={{ fontSize: "0.875rem", color: textMut }}>
              /{totalQ}
            </span>
            <p style={{ fontSize: "0.72rem", color: textMut }}>terjawab</p>
          </div>
        </div>
        <div
          style={{
            height: "8px",
            background: isDark ? "#2A3A4A" : "#E2E8F0",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #FF9B51, #FF7A1F)",
              borderRadius: "4px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "10px",
            padding: "0.875rem 1rem",
            color: "#ef4444",
            fontSize: "0.875rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <i className="lni lni-question-mark-circle" /> {error}
        </div>
      )}

      {/* Questions */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {data?.questions.map((q, idx) => (
          <div
            key={q.question_id}
            style={{
              background: surface,
              border: `1.5px solid ${answers[q.question_id] ? "#FF9B51" : border}`,
              borderRadius: "16px",
              padding: "1.375rem 1.5rem",
              transition: "border-color 0.2s",
            }}
          >
            <div
              style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: answers[q.question_id]
                    ? "#FF9B51"
                    : isDark
                      ? "#2A3A4A"
                      : "#E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  color: answers[q.question_id] ? "white" : textMut,
                  transition: "all 0.2s",
                }}
              >
                {answers[q.question_id] ? (
                  <i
                    className="lni lni-check"
                    style={{ fontSize: "0.75rem" }}
                  />
                ) : (
                  idx + 1
                )}
              </div>
              <p
                style={{
                  color: textMain,
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  lineHeight: 1.5,
                }}
              >
                {q.question_text}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                paddingLeft: "2.375rem",
              }}
            >
              {q.options.map((opt) => {
                const selected = answers[q.question_id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(q.question_id, opt.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "10px",
                      border: `1.5px solid ${selected ? "#FF9B51" : border}`,
                      background: selected
                        ? isDark
                          ? "rgba(255,155,81,0.12)"
                          : "rgba(255,155,81,0.08)"
                        : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        border: `2px solid ${selected ? "#FF9B51" : border}`,
                        background: selected ? "#FF9B51" : "transparent",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      {selected && (
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "white",
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: selected ? "#FF9B51" : textMain,
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      {opt.option_text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bug #8 fix: Tampilkan form requirements jika ada */}
      {requirements.length > 0 && (
        <div
          style={{
            background: surface,
            border: `1px solid ${border}`,
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontWeight: 800,
              fontSize: "1rem",
              color: textMain,
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <i className="lni lni-file-multiple" style={{ color: "#FF9B51" }} />{" "}
            Data Syarat Tambahan
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {requirements.map((r) => (
              <div key={r.recruitment_requirement_id}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: textMut,
                    marginBottom: "0.375rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {r.name}
                  {r.is_mandatory && (
                    <span style={{ color: "#ef4444", marginLeft: "4px" }}>
                      *
                    </span>
                  )}
                  {r.unit && (
                    <span
                      style={{
                        fontWeight: 400,
                        textTransform: "none",
                        marginLeft: "4px",
                      }}
                    >
                      ({r.unit})
                    </span>
                  )}
                </label>
                {r.value_type === "boolean" ? (
                  <select
                    style={inputStyle}
                    value={reqValues[r.recruitment_requirement_id] ?? ""}
                    onChange={(e) =>
                      handleReqValue(
                        r.recruitment_requirement_id,
                        e.target.value,
                      )
                    }
                  >
                    <option value="">-- Pilih --</option>
                    <option value="1">Ya / Memiliki</option>
                    <option value="0">Tidak / Belum Memiliki</option>
                  </select>
                ) : (
                  <input
                    type="number"
                    step={r.value_type === "numeric" ? "0.01" : "1"}
                    min={r.min_value}
                    max={r.max_value}
                    style={inputStyle}
                    value={reqValues[r.recruitment_requirement_id] ?? ""}
                    onChange={(e) =>
                      handleReqValue(
                        r.recruitment_requirement_id,
                        e.target.value,
                      )
                    }
                    placeholder={`${r.min_value} – ${r.max_value}`}
                    required={r.is_mandatory}
                    onFocus={(e) => (e.target.style.borderColor = "#FF9B51")}
                    onBlur={(e) => (e.target.style.borderColor = border)}
                  />
                )}
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: textMut,
                    marginTop: "0.25rem",
                  }}
                >
                  Rentang nilai: {r.min_value} – {r.max_value}
                  {r.is_mandatory ? " · Wajib diisi" : " · Opsional"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div
        style={{
          background: surface,
          border: `1px solid ${border}`,
          borderRadius: "16px",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <p style={{ fontSize: "0.875rem", color: textMut }}>
          {answeredCount < totalQ ? (
            <>
              <i
                className="lni lni-question-mark-circle"
                style={{ color: "#FF9B51", marginRight: "0.375rem" }}
              />
              {totalQ - answeredCount} pertanyaan belum dijawab
            </>
          ) : (
            <>
              <i
                className="lni lni-check-circle-1"
                style={{ color: "#10b981", marginRight: "0.375rem" }}
              />
              Semua pertanyaan sudah dijawab
            </>
          )}
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting || answeredCount < totalQ}
          style={{
            padding: "0.75rem 1.75rem",
            background:
              submitting || answeredCount < totalQ ? "#94a3b8" : "#FF9B51",
            border: "none",
            borderRadius: "10px",
            color: "white",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor:
              submitting || answeredCount < totalQ ? "not-allowed" : "pointer",
            fontFamily: "'Montserrat', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow:
              submitting || answeredCount < totalQ
                ? "none"
                : "0 4px 16px rgba(255,155,81,0.4)",
          }}
        >
          {submitting ? (
            <>
              <i
                className="lni lni-spinner-3"
                style={{ animation: "spin 1s linear infinite" }}
              />{" "}
              Mengirim...
            </>
          ) : (
            <>
              <i className="lni lni-enter" /> Submit Asesmen
            </>
          )}
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
