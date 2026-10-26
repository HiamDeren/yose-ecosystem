import type { VocabItem } from "./types";

// Thư viện bài học mẫu cho demo. Khi lên production, phần này chính là
// dữ liệu import từ Google Docs hiện tại (xem docs/ARCHITECTURE.md).

export interface LessonTemplate {
  topic: string;
  points: string[];
  vocab: VocabItem[];
  homework: { title: string; instructions: string };
}

const v = (
  word: string,
  partOfSpeech: string,
  meaningVi: string,
  definitionEn: string,
  example?: string,
): VocabItem => ({ word, partOfSpeech, meaningVi, definitionEn, example });

export const LESSONS: Record<string, LessonTemplate[]> = {
  speaking: [
    {
      topic: "Part 1: Hometown",
      points: [
        "Cấu trúc câu trả lời Part 1: **Answer, Reason, Example** (2–3 câu là đủ).",
        "Tránh trả lời Yes/No cụt; mở rộng bằng *because* hoặc *for example*.",
        "Luyện nối âm: *I live in a* → /aɪ lɪv ɪn ə/.",
      ],
      vocab: [
        v("bustling", "adj", "nhộn nhịp", "full of busy activity and people", "District 1 is always bustling at night."),
        v("suburb", "n", "vùng ngoại ô", "an area where people live outside the centre of a city"),
        v("laid-back", "adj", "thư thả, thoải mái", "relaxed and not worried about things"),
        v("landmark", "n", "địa danh nổi bật", "a building or place that is easy to recognise"),
      ],
      homework: {
        title: "Ghi âm 3 câu Part 1 về quê hương",
        instructions:
          "Trả lời 3 câu: Where is your hometown? What do you like about it? Has it changed much? Mỗi câu 20–30 giây, dùng ít nhất 3 từ mới. Dán link ghi âm (Drive/Voice memo).",
      },
    },
    {
      topic: "Part 1: Work and study",
      points: [
        "Phân biệt *major in* / *work as* / *be in charge of*.",
        "Dùng thì hiện tại hoàn thành khi nói về kinh nghiệm: *I have worked here for two years*.",
        "Lỗi hay gặp buổi trước: quên âm cuối /s/ ở *works*, *studies*.",
      ],
      vocab: [
        v("demanding", "adj", "đòi hỏi cao, vất vả", "needing a lot of time, effort or skill"),
        v("rewarding", "adj", "đáng giá, mang lại cảm giác thành tựu", "giving satisfaction"),
        v("deadline", "n", "hạn chót", "a time by which something must be finished"),
        v("colleague", "n", "đồng nghiệp", "a person you work with"),
      ],
      homework: {
        title: "Viết dàn ý 5 câu Part 1 về công việc",
        instructions:
          "Viết keyword (không viết full câu) cho 5 câu hỏi về Work/Study trong file đính kèm buổi học. Buổi sau sẽ nói lại không nhìn giấy.",
      },
    },
    {
      topic: "Part 2: Describe a place you like to visit",
      points: [
        "Dùng 1 phút chuẩn bị: ghi **4 keyword** theo 4 gợi ý cue card, không viết câu.",
        "Mở bài nhanh: *I'd like to talk about…*; kết bài bằng cảm xúc hoặc lý do quay lại.",
        "Kéo dài thời gian nói bằng mô tả giác quan: nhìn, nghe, mùi vị.",
      ],
      vocab: [
        v("breathtaking", "adj", "đẹp ngoạn mục", "extremely beautiful or surprising"),
        v("off the beaten track", "idiom", "ít người biết đến", "far away from places that many people visit"),
        v("unwind", "v", "thư giãn", "to relax after a period of work or worry"),
        v("vibrant", "adj", "sôi động, rực rỡ", "full of energy and life"),
      ],
      homework: {
        title: "Ghi âm Part 2 trọn 2 phút",
        instructions:
          "Chọn 1 địa điểm bạn thích, nói đủ 2 phút theo cue card. Gửi link ghi âm + dàn ý 4 keyword.",
      },
    },
    {
      topic: "Part 3: Technology and society",
      points: [
        "Part 3 cần **ý kiến + lập luận + so sánh** (quá khứ/hiện tại, người trẻ/người già).",
        "Cụm hedging: *It depends on…*, *To some extent…*, *I'd argue that…*",
        "Tránh lặp từ *good/bad*: thay bằng *beneficial, detrimental*.",
      ],
      vocab: [
        v("detrimental", "adj", "có hại", "causing harm or damage"),
        v("tech-savvy", "adj", "rành công nghệ", "knowing a lot about modern technology"),
        v("over-reliance", "n", "sự phụ thuộc quá mức", "depending on something too much"),
        v("bridge the gap", "phrase", "thu hẹp khoảng cách", "to reduce the difference between two groups"),
      ],
      homework: {
        title: "Trả lời 3 câu Part 3 dạng viết",
        instructions:
          "Viết câu trả lời (60–80 từ mỗi câu) cho 3 câu hỏi Part 3 trong note. Dùng ít nhất 2 cụm hedging.",
      },
    },
  ],
  communication: [
    {
      topic: "Small talk at work",
      points: [
        "Ba chủ đề an toàn khi small talk: thời tiết, cuối tuần, đồ ăn.",
        "Cách giữ hội thoại: hỏi lại *How about you?*, *What did you think of…?*",
        "Roleplay theo cặp: Huy đóng vai nhân viên mới, Vy là đồng nghiệp.",
      ],
      vocab: [
        v("catch up", "phr v", "hàn huyên, cập nhật tin tức", "to talk to someone you have not seen for a while"),
        v("by the way", "phrase", "nhân tiện", "used to introduce a new topic"),
        v("grab a coffee", "phrase", "đi uống cà phê", "to get a coffee quickly or casually"),
      ],
      homework: {
        title: "Viết đoạn hội thoại small talk 8 lượt",
        instructions: "Viết 1 đoạn hội thoại 8 lượt lời giữa 2 đồng nghiệp gặp nhau ở pantry. Dùng cả 3 cụm từ mới.",
      },
    },
    {
      topic: "Ordering food and drinks",
      points: [
        "Lịch sự hơn với *Could I have…* / *I'd like…* thay vì *I want…*",
        "Hỏi về món: *What does it come with?*, *Is it spicy?*",
        "Gọi tính tiền: *Could we get the bill, please?*",
      ],
      vocab: [
        v("starter", "n", "món khai vị", "a small dish eaten before the main course"),
        v("side dish", "n", "món ăn kèm", "a small amount of food served with the main dish"),
        v("split the bill", "phrase", "chia tiền", "to share the cost of a meal"),
      ],
      homework: {
        title: "Quay video gọi món (1 phút)",
        instructions: "Hai bạn quay chung 1 video roleplay khách và phục vụ. Mỗi người tự nộp link (có thể cùng link).",
      },
    },
    {
      topic: "Asking for and giving directions",
      points: [
        "Giới từ chỉ vị trí: *next to, opposite, at the end of, on the corner of*.",
        "Chỉ đường theo bước: *First… then… after that…*",
        "Xác nhận lại: *So I go straight and turn left at the bank, right?*",
      ],
      vocab: [
        v("intersection", "n", "ngã tư", "a place where roads cross"),
        v("go past", "phr v", "đi qua", "to go beyond a place"),
        v("landmark", "n", "điểm mốc", "an object that helps you know where you are"),
      ],
      homework: {
        title: "Chỉ đường từ nhà đến trung tâm",
        instructions: "Viết hướng dẫn 80–100 từ chỉ đường từ nhà bạn tới Yose Center, dùng ít nhất 4 giới từ vị trí.",
      },
    },
  ],
  readlis: [
    {
      topic: "Skimming and scanning",
      points: [
        "**Skimming**: đọc tiêu đề, câu đầu mỗi đoạn để nắm ý chính (≤ 2 phút).",
        "**Scanning**: tìm keyword cụ thể (tên, số, ngày) — không đọc từng chữ.",
        "Bài tập trên lớp: Passage 1, Cambridge 18, Test 2.",
      ],
      vocab: [
        v("gist", "n", "ý chính", "the main or general meaning of a text"),
        v("paraphrase", "v", "diễn đạt lại", "to express the same meaning using different words"),
        v("synonym", "n", "từ đồng nghĩa", "a word with the same meaning as another word"),
      ],
      homework: {
        title: "Skim 2 bài đọc, tóm tắt mỗi đoạn 1 câu",
        instructions: "Làm Passage 2 & 3 (file trên lớp). Với mỗi đoạn, viết 1 câu tóm tắt ý chính. Không tra từ điển.",
      },
    },
    {
      topic: "Listening for numbers and spelling",
      points: [
        "Phân biệt *thirteen / thirty*: trọng âm rơi vào âm tiết cuối ở số -teen.",
        "Đánh vần tên: luyện bảng chữ cái, đặc biệt *A/E/I*, *G/J*.",
        "Số điện thoại: *double five* = 55, *oh* = 0.",
      ],
      vocab: [
        v("postcode", "n", "mã bưu chính", "a group of letters and numbers added to an address"),
        v("reference number", "n", "mã tham chiếu", "a number used to identify a booking or document"),
        v("surname", "n", "họ", "the name you share with your family"),
      ],
      homework: {
        title: "Section 1 practice",
        instructions: "Làm Listening Section 1, Test 3 (file audio trên lớp). Ghi đáp án, chấm, liệt kê lỗi sai do số/đánh vần.",
      },
    },
    {
      topic: "Shopping",
      points: [
        "Bài nghe chủ đề mua sắm: chú ý giá tiền, giảm giá, size, màu sắc.",
        "Bẫy thường gặp: người nói **đổi ý** (*Actually, I'll take the blue one*).",
        "Đọc trước câu hỏi, gạch chân keyword, đoán loại từ cần điền.",
      ],
      vocab: [
        v("bargain", "n", "món hời", "something bought for less than its usual price"),
        v("refund", "n", "tiền hoàn lại", "money returned to you when you return a product"),
        v("receipt", "n", "hóa đơn", "a piece of paper showing you have paid"),
        v("out of stock", "phrase", "hết hàng", "not available in a shop at the moment"),
        v("window-shopping", "n", "đi ngắm hàng", "looking at things in shops without buying"),
      ],
      homework: {
        title: "Note completion: Shopping",
        instructions: "Làm bài Note completion (10 câu) chủ đề Shopping. Sau khi chấm, viết lại 5 câu chứa từ vựng mới.",
      },
    },
    {
      topic: "Map labelling",
      points: [
        "Xác định điểm bắt đầu và hướng (North/South) trước khi nghe.",
        "Từ khóa hướng: *clockwise, opposite, adjacent to, beyond*.",
        "Nghe theo thứ tự câu hỏi: đáp án xuất hiện lần lượt.",
      ],
      vocab: [
        v("adjacent to", "prep", "liền kề", "next to or very near"),
        v("clockwise", "adv", "theo chiều kim đồng hồ", "in the same direction as a clock's hands"),
        v("entrance", "n", "lối vào", "a door or gate used to enter a place"),
      ],
      homework: {
        title: "Map labelling 2 bài",
        instructions: "Làm 2 bài map trong tài liệu, ghi lại cụm chỉ hướng nghe được ở mỗi đáp án.",
      },
    },
    {
      topic: "True / False / Not Given",
      points: [
        "**False** = thông tin trái ngược; **Not Given** = không có thông tin.",
        "Cẩn thận từ chỉ mức độ: *all, some, always, usually*.",
        "Không dùng kiến thức bên ngoài bài đọc.",
      ],
      vocab: [
        v("contradict", "v", "mâu thuẫn", "to say the opposite of something"),
        v("claim", "n", "tuyên bố", "a statement that something is true"),
        v("evidence", "n", "bằng chứng", "facts that show something is true"),
      ],
      homework: {
        title: "TFNG 13 câu",
        instructions: "Làm Passage 1 Test 4. Với mỗi câu sai, chép lại câu trong bài đọc chứng minh đáp án đúng.",
      },
    },
    {
      topic: "Matching headings",
      points: [
        "Đọc **danh sách heading trước**, gạch chân keyword khác biệt giữa các heading.",
        "Heading tóm ý cả đoạn, không chỉ 1 câu chứa từ trùng.",
        "Loại trừ heading đã dùng để giảm lựa chọn.",
      ],
      vocab: [
        v("overview", "n", "tổng quan", "a short description of the main facts"),
        v("drawback", "n", "nhược điểm", "a disadvantage or problem"),
        v("consequence", "n", "hệ quả", "a result of an action or situation"),
      ],
      homework: {
        title: "Matching headings 2 passage",
        instructions: "Làm 2 bài matching headings trong tài liệu, ghi 1 dòng giải thích vì sao chọn heading cho mỗi đoạn.",
      },
    },
    {
      topic: "Multiple choice listening",
      points: [
        "Cả 3 phương án thường đều được nhắc tới: nghe **ý cuối cùng được xác nhận**.",
        "Chú ý từ phủ định và từ đổi ý: *but, however, actually*.",
        "Đọc trước câu hỏi trong 30 giây, đoán paraphrase.",
      ],
      vocab: [
        v("distractor", "n", "phương án gây nhiễu", "a wrong answer designed to look correct"),
        v("confirm", "v", "xác nhận", "to say that something is true or definite"),
        v("option", "n", "lựa chọn", "a thing that you can choose"),
      ],
      homework: {
        title: "Section 2 multiple choice",
        instructions: "Làm Listening Section 2, Test 4. Với mỗi câu sai, ghi lại câu trong transcript chứa đáp án đúng.",
      },
    },
  ],
  grammar: [
    {
      topic: "Present simple vs present continuous",
      points: [
        "Hiện tại đơn: thói quen, sự thật. Hiện tại tiếp diễn: đang xảy ra, tạm thời.",
        "Động từ trạng thái (know, like, want) **không** dùng tiếp diễn.",
        "Dấu hiệu: *usually, every day* / *now, at the moment, this week*.",
      ],
      vocab: [
        v("routine", "n", "thói quen hằng ngày", "the usual order in which you do things"),
        v("temporary", "adj", "tạm thời", "lasting for a short time"),
      ],
      homework: {
        title: "Bài tập 20 câu chia động từ",
        instructions: "Làm trang 12–13 trong workbook. Chụp ảnh hoặc gõ đáp án vào ô nộp bài.",
      },
    },
    {
      topic: "Past simple and used to",
      points: [
        "Quá khứ đơn: hành động kết thúc tại thời điểm xác định.",
        "*Used to*: thói quen trong quá khứ, nay không còn.",
        "Phát âm đuôi -ed: /t/, /d/, /ɪd/.",
      ],
      vocab: [
        v("childhood", "n", "thời thơ ấu", "the time when someone is a child"),
        v("memorable", "adj", "đáng nhớ", "worth remembering"),
      ],
      homework: {
        title: "Viết đoạn 100 từ về tuổi thơ",
        instructions: "Viết về một thói quen hồi nhỏ, dùng ít nhất 3 câu với *used to* và 5 động từ quá khứ.",
      },
    },
    {
      topic: "Comparatives and superlatives",
      points: [
        "Tính từ ngắn: -er/-est; tính từ dài: more/most.",
        "Bất quy tắc: good–better–best, bad–worse–worst, far–further–furthest.",
        "So sánh bằng: *as … as*; nhấn mạnh: *much / far / a lot + comparative*.",
      ],
      vocab: [
        v("affordable", "adj", "giá phải chăng", "cheap enough for people to buy"),
        v("convenient", "adj", "tiện lợi", "easy to use or suitable"),
      ],
      homework: {
        title: "So sánh 2 thành phố",
        instructions: "Viết 8 câu so sánh Sài Gòn và một thành phố bạn từng đến.",
      },
    },
    {
      topic: "Present perfect",
      points: [
        "Kinh nghiệm, hành động kéo dài tới hiện tại: *I have lived here for 5 years*.",
        "**for** + khoảng thời gian, **since** + mốc thời gian.",
        "Không dùng với thời điểm xác định trong quá khứ (*yesterday, in 2020*).",
      ],
      vocab: [
        v("experience", "n", "trải nghiệm", "something that happens to you"),
        v("recently", "adv", "gần đây", "not long ago"),
      ],
      homework: {
        title: "10 câu với for/since",
        instructions: "Viết 10 câu về bản thân dùng hiện tại hoàn thành, 5 câu với for và 5 câu với since.",
      },
    },
    {
      topic: "Future forms: will, be going to",
      points: [
        "*Will*: quyết định tức thời, dự đoán chung, lời hứa.",
        "*Be going to*: kế hoạch đã định, dự đoán có bằng chứng.",
        "Hiện tại tiếp diễn cho lịch hẹn cố định: *I'm meeting her tomorrow*.",
      ],
      vocab: [
        v("intention", "n", "dự định", "something you plan to do"),
        v("prediction", "n", "dự đoán", "a statement about what will happen"),
      ],
      homework: {
        title: "Kế hoạch cuối tuần",
        instructions: "Viết 80 từ về kế hoạch cuối tuần, dùng cả will, be going to và hiện tại tiếp diễn.",
      },
    },
  ],
};

export function lessonFor(track: keyof typeof LESSONS, i: number): LessonTemplate {
  const list = LESSONS[track];
  const base = list[i % list.length];
  const round = Math.floor(i / list.length);
  return round === 0 ? base : { ...base, topic: `${base.topic} (luyện thêm${round > 1 ? ` ${round}` : ""})` };
}
