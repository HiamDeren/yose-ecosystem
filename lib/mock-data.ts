import { lessonFor, LESSONS } from "./lessons";
import type {
  Account,
  Attachment,
  ClassGroup,
  ClassSession,
  Enrollment,
  Homework,
  SessionNote,
  Student,
  StudentRemark,
  Submission,
  Teacher,
  YoseData,
} from "./types";

// Dữ liệu demo được sinh tương đối theo ngày hiện tại, để lúc nào mở demo
// cũng có buổi đã học, buổi sắp tới và bài tập đang chờ nộp.

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;

const teachers: Teacher[] = [
  { id: "t-linh", fullName: "Trần Mỹ Linh", email: "linh.tran@yose.edu.vn", hourlyRate: 250_000 },
  { id: "t-kevin", fullName: "Kevin Nguyen", email: "kevin.nguyen@yose.edu.vn", hourlyRate: 300_000 },
  { id: "t-ha", fullName: "Phạm Thu Hà", email: "ha.pham@yose.edu.vn", hourlyRate: 220_000 },
];

const studentSeeds: [string, string, string][] = [
  ["s-minhanh", "Nguyễn Minh Anh", "minhanh.nguyen.ys@gmail.com"],
  ["s-giahuy", "Trần Gia Huy", "giahuy.tran.ys@gmail.com"],
  ["s-thaovy", "Lê Thảo Vy", "thaovy.le.ys@gmail.com"],
  ["s-quocbao", "Võ Quốc Bảo", "quocbao.vo.ys@gmail.com"],
  ["s-ngochan", "Đặng Ngọc Hân", "ngochan.dang.ys@gmail.com"],
  ["s-tuankiet", "Huỳnh Tuấn Kiệt", "tuankiet.huynh.ys@gmail.com"],
  ["s-baochau", "Phan Bảo Châu", "baochau.phan.ys@gmail.com"],
  ["s-ducminh", "Bùi Đức Minh", "ducminh.bui.ys@gmail.com"],
  ["s-khanhlinh", "Ngô Khánh Linh", "khanhlinh.ngo.ys@gmail.com"],
  ["s-hoangnam", "Lý Hoàng Nam", "hoangnam.ly.ys@gmail.com"],
  ["s-myduyen", "Trương Mỹ Duyên", "myduyen.truong.ys@gmail.com"],
  ["s-thanhtam", "Mai Thanh Tâm", "thanhtam.mai.ys@gmail.com"],
  ["s-phuonguyen", "Cao Phương Uyên", "phuonguyen.cao.ys@gmail.com"],
  ["s-giabao", "Đinh Gia Bảo", "giabao.dinh.ys@gmail.com"],
  ["s-thutrang", "Hồ Thu Trang", "thutrang.ho.ys@gmail.com"],
];

function mondayOf(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const diff = (x.getDay() + 6) % 7;
  return new Date(x.getTime() - diff * DAY);
}

