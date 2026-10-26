"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/app-shell";
import { GoogleMark } from "@/components/icons";
import { Avatar, inputCls } from "@/components/ui";
import { DEMO_ACCOUNT_IDS } from "@/lib/mock-data";
import { classesForAccount } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { CLASS_TYPE_LABEL } from "@/lib/format";

export default function LoginPage() {
  const { ready, data, account, signIn, signInByEmail } = useStore();
  const router = useRouter();
  const [chooser, setChooser] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && account) router.replace("/");
  }, [ready, account, router]);

  const demoAccounts = DEMO_ACCOUNT_IDS.map((id) => data.accounts.find((a) => a.id === id)).filter(
    (a): a is NonNullable<typeof a> => !!a,
  );

  const go = (id: string) => {
    signIn(id);
    router.replace("/");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Trang vở bên trái */}
      <section className="relative hidden overflow-hidden border-r border-rule bg-surface lg:block">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0 2.4rem, var(--rule) 2.4rem calc(2.4rem + 1px))",
          }}
          aria-hidden
        />
        <div className="absolute inset-y-0 left-24 border-l-[1.5px] border-margin" aria-hidden />
        <div className="relative flex h-full flex-col justify-between py-14 pl-32 pr-14">
          <div className="flex items-center gap-3">
            <Logo size={34} />
            <span className="text-lg font-semibold tracking-tight">Yose Center</span>
          </div>
          <div className="max-w-md">
            <p className="font-serif text-[2.35rem] leading-[1.2] text-ink">
              Mọi buổi học, ghi chú và <span className="hl">bài tập về nhà</span> ở cùng một chỗ.
            </p>
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-ink-soft">
              Lớp 1-1, 1-2 hay lớp nhóm đều chia theo từng buổi. Mở buổi nào là thấy note trên lớp, từ vựng và
              homework của buổi đó.
            </p>
          </div>
          <p className="text-xs text-muted">Bản demo, dữ liệu mẫu lưu trên trình duyệt của bạn.</p>
        </div>
      </section>

      {/* Đăng nhập */}
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <Logo />
            <span className="font-semibold tracking-tight">Yose Center</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Dùng Gmail bạn đã điền trong form đăng ký học. Gmail chưa đăng ký sẽ không vào được.
          </p>

          <button
            type="button"
            onClick={() => setChooser((v) => !v)}
            aria-expanded={chooser}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-rule bg-surface px-4 py-2.5 text-sm font-medium shadow-card transition hover:bg-surface-2"
          >
            <GoogleMark />
            Tiếp tục với Google
          </button>

          {chooser && (
            <div className="mt-3 overflow-hidden rounded-xl border border-rule bg-surface shadow-card">
              <div className="border-b border-rule bg-surface-2 px-4 py-2.5 text-xs text-muted">
                Chế độ demo: chọn một tài khoản mẫu
              </div>
              <ul>
                {demoAccounts.map((a) => {
                  const classes = classesForAccount(data, a);
                  const desc =
                    a.role === "admin"
                      ? "Quản trị trung tâm"
                      : a.role === "teacher"
                        ? `Giáo viên, dạy ${classes.length} lớp`
                        : classes.map((c) => `${CLASS_TYPE_LABEL[c.type]} ${c.name}`).join(" và ");
                  return (
                    <li key={a.id} className="border-b border-rule last:border-0">
                      <button
                        type="button"
                        onClick={() => go(a.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
                      >
                        <Avatar name={a.name} size={34} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{a.name}</span>
                          <span className="block truncate text-xs text-muted">{a.email}</span>
                          <span className="mt-0.5 block truncate text-xs text-ink-soft">{desc}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <form
                className="flex gap-2 border-t border-rule p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const acc = signInByEmail(email.trim());
                  if (acc) router.replace("/");
                  else setError("Gmail này chưa có trong danh sách học viên hoặc giáo viên.");
                }}
              >
                <label htmlFor="email" className="sr-only">
                  Gmail khác
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Gmail khác trong dữ liệu mẫu"
                  className={inputCls}
                />
                <button type="submit" className="rounded-lg bg-brand px-3 text-sm font-medium text-brand-ink">
                  Vào
                </button>
              </form>
              {error && (
                <p role="alert" className="px-4 pb-3 text-xs text-danger">
                  {error}
                </p>
              )}
            </div>
          )}

          <p className="mt-10 text-xs leading-relaxed text-muted">
            Chưa có tài khoản? Liên hệ Yose để được ghi danh. Mỗi học viên có một mã riêng, gắn với Gmail đăng ký.
          </p>
        </div>
      </section>
    </div>
  );
}
