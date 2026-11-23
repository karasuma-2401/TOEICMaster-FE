import type { FlashcardCategory, FlashcardDeck } from "./types";

export const FLASHCARD_CATEGORY_LABELS: Record<FlashcardCategory, string> = {
  office: "Office & Operations",
  contracts: "Contracts & Negotiation",
  finance: "Finance & Accounting",
  travel: "Travel & Hospitality",
  marketing: "Marketing & Sales",
  hr: "HR & Recruitment",
  custom: "My Decks",
};

export const BUILTIN_FLASHCARD_DECKS: readonly FlashcardDeck[] = [
  {
    id: "deck-office",
    slug: "office-operations",
    title: "Office & Business Operations",
    description:
      "Core vocabulary for meeting schedules, internal notices, equipment, and workflows commonly seen in Part 3, 4, and 7.",
    category: "office",
    targetScore: "500–750+",
    estimatedMinutes: 8,
    cards: [
      {
        id: "off-1",
        term: "itinerary",
        phonetic: "/aɪˈtɪn.ə.rer.i/",
        partOfSpeech: "noun",
        meaningVi: "lịch trình chi tiết (chuyến đi, công tác)",
        exampleEn:
          "Please review the updated travel itinerary before Monday's flight.",
        exampleVi:
          "Vui lòng xem lại lịch trình công tác đã cập nhật trước chuyến bay thứ Hai.",
        collocations: [
          "travel itinerary",
          "detailed itinerary",
          "revise an itinerary",
        ],
        toeicPart: "Part 3 · Part 7",
        level: "B2",
      },
      {
        id: "off-2",
        term: "accommodate",
        phonetic: "/əˈkɑː.mə.deɪt/",
        partOfSpeech: "verb",
        meaningVi: "đáp ứng (nhu cầu), chứa được (số lượng người)",
        exampleEn:
          "The conference hall can accommodate up to 300 attendees comfortably.",
        exampleVi: "Hội trường có thể chứa thoải mái tới 300 người tham dự.",
        collocations: [
          "accommodate a request",
          "accommodate guests",
          "accommodate changes",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B2",
      },
      {
        id: "off-3",
        term: "agenda",
        phonetic: "/əˈdʒen.də/",
        partOfSpeech: "noun",
        meaningVi: "chương trình nghị sự, danh sách nội dung cuộc họp",
        exampleEn:
          "The budget review is the first item on today's meeting agenda.",
        exampleVi:
          "Rà soát ngân sách là mục đầu tiên trong chương trình họp hôm nay.",
        collocations: ["on the agenda", "set the agenda", "meeting agenda"],
        toeicPart: "Part 3 · Part 4",
        level: "B1",
      },
      {
        id: "off-4",
        term: "mandatory",
        phonetic: "/ˈmæn.də.tɔːr.i/",
        partOfSpeech: "adjective",
        meaningVi: "bắt buộc (theo quy định)",
        exampleEn:
          "Attendance at the workplace safety briefing is mandatory for all staff.",
        exampleVi:
          "Việc tham dự buổi phổ biến an toàn lao động là bắt buộc đối với toàn bộ nhân viên.",
        collocations: [
          "mandatory training",
          "mandatory requirement",
          "make it mandatory",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
      {
        id: "off-5",
        term: "streamline",
        phonetic: "/ˈstriːm.laɪn/",
        partOfSpeech: "verb",
        meaningVi: "tinh giản, tối ưu hóa quy trình",
        exampleEn:
          "The new software will streamline our invoice approval workflow.",
        exampleVi:
          "Phần mềm mới sẽ tối ưu hóa quy trình phê duyệt hóa đơn của chúng ta.",
        collocations: [
          "streamline operations",
          "streamline a process",
          "streamline production",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "off-6",
        term: "correspondence",
        phonetic: "/ˌkɔːr.əˈspɑːn.dəns/",
        partOfSpeech: "noun",
        meaningVi: "thư từ giao dịch, trao đổi bằng văn bản",
        exampleEn:
          "All client correspondence must be archived in the shared folder.",
        exampleVi:
          "Mọi thư từ trao đổi với khách hàng phải được lưu trữ trong thư mục dùng chung.",
        collocations: [
          "business correspondence",
          "official correspondence",
          "handle correspondence",
        ],
        toeicPart: "Part 6 · Part 7",
        level: "B2",
      },
      {
        id: "off-7",
        term: "designate",
        phonetic: "/ˈdez.ɪɡ.neɪt/",
        partOfSpeech: "verb",
        meaningVi: "chỉ định, phân công chính thức",
        exampleEn:
          "Management designated the second floor as a quiet working zone.",
        exampleVi:
          "Ban quản lý đã chỉ định tầng hai làm khu vực làm việc yên tĩnh.",
        collocations: [
          "designated area",
          "designate a representative",
          "designated parking",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "off-8",
        term: "promptly",
        phonetic: "/ˈprɑːmpt.li/",
        partOfSpeech: "adverb",
        meaningVi: "đúng giờ, nhanh chóng, kịp thời",
        exampleEn:
          "The quarterly orientation session will begin promptly at 9:00 A.M.",
        exampleVi: "Buổi định hướng hàng quý sẽ bắt đầu đúng 9:00 sáng.",
        collocations: [
          "respond promptly",
          "arrive promptly",
          "begin promptly at",
        ],
        toeicPart: "Part 4 · Part 5",
        level: "B2",
      },
    ],
  },
  {
    id: "deck-contracts",
    slug: "contracts-negotiation",
    title: "Contracts & Commercial Negotiation",
    description:
      "Master terms for clauses, renewals, compliance, and agreements that appear frequently in Part 6-7 emails and notices.",
    category: "contracts",
    targetScore: "650–850+",
    estimatedMinutes: 9,
    cards: [
      {
        id: "con-1",
        term: "stipulate",
        phonetic: "/ˈstɪp.jə.leɪt/",
        partOfSpeech: "verb",
        meaningVi: "quy định rõ trong hợp đồng hoặc thỏa thuận",
        exampleEn:
          "The lease stipulates that tenants must give 30 days' notice before moving out.",
        exampleVi:
          "Hợp đồng thuê quy định rõ người thuê phải báo trước 30 ngày trước khi chuyển đi.",
        collocations: [
          "stipulate conditions",
          "as stipulated in",
          "contract stipulates",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "con-2",
        term: "abide by",
        phonetic: "/əˈbaɪd baɪ/",
        partOfSpeech: "phrasal verb",
        meaningVi: "tuân thủ, chấp hành (luật lệ, thỏa thuận)",
        exampleEn:
          "Both parties agreed to abide by the revised confidentiality clause.",
        exampleVi: "Cả hai bên đã đồng ý tuân thủ điều khoản bảo mật sửa đổi.",
        collocations: [
          "abide by the terms",
          "abide by regulations",
          "abide by an agreement",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
      {
        id: "con-3",
        term: "provision",
        phonetic: "/prəˈvɪʒ.ən/",
        partOfSpeech: "noun",
        meaningVi: "điều khoản; sự cung cấp",
        exampleEn:
          "We added a warranty provision covering replacement parts for two years.",
        exampleVi:
          "Chúng tôi đã bổ sung điều khoản bảo hành bao gồm linh kiện thay thế trong hai năm.",
        collocations: [
          "contract provision",
          "under the provisions of",
          "make provision for",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "con-4",
        term: "renew",
        phonetic: "/rɪˈnuː/",
        partOfSpeech: "verb",
        meaningVi: "gia hạn (hợp đồng, gói đăng ký, giấy phép)",
        exampleEn:
          "Clients who renew their annual subscription early receive a 15% discount.",
        exampleVi:
          "Khách hàng gia hạn gói thường niên sớm sẽ nhận được ưu đãi giảm 15%.",
        collocations: [
          "renew a contract",
          "automatic renewal",
          "renew a membership",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B1",
      },
      {
        id: "con-5",
        term: "obligate",
        phonetic: "/ˈɑːb.lɪ.ɡeɪt/",
        partOfSpeech: "verb",
        meaningVi: "ràng buộc, bắt buộc theo nghĩa vụ",
        exampleEn:
          "The supplier is obligated to deliver all components by Friday.",
        exampleVi:
          "Nhà cung cấp có nghĩa vụ giao toàn bộ linh kiện trước thứ Sáu.",
        collocations: [
          "be obligated to",
          "contractual obligation",
          "meet an obligation",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
      {
        id: "con-6",
        term: "amendment",
        phonetic: "/əˈmend.mənt/",
        partOfSpeech: "noun",
        meaningVi: "bản sửa đổi, phụ lục điều chỉnh",
        exampleEn:
          "Any amendment to the service agreement requires written approval.",
        exampleVi:
          "Mọi sửa đổi đối với thỏa thuận dịch vụ đều cần phê duyệt bằng văn bản.",
        collocations: [
          "proposed amendment",
          "make an amendment",
          "contract amendment",
        ],
        toeicPart: "Part 6 · Part 7",
        level: "C1",
      },
      {
        id: "con-7",
        term: "consensus",
        phonetic: "/kənˈsen.səs/",
        partOfSpeech: "noun",
        meaningVi: "sự đồng thuận, nhất trí chung",
        exampleEn:
          "After two hours of negotiation, the committee reached a consensus.",
        exampleVi: "Sau hai giờ đàm phán, ủy ban đã đạt được sự đồng thuận.",
        collocations: [
          "reach a consensus",
          "broad consensus",
          "build consensus",
        ],
        toeicPart: "Part 3 · Part 7",
        level: "C1",
      },
      {
        id: "con-8",
        term: "terminate",
        phonetic: "/ˈtɜːr.mɪ.neɪt/",
        partOfSpeech: "verb",
        meaningVi: "chấm dứt, hủy bỏ (hợp đồng)",
        exampleEn:
          "Either company may terminate the partnership upon written notice.",
        exampleVi:
          "Một trong hai công ty có thể chấm dứt quan hệ hợp tác khi có thông báo bằng văn bản.",
        collocations: [
          "terminate a contract",
          "early termination",
          "termination fee",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B2",
      },
    ],
  },
  {
    id: "deck-finance",
    slug: "finance-accounting",
    title: "Finance, Invoicing & Budgeting",
    description:
      "Essential vocabulary for TOEIC revenue reports, reimbursements, audits, and accounting documents.",
    category: "finance",
    targetScore: "600–850+",
    estimatedMinutes: 8,
    cards: [
      {
        id: "fin-1",
        term: "reimburse",
        phonetic: "/ˌriː.ɪmˈbɜːrs/",
        partOfSpeech: "verb",
        meaningVi: "hoàn trả chi phí (công tác, mua sắm)",
        exampleEn:
          "Keep all hotel receipts so the accounting team can reimburse you.",
        exampleVi:
          "Hãy giữ lại toàn bộ hóa đơn khách sạn để bộ phận kế toán có thể hoàn tiền cho bạn.",
        collocations: [
          "reimburse expenses",
          "travel reimbursement",
          "reimbursement form",
        ],
        toeicPart: "Part 3 · Part 7",
        level: "B2",
      },
      {
        id: "fin-2",
        term: "discrepancy",
        phonetic: "/dɪˈskrep.ən.si/",
        partOfSpeech: "noun",
        meaningVi: "sự chênh lệch, sai khác (giữa số liệu, hóa đơn)",
        exampleEn:
          "The auditor noticed a discrepancy between the invoice and the purchase order.",
        exampleVi:
          "Kiểm toán viên phát hiện sự sai khác giữa hóa đơn và đơn đặt hàng.",
        collocations: [
          "billing discrepancy",
          "resolve a discrepancy",
          "report a discrepancy",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "fin-3",
        term: "allocate",
        phonetic: "/ˈæl.ə.keɪt/",
        partOfSpeech: "verb",
        meaningVi: "phân bổ (ngân sách, nguồn lực)",
        exampleEn:
          "The board allocated additional funds to expand the R&D division.",
        exampleVi:
          "Hội đồng quản trị đã phân bổ thêm ngân sách để mở rộng khối R&D.",
        collocations: [
          "allocate funds",
          "budget allocation",
          "allocate resources",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
      {
        id: "fin-4",
        term: "revenue",
        phonetic: "/ˈrev.ə.nuː/",
        partOfSpeech: "noun",
        meaningVi: "doanh thu",
        exampleEn:
          "Online subscriptions accounted for 40% of our annual revenue.",
        exampleVi:
          "Các gói đăng ký trực tuyến chiếm 40% tổng doanh thu thường niên của chúng tôi.",
        collocations: ["annual revenue", "generate revenue", "revenue growth"],
        toeicPart: "Part 4 · Part 7",
        level: "B2",
      },
      {
        id: "fin-5",
        term: "overdue",
        phonetic: "/ˌoʊ.vɚˈduː/",
        partOfSpeech: "adjective",
        meaningVi: "quá hạn (thanh toán, bàn giao)",
        exampleEn:
          "A late fee applies to any balance that is more than 15 days overdue.",
        exampleVi:
          "Phí trễ hạn áp dụng cho mọi khoản dư quá hạn thanh toán hơn 15 ngày.",
        collocations: ["overdue payment", "overdue invoice", "long overdue"],
        toeicPart: "Part 5 · Part 7",
        level: "B1",
      },
      {
        id: "fin-6",
        term: "expenditure",
        phonetic: "/ɪkˈspen.dɪ.tʃɚ/",
        partOfSpeech: "noun",
        meaningVi: "khoản chi tiêu, kinh phí chi ra",
        exampleEn:
          "We need to curb operating expenditure during the third quarter.",
        exampleVi: "Chúng ta cần kiềm chế chi phí vận hành trong quý ba.",
        collocations: [
          "capital expenditure",
          "reduce expenditure",
          "public expenditure",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "fin-7",
        term: "forecast",
        phonetic: "/ˈfɔːr.kæst/",
        partOfSpeech: "noun / verb",
        meaningVi: "dự báo, bản dự đoán tài chính",
        exampleEn:
          "Analysts forecast steady export demand through the end of the year.",
        exampleVi:
          "Các nhà phân tích dự báo nhu cầu xuất khẩu ổn định đến hết năm.",
        collocations: [
          "sales forecast",
          "financial forecast",
          "forecast growth",
        ],
        toeicPart: "Part 4 · Part 7",
        level: "B2",
      },
      {
        id: "fin-8",
        term: "deduct",
        phonetic: "/dɪˈdʌkt/",
        partOfSpeech: "verb",
        meaningVi: "khấu trừ, trừ bớt vào tổng tiền",
        exampleEn: "The discount will be automatically deducted at checkout.",
        exampleVi: "Khoản giảm giá sẽ được khấu trừ tự động khi thanh toán.",
        collocations: [
          "deduct from",
          "tax deduction",
          "automatically deducted",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
    ],
  },
  {
    id: "deck-travel",
    slug: "travel-hospitality",
    title: "Travel, Aviation & Hospitality",
    description:
      "Master conversations about room bookings, flight changes, and conference events in Part 2, 3, and 4.",
    category: "travel",
    targetScore: "450–700+",
    estimatedMinutes: 7,
    cards: [
      {
        id: "trv-1",
        term: "complimentary",
        phonetic: "/ˌkɑːm.pləˈmen.t̬ɚ.i/",
        partOfSpeech: "adjective",
        meaningVi: "miễn phí (dịch vụ tặng kèm cho khách)",
        exampleEn:
          "All hotel guests receive complimentary breakfast and airport shuttle service.",
        exampleVi:
          "Mọi khách lưu trú đều được tặng bữa sáng miễn phí và xe đưa đón sân bay.",
        collocations: [
          "complimentary breakfast",
          "complimentary upgrade",
          "complimentary ticket",
        ],
        toeicPart: "Part 4 · Part 7",
        level: "B2",
      },
      {
        id: "trv-2",
        term: "occupancy",
        phonetic: "/ˈɑːk.jə.pən.si/",
        partOfSpeech: "noun",
        meaningVi: "tỷ lệ lấp đầy phòng, sức chứa tối đa",
        exampleEn: "Peak-season occupancy at the resort reached 95% last July.",
        exampleVi:
          "Tỷ lệ lấp đầy phòng mùa cao điểm tại khu nghỉ dưỡng đạt 95% vào tháng 7 năm ngoái.",
        collocations: [
          "occupancy rate",
          "maximum occupancy",
          "double occupancy",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "trv-3",
        term: "depart",
        phonetic: "/dɪˈpɑːrt/",
        partOfSpeech: "verb",
        meaningVi: "khởi hành, rời bến",
        exampleEn:
          "The express train to Kyoto departs from Platform 4 in ten minutes.",
        exampleVi:
          "Chuyến tàu tốc hành đi Kyoto khởi hành từ sân ga số 4 sau mười phút nữa.",
        collocations: [
          "departure gate",
          "depart on schedule",
          "departure lounge",
        ],
        toeicPart: "Part 2 · Part 4",
        level: "B1",
      },
      {
        id: "trv-4",
        term: "amenity",
        phonetic: "/əˈmen.ə.t̬i/",
        partOfSpeech: "noun",
        meaningVi: "tiện nghi, dịch vụ tiện ích",
        exampleEn:
          "Modern amenities include high-speed Wi-Fi and a 24-hour fitness center.",
        exampleVi:
          "Các tiện nghi hiện đại gồm Wi-Fi tốc độ cao và phòng tập mở cửa 24 giờ.",
        collocations: [
          "hotel amenities",
          "local amenities",
          "on-site amenities",
        ],
        toeicPart: "Part 4 · Part 7",
        level: "B2",
      },
      {
        id: "trv-5",
        term: "confirm",
        phonetic: "/kənˈfɜːrm/",
        partOfSpeech: "verb",
        meaningVi: "xác nhận (đặt chỗ, lịch hẹn)",
        exampleEn:
          "Could you confirm my reservation for two nights starting October 12?",
        exampleVi:
          "Bạn có thể xác nhận đặt phòng hai đêm bắt đầu từ ngày 12 tháng 10 giúp tôi không?",
        collocations: [
          "confirm a reservation",
          "confirmation number",
          "written confirmation",
        ],
        toeicPart: "Part 2 · Part 3",
        level: "B1",
      },
      {
        id: "trv-6",
        term: "layover",
        phonetic: "/ˈleɪ.oʊ.vɚ/",
        partOfSpeech: "noun",
        meaningVi: "thời gian quá cảnh giữa hai chặng bay",
        exampleEn:
          "Because of the three-hour layover in Seoul, I had time to answer emails.",
        exampleVi:
          "Nhờ có ba tiếng quá cảnh ở Seoul, tôi đã có thời gian trả lời email.",
        collocations: ["short layover", "overnight layover", "long layover"],
        toeicPart: "Part 3 · Part 7",
        level: "B2",
      },
      {
        id: "trv-7",
        term: "beverage",
        phonetic: "/ˈbev.ɚ.ɪdʒ/",
        partOfSpeech: "noun",
        meaningVi: "đồ uống, thức uống",
        exampleEn:
          "Light snacks and beverages will be served in the lobby during intermission.",
        exampleVi:
          "Đồ ăn nhẹ và thức uống sẽ được phục vụ tại sảnh trong giờ giải lao.",
        collocations: [
          "food and beverage",
          "refreshing beverage",
          "complimentary beverages",
        ],
        toeicPart: "Part 1 · Part 4",
        level: "B1",
      },
      {
        id: "trv-8",
        term: "adjacent",
        phonetic: "/əˈdʒeɪ.sənt/",
        partOfSpeech: "adjective",
        meaningVi: "liền kề, ngay sát bên",
        exampleEn:
          "Parking is available in the garage adjacent to the convention center.",
        exampleVi:
          "Chỗ đỗ xe có sẵn tại nhà xe nằm ngay cạnh trung tâm hội nghị.",
        collocations: ["adjacent to", "adjacent building", "adjacent rooms"],
        toeicPart: "Part 1 · Part 5",
        level: "B2",
      },
    ],
  },
  {
    id: "deck-marketing",
    slug: "marketing-sales",
    title: "Marketing, Product Launches & Sales",
    description:
      "Vocabulary for advertising, promotional campaigns, market research, and customer care in the TOEIC exam.",
    category: "marketing",
    targetScore: "550–800+",
    estimatedMinutes: 8,
    cards: [
      {
        id: "mkt-1",
        term: "merchandise",
        phonetic: "/ˈmɜːr.tʃən.daɪs/",
        partOfSpeech: "noun",
        meaningVi: "hàng hóa trưng bày, sản phẩm bán lẻ",
        exampleEn: "Seasonal merchandise is marked down by 30% until Sunday.",
        exampleVi: "Hàng hóa theo mùa được giảm giá 30% cho đến hết Chủ nhật.",
        collocations: [
          "defective merchandise",
          "display merchandise",
          "promotional merchandise",
        ],
        toeicPart: "Part 1 · Part 7",
        level: "B2",
      },
      {
        id: "mkt-2",
        term: "demographics",
        phonetic: "/ˌdem.əˈɡræf.ɪks/",
        partOfSpeech: "noun",
        meaningVi: "nhân khẩu học (nhóm tuổi, thu nhập khách hàng)",
        exampleEn: "The campaign was tailored to younger urban demographics.",
        exampleVi:
          "Chiến dịch được thiết kế riêng cho nhóm khách hàng trẻ ở khu vực đô thị.",
        collocations: [
          "target demographics",
          "customer demographics",
          "demographic data",
        ],
        toeicPart: "Part 4 · Part 7",
        level: "C1",
      },
      {
        id: "mkt-3",
        term: "incentive",
        phonetic: "/ɪnˈsen.tɪv/",
        partOfSpeech: "noun",
        meaningVi: "ưu đãi khuyến khích, động lực thúc đẩy",
        exampleEn:
          "Free express shipping served as a strong incentive for repeat orders.",
        exampleVi:
          "Miễn phí giao hàng nhanh là động lực lớn thúc đẩy đơn hàng lặp lại.",
        collocations: [
          "financial incentive",
          "offer an incentive",
          "sales incentive",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B2",
      },
      {
        id: "mkt-4",
        term: "launch",
        phonetic: "/lɔːntʃ/",
        partOfSpeech: "verb / noun",
        meaningVi: "ra mắt, tung ra thị trường (sản phẩm, chiến dịch)",
        exampleEn:
          "The company plans to launch its eco-friendly packaging line in May.",
        exampleVi:
          "Công ty dự kiến ra mắt dòng bao bì thân thiện môi trường vào tháng Năm.",
        collocations: ["product launch", "launch a campaign", "launch event"],
        toeicPart: "Part 3 · Part 6",
        level: "B1",
      },
      {
        id: "mkt-5",
        term: "endorse",
        phonetic: "/ɪnˈdɔːrs/",
        partOfSpeech: "verb",
        meaningVi: "chứng thực, đại diện quảng bá, ủng hộ chính thức",
        exampleEn:
          "Several professional athletes endorse our new running shoes.",
        exampleVi:
          "Nhiều vận động viên chuyên nghiệp đại diện quảng bá cho dòng giày chạy bộ mới của chúng tôi.",
        collocations: [
          "celebrity endorsement",
          "officially endorse",
          "endorse a product",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "mkt-6",
        term: "competitive",
        phonetic: "/kəmˈpet̬.ə.t̬ɪv/",
        partOfSpeech: "adjective",
        meaningVi: "có tính cạnh tranh cao (giá cả, chất lượng)",
        exampleEn:
          "We maintain competitive pricing without compromising material quality.",
        exampleVi:
          "Chúng tôi duy trì mức giá cạnh tranh mà không đánh đổi chất lượng vật liệu.",
        collocations: [
          "competitive edge",
          "competitive pricing",
          "highly competitive",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B1",
      },
      {
        id: "mkt-7",
        term: "outperform",
        phonetic: "/ˌaʊt.pɚˈfɔːrm/",
        partOfSpeech: "verb",
        meaningVi: "vượt trội hơn, đạt hiệu quả cao hơn",
        exampleEn:
          "The updated model outperformed rival devices in battery life tests.",
        exampleVi:
          "Mẫu cải tiến vượt trội hơn các thiết bị đối thủ trong bài kiểm tra thời lượng pin.",
        collocations: [
          "outperform competitors",
          "outperform expectations",
          "outperform the market",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "mkt-8",
        term: "survey",
        phonetic: "/ˈsɜːr.veɪ/",
        partOfSpeech: "noun / verb",
        meaningVi: "khảo sát ý kiến khách hàng",
        exampleEn:
          "Please take two minutes to complete our customer satisfaction survey.",
        exampleVi:
          "Vui lòng dành hai phút để hoàn thành khảo sát mức độ hài lòng của khách hàng.",
        collocations: [
          "conduct a survey",
          "survey results",
          "satisfaction survey",
        ],
        toeicPart: "Part 4 · Part 7",
        level: "B1",
      },
    ],
  },
  {
    id: "deck-hr",
    slug: "hr-recruitment",
    title: "HR, Recruitment & Training",
    description:
      "Vocabulary for job applications, performance reviews, promotions, and employee benefits across all TOEIC levels.",
    category: "hr",
    targetScore: "500–800+",
    estimatedMinutes: 8,
    cards: [
      {
        id: "hr-1",
        term: "applicant",
        phonetic: "/ˈæp.lə.kənt/",
        partOfSpeech: "noun",
        meaningVi: "ứng viên nộp hồ sơ",
        exampleEn:
          "Successful applicants will be contacted for a second-round interview.",
        exampleVi:
          "Các ứng viên đạt yêu cầu sẽ được liên hệ để phỏng vấn vòng hai.",
        collocations: [
          "job applicant",
          "qualified applicant",
          "screen applicants",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B1",
      },
      {
        id: "hr-2",
        term: "credentials",
        phonetic: "/krɪˈden.ʃəlz/",
        partOfSpeech: "noun (plural)",
        meaningVi: "bằng cấp, chứng chỉ và năng lực chuyên môn",
        exampleEn:
          "The hiring panel verified all academic credentials prior to making an offer.",
        exampleVi:
          "Hội đồng tuyển dụng đã xác minh toàn bộ bằng cấp học thuật trước khi gửi thư mời.",
        collocations: [
          "verify credentials",
          "professional credentials",
          "strong credentials",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "hr-3",
        term: "probationary",
        phonetic: "/proʊˈbeɪ.ʃə.ner.i/",
        partOfSpeech: "adjective",
        meaningVi: "thuộc giai đoạn thử việc",
        exampleEn:
          "Health benefits begin immediately after the 60-day probationary period.",
        exampleVi:
          "Quyền lợi bảo hiểm sức khỏe bắt đầu ngay sau giai đoạn thử việc 60 ngày.",
        collocations: [
          "probationary period",
          "probationary employee",
          "complete probation",
        ],
        toeicPart: "Part 6 · Part 7",
        level: "C1",
      },
      {
        id: "hr-4",
        term: "proficient",
        phonetic: "/prəˈfɪʃ.ənt/",
        partOfSpeech: "adjective",
        meaningVi: "thành thạo, giỏi chuyên môn",
        exampleEn:
          "Candidates must be proficient in spreadsheet modeling and data visualization.",
        exampleVi:
          "Ứng viên phải thành thạo lập mô hình bảng tính và trực quan hóa dữ liệu.",
        collocations: [
          "proficient in",
          "highly proficient",
          "language proficiency",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B2",
      },
      {
        id: "hr-5",
        term: "appraisal",
        phonetic: "/əˈpreɪ.zəl/",
        partOfSpeech: "noun",
        meaningVi: "đánh giá hiệu suất làm việc",
        exampleEn:
          "Annual performance appraisals are scheduled for the first week of December.",
        exampleVi:
          "Các buổi đánh giá hiệu suất thường niên được lên lịch vào tuần đầu tháng 12.",
        collocations: [
          "performance appraisal",
          "conduct an appraisal",
          "annual appraisal",
        ],
        toeicPart: "Part 3 · Part 7",
        level: "C1",
      },
      {
        id: "hr-6",
        term: "vacancy",
        phonetic: "/ˈveɪ.kən.si/",
        partOfSpeech: "noun",
        meaningVi: "vị trí tuyển dụng đang trống",
        exampleEn:
          "Internal staff are encouraged to apply for the senior analyst vacancy.",
        exampleVi:
          "Nhân sự nội bộ được khuyến khích ứng tuyển vào vị trí chuyên viên phân tích cấp cao đang trống.",
        collocations: ["fill a vacancy", "job vacancy", "current vacancies"],
        toeicPart: "Part 5 · Part 7",
        level: "B2",
      },
      {
        id: "hr-7",
        term: "eligible",
        phonetic: "/ˈel.ə.dʒə.bəl/",
        partOfSpeech: "adjective",
        meaningVi: "đủ điều kiện, đủ tiêu chuẩn hưởng quyền lợi",
        exampleEn:
          "Full-time employees are eligible for tuition reimbursement after one year.",
        exampleVi:
          "Nhân viên toàn thời gian đủ điều kiện được hỗ trợ học phí sau một năm làm việc.",
        collocations: [
          "be eligible for",
          "eligible candidates",
          "eligibility criteria",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
      {
        id: "hr-8",
        term: "mentor",
        phonetic: "/ˈmen.tɔːr/",
        partOfSpeech: "noun / verb",
        meaningVi: "người cố vấn; hướng dẫn, kèm cặp",
        exampleEn:
          "Each new hire is paired with an experienced mentor during onboarding.",
        exampleVi:
          "Mỗi nhân viên mới được ghép cặp với một người cố vấn giàu kinh nghiệm trong quá trình hội nhập.",
        collocations: [
          "mentorship program",
          "assign a mentor",
          "mentor junior staff",
        ],
        toeicPart: "Part 3 · Part 7",
        level: "B2",
      },
    ],
  },
];
