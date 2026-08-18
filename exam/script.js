// ==========================================
// AEROQUIZ SIMULATOR ENGINE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const questionsInput = document.getElementById('questions-input');
  const lineNumbers = document.getElementById('line-numbers');
  const themeToggle = document.getElementById('theme-toggle');
  const editorToggle = document.getElementById('editor-toggle');
  const mainGrid = document.getElementById('main-grid');
  
  const btnLoadSample = document.getElementById('btn-load-sample');
  const btnClear = document.getElementById('btn-clear');
  const btnParse = document.getElementById('btn-parse');
  const parserStatus = document.getElementById('parser-status');
  
  // Quiz config & state panels
  const simStateConfig = document.getElementById('sim-state-config');
  const simStateActive = document.getElementById('sim-state-active');
  const simStateResults = document.getElementById('sim-state-results');
  
  const configOptionsCard = document.getElementById('config-options-card');
  const btnStartQuiz = document.getElementById('btn-start-quiz');
  
  // Active quiz elements
  const currentQIndexEl = document.getElementById('current-q-index');
  const totalQCountEl = document.getElementById('total-q-count');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const activeQuestionText = document.getElementById('active-question-text');
  const activeOptionsList = document.getElementById('active-options-list');
  const feedbackBanner = document.getElementById('feedback-banner');
  const feedbackIcon = document.getElementById('feedback-icon');
  const feedbackText = document.getElementById('feedback-text');
  const quizTimerDisplay = document.getElementById('quiz-timer-display');
  const timerVal = document.getElementById('timer-val');
  
  // Navigation
  const btnPrevQ = document.getElementById('btn-prev-q');
  const btnNextQ = document.getElementById('btn-next-q');
  const btnSubmitExam = document.getElementById('btn-submit-exam');
  
  // Results
  const resultsPct = document.getElementById('results-pct');
  const resultsScore = document.getElementById('results-score');
  const resultsHeading = document.getElementById('results-heading');
  const resultsSummary = document.getElementById('results-summary');
  const statTime = document.getElementById('stat-time');
  const statCorrect = document.getElementById('stat-correct');
  const statIncorrect = document.getElementById('stat-incorrect');
  const btnRestartQuiz = document.getElementById('btn-restart-quiz');
  const btnReviewAnswers = document.getElementById('btn-review-answers');
  const btnEditQuestions = document.getElementById('btn-edit-questions');
  const reviewSection = document.getElementById('review-section');
  const reviewList = document.getElementById('review-list');

  // Application State Variables
  let parsedQuestions = [];
  let activeQuestions = []; // Can be shuffled
  let userAnswers = {}; // { questionId: selectedOptionIndex }
  let currentQuestionIndex = 0;
  let quizMode = 'practice'; // 'practice' or 'exam'
  let timerInterval = null;
  let timeRemaining = 0; // seconds
  let totalTimeLimit = 0; // seconds
  let timeElapsed = 0; // seconds
  let examStartTime = null;

  // Sample questions to populate
  const SAMPLE_QUESTIONS = `q1 = What is the correct syntax to output "Hello World" in Python?
a1 = print("Hello World")(ans)
b1 = p("Hello World")
c1 = echo("Hello World")
d1 = System.out.println("Hello World")

q2 = Which tag is used to create a hyperlink in HTML?
a2 = <link>
b2 = <a>(ans)
c2 = <href>
d2 = <hyperlink>

q3 = What is the main purpose of CSS on a webpage?
a3 = To store dynamic database values
b3 = To structure the content outline
c3 = To style and layout the presentation(ans)
d3 = To handle button click backend behaviors

q4 = Which of the following is NOT a JavaScript data type?
a4 = String
b4 = Boolean
c4 = Float(ans)
d4 = Undefined

q5 = What does CPU stand for?
a5 = Central Processing Unit(ans)
b5 = Computer Personal Unit
c5 = Central Process User
d5 = Core Programming Utility`;

  // ==========================================
  // TEXTAREA LINE NUMBERS & STORAGE
  // ==========================================
  
  function updateLineNumbers() {
    const lines = questionsInput.value.split('\n');
    const count = Math.max(lines.length, 1);
    let html = '';
    for (let i = 1; i <= count; i++) {
      html += `<div>${i}</div>`;
    }
    lineNumbers.innerHTML = html;
  }

  questionsInput.addEventListener('input', () => {
    updateLineNumbers();
    localStorage.setItem('aeroquiz_draft', questionsInput.value);
    updateParserBadge();
  });

  questionsInput.addEventListener('scroll', () => {
    lineNumbers.scrollTop = questionsInput.scrollTop;
  });

  // Load draft from localstorage or load default sample
  const draft = localStorage.getItem('aeroquiz_draft');
  if (draft !== null) {
    questionsInput.value = draft;
  } else {
    questionsInput.value = SAMPLE_QUESTIONS;
  }
  updateLineNumbers();
  updateParserBadge();

  // Theme Toggler
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
  });

  // Editor Panel Toggler
  editorToggle.addEventListener('click', () => {
    mainGrid.classList.toggle('editor-hidden');
  });

  // GitHub Push Button
  const githubPushBtn = document.getElementById('github-push-btn');
  githubPushBtn.addEventListener('click', () => {
    // Show toast notification
    showToast('⏳ Launching GitHub push script...', 'info');

    // Open the push_to_github.bat file — browser will prompt to open/download it
    // The user must allow it to run locally (works when opening index.html as a file)
    const link = document.createElement('a');
    link.href = 'push_to_github.bat';
    link.download = 'push_to_github.bat';
    link.click();

    setTimeout(() => {
      showToast('✅ push_to_github.bat downloaded! Run it to push your changes.', 'success');
    }, 800);
  });

  // Toast notification helper
  function showToast(message, type = 'info') {
    let toast = document.getElementById('aeroquiz-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'aeroquiz-toast';
      toast.style.cssText = `
        position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
        padding: 1rem 1.5rem; border-radius: 10px; font-size: 0.95rem;
        font-weight: 600; font-family: 'Outfit', sans-serif;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        transition: opacity 0.3s, transform 0.3s;
        max-width: 360px;
      `;
      document.body.appendChild(toast);
    }
    const colors = {
      info:    { bg: 'var(--bg-tertiary)',  color: 'var(--text-primary)', border: 'var(--border-color)' },
      success: { bg: 'var(--success-bg)',   color: 'var(--success)',      border: 'var(--success-border)' },
      error:   { bg: 'var(--danger-bg)',    color: 'var(--danger)',       border: 'var(--danger-border)' },
    };
    const c = colors[type] || colors.info;
    toast.style.background   = c.bg;
    toast.style.color         = c.color;
    toast.style.border        = `1px solid ${c.border}`;
    toast.style.opacity       = '1';
    toast.style.transform     = 'translateY(0)';
    toast.textContent         = message;

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.opacity   = '0';
      toast.style.transform = 'translateY(10px)';
    }, 4000);
  }

  // Button actions
  btnLoadSample.addEventListener('click', () => {
    questionsInput.value = SAMPLE_QUESTIONS;
    updateLineNumbers();
    localStorage.setItem('aeroquiz_draft', SAMPLE_QUESTIONS);
    updateParserBadge();
    showConfig(false);
  });

  btnClear.addEventListener('click', () => {
    questionsInput.value = '';
    updateLineNumbers();
    localStorage.removeItem('aeroquiz_draft');
    updateParserBadge();
    showConfig(false);
  });

  // ==========================================
  // PARSER ENGINE
  // ==========================================

  function parseInput() {
    const text = questionsInput.value;
    const lines = text.split('\n');
    const qMap = new Map(); // questionNumber -> question object

    // Regex to match q1 = question, a1 = choice, b1 = choice, etc., e1 = explanation
    const keyValRegex = /^([qA-Da-dEe])(\d+)\s*=\s*(.*)$/;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const match = trimmed.match(keyValRegex);
      if (match) {
        const type = match[1].toLowerCase();
        const num = match[2];
        const val = match[3];

        if (!qMap.has(num)) {
          qMap.set(num, {
            id: num,
            lineNum: index + 1,
            text: '',
            choices: [],
            correctChoiceIndex: -1,
            explanation: ''
          });
        }

        const qObj = qMap.get(num);

        if (type === 'q') {
          qObj.text = val;
        } else if (type === 'e') {
          qObj.explanation = val;
        } else {
          // Choice mapping: a=0, b=1, c=2, d=3
          const choiceIndex = type.charCodeAt(0) - 97; // 'a' code is 97
          let choiceText = val;
          let isCorrect = false;

          // Check if containing (ans)
          if (choiceText.includes('(ans)')) {
            isCorrect = true;
            choiceText = choiceText.replace('(ans)', '').trim();
            qObj.correctChoiceIndex = choiceIndex;
          }

          qObj.choices.push({
            index: choiceIndex,
            key: type.toUpperCase(),
            text: choiceText,
            isCorrect: isCorrect
          });
        }
      }
    });

    // Convert map to sorted array & validate
    const questions = Array.from(qMap.values()).sort((a, b) => parseInt(a.id) - parseInt(b.id));
    const errors = [];

    questions.forEach(q => {
      if (!q.text) {
        errors.push(`Question q${q.id} (around line ${q.lineNum}) has no question text.`);
      }
      if (q.choices.length < 2) {
        errors.push(`Question q${q.id} must have at least 2 choices.`);
      }
      
      // Check if correct choice index is specified
      const correctChoices = q.choices.filter(c => c.isCorrect);
      if (correctChoices.length === 0) {
        errors.push(`Question q${q.id} has no correct answer specified. Use (ans) next to the correct choice.`);
      } else if (correctChoices.length > 1) {
        errors.push(`Question q${q.id} has multiple correct answers. Only one is allowed.`);
      }

      // Sort choices A, B, C, D
      q.choices.sort((a, b) => a.index - b.index);
    });

    return {
      questions,
      isValid: errors.length === 0,
      errors
    };
  }

  function updateParserBadge() {
    if (!questionsInput.value.trim()) {
      setParserStatus('idle', 'Empty input');
      return;
    }
    const result = parseInput();
    if (result.questions.length === 0) {
      setParserStatus('error', 'No valid questions found');
    } else if (!result.isValid) {
      setParserStatus('error', `${result.errors.length} formatting errors`);
    } else {
      setParserStatus('success', `${result.questions.length} questions parsed`);
    }
  }

  function setParserStatus(type, text) {
    parserStatus.className = `status-badge status-${type}`;
    const dot = parserStatus.querySelector('.status-dot');
    const txt = parserStatus.querySelector('.status-text');
    txt.textContent = text;
  }

  btnParse.addEventListener('click', () => {
    const parseResult = parseInput();
    
    if (parseResult.questions.length === 0) {
      alert("Error: No questions detected. Please verify your format matches: q1 = question, a1 = option, etc.");
      return;
    }

    if (!parseResult.isValid) {
      alert("Please fix the following formatting errors before running the quiz:\n\n" + parseResult.errors.slice(0, 5).join('\n') + (parseResult.errors.length > 5 ? '\n...and more' : ''));
      return;
    }

    parsedQuestions = parseResult.questions;
    showConfig(true);
  });

  function showConfig(show) {
    if (show) {
      configOptionsCard.style.display = 'block';
      simStateConfig.querySelector('.empty-icon').textContent = '⚡';
      simStateConfig.querySelector('h3').textContent = 'Exam Configuration';
      simStateConfig.querySelector('p').textContent = `${parsedQuestions.length} questions loaded successfully. Configure your test rules below.`;
      
      // Scroll right panel into view if stacked
      simStateConfig.scrollIntoView({ behavior: 'smooth' });
    } else {
      configOptionsCard.style.display = 'none';
      simStateConfig.querySelector('.empty-icon').textContent = '🎯';
      simStateConfig.querySelector('h3').textContent = 'Ready to Quiz';
      simStateConfig.querySelector('p').textContent = 'Input your questions on the left and click Generate Exam to begin the simulator.';
    }
  }

  // ==========================================
  // QUIZ ENGINE SIMULATOR
  // ==========================================

  btnStartQuiz.addEventListener('click', startQuiz);

  function startQuiz() {
    const shuffleQ = document.getElementById('setting-shuffle-q').checked;
    const shuffleA = document.getElementById('setting-shuffle-a').checked;
    quizMode = document.getElementById('setting-mode').value;
    const timerSetting = parseInt(document.getElementById('setting-timer').value);

    // Prepare questions
    activeQuestions = JSON.parse(JSON.stringify(parsedQuestions)); // Deep clone
    
    if (shuffleQ) {
      shuffleArray(activeQuestions);
    }

    if (shuffleA) {
      activeQuestions.forEach(q => {
        const correctChoice = q.choices[q.correctChoiceIndex];
        shuffleArray(q.choices);
        // Recalculate index of correct choice
        q.correctChoiceIndex = q.choices.findIndex(c => c.index === correctChoice.index);
      });
    }

    // Reset simulator variables
    userAnswers = {};
    currentQuestionIndex = 0;
    examStartTime = new Date();
    timeElapsed = 0;
    
    // Clear feedback
    feedbackBanner.style.display = 'none';

    // Show/Hide timer
    if (timerSetting > 0) {
      timeRemaining = timerSetting;
      totalTimeLimit = timerSetting;
      quizTimerDisplay.style.display = 'inline-flex';
      updateTimerDisplay();
      
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        timeRemaining--;
        timeElapsed++;
        updateTimerDisplay();
        if (timeRemaining <= 0) {
          clearInterval(timerInterval);
          alert("Time's up! Submitting your exam.");
          finishExam();
        }
      }, 1000);
    } else {
      quizTimerDisplay.style.display = 'none';
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        timeElapsed++;
      }, 1000);
    }

    // Switch panels
    switchStatePanel('active');
    renderQuestion();
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function updateTimerDisplay() {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    timerVal.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function switchStatePanel(state) {
    simStateConfig.classList.remove('active');
    simStateActive.classList.remove('active');
    simStateResults.classList.remove('active');

    if (state === 'config') simStateConfig.classList.add('active');
    else if (state === 'active') simStateActive.classList.add('active');
    else if (state === 'results') simStateResults.classList.add('active');
  }

  // ==========================================
  // QUESTION RENDERING & INTERACTIONS
  // ==========================================

  function renderQuestion() {
    const q = activeQuestions[currentQuestionIndex];
    
    currentQIndexEl.textContent = currentQuestionIndex + 1;
    totalQCountEl.textContent = activeQuestions.length;
    
    // Progress bar fill percentage
    const progressPct = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;
    progressBarFill.style.width = `${progressPct}%`;
    
    activeQuestionText.textContent = q.text;
    activeOptionsList.innerHTML = '';
    
    const selectedAnswerIndex = userAnswers[q.id];
    const isAnswered = selectedAnswerIndex !== undefined;

    // Prev / Next button states
    btnPrevQ.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === activeQuestions.length - 1) {
      btnNextQ.style.display = 'none';
      btnSubmitExam.style.display = 'block';
    } else {
      btnNextQ.style.display = 'block';
      btnSubmitExam.style.display = 'none';
    }

    // Render Options
    q.choices.forEach((choice, idx) => {
      const card = document.createElement('div');
      card.className = 'option-card';
      
      const badge = document.createElement('div');
      badge.className = 'option-badge';
      badge.textContent = String.fromCharCode(65 + idx); // A, B, C, D
      
      const text = document.createElement('div');
      text.className = 'option-text';
      text.textContent = choice.text;
      
      card.appendChild(badge);
      card.appendChild(text);

      // Classes based on modes and whether answered
      if (quizMode === 'practice') {
        if (isAnswered) {
          if (idx === q.correctChoiceIndex) {
            card.classList.add('correct');
          } else if (idx === selectedAnswerIndex) {
            card.classList.add('incorrect');
          }
        }
      } else { // Exam mode
        if (selectedAnswerIndex === idx) {
          card.classList.add('selected');
        }
      }

      // Add click handler
      card.addEventListener('click', () => {
        selectOption(idx);
      });

      activeOptionsList.appendChild(card);
    });

    // Handle feedback banner for Practice Mode
    if (quizMode === 'practice' && isAnswered) {
      showFeedbackBanner(selectedAnswerIndex === q.correctChoiceIndex, q.choices[q.correctChoiceIndex].text, q.explanation);
    } else {
      feedbackBanner.style.display = 'none';
    }
  }

  function selectOption(choiceIndex) {
    const q = activeQuestions[currentQuestionIndex];
    
    // In practice mode, lock answer once selected
    if (quizMode === 'practice' && userAnswers[q.id] !== undefined) {
      return;
    }

    userAnswers[q.id] = choiceIndex;
    
    if (quizMode === 'practice') {
      renderQuestion(); // Re-render to show immediate colors & feedback
    } else {
      // Just toggle 'selected' class on option cards visually in Exam Mode
      const cards = activeOptionsList.querySelectorAll('.option-card');
      cards.forEach((card, idx) => {
        if (idx === choiceIndex) card.classList.add('selected');
        else card.classList.remove('selected');
      });
    }
  }

  function showFeedbackBanner(isCorrect, correctAnswerText, explanationText) {
    feedbackBanner.style.display = 'flex';
    feedbackBanner.className = `feedback-banner ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackIcon.textContent = isCorrect ? '✅' : '❌';
    
    let htmlContent = `<div><strong>${isCorrect ? 'Correct! Well done.' : `Incorrect. The correct answer is: ${correctAnswerText}`}</strong></div>`;
    if (explanationText) {
      htmlContent += `<div style="margin-top: 0.5rem; font-size: 0.85rem; border-top: 1px solid currentColor; padding-top: 0.5rem; opacity: 0.95;">📖 <strong>Explanation:</strong> ${explanationText}</div>`;
    }
    feedbackText.innerHTML = htmlContent;
  }

  btnPrevQ.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderQuestion();
    }
  });

  btnNextQ.addEventListener('click', () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      currentQuestionIndex++;
      renderQuestion();
    }
  });

  btnSubmitExam.addEventListener('click', () => {
    // Check if unanswered questions exist
    const totalAnswered = Object.keys(userAnswers).length;
    if (totalAnswered < activeQuestions.length) {
      const confirmSubmit = confirm(`You have only answered ${totalAnswered} out of ${activeQuestions.length} questions. Are you sure you want to submit?`);
      if (!confirmSubmit) return;
    }
    finishExam();
  });

  // ==========================================
  // SCORE REPORTING & RESULTS
  // ==========================================

  function finishExam() {
    clearInterval(timerInterval);
    
    let correctCount = 0;
    activeQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correctChoiceIndex) {
        correctCount++;
      }
    });

    const totalQ = activeQuestions.length;
    const percentage = Math.round((correctCount / totalQ) * 100);

    // Update result page content
    resultsPct.textContent = `${percentage}%`;
    resultsScore.textContent = `${correctCount} / ${totalQ}`;
    
    // Set response header message
    if (percentage === 100) {
      resultsHeading.textContent = "Perfect Score! 🎉";
      resultsSummary.textContent = "Incredible work! You answered every question correctly.";
    } else if (percentage >= 80) {
      resultsHeading.textContent = "Excellent Job! 🌟";
      resultsSummary.textContent = "Great mastery of the exam material. Keep up the good work!";
    } else if (percentage >= 50) {
      resultsHeading.textContent = "Good Effort! 👍";
      resultsSummary.textContent = "You passed, but there is still room for improvement.";
    } else {
      resultsHeading.textContent = "Keep Studying! 📚";
      resultsSummary.textContent = "Take another look at the textbook or notes and try again.";
    }

    // Time Taken conversion
    const elapsedMins = Math.floor(timeElapsed / 60);
    const elapsedSecs = timeElapsed % 60;
    statTime.textContent = `${elapsedMins.toString().padStart(2, '0')}:${elapsedSecs.toString().padStart(2, '0')}`;
    
    statCorrect.textContent = correctCount;
    statIncorrect.textContent = totalQ - correctCount;

    // Reset review container
    reviewSection.style.display = 'none';
    reviewList.innerHTML = '';

    switchStatePanel('results');
  }

  btnRestartQuiz.addEventListener('click', () => {
    startQuiz();
  });

  btnEditQuestions.addEventListener('click', () => {
    switchStatePanel('config');
    // Scroll to left panel to edit
    questionsInput.scrollIntoView({ behavior: 'smooth' });
  });

  btnReviewAnswers.addEventListener('click', () => {
    if (reviewSection.style.display === 'block') {
      reviewSection.style.display = 'none';
      btnReviewAnswers.textContent = "Review Answers";
      return;
    }

    reviewList.innerHTML = '';
    
    activeQuestions.forEach((q, qIdx) => {
      const userChoiceIndex = userAnswers[q.id];
      const isCorrect = userChoiceIndex === q.correctChoiceIndex;

      const card = document.createElement('div');
      card.className = 'review-card';

      const qNum = document.createElement('div');
      qNum.className = 'review-q-num';
      qNum.textContent = `Question ${qIdx + 1}`;

      const qText = document.createElement('div');
      qText.className = 'review-q-text';
      qText.textContent = q.text;

      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'review-options';

      q.choices.forEach((choice, idx) => {
        const optionRow = document.createElement('div');
        optionRow.className = 'review-option';

        const choiceText = `${String.fromCharCode(65 + idx)}. ${choice.text}`;
        
        let label = '';
        
        if (idx === q.correctChoiceIndex) {
          optionRow.classList.add('correct');
          label = 'Correct Answer';
        } else if (idx === userChoiceIndex && !isCorrect) {
          optionRow.classList.add('user-wrong');
          label = 'Your Answer';
        } else {
          optionRow.classList.add('normal');
        }

        const labelSpan = document.createElement('span');
        labelSpan.textContent = choiceText;
        optionRow.appendChild(labelSpan);

        if (label) {
          const statusLbl = document.createElement('span');
          statusLbl.className = 'review-status-label';
          statusLbl.textContent = label;
          optionRow.appendChild(statusLbl);
        }

        optionsDiv.appendChild(optionRow);
      });

      card.appendChild(qNum);
      card.appendChild(qText);
      card.appendChild(optionsDiv);
      
      if (q.explanation) {
        const expDiv = document.createElement('div');
        expDiv.style.marginTop = '1rem';
        expDiv.style.fontSize = '0.9rem';
        expDiv.style.borderTop = '1px solid var(--border-color)';
        expDiv.style.paddingTop = '0.75rem';
        expDiv.style.color = 'var(--text-secondary)';
        expDiv.innerHTML = `📖 <strong>Explanation:</strong> ${q.explanation}`;
        card.appendChild(expDiv);
      }

      reviewList.appendChild(card);
    });

    reviewSection.style.display = 'block';
    btnReviewAnswers.textContent = "Hide Review";
    
    // Smooth scroll down to review
    reviewSection.scrollIntoView({ behavior: 'smooth' });
  });

});
