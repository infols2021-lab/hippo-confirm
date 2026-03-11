"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./confirm.module.css";

type ConfirmRecordDto = {
  sheetName: string;
  applicationNumber: string;
  studentName: string;
  birthDate: string;
  englishSchool: string;
  age: string;
  category: string;
  format: string;
  confirmStatus: string;
  confirmResponse?: string;
};

type Props = {
  token: string;
};

type LoadState = "loading" | "ready" | "error";
type SubmitState = "idle" | "submitting";

export default function ConfirmPageClient({ token }: Props) {
  const [record, setRecord] = useState<ConfirmRecordDto | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [doneMessage, setDoneMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadState("loading");
        setError("");
        setDoneMessage("");

        const res = await fetch(
          `/api/confirm/load?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(mapLoadError(json?.error || "Не удалось загрузить данные"));
        }

        if (cancelled) return;

        setRecord(json.record);

        if (json.record?.confirmResponse === "confirmed") {
          setDoneMessage("Данные уже были подтверждены ранее.");
        } else if (json.record?.confirmResponse === "rejected") {
          setDoneMessage(
            "Ранее уже было отмечено, что данные неверны. Мы свяжемся с вами лично в Telegram."
          );
        }

        setLoadState("ready");
      } catch (err) {
        if (cancelled) return;

        setError(err instanceof Error ? err.message : "Ошибка загрузки");
        setLoadState("error");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(action: "confirmed" | "rejected") {
    try {
      setSubmitState("submitting");
      setError("");

      const res = await fetch("/api/confirm/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          action,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(mapSubmitError(json?.error || "Не удалось отправить ответ"));
      }

      if (action === "confirmed") {
        setDoneMessage("Спасибо! Данные успешно подтверждены.");
      } else {
        setDoneMessage(
          "Спасибо! Мы отметили, что данные неверны. Мы свяжемся с вами лично в Telegram."
        );
      }

      setRecord((prev) =>
        prev
          ? {
              ...prev,
              confirmResponse: action,
            }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setSubmitState("idle");
    }
  }

  const statusVariant = useMemo(() => {
    if (error) return "error";
    if (doneMessage) {
      if (record?.confirmResponse === "rejected") return "error";
      return "success";
    }
    return "info";
  }, [doneMessage, error, record?.confirmResponse]);

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.hero}>
          <div className={styles.badge}>HIPPO 2026 • Подтверждение данных</div>
          <h1 className={styles.title}>Проверьте данные участника</h1>
          <p className={styles.subtitle}>
            Пожалуйста, внимательно проверьте информацию ниже. Если всё верно —
            подтвердите данные. Если есть ошибка — нажмите кнопку ниже, и мы
            свяжемся с вами лично в Telegram.
          </p>
        </div>

        <div className={styles.card}>
          {loadState === "loading" && (
            <div className={styles.loading}>Загрузка данных...</div>
          )}

          {loadState === "error" && (
            <StatusBox variant="error" title="Не удалось открыть страницу">
              {error}
            </StatusBox>
          )}

          {loadState === "ready" && (
            <>
              {doneMessage ? (
                <StatusBox
                  variant={statusVariant === "error" ? "error" : "success"}
                  title="Готово"
                >
                  {doneMessage}
                </StatusBox>
              ) : (
                <StatusBox variant="info" title="Проверьте данные">
                  Если вы видите ошибку в данных участника, нажмите «Данные
                  неверны».
                </StatusBox>
              )}

              {record && (
                <>
                  <div className={styles.grid}>
                    <Field label="ФИО кандидата" value={record.studentName} />
                    <Field label="Дата рождения кандидата" value={record.birthDate} />
                    <Field
                      label="Школа, где кандидат изучает английский сейчас"
                      value={record.englishSchool}
                    />
                    <Field label="Возраст" value={record.age} />
                    <Field label="Категория олимпиады" value={record.category} />
                    <Field label="Формат участия" value={record.format} />
                  </div>

                  {!doneMessage && (
                    <>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.button} ${styles.primary}`}
                          onClick={() => handleSubmit("confirmed")}
                          disabled={submitState === "submitting"}
                        >
                          {submitState === "submitting"
                            ? "Отправка..."
                            : "Подтверждаю данные"}
                        </button>

                        <button
                          className={`${styles.button} ${styles.danger}`}
                          onClick={() => handleSubmit("rejected")}
                          disabled={submitState === "submitting"}
                        >
                          {submitState === "submitting"
                            ? "Отправка..."
                            : "Данные неверны"}
                        </button>
                      </div>

                      <p className={styles.note}>
                        Если данные указаны неверно, нажмите «Данные неверны». Мы
                        свяжемся с вами лично в Telegram для уточнения информации.
                      </p>
                    </>
                  )}

                  <div className={styles.footerInfo}>
                    Номер заявки: <b>{record.applicationNumber}</b>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValue}>{value || "—"}</div>
    </div>
  );
}

function StatusBox({
  variant,
  title,
  children,
}: {
  variant: "success" | "error" | "info";
  title: string;
  children: React.ReactNode;
}) {
  const variantClass =
    variant === "success"
      ? styles.statusSuccess
      : variant === "error"
      ? styles.statusError
      : styles.statusInfo;

  return (
    <div className={`${styles.statusBox} ${variantClass}`}>
      <h2 className={styles.statusTitle}>{title}</h2>
      <p className={styles.statusText}>{children}</p>
    </div>
  );
}

function mapLoadError(message: string) {
  if (message.includes("outdated")) {
    return "Эта ссылка уже устарела. Пожалуйста, запросите новую ссылку подтверждения.";
  }

  if (message.includes("Record not found")) {
    return "Запись не найдена. Пожалуйста, свяжитесь с организатором.";
  }

  if (message.includes("Missing or invalid token")) {
    return "Некорректная ссылка подтверждения.";
  }

  return message;
}

function mapSubmitError(message: string) {
  if (message.includes("outdated")) {
    return "Эта ссылка уже устарела. Пожалуйста, запросите новую ссылку подтверждения.";
  }

  if (message.includes("уже подтверждены") || message.includes("already")) {
    return "Ответ уже был отправлен ранее.";
  }

  return message;
}