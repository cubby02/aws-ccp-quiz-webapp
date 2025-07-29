import React, { useEffect, useState, useRef } from "react";
import { Bars3Icon } from '@heroicons/react/24/outline';

const SHUFFLE = (array) => {
  const result = [...array];
  const rand = new Uint32Array(1);
  for (let i = result.length - 1; i > 0; i--) {
    window.crypto.getRandomValues(rand);
    const j = rand[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const DOMAIN_PERCENTAGES = {
  "Cloud Concepts": 0.24,
  "Security and Compliance": 0.30,
  "Cloud Technology": 0.34,
  "Billing, Pricing and Support": 0.12,
};

export default function QuizApp() {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [domainScores, setDomainScores] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [navVisible, setNavVisible] = useState(true);

  const timerRef = useRef();

  useEffect(() => {
    fetch(
      "https://opensheet.elk.sh/1j4EcxTM-ee-TeVEOUWZP_ftqLzDMRGpiGD1GQr_oGwY/Form%20Responses%201"
    )
      .then((res) => res.json())
      .then((data) => {
        const domains = Object.keys(DOMAIN_PERCENTAGES);
        const grouped = {};
        domains.forEach((d) => (grouped[d] = []));

        data.forEach((q) => {
          const domain = q["Domain"].trim();
          if (grouped[domain]) grouped[domain].push(q);
        });

        const selected = domains.flatMap((domain) => {
          const total = Math.round(DOMAIN_PERCENTAGES[domain] * 65);
          return SHUFFLE(grouped[domain]).slice(0, total);
        });

        const shuffled = SHUFFLE(selected).map((q) => {
          const isCheckbox = q["Question Type"].toLowerCase() === "checkbox";
          const correct = isCheckbox
            ? q["Correct Answers"]
                .split(/\s*;\s*/g)
                .map((c) => c.trim())
                .filter((c) => c)
            : [q["Correct Answers"].trim()];

          const options = SHUFFLE([
            q["Option 1"],
            q["Option 2"],
            q["Option 3"],
            q["Option 4"],
            ...correct.filter((c) => ![
              q["Option 1"],
              q["Option 2"],
              q["Option 3"],
              q["Option 4"],
            ].includes(c)),
          ]);

          return { ...q, correct, options };
        });

        setQuestions(shuffled);
      });
  }, []);

  useEffect(() => {
    if (quizStarted && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [quizStarted]);

  const handleChange = (index, value, type) => {
    setUserAnswers((prev) => {
      const current = prev[index] || (type === "checkbox" ? [] : "");
      if (type === "checkbox") {
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [index]: updated };
      } else {
        return { ...prev, [index]: value };
      }
    });
  };

  const handleSubmit = () => {
    let score = 0;
    const domainScores = {};

    questions.forEach((q, i) => {
      const correct = q.correct.sort();
      const answer = userAnswers[i] || (q["Question Type"] === "checkbox" ? [] : "");
      const userAnswer = Array.isArray(answer) ? answer.sort() : [answer];
      const isCorrect = JSON.stringify(correct) === JSON.stringify(userAnswer);

      if (isCorrect) {
        score++;
        domainScores[q["Domain"]] = (domainScores[q["Domain"]] || 0) + 1;
      }
    });

    setScore(score);
    setDomainScores(domainScores);
    setSubmitted(true);
    clearInterval(timerRef.current);
  };

  const percent = ((score / questions.length) * 100).toFixed(2);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!quizStarted) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4 text-center">
        <h1 className="text-3xl font-bold">AWS CCP Mock Exam</h1>
        <button
          onClick={() => setQuizStarted(true)}
          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">AWS CCP Mock Exam</h1>
      <button
        className="flex items-center gap-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
        onClick={() => setNavVisible(!navVisible)}
      >
        <Bars3Icon className="w-5 h-5" />
        {navVisible ? "Hide Navigation" : "Show Navigation"}
      </button>

      {submitted && (
        <div className="text-center space-y-2">
          <p className="text-3xl font-bold">{percent}%</p>
          <p className="text-lg font-semibold">
            {percent >= 70 ? "You passed!" : "You failed. Try again."}
          </p>
          <p className="text-md">
            Score: {score} / {questions.length}
          </p>
          <div className="text-left mt-4 space-y-1">
            <h3 className="font-semibold">Domain Scores:</h3>
            {Object.entries(domainScores).map(([domain, count]) => (
              <p key={domain}>
                {domain}: {count} correct
              </p>
            ))}
          </div>
        </div>
      )}

      {!submitted && (
        <div className="space-y-2">
          <p className="text-lg font-semibold text-center">
            Time Left: {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
          <div className="w-full h-4 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-4 bg-blue-600 transition-all duration-1000"
              style={{ width: `${(timeLeft / (90 * 60)) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {navVisible && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2 sticky top-4 h-fit">
            {questions.map((_, idx) => {
              const isAnswered = userAnswers[idx] !== undefined;
              const isActive = idx === currentQuestion;
              const isWrong = submitted && JSON.stringify((Array.isArray(userAnswers[idx]) ? userAnswers[idx].sort() : [userAnswers[idx]])) !== JSON.stringify(questions[idx].correct.sort());

              return (
                <button
                  key={idx}
                  onClick={() => isAnswered && setCurrentQuestion(idx)}
                  className={`w-10 h-10 rounded-full border text-sm font-medium ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isWrong
                      ? "bg-red-100 border-red-500"
                      : isAnswered
                      ? "bg-green-100 border-green-500"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!isAnswered}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        )}

        <div className={`flex-1 space-y-4 transition-all duration-300 ${navVisible ? "" : "w-full"}`}>
          <div className="flex justify-between">
            {currentQuestion > 0 ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Previous
              </button>
            ) : <div />}

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Next
              </button>
            ) : !submitted ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(userAnswers).length < questions.length}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
              >
                Submit
              </button>
            ) : null}
          </div>

          {(() => {
            const q = questions[currentQuestion];
            const userAnswer = userAnswers[currentQuestion] || [];
            return (
              <div className="p-4 border rounded-lg shadow space-y-2 bg-white">
                <h2 className="font-semibold whitespace-pre-wrap">
                  {currentQuestion + 1}. {q["Question"]}
                </h2>
                <div className="space-y-2">
                  {q.options.map((opt, j) => {
                    const selected = Array.isArray(userAnswer)
                      ? userAnswer.includes(opt)
                      : userAnswer === opt;
                    const isCorrectOpt = q.correct.includes(opt);
                    const isWrongSelection = submitted && selected && !isCorrectOpt;
                    const isRightSelection = submitted && selected && isCorrectOpt;
                    const isUnselectedCorrect = submitted && !selected && isCorrectOpt;

                    const color = isWrongSelection
                      ? "bg-red-100 border-red-500"
                      : isRightSelection || isUnselectedCorrect
                      ? "bg-green-100 border-green-500"
                      : "";

                    return (
                      <label
                        key={j}
                        className={`flex items-center p-2 border rounded cursor-pointer ${color}`}
                      >
                        <input
                          type={q["Question Type"]}
                          name={`question-${currentQuestion}`}
                          value={opt}
                          checked={selected}
                          disabled={submitted}
                          onChange={() =>
                            handleChange(currentQuestion, opt, q["Question Type"])
                          }
                          className="mr-2"
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Feedback:</strong> {q["Feedback"]}
                    </p>
                    <p>
                      <strong>Correct Answer:</strong> {q.correct.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}