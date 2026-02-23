export type Language = "en" | "sw";

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    lessons: "Lessons",
    quizzes: "Quizzes",
    assignments: "Assignments",
    progress: "Progress",
    logout: "Logout",
    settings: "Settings",
    notifications: "Notifications",
    search: "Search",

    // Dashboard
    welcome: "Welcome back",
    myClasses: "My Classes",
    recentActivity: "Recent Activity",
    viewAll: "View All",
    quickActions: "Quick Actions",

    // Lessons
    lessonTitle: "Lesson Title",
    lessonContent: "Lesson Content",
    addLesson: "Add Lesson",
    editLesson: "Edit Lesson",
    deleteLesson: "Delete Lesson",
    lessonCompleted: "Lesson Completed",
    markComplete: "Mark as Complete",
    nextLesson: "Next Lesson",
    previousLesson: "Previous Lesson",

    // Quizzes
    startQuiz: "Start Quiz",
    submitQuiz: "Submit Quiz",
    quizScore: "Your Score",
    correctAnswers: "Correct Answers",
    tryAgain: "Try Again",
    timeRemaining: "Time Remaining",
    question: "Question",

    // Assignments
    submitAssignment: "Submit Assignment",
    dueDate: "Due Date",
    submitted: "Submitted",
    graded: "Graded",
    pending: "Pending",
    overdue: "Overdue",
    feedback: "Feedback",
    marks: "Marks",

    // Progress
    overallProgress: "Overall Progress",
    completedLessons: "Completed Lessons",
    averageScore: "Average Score",
    streak: "Learning Streak",
    badges: "Badges Earned",
    points: "Points",

    // General
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    back: "Back",
    next: "Next",
    previous: "Previous",
    loading: "Loading",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    submit: "Submit",
    upload: "Upload",
    download: "Download",
    share: "Share",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    refresh: "Refresh",
    close: "Close",
    open: "Open",
    view: "View",
    create: "Create",
    update: "Update",

    // Roles
    student: "Student",
    teacher: "Teacher",
    admin: "Administrator",
    parent: "Parent",

    // Fees
    schoolFees: "School Fees",
    payFees: "Pay Fees",
    balance: "Balance",
    paid: "Paid",
    payViaMpesa: "Pay via M-Pesa",

    // Study Groups
    studyGroups: "Study Groups",
    createGroup: "Create Group",
    joinGroup: "Join Group",
    leaveGroup: "Leave Group",
    members: "Members",
    posts: "Posts",

    // EduBot
    askEduBot: "Ask EduBot",
    typeMessage: "Type a message...",
    send: "Send",
    clearChat: "Clear Chat",
  },
  sw: {
    // Navigation
    dashboard: "Dashibodi",
    lessons: "Masomo",
    quizzes: "Maswali",
    assignments: "Kazi",
    progress: "Maendeleo",
    logout: "Ondoka",
    settings: "Mipangilio",
    notifications: "Arifa",
    search: "Tafuta",

    // Dashboard
    welcome: "Karibu tena",
    myClasses: "Madarasa Yangu",
    recentActivity: "Shughuli za Hivi Karibuni",
    viewAll: "Ona Yote",
    quickActions: "Vitendo vya Haraka",

    // Lessons
    lessonTitle: "Kichwa cha Somo",
    lessonContent: "Maudhui ya Somo",
    addLesson: "Ongeza Somo",
    editLesson: "Hariri Somo",
    deleteLesson: "Futa Somo",
    lessonCompleted: "Somo Limekamilika",
    markComplete: "Weka Alama ya Kukamilika",
    nextLesson: "Somo Lijalo",
    previousLesson: "Somo Lililotangulia",

    // Quizzes
    startQuiz: "Anza Maswali",
    submitQuiz: "Wasilisha Maswali",
    quizScore: "Alama Yako",
    correctAnswers: "Majibu Sahihi",
    tryAgain: "Jaribu Tena",
    timeRemaining: "Muda Uliosalia",
    question: "Swali",

    // Assignments
    submitAssignment: "Wasilisha Kazi",
    dueDate: "Tarehe ya Mwisho",
    submitted: "Imewasilishwa",
    graded: "Imepewa Alama",
    pending: "Inasubiri",
    overdue: "Imechelewa",
    feedback: "Maoni",
    marks: "Alama",

    // Progress
    overallProgress: "Maendeleo ya Jumla",
    completedLessons: "Masomo Yaliyokamilika",
    averageScore: "Wastani wa Alama",
    streak: "Mfululizo wa Kujifunza",
    badges: "Beji Zilizopatikana",
    points: "Pointi",

    // General
    save: "Hifadhi",
    cancel: "Ghairi",
    delete: "Futa",
    edit: "Hariri",
    add: "Ongeza",
    back: "Rudi",
    next: "Endelea",
    previous: "Iliyotangulia",
    loading: "Inapakia",
    error: "Hitilafu",
    success: "Imefanikiwa",
    confirm: "Thibitisha",
    yes: "Ndiyo",
    no: "Hapana",
    submit: "Wasilisha",
    upload: "Pakia",
    download: "Pakua",
    share: "Shiriki",
    search: "Tafuta",
    filter: "Chuja",
    sort: "Panga",
    refresh: "Onyesha Upya",
    close: "Funga",
    open: "Fungua",
    view: "Angalia",
    create: "Unda",
    update: "Sasisha",

    // Roles
    student: "Mwanafunzi",
    teacher: "Mwalimu",
    admin: "Msimamizi",
    parent: "Mzazi",

    // Fees
    schoolFees: "Ada za Shule",
    payFees: "Lipa Ada",
    balance: "Salio",
    paid: "Imelipwa",
    payViaMpesa: "Lipa kupitia M-Pesa",

    // Study Groups
    studyGroups: "Vikundi vya Kusoma",
    createGroup: "Unda Kikundi",
    joinGroup: "Jiunge na Kikundi",
    leaveGroup: "Acha Kikundi",
    members: "Wanachama",
    posts: "Machapisho",

    // EduBot
    askEduBot: "Uliza EduBot",
    typeMessage: "Andika ujumbe...",
    send: "Tuma",
    clearChat: "Futa Mazungumzo",
  },
};

export function t(key: string, lang: Language = "en"): string {
  return translations[lang][key] || translations["en"][key] || key;
}