export function buildMockData(now = new Date()): YoseData {
  const r = rng(20261026);
  const thisMonday = mondayOf(now);
  const weeksAgo = (w: number) => new Date(thisMonday.getTime() - w * 7 * DAY).toISOString();

  const students: Student[] = studentSeeds.map(([id, fullName, email], i) => ({
    id,
    code: `YS-24${String(17 + i * 3).padStart(3, "0")}`,
    fullName,
    email,
    phone: `09${String(10000000 + i * 7919123).slice(0, 8)}`,
    joinedAt: weeksAgo(8 + (i % 4)),
  }));

  const classes: ClassGroup[] = [
    {
      id: "c-spk",
      description: "Luyện nói 1-1 theo 3 part của IELTS Speaking, sửa phát âm từng buổi.",
      code: "11-SPK-07",
      name: "Speaking 1-1 IELTS",
      type: "ONE_ON_ONE",
      level: "IELTS 6.0+",
      teacherId: "t-linh",
      schedule: [
        { day: 2, start: "19:30", durationMin: 90 },
        { day: 4, start: "19:30", durationMin: 90 },
      ],
      totalSessions: 20,
      startDate: weeksAgo(6),
      status: "active",
    },
    {
      id: "c-com",
      description: "Giao tiếp công sở và đời sống cho 2 học viên, học qua roleplay.",
      code: "12-COM-03",
      name: "Communication 1-2",
      type: "ONE_ON_TWO",
      level: "Pre-Intermediate",
      teacherId: "t-ha",
      schedule: [
        { day: 1, start: "18:00", durationMin: 90 },
        { day: 3, start: "18:00", durationMin: 90 },
      ],
      totalSessions: 16,
      startDate: weeksAgo(4),
      status: "active",
    },
    {
      id: "c-rl",
      description: "Reading và Listening nền tảng cho nhóm mới bắt đầu.",
      code: "G-INT-RL-02",
      name: "Intern Read-Lis",
      type: "GROUP",
      level: "Intern",
      teacherId: "t-kevin",
      schedule: [
        { day: 1, start: "19:30", durationMin: 120 },
        { day: 5, start: "19:30", durationMin: 120 },
      ],
      totalSessions: 24,
      startDate: weeksAgo(5),
      status: "active",
    },
    {
      id: "c-gram",
      description: "Ngữ pháp trọng tâm, mỗi buổi một chủ điểm kèm bài tập workbook.",
      code: "G-PRE-GR-01",
      name: "Pre-Inter Grammar",
      type: "GROUP",
      level: "Pre-Intermediate",
      teacherId: "t-linh",
      schedule: [
        { day: 6, start: "09:00", durationMin: 120 },
        { day: 0, start: "09:00", durationMin: 120 },
      ],
      totalSessions: 24,
      startDate: weeksAgo(3),
      status: "active",
    },
    {
      id: "c-wri",
      description: "Viết đoạn và bài luận ngắn, chữa bài chi tiết theo tiêu chí.",
      code: "G-INT-WR-01",
      name: "Intermediate Writing",
      type: "GROUP",
      level: "Intermediate",
      teacherId: "t-ha",
      schedule: [
        { day: 2, start: "18:00", durationMin: 90 },
        { day: 4, start: "18:00", durationMin: 90 },
      ],
      totalSessions: 20,
      startDate: weeksAgo(2),
      status: "active",
    },
    {
      id: "c-pie",
      description: "Lớp mới khai giảng: làm quen format IELTS, mục tiêu 5.0.",
      code: "G-PIE-FD-01",
      name: "Pre-IELTS Foundation",
      type: "GROUP",
      level: "Pre-IELTS",
      teacherId: "t-kevin",
      schedule: [{ day: 6, start: "14:00", durationMin: 120 }],
      totalSessions: 24,
      startDate: weeksAgo(-2),
      status: "upcoming",
    },
    {
      id: "c-old",
      description: "Khóa trước của Intern Read-Lis.",
      code: "G-INT-RL-01",
      name: "Intern Read-Lis K01",
      type: "GROUP",
      level: "Intern",
      teacherId: "t-kevin",
      schedule: [
        { day: 2, start: "19:30", durationMin: 120 },
        { day: 5, start: "17:30", durationMin: 120 },
      ],
      totalSessions: 16,
      startDate: weeksAgo(20),
      status: "finished",
    },
  ];

  const track: Record<string, keyof typeof LESSONS> = {
    "c-spk": "speaking",
    "c-com": "communication",
    "c-rl": "readlis",
    "c-gram": "grammar",
    "c-wri": "writing",
    "c-pie": "readlis",
    "c-old": "readlis",
  };

  const roster: Record<string, string[]> = {
    "c-spk": ["s-minhanh"],
    "c-com": ["s-giahuy", "s-thaovy"],
    "c-rl": [
      "s-minhanh", "s-giahuy", "s-quocbao", "s-ngochan", "s-tuankiet",
      "s-baochau", "s-ducminh", "s-khanhlinh", "s-hoangnam",
    ],
    "c-gram": ["s-thaovy", "s-myduyen", "s-thanhtam", "s-phuonguyen", "s-quocbao", "s-ngochan"],
    "c-wri": ["s-baochau", "s-ducminh", "s-khanhlinh", "s-myduyen", "s-hoangnam"],
    "c-pie": ["s-tuankiet", "s-ngochan", "s-phuonguyen"],
    "c-old": ["s-giahuy", "s-quocbao", "s-thanhtam"],
  };

  const enrollments: Enrollment[] = Object.entries(roster).flatMap(([classId, ids]) =>
    ids.map((studentId) => ({
      studentId,
      classId,
      joinedAt: classes.find((c) => c.id === classId)!.startDate,
      status: "active" as const,
    })),
  );

  const sessions: ClassSession[] = [];
  const notes: SessionNote[] = [];
  const remarks: StudentRemark[] = [];
  const homework: Homework[] = [];
  const submissions: Submission[] = [];
  const attachments: Attachment[] = [];

  for (const c of classes) {
    let cursor = new Date(c.startDate);
    let index = 0;
    while (index < c.totalSessions) {
      const slot = c.schedule.find((s) => s.day === cursor.getDay());
      if (slot) {
        const [h, m] = slot.start.split(":").map(Number);
        const start = new Date(cursor);
        start.setHours(h, m, 0, 0);
        index += 1;
        const lesson = lessonFor(track[c.id], index - 1);
        const done = start.getTime() + slot.durationMin * 60_000 < now.getTime();
        const s: ClassSession = {
          id: `${c.id}-b${index}`,
          classId: c.id,
          index,
          date: start.toISOString(),
          durationMin: slot.durationMin,
          topic: lesson.topic,
          teacherId: c.teacherId,
          status: done ? "done" : "scheduled",
        };
        sessions.push(s);

        const endedAt = new Date(start.getTime() + slot.durationMin * 60_000).toISOString();
        const isNextScheduled = !done && !sessions.some((x) => x.classId === c.id && x.status === "scheduled" && x !== s);

        if (done || isNextScheduled) {
          // Note buổi đã học: đã công bố. Buổi sắp tới gần nhất: GV đã soạn sẵn bản nháp.
          notes.push({
            sessionId: s.id,
            html: done ? lessonHtml(lesson.points) : draftHtml(lesson.points),
            vocab: lesson.vocab,
            updatedAt: done ? endedAt : new Date(start.getTime() - 2 * DAY).toISOString(),
            authorId: c.teacherId,
            publishedAt: done ? new Date(start.getTime() - 30 * 60_000).toISOString() : undefined,
          });
          for (const m of MATERIALS[track[c.id]].slice(0, done ? 1 + (index % 2) : 1)) {
            attachments.push({
              id: `att-${s.id}-${attachments.length}`,
              ownerType: "session",
              ownerId: s.id,
              name: m.name.replace("{n}", String(index)),
              size: m.size,
              mime: m.mime,
              uploadedAt: new Date(start.getTime() - DAY).toISOString(),
              uploaderId: c.teacherId,
              sample: true,
            });
          }
        }

        if (done) {
          // Hạn nộp: trước giờ vào lớp buổi kế tiếp
          const dueAt = nextSlot(c, start);
          const hw: Homework = {
            id: `hw-${s.id}`,
            sessionId: s.id,
            title: lesson.homework.title,
            instructions: lesson.homework.instructions,
            dueAt: dueAt.toISOString(),
            assigneeIds: null,
          };
          homework.push(hw);
          if (track[c.id] === "readlis" || track[c.id] === "grammar") {
            attachments.push({
              id: `att-${hw.id}`,
              ownerType: "homework",
              ownerId: hw.id,
              name: track[c.id] === "readlis" ? `Answer sheet buoi ${index}.pdf` : `Workbook trang ${10 + index}.pdf`,
              size: 240_000 + index * 13_000,
              mime: "application/pdf",
              uploadedAt: endedAt,
              uploaderId: c.teacherId,
              sample: true,
            });
          }

          const isRecent = now.getTime() - start.getTime() < 4 * DAY;
          for (const studentId of roster[c.id]) {
            const roll = r();
            remarks.push({
              sessionId: s.id,
              studentId,
              attendance: roll < 0.05 ? "absent" : roll < 0.12 ? "late" : "present",
              comment:
                c.type !== "GROUP" || roll > 0.85
                  ? pick(r, [
                      "Phát âm cải thiện rõ, chú ý thêm âm cuối.",
                      "Tham gia tích cực, cần mở rộng câu trả lời dài hơn.",
                      "Nắm bài tốt. Buổi sau thử nói không nhìn note.",
                      "Còn lẫn thì quá khứ và hiện tại hoàn thành, xem lại phần ví dụ.",
                    ])
                  : undefined,
            });

            // Minh Anh chừa bài gần nhất chưa nộp để demo trạng thái "cần làm"
            if (isRecent && (studentId === "s-minhanh" || r() < 0.5)) continue;
            if (!isRecent && r() < 0.08) continue; // một vài bài bị bỏ lỡ
            const submittedAt = new Date(start.getTime() + (0.5 + r()) * DAY);
            const reviewed = !isRecent;
            submissions.push({
              id: `sub-${hw.id}-${studentId}`,
              homeworkId: hw.id,
              studentId,
              content: track[c.id] === "speaking" ? "Em gửi file ghi âm ạ." : "Em nộp bài, ảnh chụp bài làm ở file đính kèm ạ.",
              submittedAt: submittedAt.toISOString(),
              status: reviewed ? "reviewed" : "submitted",
              score: reviewed ? Math.round((6 + r() * 4) * 2) / 2 : undefined,
              feedback: reviewed
                ? pick(r, [
                    "Tốt, chú ý chính tả các từ mới.",
                    "Đúng 8/10, xem lại câu 4 và 7.",
                    "Ý rõ ràng, nên dùng thêm từ nối.",
                    "Làm đầy đủ. Lần sau nộp sớm hơn nhé.",
                  ])
                : undefined,
            });
            const speaking = track[c.id] === "speaking";
            attachments.push({
              id: `att-sub-${hw.id}-${studentId}`,
              ownerType: "submission",
              ownerId: `sub-${hw.id}-${studentId}`,
              name: speaking ? `ghi-am-buoi-${index}.webm` : `bai-lam-buoi-${index}.jpg`,
              size: speaking ? 900_000 + Math.round(r() * 600_000) : 600_000 + Math.round(r() * 900_000),
              mime: speaking ? "audio/webm" : "image/jpeg",
              uploadedAt: submittedAt.toISOString(),
              uploaderId: studentId,
              sample: true,
            });
          }
        }
      }
      cursor = new Date(cursor.getTime() + DAY);
    }
  }

  const accounts: Account[] = [
    ...students.map((s) => ({
      id: `acc-${s.id}`,
      email: s.email,
      name: s.fullName,
      role: "student" as const,
      profileId: s.id,
    })),
    ...teachers.map((t) => ({
      id: `acc-${t.id}`,
      email: t.email,
      name: t.fullName,
      role: "teacher" as const,
      profileId: t.id,
    })),
    { id: "acc-admin", email: "admin@yose.edu.vn", name: "Quản trị Yose", role: "admin" },
  ];

  return {
    accounts,
    students,
    teachers,
    classes,
    enrollments,
    sessions,
    notes,
    remarks,
    homework,
    submissions,
    attachments,
  };
}

