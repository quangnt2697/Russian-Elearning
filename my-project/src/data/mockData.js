// --- Dữ liệu giả định cho Ứng dụng Học tiếng Nga ---

// Dữ liệu giả định người dùng (Đã có logic tạo Admin trong Backend, dùng User/Practice/Result cho Frontend)
// Chúng ta sẽ giả lập một số người dùng khác để hiển thị trong trang Admin
export const MOCK_ALL_USERS = [
    // Giả định User hiện tại (sẽ được ghi đè khi đăng nhập thật)
    { id: 1, username: 'hocvien1', fullName: 'NGUYỄN VĂN A', role: 'USER', results: [], practices: [] },
    // Giả định các User khác
    { id: 2, username: 'hocvien2', fullName: 'TRẦN THỊ B', role: 'USER',
        results: [
            { id: 101, testTitle: "Kiểm tra Ngữ pháp A1", date: "2024-11-20", score: 85, total: 100, isReviewed: true, feedback: "Bài làm tốt, tuy nhiên cần chú ý thêm về cách chia động từ.", questions: [
                    { id: 1, text: "Chọn dạng đúng của động từ: Я ... в библиотеке.", type: "quiz", options: ["работаю", "работаешь", "работает"], correct: 0, userAnswer: 0 },
                    { id: 2, text: "Viết 5 câu về sở thích của bạn.", type: "essay", userAnswer: "Я люблю читать книги и слушать музыку.", isCorrect: false },
                ]},
        ],
        practices: [
            { id: 201, title: "Luyện Viết Thư", type: "writing", content: "Kính gửi thầy/cô...", date: "2024-11-25", isReviewed: false, feedback: ""},
        ]
    },
];

// --- Dữ liệu Bài giảng (Lessons) ---
export const INITIAL_LESSONS = [
    {
        id: 1,
        title: "Bài 1: Bảng chữ cái và phát âm",
        summary: "Giới thiệu 33 chữ cái Cyrillic và quy tắc phát âm cơ bản.",
        theory: "Tiếng Nga sử dụng bảng chữ cái Cyrillic gồm 33 chữ cái. \n- 10 nguyên âm (а, о, у, ы, э, я, ё, ю, и, е)\n- 21 phụ âm\n- 2 dấu (ь - dấu mềm, ъ - dấu cứng)\n\nQuy tắc phát âm: Hầu hết các chữ cái phát âm như viết, ngoại trừ các trường hợp đặc biệt như 'о' không nhấn âm sẽ thành 'а'.",
        audioUrl: "/mock-audio/lesson1-audio.mp3",
        exercises: [
            { id: 11, type: 'writing', prompt: 'Viết lại các chữ cái sau và ghi chú cách phát âm (A, B, V, G, D, Ye, Yo, Zh, Z, I, Y, K, L, M, N, O, P, R, S, T, U, F, Kh, Ts, Ch, Sh, Shch, Ъ, Y, Ь, E, Yu, Ya).'},
            { id: 12, type: 'speaking', prompt: 'Ghi âm phát âm 5 từ cơ bản: Здравствуйте, Спасибо, До свидания, Как дела?, Хорошо.'},
        ]
    },
    {
        id: 2,
        title: "Bài 2: Đại từ nhân xưng và Động từ 'быть'",
        summary: "Học các đại từ nhân xưng và cách dùng động từ 'to be' (быть) ở thì hiện tại.",
        theory: "Đại từ nhân xưng:\n- Я (I)\n- Ты (You - thân mật)\n- Он/Она/Оно (He/She/It)\n- Мы (We)\n- Вы (You - lịch sự/số nhiều)\n- Они (They)\n\nĐộng từ 'быть' (to be) không được dùng ở thì hiện tại, chỉ dùng dấu gạch ngang (-) hoặc bỏ qua. Ví dụ: Я студент. (I am a student).",
        audioUrl: "/mock-audio/lesson2-audio.mp3",
        exercises: [
            { id: 21, type: 'writing', prompt: 'Dịch các câu sau sang tiếng Nga: 1. I am a doctor. 2. They are students. 3. She is beautiful.'},
            { id: 22, type: 'speaking', prompt: 'Giới thiệu bản thân bằng tiếng Nga (Tên, nghề nghiệp, quốc tịch).'},
        ]
    },
];

