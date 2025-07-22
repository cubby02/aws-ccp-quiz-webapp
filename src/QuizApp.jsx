import React, { useEffect, useState } from "react";

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


export default function QuizApp() {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
  fetch(
    "https://opensheet.elk.sh/1j4EcxTM-ee-TeVEOUWZP_ftqLzDMRGpiGD1GQr_oGwY/Form%20Responses%201"
  )
    .then((res) => res.json())
    .then((data) => {
      const shuffled = SHUFFLE(data).slice(0, 5).map((q) => {
        // Determine if it's checkbox (multiple answers) or radio (single answer)
        const isCheckbox = q["Question Type"]?.toLowerCase() === "checkbox";

        const correct = isCheckbox
          ? q["Correct Answers"]
              .split(/\s*;\s*|\s*,\s*/) // split by comma or semicolon
              .map((c) => c.trim())
              .filter((c) => c)
          : [q["Correct Answers"].trim()]; // radio: single-element array

        const allOptions = [q["Option 1"], q["Option 2"], q["Option 3"], q["Option 4"]];

        // Include any correct answers not in the listed options
        const extraCorrect = correct.filter((c) => !allOptions.includes(c));
        const options = SHUFFLE([...allOptions, ...extraCorrect]);

        return {
          ...q,
          correct,
          options,
        };
      });

      setQuestions(shuffled);
    });
}, []);


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
    questions.forEach((q, i) => {
      const correct = q.correct.sort();
      const answer = userAnswers[i] || (q["Question Type"] === "checkbox" ? [] : "");
      const userAnswer = Array.isArray(answer) ? answer.sort() : [answer];
      if (JSON.stringify(correct) === JSON.stringify(userAnswer)) score++;
    });
    setScore(score);
    setSubmitted(true);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Quiz</h1>
      {questions.map((q, i) => {
        const correctAnswers = q.correct;
        const userAnswer = userAnswers[i] || [];
        const isCorrect =
          submitted &&
          JSON.stringify([...correctAnswers].sort()) ===
            JSON.stringify((Array.isArray(userAnswer) ? userAnswer : [userAnswer]).sort());

        return (
          <div
            key={i}
            className="p-4 border rounded-lg shadow space-y-2 bg-white"
          >
            <h2 className="font-semibold">
              {i + 1}. {q["Question"]}
            </h2>
            <div className="space-y-2">
              {q.options.map((opt, j) => {
                const selected = Array.isArray(userAnswer)
                  ? userAnswer.includes(opt)
                  : userAnswer === opt;
                const isCorrectOpt = correctAnswers.includes(opt);
                const isWrongSelection = submitted && selected && !isCorrectOpt;
                const isRightSelection = submitted && selected && isCorrectOpt;
                const isUnselectedCorrect =
                  submitted && !selected && isCorrectOpt;

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
                      name={`question-${i}`}
                      value={opt}
                      checked={selected}
                      disabled={submitted}
                      onChange={() =>
                        handleChange(i, opt, q["Question Type"])
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
                  <strong>Correct Answer:</strong>{" "}
                  {q.correct && q.correct.join(", ")}
                </p>
              </div>
            )}
          </div>
        );

      })}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit
        </button>
      ) : (
        <p className="text-xl font-semibold">
          Score: {score} / {questions.length}
        </p>
      )}
    </div>
  );
}