const MATERIALS: Record<keyof typeof LESSONS, { name: string; size: number; mime: string }[]> = {
  speaking: [
    { name: "Cue card buoi {n}.pdf", size: 182_000, mime: "application/pdf" },
    { name: "Sample answer band 7.mp3", size: 2_400_000, mime: "audio/mpeg" },
  ],
  communication: [
    { name: "Roleplay cards buoi {n}.pdf", size: 310_000, mime: "application/pdf" },
    { name: "Useful phrases.docx", size: 48_000, mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  ],
  readlis: [
    { name: "Reading passage buoi {n}.pdf", size: 2_350_000, mime: "application/pdf" },
    { name: "Listening section buoi {n}.mp3", size: 6_100_000, mime: "audio/mpeg" },
  ],
  writing: [
    { name: "De bai viet buoi {n}.pdf", size: 150_000, mime: "application/pdf" },
    { name: "Bai mau band cao.docx", size: 62_000, mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  ],
  grammar: [
    { name: "Slide ngu phap buoi {n}.pptx", size: 1_800_000, mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
    { name: "Bai tap them buoi {n}.pdf", size: 420_000, mime: "application/pdf" },
  ],
};

/** "**đậm**", "*nghiêng*" trong thư viện bài học → HTML */
function inlineHtml(t: string) {
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function lessonHtml(points: string[]) {
  return (
    "<h2>Nội dung chính</h2><ul>" +
    points.map((p) => `<li><p>${inlineHtml(p)}</p></li>`).join("") +
    "</ul><h2>Ghi trên lớp</h2><ul><li><p>Cả lớp làm bài mẫu, chữa trực tiếp trên bảng. <mark>Câu sai nhiều nhất: câu 3 và câu 7.</mark></p></li></ul>" +
    "<h2>Lưu ý cho buổi sau</h2><ul><li><p>Ôn lại từ vựng trong bảng bên dưới trước khi vào lớp.</p></li></ul>"
  );
}

function draftHtml(points: string[]) {
  return (
    "<h2>Kế hoạch buổi học</h2><ol><li><p>Warm-up 10 phút: hỏi lại từ vựng buổi trước.</p></li><li><p>Bài chính 60 phút.</p></li><li><p>Luyện tập theo cặp và chữa bài.</p></li></ol>" +
    "<h2>Nội dung chính</h2><ul>" +
    points.map((p) => `<li><p>${inlineHtml(p)}</p></li>`).join("") +
    "</ul><h2>Ghi trên lớp</h2><p></p>"
  );
}

function nextSlot(c: ClassGroup, after: Date) {
  for (let i = 1; i <= 7; i++) {
    const d = new Date(after.getTime() + i * DAY);
    const slot = c.schedule.find((s) => s.day === d.getDay());
    if (slot) {
      const [h, m] = slot.start.split(":").map(Number);
      d.setHours(h, m, 0, 0);
      return d;
    }
  }
  return new Date(after.getTime() + 3 * DAY);
}

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

/** Các tài khoản hiện ra ở màn chọn tài khoản demo */
export const DEMO_ACCOUNT_IDS = ["acc-s-minhanh", "acc-s-giahuy", "acc-t-linh", "acc-admin"];
