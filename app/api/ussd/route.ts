import { prisma } from "@/lib/prisma";
import { formatUSSDResponse, parseUSSDInput, sendSMS } from "@/lib/africastalking";
import { NextResponse } from "next/server";

function getQuestionOptions(question: {
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}) {
  return [
    question.optionA,
    question.optionB,
    question.optionC,
    question.optionD,
  ];
}
export async function POST(req: Request) {
  const formData = await req.formData();
  const sessionId = formData.get("sessionId") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const text = formData.get("text") as string;

  const inputs = parseUSSDInput(text);
  const level = inputs.length;

  // Find student by phone number
  const student = await prisma.user.findFirst({
    where: { phone: phoneNumber.replace("+254", "0") },
    include: {
      enrolledClasses: {
        include: {
          classroom: {
            include: {
              subjects: {
                include: {
                  topics: {
                    include: {
                      subtopics: {
                        include: {
                          lessons: { orderBy: { createdAt: "desc" }, take: 1 },
                          quizzes: { take: 1 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      quizAttempts: { orderBy: { createdAt: "desc" }, take: 5 },
      lessonProgress: { where: { completed: true } },
      userPoints: true,
    },
  });

  // Level 0 — Main menu
  if (level === 0 || text === "") {
    if (!student) {
      return new Response(
        formatUSSDResponse(
          "Welcome to EduFlow!\nYou are not registered.\nContact your school admin to register your phone number.",
          true
        ),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    return new Response(
      formatUSSDResponse(
        `Welcome ${student.name}!\nEduFlow Learning\n1. Today's Lesson\n2. Take Quiz\n3. My Progress\n4. Contact Teacher`
      ),
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  // Level 1 — Main menu selection
  if (level === 1) {
    const choice = inputs[0];

    if (choice === "1") {
      // Today's Lesson
      if (!student) {
        return new Response(formatUSSDResponse("Not registered.", true), {
          headers: { "Content-Type": "text/plain" },
        });
      }

      const classroom = student.enrolledClasses?.[0]?.classroom;
      const subjects = classroom?.subjects || [];

      if (subjects.length === 0) {
        return new Response(
          formatUSSDResponse("No subjects found.\nContact your teacher.", true),
          { headers: { "Content-Type": "text/plain" } }
        );
      }

      const subjectList = subjects
        .slice(0, 5)
        .map((s, i) => `${i + 1}. ${s.name}`)
        .join("\n");

      return new Response(
        formatUSSDResponse(`Select Subject:\n${subjectList}`),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    if (choice === "2") {
      // Take Quiz
      const classroom = student?.enrolledClasses?.[0]?.classroom;
      const subjects = classroom?.subjects || [];

      if (subjects.length === 0) {
        return new Response(
          formatUSSDResponse("No quizzes available.", true),
          { headers: { "Content-Type": "text/plain" } }
        );
      }

      const subjectList = subjects
        .slice(0, 5)
        .map((s, i) => `${i + 1}. ${s.name}`)
        .join("\n");

      return new Response(
        formatUSSDResponse(`Select Subject for Quiz:\n${subjectList}`),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    if (choice === "3") {
      // My Progress
      if (!student) {
        return new Response(formatUSSDResponse("Not registered.", true), {
          headers: { "Content-Type": "text/plain" },
        });
      }

      const attempts = student.quizAttempts;
      const avgScore = attempts.length
        ? Math.round(
            attempts.reduce((acc, a) => acc + (a.score / a.total) * 100, 0) /
              attempts.length
          )
        : 0;

      const completedLessons = student.lessonProgress.length;
      const streak = student.userPoints?.streak || 0;
      const points = student.userPoints?.points || 0;

      return new Response(
        formatUSSDResponse(
          `My Progress:\nAvg Score: ${avgScore}%\nLessons Done: ${completedLessons}\nStreak: ${streak} days\nPoints: ${points}\n\n0. Back`,
          true
        ),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    if (choice === "4") {
      // Contact Teacher
      const classroom = student?.enrolledClasses?.[0]?.classroom;
      if (!classroom) {
        return new Response(
          formatUSSDResponse("No class found.", true),
          { headers: { "Content-Type": "text/plain" } }
        );
      }

      const teacher = await prisma.user.findFirst({
        where: { taughtClasses: { some: { id: classroom.id } } },
      });

      if (teacher?.phone) {
        await sendSMS(
          teacher.phone,
          `EduFlow: ${student?.name} (${phoneNumber}) is trying to reach you via USSD.`
        );
      }

      return new Response(
        formatUSSDResponse(
          `Message sent to your teacher!\nThey will contact you shortly.\n\nTeacher: ${teacher?.name || "Unknown"}`,
          true
        ),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    return new Response(
      formatUSSDResponse("Invalid choice.\n1. Back to menu", false),
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  // Level 2 — Subject selection for lesson or quiz
  if (level === 2) {
    const mainChoice = inputs[0];
    const subjectIndex = parseInt(inputs[1]) - 1;

    const classroom = student?.enrolledClasses?.[0]?.classroom;
    const subjects = classroom?.subjects || [];
    const subject = subjects[subjectIndex];

    if (!subject) {
      return new Response(
        formatUSSDResponse("Invalid selection.\n0. Back"),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    if (mainChoice === "1") {
      // Show topics for lesson
      const topics = subject.topics.slice(0, 5);
      if (topics.length === 0) {
        return new Response(
          formatUSSDResponse(`No topics in ${subject.name} yet.`, true),
          { headers: { "Content-Type": "text/plain" } }
        );
      }

      const topicList = topics.map((t, i) => `${i + 1}. ${t.name}`).join("\n");
      return new Response(
        formatUSSDResponse(`${subject.name} Topics:\n${topicList}`),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    if (mainChoice === "2") {
      // Find available quiz
      const subtopics = subject.topics.flatMap((t) => t.subtopics);
      const quizzes = subtopics.flatMap((st) => st.quizzes).slice(0, 5);

      if (quizzes.length === 0) {
        return new Response(
          formatUSSDResponse(`No quizzes in ${subject.name} yet.`, true),
          { headers: { "Content-Type": "text/plain" } }
        );
      }

      const quizList = quizzes.map((q, i) => `${i + 1}. ${q.title}`).join("\n");
      return new Response(
        formatUSSDResponse(`${subject.name} Quizzes:\n${quizList}`),
        { headers: { "Content-Type": "text/plain" } }
      );
    }
  }

  // Level 3 — Topic selection for lesson
  if (level === 3 && inputs[0] === "1") {
    const subjectIndex = parseInt(inputs[1]) - 1;
    const topicIndex = parseInt(inputs[2]) - 1;

    const classroom = student?.enrolledClasses?.[0]?.classroom;
    const subjects = classroom?.subjects || [];
    const subject = subjects[subjectIndex];
    const topic = subject?.topics?.[topicIndex];

    if (!topic) {
      return new Response(
        formatUSSDResponse("Topic not found.", true),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    const subtopics = topic.subtopics.slice(0, 3);
    if (subtopics.length === 0) {
      return new Response(
        formatUSSDResponse(`No lessons in ${topic.name} yet.`, true),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // Get latest lesson from first subtopic
    const lesson = subtopics[0]?.lessons?.[0];
    if (!lesson) {
      return new Response(
        formatUSSDResponse(`No lessons available yet.`, true),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // Truncate lesson text for SMS
    const lessonText = lesson.text
      ? lesson.text.substring(0, 200).replace(/[#*]/g, "").trim()
      : "No text content available for this lesson.";

    // Send full lesson via SMS
    if (student?.phone || phoneNumber) {
      await sendSMS(
        student?.phone || phoneNumber,
        `EduFlow Lesson: ${lesson.title}\n\n${lessonText}${lesson.text && lesson.text.length > 200 ? "...\n\nLog in to EduFlow for the full lesson." : ""}`
      );
    }

    return new Response(
      formatUSSDResponse(
        `${lesson.title}\n\n${lessonText.substring(0, 100)}${lessonText.length > 100 ? "..." : ""}\n\nFull lesson sent via SMS!`,
        true
      ),
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  // Level 3 — Quiz selection
  if (level === 3 && inputs[0] === "2") {
    const subjectIndex = parseInt(inputs[1]) - 1;
    const quizIndex = parseInt(inputs[2]) - 1;

    const classroom = student?.enrolledClasses?.[0]?.classroom;
    const subjects = classroom?.subjects || [];
    const subject = subjects[subjectIndex];
    const subtopics = subject?.topics.flatMap((t) => t.subtopics) || [];
    const quizzes = subtopics.flatMap((st) => st.quizzes);
    const quiz = quizzes[quizIndex];

    if (!quiz) {
      return new Response(
        formatUSSDResponse("Quiz not found.", true),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // Get first question
    const questions = await prisma.question.findMany({
      where: { quizId: quiz.id },
      take: 1,
      orderBy: { createdAt: "asc" },
    });

    const question = questions[0];
    if (!question) {
      return new Response(
        formatUSSDResponse("No questions in this quiz yet.", true),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // const options = question.options as string[];
    const options = getQuestionOptions(question);
    const optionList = options.map((o, i) => `${i + 1}. ${o}`).join("\n");

    return new Response(
      formatUSSDResponse(`Q: ${question.text.substring(0, 100)}\n\n${optionList}`),
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  // Level 4 — Quiz answer
  if (level === 4 && inputs[0] === "2") {
    const subjectIndex = parseInt(inputs[1]) - 1;
    const quizIndex = parseInt(inputs[2]) - 1;
    const answerIndex = parseInt(inputs[3]) - 1;

    const classroom = student?.enrolledClasses?.[0]?.classroom;
    const subjects = classroom?.subjects || [];
    const subject = subjects[subjectIndex];
    const subtopics = subject?.topics.flatMap((t) => t.subtopics) || [];
    const quizzes = subtopics.flatMap((st) => st.quizzes);
    const quiz = quizzes[quizIndex];

    if (!quiz || !student) {
      return new Response(
        formatUSSDResponse("Error processing answer.", true),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    const questions = await prisma.question.findMany({
      where: { quizId: quiz.id },
      take: 1,
      orderBy: { createdAt: "asc" },
    });

    const question = questions[0];
    const options = getQuestionOptions(question);
    // const options = question?.options as string[];
    const selectedAnswer = options?.[answerIndex];
    const isCorrect = selectedAnswer === question?.correctAnswer;

    // Record attempt
    await prisma.quizAttempt.create({
      data: {
        studentId: student.id,
        quizId: quiz.id,
        score: isCorrect ? 1 : 0,
        total: 1,
        answers: { ussd: true, answer: selectedAnswer },
      },
    });

    // Send result via SMS
    await sendSMS(
      phoneNumber,
      `EduFlow Quiz Result: ${isCorrect ? "✓ Correct!" : "✗ Wrong"}\nYour answer: ${selectedAnswer}\n${!isCorrect ? `Correct: ${question.correctAnswer}` : "Well done!"}`
    );

    return new Response(
      formatUSSDResponse(
        `${isCorrect ? "Correct!" : "Wrong!"}\n${!isCorrect ? `Answer: ${question.correctAnswer}` : "Well done!"}\n\nResult sent via SMS.\n\n1. Try another quiz\n2. Main menu`,
        false
      ),
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  return new Response(
    formatUSSDResponse("Session ended.\nDial again to continue.", true),
    { headers: { "Content-Type": "text/plain" } }
  );
}


// /**/
// import { prisma } from "@/lib/prisma";
// import { formatUSSDResponse, parseUSSDInput, sendSMS } from "@/lib/africastalking";
// import { NextResponse } from "next/server";
//
// export async function POST(req: Request) {
//   const formData = await req.formData();
//   const sessionId = formData.get("sessionId") as string;
//   const phoneNumber = formData.get("phoneNumber") as string;
//   const text = formData.get("text") as string;
//
//   const inputs = parseUSSDInput(text);
//   const level = inputs.length;
//
//   // Find student by phone number
//   const student = await prisma.user.findFirst({
//     where: { phone: phoneNumber.replace("+254", "0") },
//     include: {
//       classrooms: {
//         include: {
//           classroom: {
//             include: {
//               subjects: {
//                 include: {
//                   topics: {
//                     include: {
//                       subtopics: {
//                         include: {
//                           lessons: { take: 1, orderBy: { createdAt: "desc" } },
//                           quizzes: {
//                             take: 1,
//                             include: { questions: { include: { options: true } } },
//                           },
//                         },
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//       quizAttempts: { select: { score: true, maxScore: true } },
//       lessonProgress: { where: { completed: true }, select: { lessonId: true } },
//     },
//   });
//
//   // Main menu — level 0
//   if (level === 0) {
//     if (!student) {
//       return new Response(
//         formatUSSDResponse(
//           "Welcome to EduFlow!\nYou are not registered.\nContact your school admin to register your phone number.",
//           true
//         ),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//
//     return new Response(
//       formatUSSDResponse(
//         `Welcome ${student.name}!\nEduFlow Learning\n\n1. Today's Lesson\n2. Take Quiz\n3. My Progress\n4. Contact Teacher\n5. Announcements`
//       ),
//       { headers: { "Content-Type": "text/plain" } }
//     );
//   }
//
//   // Level 1 — main menu selection
//   const mainChoice = inputs[0];
//
//   // 1. Today's Lesson
//   if (mainChoice === "1") {
//     if (!student) return new Response(formatUSSDResponse("Student not found.", true));
//
//     const classrooms = student.classrooms;
//     if (classrooms.length === 0) {
//       return new Response(
//         formatUSSDResponse("You are not enrolled in any class.", true),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//
//     if (level === 1) {
//       // Show class list
//       const classMenu = classrooms
//         .map((c, i) => `${i + 1}. ${c.classroom.name}`)
//         .join("\n");
//       return new Response(
//         formatUSSDResponse(`Select Class:\n${classMenu}`),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//
//     if (level === 2) {
//       const classIndex = parseInt(inputs[1]) - 1;
//       const classroom = classrooms[classIndex]?.classroom;
//       if (!classroom) {
//         return new Response(
//           formatUSSDResponse("Invalid selection.", true),
//           { headers: { "Content-Type": "text/plain" } }
//         );
//       }
//
//       // Get latest lesson
//       const latestLesson = classroom.subjects
//         .flatMap((s) => s.topics.flatMap((t) => t.subtopics.flatMap((st) => st.lessons)))
//         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
//
//       if (!latestLesson) {
//         return new Response(
//           formatUSSDResponse("No lessons available yet.", true),
//           { headers: { "Content-Type": "text/plain" } }
//         );
//       }
//
//       // Truncate lesson text for USSD
//       const lessonText = latestLesson.text
//         ? latestLesson.text.substring(0, 160).replace(/<[^>]*>/g, "")
//         : "No text content available.";
//
//       // Send full lesson via SMS
//       await sendSMS(
//         phoneNumber,
//         `EduFlow Lesson: ${latestLesson.title}\n\n${latestLesson.text?.replace(/<[^>]*>/g, "").substring(0, 300) || "No content"}`
//       );
//
//       return new Response(
//         formatUSSDResponse(
//           `Lesson: ${latestLesson.title}\n\n${lessonText}\n\n(Full lesson sent via SMS)\n\n0. Back to menu`,
//           true
//         ),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//   }
//
//   // 2. Take Quiz
//   if (mainChoice === "2") {
//     if (!student) return new Response(formatUSSDResponse("Student not found.", true));
//
//     const classrooms = student.classrooms;
//
//     if (level === 1) {
//       const classMenu = classrooms
//         .map((c, i) => `${i + 1}. ${c.classroom.name}`)
//         .join("\n");
//       return new Response(
//         formatUSSDResponse(`Select Class:\n${classMenu}`),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//
//     if (level === 2) {
//       const classIndex = parseInt(inputs[1]) - 1;
//       const classroom = classrooms[classIndex]?.classroom;
//       if (!classroom) {
//         return new Response(formatUSSDResponse("Invalid selection.", true));
//       }
//
//       const quizzes = classroom.subjects
//         .flatMap((s) => s.topics.flatMap((t) => t.subtopics.flatMap((st) => st.quizzes)))
//         .filter((q) => q.questions.length > 0);
//
//       if (quizzes.length === 0) {
//         return new Response(
//           formatUSSDResponse("No quizzes available.", true),
//           { headers: { "Content-Type": "text/plain" } }
//         );
//       }
//
//       const quizMenu = quizzes
//         .slice(0, 5)
//         .map((q, i) => `${i + 1}. ${q.title.substring(0, 20)}`)
//         .join("\n");
//
//       return new Response(
//         formatUSSDResponse(`Select Quiz:\n${quizMenu}`),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//
//     if (level === 3) {
//       const classIndex = parseInt(inputs[1]) - 1;
//       const classroom = classrooms[classIndex]?.classroom;
//       const quizzes = classroom?.subjects
//         .flatMap((s) => s.topics.flatMap((t) => t.subtopics.flatMap((st) => st.quizzes)))
//         .filter((q) => q.questions.length > 0) || [];
//
//       const quizIndex = parseInt(inputs[2]) - 1;
//       const quiz = quizzes[quizIndex];
//
//       if (!quiz) {
//         return new Response(formatUSSDResponse("Invalid selection.", true));
//       }
//
//       const firstQuestion = quiz.questions[0];
//       const options = firstQuestion.options
//         .map((o, i) => `${i + 1}. ${o.text.substring(0, 30)}`)
//         .join("\n");
//
//       return new Response(
//         formatUSSDResponse(`Q1: ${firstQuestion.text.substring(0, 80)}\n\n${options}`),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//
//     if (level === 4) {
//       const classIndex = parseInt(inputs[1]) - 1;
//       const classroom = classrooms[classIndex]?.classroom;
//       const quizzes = classroom?.subjects
//         .flatMap((s) => s.topics.flatMap((t) => t.subtopics.flatMap((st) => st.quizzes)))
//         .filter((q) => q.questions.length > 0) || [];
//
//       const quizIndex = parseInt(inputs[2]) - 1;
//       const quiz = quizzes[quizIndex];
//       const answerIndex = parseInt(inputs[3]) - 1;
//
//       if (!quiz) {
//         return new Response(formatUSSDResponse("Invalid selection.", true));
//       }
//
//       const firstQuestion = quiz.questions[0];
//       const selectedOption = firstQuestion.options[answerIndex];
//       const isCorrect = selectedOption?.isCorrect || false;
//
//       // Record attempt
//       await prisma.quizAttempt.create({
//         data: {
//           userId: student!.id,
//           quizId: quiz.id,
//           score: isCorrect ? 1 : 0,
//           maxScore: 1,
//         },
//       });
//
//       // Notify teacher via SMS
//       const teacher = await prisma.user.findFirst({
//         where: { teachingClassrooms: { some: { id: classroom?.id } } },
//       });
//
//       if (teacher?.phone) {
//         await sendSMS(
//           teacher.phone,
//           `EduFlow: ${student!.name} completed quiz "${quiz.title}" via USSD. Score: ${isCorrect ? "1/1" : "0/1"}`
//         );
//       }
//
//       const result = isCorrect ? "✓ Correct!" : `✗ Wrong. Answer: ${firstQuestion.options.find((o) => o.isCorrect)?.text || "N/A"}`;
//
//       return new Response(
//         formatUSSDResponse(
//           `${result}\n\nQuiz: ${quiz.title}\nScore: ${isCorrect ? 1 : 0}/1\n\nFull results sent via SMS.`,
//           true
//         ),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//   }
//
//   // 3. My Progress
//   if (mainChoice === "3") {
//     if (!student) return new Response(formatUSSDResponse("Student not found.", true));
//
//     const attempts = student.quizAttempts;
//     const avgScore = attempts.length
//       ? Math.round(
//           attempts.reduce((acc, a) => acc + (a.score / a.maxScore) * 100, 0) / attempts.length
//         )
//       : 0;
//     const completedLessons = student.lessonProgress.length;
//
//     // Send detailed progress via SMS
//     await sendSMS(
//       phoneNumber,
//       `EduFlow Progress for ${student.name}:\nQuizzes taken: ${attempts.length}\nAverage score: ${avgScore}%\nLessons completed: ${completedLessons}\nKeep learning!`
//     );
//
//     return new Response(
//       formatUSSDResponse(
//         `Progress for ${student.name}:\n\nQuizzes: ${attempts.length}\nAvg Score: ${avgScore}%\nLessons Done: ${completedLessons}\n\n(Details sent via SMS)`,
//         true
//       ),
//       { headers: { "Content-Type": "text/plain" } }
//     );
//   }
//
//   // 4. Contact Teacher
//   if (mainChoice === "4") {
//     if (!student) return new Response(formatUSSDResponse("Student not found.", true));
//
//     if (level === 1) {
//       const classMenu = student.classrooms
//         .map((c, i) => `${i + 1}. ${c.classroom.name}`)
//         .join("\n");
//       return new Response(
//         formatUSSDResponse(`Select Class:\n${classMenu}`),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//
//     if (level === 2) {
//       const classIndex = parseInt(inputs[1]) - 1;
//       const classroom = student.classrooms[classIndex]?.classroom;
//
//       const teacher = await prisma.user.findFirst({
//         where: { teachingClassrooms: { some: { id: classroom?.id } } },
//         select: { name: true, phone: true, email: true },
//       });
//
//       if (!teacher) {
//         return new Response(
//           formatUSSDResponse("Teacher not found.", true),
//           { headers: { "Content-Type": "text/plain" } }
//         );
//       }
//
//       // Notify teacher
//       if (teacher.phone) {
//         await sendSMS(
//           teacher.phone,
//           `EduFlow: ${student.name} is trying to reach you via USSD. Please follow up.`
//         );
//       }
//
//       return new Response(
//         formatUSSDResponse(
//           `Teacher: ${teacher.name}\n${teacher.phone ? `Phone: ${teacher.phone}` : ""}\n${teacher.email ? `Email: ${teacher.email}` : ""}\n\nTeacher has been notified.`,
//           true
//         ),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//   }
//
//   // 5. Announcements
//   if (mainChoice === "5") {
//     const announcements = await prisma.announcement.findMany({
//       where: { audience: { in: ["ALL", "STUDENT"] } },
//       take: 3,
//       orderBy: { createdAt: "desc" },
//     });
//
//     if (announcements.length === 0) {
//       return new Response(
//         formatUSSDResponse("No announcements at this time.", true),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//
//     if (level === 1) {
//       const menu = announcements
//         .map((a, i) => `${i + 1}. ${a.title.substring(0, 25)}`)
//         .join("\n");
//       return new Response(
//         formatUSSDResponse(`Announcements:\n${menu}`),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//
//     if (level === 2) {
//       const index = parseInt(inputs[1]) - 1;
//       const announcement = announcements[index];
//
//       if (!announcement) {
//         return new Response(formatUSSDResponse("Invalid selection.", true));
//       }
//
//       await sendSMS(
//         phoneNumber,
//         `EduFlow: ${announcement.title}\n\n${announcement.body.substring(0, 300)}`
//       );
//
//       return new Response(
//         formatUSSDResponse(
//           `${announcement.title}\n\n${announcement.body.substring(0, 100)}\n\n(Full message sent via SMS)`,
//           true
//         ),
//         { headers: { "Content-Type": "text/plain" } }
//       );
//     }
//   }
//
//   return new Response(
//     formatUSSDResponse("Invalid selection. Please try again.", true),
//     { headers: { "Content-Type": "text/plain" } }
//   );
// }
// /**/