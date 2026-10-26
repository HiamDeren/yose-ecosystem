import { lessonFor, LESSONS } from "./lessons";
import type {
  Account,
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
  ];

  const track: Record<string, keyof typeof LESSONS> = {
    "c-spk": "speaking",
    "c-com": "communication",
    "c-rl": "readlis",
    "c-gram": "grammar",
  };

  const roster: Record<string, string[]> = {
    "c-spk": ["s-minhanh"],
    "c-com": ["s-giahuy", "s-thaovy"],
    "c-rl": [
      "s-minhanh", "s-giahuy", "s-quocbao", "s-ngochan", "s-tuankiet",
      "s-baochau", "s-ducminh", "s-khanhlinh", "s-hoangnam",
    ],
    "c-gram": ["s-thaovy", "s-myduyen", "s-thanhtam", "s-phuonguyen", "s-quocbao", "s-ngochan"],
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

        if (done) {
          notes.push({
            sessionId: s.id,
            content:
              "## Nội dung chính\n" +
              lesson.points.map((p) => `- ${p}`).join("\n") +
              "\n\n## Lưu ý cho buổi sau\n- Ôn lại từ vựng trong bảng bên dưới trước khi vào lớp.",
            vocab: lesson.vocab,
            updatedAt: new Date(start.getTime() + slot.durationMin * 60_000).toISOString(),
            authorId: c.teacherId,
          });

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
              content: "Em đã làm xong, đáp án và bài viết ở link bên dưới ạ.",
              link: "https://drive.google.com/",
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
  };
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
