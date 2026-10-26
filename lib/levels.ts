// Danh mục trình độ. Lớp lưu `level` = name; production nên tách bảng Level.

export interface Level {
  name: string;
  description: string;
}

export const LEVELS: Level[] = [
  { name: "Intern", description: "Mới bắt đầu: làm quen 4 kỹ năng, từ vựng và ngữ pháp nền tảng." },
  { name: "Pre-Intermediate", description: "Giao tiếp tình huống quen thuộc, nắm các thì cơ bản." },
  { name: "Intermediate", description: "Diễn đạt ý kiến, đọc nghe bài dài, viết đoạn có lập luận." },
  { name: "Pre-IELTS", description: "Làm quen format IELTS, mục tiêu 4.5 đến 5.5." },
  { name: "IELTS 6.0+", description: "Luyện đề và chiến thuật cho mục tiêu 6.0 trở lên." },
];

export function levelOf(name: string): Level {
  return LEVELS.find((l) => l.name === name) ?? { name, description: "" };
}

export function levelRank(name: string) {
  const i = LEVELS.findIndex((l) => l.name === name);
  return i === -1 ? LEVELS.length : i;
}
