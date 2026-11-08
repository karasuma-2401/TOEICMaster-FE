export interface MascotGuide {
  title: string;
  tips: string[];
}

const guides: { match: RegExp; guide: MascotGuide }[] = [
  {
    match: /^\/speaking\/(tests\/[^/]+\/practice|exercises\/[^/]+\/practice)/,
    guide: {
      title: "Kiểm tra micro",
      tips: [
        "Cho phép trình duyệt dùng micro khi được hỏi.",
        "Đọc thử vài từ. Thấy báo “Micro hoạt động tốt” là bạn có thể bắt đầu.",
      ],
    },
  },
  {
    match: /^\/speaking\/attempts\/[^/]+\/review/,
    guide: {
      title: "Xem lại bài làm",
      tips: [
        "Bấm số câu bên trái để chuyển câu.",
        "Từ gạch chân là từ AI thấy phát âm chưa rõ. Rê chuột lên để xem điểm.",
      ],
    },
  },
  {
    match: /^\/speaking\/parts/,
    guide: {
      title: "Luyện theo Part",
      tips: [
        "Chọn Part ở dải năm mục ngay dưới tiêu đề.",
        "Lọc theo độ khó hoặc chủ đề, rồi bấm vào một bài để luyện.",
      ],
    },
  },
  {
    match: /^\/speaking/,
    guide: {
      title: "Trang Speaking",
      tips: [
        "Mới bắt đầu? Hãy luyện từng Part trước để quen dạng câu hỏi.",
        "Khi đã sẵn sàng, chọn một đề thi thử đủ 11 câu.",
        "Trong lúc thi, nói đủ rồi thì bấm sang câu tiếp, không cần chờ hết giờ.",
      ],
    },
  },
  {
    match: /^\/writing\/practice/,
    guide: {
      title: "Luyện Writing theo Part",
      tips: ["Chọn một bài trong danh sách để bắt đầu viết."],
    },
  },
  {
    match: /^\/writing/,
    guide: {
      title: "Trang Writing",
      tips: [
        "Luyện từng Part để quen dạng bài, hoặc làm đề đầy đủ có tính giờ.",
        "Xem lại các lượt đã làm ở mục Lịch sử.",
      ],
    },
  },
  {
    match: /^\/history/,
    guide: {
      title: "Lịch sử học tập",
      tips: ["Mở một lượt đã làm để xem lại kết quả."],
    },
  },
];

const home: MascotGuide = {
  title: "Chào bạn, mình là Míc!",
  tips: [
    "Chọn kỹ năng bạn muốn luyện ở khu “Chọn kỹ năng để bắt đầu”.",
    "Ở mọi trang đều có nút Quay lại và Trang chủ trên thanh đầu trang.",
    "Cần trợ giúp lúc nào cứ bấm vào mình ở góc màn hình nhé.",
  ],
};

/** The guide for a page, or null where the mascot would disturb a timed attempt. */
export function mascotGuide(pathname: string): MascotGuide | null {
  if (/^\/(speaking|writing)\/attempts\/[^/]+$/.test(pathname)) return null;
  return guides.find((item) => item.match.test(pathname))?.guide ?? home;
}