// --- Dữ liệu Bài kiểm tra (Tests) ---
export const INITIAL_TESTS = [
    {
        id: 101,
        title: "Kiểm tra Ngữ pháp A1: Căn bản",
        description: "Kiểm tra kiến thức cơ bản về đại từ nhân xưng, giống từ và chia động từ.",
        duration: 1800, // 30 phút
        questions: [
            { id: 1, text: "Chọn đại từ nhân xưng phù hợp cho 'Cô ấy':", type: "quiz", options: ["Я", "Он", "Она"], correct: 2 },
            { id: 2, text: "Chọn từ có giống đực:", type: "quiz", options: ["Книга (sách)", "Стол (bàn)", "Вода (nước)"], correct: 1 },
            { id: 3, text: "Sắp xếp các từ sau thành câu đúng: (в, я, живу, Москва)", type: "reorder", correctOrder: ["Я", "живу", "в", "Москва"] },
            { id: 4, text: "Bạn sẽ nói gì khi gặp một người bạn lần đầu? (Viết bằng tiếng Nga)", type: "essay" }
        ]
    },
    {
        id: 102,
        title: "Kiểm tra Nghe & Từ vựng A1",
        description: "Kiểm tra khả năng nghe hiểu và vốn từ vựng xoay quanh chủ đề Gia đình và Công việc.",
        duration: 2400, // 40 phút
        questions: [
            { id: 5, text: "Từ nào sau đây là 'bố mẹ'?", type: "quiz", options: ["Брат", "Родители", "Сестра"], correct: 1 },
            { id: 6, text: "Nghe đoạn hội thoại và chọn câu trả lời đúng (Giả định có audio đi kèm):", type: "quiz", options: ["Anh ấy là bác sĩ.", "Anh ấy là kỹ sư.", "Anh ấy là giáo viên."], correct: 0 },
            { id: 7, text: "Định nghĩa từ 'Работа' bằng tiếng Việt.", type: "essay" },
        ]
    }
];

// --- Dữ liệu Luyện tập (Practices) ---
export const MOCK_PRACTICES = [
    { id: 1, title: "Luyện Nghe", icon: "Headphones", color: "bg-blue-600", description: "Nghe các đoạn hội thoại ngắn, trả lời câu hỏi." },
    { id: 2, title: "Luyện Nói", icon: "Mic", color: "bg-red-500", description: "Thực hành ghi âm, phát âm, và đối thoại." },
    { id: 3, title: "Luyện Đọc", icon: "BookOpen", color: "bg-green-600", description: "Đọc các đoạn văn, bài báo ngắn, trả lời câu hỏi." },
    { id: 4, title: "Luyện Viết", icon: "PenTool", color: "bg-purple-600", description: "Viết đoạn văn, thư từ, bài luận ngắn." },
];

// --- Dữ liệu Chủ đề Luyện Đọc ---
export const READING_TOPICS = [
    {
        id: 1,
        title: "Moscow - Thủ đô Nga",
        content: "Москва — столица Российской Федерации, крупнейший город страны и один из самых больших городов мира. Она является важным политическим, экономическим, культурным и научным центром России. В Москве находится знаменитый Кремль и Красная площадь."
    },
    {
        id: 2,
        title: "Gia đình tôi",
        content: "Меня зовут Анна. У меня большая семья: папа, мама, два брата и младшая сестра. Мой папа — инженер, а мама — учительница. Мы очень любим проводить время вместе, особенно по выходным."
    },
];

// --- Dữ liệu Tài liệu (Documents) ---
export const MOCK_DOCUMENTS = [
    {
        id: 1,
        title: "Bảng chia động từ cơ bản",
        description: "Tài liệu tổng hợp cách chia 100 động từ thông dụng nhất ở thì hiện tại.",
        type: "Ngữ pháp",
        url: "#"
    },
    {
        id: 2,
        title: "Từ điển bỏ túi A1-A2",
        description: "Danh sách 1000 từ vựng cần thiết cho trình độ sơ cấp.",
        type: "Từ vựng",
        url: "#"
    },
    {
        id: 3,
        title: "Tóm tắt 6 cách",
        description: "Hướng dẫn ngắn gọn và dễ hiểu về 6 cách trong tiếng Nga (Cách 1 - Cách 6).",
        type: "Ngữ pháp",
        url: "#"
    },
];