import { useEffect, useRef, useState } from 'react';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import './App.css';
import './theme.css';
import Card from './components/Card';
import CardsModal from './components/CardsModal';
import EuropeMap, {
  type EuropeMapClickEvent,
  type EuropeMapDisplay,
  type EuropeMapRefHandle,
} from './components/EuropeMap';
import FloatingPanel, { type FloatingPanelPosition } from './components/FloatingPanel';
import GameButton, { type GameButtonType } from './components/GameButton';
import GameplayInstructions from './components/GameplayInstructions';
import Leaderboards, { type LeaderboardContent } from './components/Leaderboards';
import LoadingSpinner from './components/LoadingSpinner';
import Modal from './components/Modal';
import Overlay from './components/Overlay';
import PlayerScore from './components/PlayerScore';
import QuestionPanel, { type QuestionFeedback } from './components/QuestionPanel';
import ResultSummary, { type ResultSummaryContent } from './components/ResultSummary';
import europeGeoJson from '../../ui/api/europe.geo.json';
import styles from './App.module.css';
import {setWorkerUrl} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
setWorkerUrl(workerUrl);

const GAME_BUTTONS: GameButtonType[] = [
  'start',
  'pause',
  'stop',
  'new-game',
  'resume',
  'submit',
  'back',
  'next',
  'help',
];

const FLOATING_POSITIONS: FloatingPanelPosition[] = ['top-left', 'top-right', 'bottom-center', 'bottom-right'];

const QUESTION_DEMOS = [
  {
    prompt: 'Which country is home to Paris?',
    hint: 'Choose a country, then submit your answer.',
    options: ['France', 'Italy', 'Spain'],
    answer: 'France',
  },
  {
    prompt: 'Which country is home to Rome?',
    hint: 'Choose a country, then submit your answer.',
    options: ['Greece', 'Italy', 'Portugal'],
    answer: 'Italy',
  },
];

const GAME_MODES = [
  {
    id: 1,
    name: 'Capital Cities',
    description: 'Explore the capitals of Europe.',
    icon: '🏙️',
    display: { city: true },
  },
  {
    id: 2,
    name: 'Countries & Regions',
    description: 'Discover countries and their regions.',
    icon: '🗺️',
    display: { country: true },
  },
  {
    id: 3,
    name: 'History & Fun Facts',
    description: 'Learn surprising stories from across Europe.',
    icon: '✨',
    display: { country: true, city: true },
  },
];

const LEADERBOARD_CONTENT: LeaderboardContent = {
  eyebrow: 'THE CLASSROOM CHALLENGE',
  title: 'Top explorers',
  subtitle: 'Every quiz gets you closer to the top.',
  periodLabel: 'WEEKLY',
  scoreNote: 'Earn points by exploring the map',
  youLabel: 'YOU',
  pointsLabel: 'pts',
  emptyState: 'No scores yet. Be the first to play!',
  currentPlayerSummary: (rank) => (
    <>
      You are currently ', <strong>#${rank}</strong>
    </>
  ),
};

const RESULT_SUMMARY_CONTENT: ResultSummaryContent = {
  heading: 'Your expedition',
  pointsLabel: (maximumPoints) => `out of ${maximumPoints} possible points`,
  resultMessage: (correct, total, percentage) => `${correct} of ${total} answers correct · ${percentage}%`,
  correctLabel: 'Correct',
  incorrectLabel: 'Incorrect',
  reviewLabel: 'Review',
  answersHeading: 'Answer review',
  questionLabel: (number) => `Question ${number}`,
  correctAnswerLabel: (answer) => <>Correct answer: {answer}</>,
  pointsUnit: 'pts',
  replayLabel: 'Replay demo',
};

const App = () => {
  const [selectedMode, setSelectedMode] = useState<string>('Capital Cities');
  const [activeButton, setActiveButton] = useState<GameButtonType>('start');
  const [isSpinnerOpen, setIsSpinnerOpen] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCardsModalOpen, setIsCardsModalOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState<FloatingPanelPosition>('top-right');
  const [mapDisplay, setMapDisplay] = useState<EuropeMapDisplay>({ country: true, city: true });
  const [mapMessage, setMapMessage] = useState('Click a country to place a marker and inspect the map event.');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>();
  const [feedback, setFeedback] = useState<QuestionFeedback>();
  const [questionMessage, setQuestionMessage] = useState('Choose an answer to try the question flow.');
  const [summaryMessage, setSummaryMessage] = useState('The result summary is rendered with sample answers.');
  const mapRef = useRef<EuropeMapRefHandle>(null);

  const currentQuestion = QUESTION_DEMOS[questionIndex];

  useEffect(() => {
    if (!isSpinnerOpen) {
      return;
    }

    const timeout = window.setTimeout(() => setIsSpinnerOpen(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [isSpinnerOpen]);

  const handleMapClick = ({ country, city, lngLat }: EuropeMapClickEvent) => {
    const place = city ? `${city}, ${country ?? 'Europe'}` : (country ?? 'Map location');
    setMapMessage(`${place} · ${lngLat.lat.toFixed(2)}, ${lngLat.lng.toFixed(2)}`);
    mapRef.current?.addMarker(lngLat);
    mapRef.current?.addPopup(lngLat, place);
  };

  const handleQuestionSubmit = (answer: string) => {
    const isCorrect = answer === currentQuestion.answer;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setQuestionMessage(
      isCorrect ? 'That is right — nice work!' : `Not quite. The answer is ${currentQuestion.answer}.`,
    );
  };

  const handleNextQuestion = () => {
    setQuestionIndex((index) => (index + 1) % QUESTION_DEMOS.length);
    setSelectedAnswer(undefined);
    setFeedback(undefined);
    setQuestionMessage('Choose an answer to try the question flow.');
  };

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="#top" aria-label="Meridiani components home">
          <span className={styles.brandMark} aria-hidden="true">
            M
          </span>
          <span>
            <strong>MERIDIANI</strong>
            <small>COMPONENT LIBRARY</small>
          </span>
        </a>
        <nav className={styles.topLinks} aria-label="Main navigation">
          <a href="#components">Components</a>
          <a href="#map-demo">Interactive map</a>
          <a className={styles.githubLink} href="https://github.com/trajkovskim/rups-rv4">
            View project <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            <span /> A FIELD GUIDE TO THE UI
          </p>
          <h1>
            Small pieces.
            <br />
            <span>Big adventures.</span>
          </h1>
          <p className={styles.heroDescription}>
            Meet the building blocks behind Meridiani. Explore each component, try the interactions, and see how they
            work together.
          </p>
          <a className={styles.primaryLink} href="#components">
            Explore the components <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.artOrbit} />
          <span className={styles.artStar}>✳</span>
          <span className={styles.artPin}>⌖</span>
          <div className={styles.artLabel}>
            <span>48° 51′ 24″ N</span>
            <strong>Somewhere in Europe</strong>
          </div>
          <span className={styles.artDot} />
        </div>
        <div className={styles.heroMeta}>
          <span>
            <strong>13</strong> reusable components
          </span>
          <span>
            <strong>01</strong> interactive map
          </span>
          <span>
            <strong>100%</strong> React
          </span>
        </div>
      </section>

      <div className={styles.content} id="components">
        <aside className={styles.sidebar}>
          <p className={styles.sidebarLabel}>IN THIS LIBRARY</p>
          <a href="#essentials">
            <span>01</span> Essentials
          </a>
          <a href="#map-demo">
            <span>02</span> Map & overlays
          </a>
          <a href="#quiz-components">
            <span>03</span> Quiz experience
          </a>
          <a href="#feedback-components">
            <span>04</span> Results & rankings
          </a>
          <div className={styles.sidebarNote}>
            <span aria-hidden="true">✦</span>
            <p>Every component is ready to drop into your next adventure.</p>
          </div>
        </aside>

        <div className={styles.catalog}>
          <section className={styles.section} id="essentials">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionNumber}>01</span>
              <div>
                <p className={styles.eyebrow}>THE BUILDING BLOCKS</p>
                <h2>Essentials</h2>
                <p>Simple, flexible pieces for starting and shaping an experience.</p>
              </div>
            </div>

            <div className={styles.sampleCard}>
              <div className={styles.sampleHeader}>
                <div>
                  <p className={styles.sampleEyebrow}>CARD · CLICK TO SELECT</p>
                  <h3>Choose a challenge</h3>
                </div>
                <span className={styles.componentTag}>Card</span>
              </div>
              <div className={styles.challengeGrid}>
                {GAME_MODES.map((mode) => (
                  <Card
                    key={mode.name}
                    className={selectedMode === mode.name ? styles.selectedCard : ''}
                    aria-pressed={selectedMode === mode.name}
                    onClick={() => setSelectedMode(mode.name)}
                  >
                    <span className={styles.challengeIcon}>{mode.icon}</span>
                    <span className={styles.challengeName}>{mode.name}</span>
                    <span className={styles.challengeDescription}>{mode.description}</span>
                    <span className={styles.challengeAction}>
                      {selectedMode === mode.name ? 'Selected' : 'Choose mode'} <span aria-hidden="true">→</span>
                    </span>
                  </Card>
                ))}
              </div>
              <p className={styles.inlineStatus}>
                Selected: <strong>{selectedMode}</strong>
              </p>
            </div>

            <div className={styles.sampleCard}>
              <div className={styles.sampleHeader}>
                <div>
                  <p className={styles.sampleEyebrow}>NINE BUILT-IN ACTIONS</p>
                  <h3>GameButton</h3>
                </div>
                <span className={styles.componentTag}>GameButton</span>
              </div>
              <div className={styles.buttonGrid}>
                {GAME_BUTTONS.map((type) => (
                  <div className={styles.buttonSample} key={type}>
                    <GameButton type={type} label={type.replace('-', ' ')} onClick={() => setActiveButton(type)} />
                    <span>{type}</span>
                  </div>
                ))}
              </div>
              <p className={styles.inlineStatus}>
                Last action: <strong>{activeButton}</strong>
              </p>
            </div>

            <div className={styles.sampleCard}>
              <div className={styles.sampleHeader}>
                <div>
                  <p className={styles.sampleEyebrow}>ASYNC FEEDBACK</p>
                  <h3>LoadingSpinner</h3>
                </div>
                <span className={styles.componentTag}>LoadingSpinner</span>
              </div>
              <div className={styles.spinnerStage}>
                <div>
                  <strong>Full-screen loading state</strong>
                  <span>Preview the centered indicator over the current page.</span>
                </div>
                <button className={styles.secondaryButton} type="button" onClick={() => setIsSpinnerOpen(true)}>
                  Preview spinner <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          </section>

          <section className={styles.section} id="map-demo">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionNumber}>02</span>
              <div>
                <p className={styles.eyebrow}>A LITTLE ROOM TO EXPLORE</p>
                <h2>Map & overlays</h2>
                <p>Position helpful context around the map without taking explorers away from it.</p>
              </div>
            </div>

            <div className={`${styles.sampleCard} ${styles.mapCard}`}>
              <div className={styles.sampleHeader}>
                <div>
                  <p className={styles.sampleEyebrow}>MAPLIBRE · CLICK ANY COUNTRY</p>
                  <h3>EuropeMap</h3>
                </div>
                <span className={styles.componentTag}>EuropeMap</span>
              </div>
              <div className={styles.mapToolbar}>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(mapDisplay.country)}
                    onChange={(event) =>
                      setMapDisplay((display) => ({ ...display, country: event.target.checked }))
                    }
                  />{' '}
                  Country labels
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(mapDisplay.city)}
                    onChange={(event) =>
                      setMapDisplay((display) => ({ ...display, city: event.target.checked }))
                    }
                  />{' '}
                  City labels
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(mapDisplay.navigation)}
                    onChange={(event) =>
                      setMapDisplay((display) => ({ ...display, navigation: event.target.checked }))
                    }
                  />{' '}
                  Navigation
                </label>
              </div>
              <div className={styles.mapFrame}>
                <EuropeMap
                  ref={mapRef}
                  geojson={europeGeoJson as FeatureCollection<Geometry, GeoJsonProperties>}
                  display={mapDisplay}
                  style={{ width: '100%', height: '100%' }}
                  onClick={handleMapClick}
                />
                <PlayerScore name="Explorer" points={120} pointsLabel="POINTS" />
                <FloatingPanel position="bottom-center" className={styles.mapCaption}>
                  <span className={styles.mapCaptionDot} />
                  <span>EUROPE · LIVE MAP</span>
                </FloatingPanel>
              </div>
              <p className={styles.inlineStatus} aria-live="polite">
                {mapMessage}
              </p>
            </div>

            <div className={styles.twoColumn}>
              <div className={styles.sampleCard}>
                <div className={styles.sampleHeader}>
                  <div>
                    <p className={styles.sampleEyebrow}>RESPONSIVE POSITIONING</p>
                    <h3>FloatingPanel</h3>
                  </div>
                  <span className={styles.componentTag}>FloatingPanel</span>
                </div>
                <label className={styles.selectLabel} htmlFor="floating-position">
                  Try a position
                </label>
                <select
                  id="floating-position"
                  className={styles.select}
                  value={floatingPosition}
                  onChange={(event) => {
                    const position = FLOATING_POSITIONS.find((option) => option === event.currentTarget.value);
                    if (position) {
                      setFloatingPosition(position);
                    }
                  }}
                >
                  {FLOATING_POSITIONS.map((position) => (
                    <option key={position}>{position}</option>
                  ))}
                </select>
                <div className={styles.panelStage}>
                  <span className={styles.stageHint}>RELATIVE CONTAINER</span>
                  <FloatingPanel position={floatingPosition} size="content">
                    <span className={styles.panelPreview}>
                      <span>✦</span> Your panel, your place
                    </span>
                  </FloatingPanel>
                </div>
              </div>

              <div className={styles.sampleCard}>
                <div className={styles.sampleHeader}>
                  <div>
                    <p className={styles.sampleEyebrow}>FOCUS & EMPHASIS</p>
                    <h3>Overlay</h3>
                  </div>
                  <span className={styles.componentTag}>Overlay</span>
                </div>
                <div className={styles.overlayStage}>
                  <div className={styles.overlayBackdrop}>
                    <span className={styles.overlayBackdropIcon}>✦</span>
                    <strong>Adventure awaits</strong>
                    <span>Explore the map to get started.</span>
                  </div>
                  <Overlay isOpen={isOverlayOpen} blur className={styles.overlayDemo} aria-hidden={!isOverlayOpen}>
                    <div className={styles.overlayContent}>
                      <strong>{isOverlayOpen ? 'A moment of focus' : 'Overlay dismissed'}</strong>
                      <span>
                        {isOverlayOpen ? 'The background stays in view.' : 'The content underneath is clear again.'}
                      </span>
                    </div>
                  </Overlay>
                </div>
                <button className={styles.textButton} type="button" onClick={() => setIsOverlayOpen((open) => !open)}>
                  {isOverlayOpen ? 'Dismiss overlay' : 'Show overlay'} <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          </section>

          <section className={styles.section} id="quiz-components">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionNumber}>03</span>
              <div>
                <p className={styles.eyebrow}>THE HEART OF THE GAME</p>
                <h2>Quiz experience</h2>
                <p>Guide a player from their first question to the final reveal.</p>
              </div>
            </div>

            <div className={styles.sampleCard}>
              <div className={styles.sampleHeader}>
                <div>
                  <p className={styles.sampleEyebrow}>SELECT · SUBMIT · CONTINUE</p>
                  <h3>QuestionPanel</h3>
                </div>
                <span className={styles.componentTag}>QuestionPanel</span>
              </div>
              <div className={styles.questionDemo}>
                <QuestionPanel
                  question={currentQuestion}
                  selectedAnswer={selectedAnswer}
                  feedback={feedback}
                  onSubmit={handleQuestionSubmit}
                  onNext={handleNextQuestion}
                  questionLabel={`QUESTION ${questionIndex + 1} OF ${QUESTION_DEMOS.length}`}
                  selectedAnswerLabel="Selected:"
                  submitLabel="Check answer"
                  nextLabel="Next question"
                />
                {!feedback && (
                  <div className={styles.answerChoices}>
                    {currentQuestion.options.map((answer) => (
                      <button
                        key={answer}
                        className={selectedAnswer === answer ? styles.answerChoiceSelected : ''}
                        type="button"
                        aria-pressed={selectedAnswer === answer}
                        onClick={() => setSelectedAnswer(answer)}
                      >
                        <span className={styles.choiceRadio} />
                        {answer}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className={styles.inlineStatus} aria-live="polite">
                {questionMessage}
              </p>
            </div>

            <div className={styles.sampleCard}>
              <div className={styles.sampleHeader}>
                <div>
                  <p className={styles.sampleEyebrow}>STEP-BY-STEP GUIDANCE</p>
                  <h3>GameplayInstructions</h3>
                </div>
                <span className={styles.componentTag}>GameplayInstructions</span>
              </div>
              <p className={styles.sampleDescription}>An accessible, reusable guide presented in a focused modal.</p>
              <button className={styles.secondaryButton} type="button" onClick={() => setIsInstructionsOpen(true)}>
                <span aria-hidden="true">ⓘ</span> Open how to play
              </button>
            </div>
          </section>

          <section className={styles.section} id="feedback-components">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionNumber}>04</span>
              <div>
                <p className={styles.eyebrow}>CELEBRATE THE JOURNEY</p>
                <h2>Results & rankings</h2>
                <p>Wrap up a round, show progress, and make every point count.</p>
              </div>
            </div>

            <div className={styles.sampleCard}>
              <div className={styles.sampleHeader}>
                <div>
                  <p className={styles.sampleEyebrow}>END-OF-ROUND REVIEW</p>
                  <h3>ResultSummary</h3>
                </div>
                <span className={styles.componentTag}>ResultSummary</span>
              </div>
              <ResultSummary
                points={30}
                correctAnswers={3}
                totalQuestions={4}
                pointsPerCorrectAnswer={10}
                questionResults={[
                  {
                    prompt: 'Which country is home to Paris?',
                    submittedAnswer: 'France',
                    correctAnswer: 'France',
                    isCorrect: true,
                  },
                  {
                    prompt: 'Which country is home to Rome?',
                    submittedAnswer: 'Spain',
                    correctAnswer: 'Italy',
                    isCorrect: false,
                  },
                  {
                    prompt: 'Which country is home to Lisbon?',
                    submittedAnswer: 'Portugal',
                    correctAnswer: 'Portugal',
                    isCorrect: true,
                  },
                  {
                    prompt: 'Which country is home to Athens?',
                    submittedAnswer: 'Greece',
                    correctAnswer: 'Greece',
                    isCorrect: true,
                  },
                ]}
                onReplay={() => setSummaryMessage('Replay selected — start a new round whenever you are ready.')}
                content={RESULT_SUMMARY_CONTENT}
              />
              <p className={styles.inlineStatus} aria-live="polite">
                {summaryMessage}
              </p>
            </div>

            <div className={styles.sampleCard}>
              <div className={styles.sampleHeader}>
                <div>
                  <p className={styles.sampleEyebrow}>A LITTLE FRIENDLY COMPETITION</p>
                  <h3>Leaderboards</h3>
                </div>
                <span className={styles.componentTag}>Leaderboards</span>
              </div>
              <div className={styles.leaderboardStage}>
                <Leaderboards
                  currentPlayerName="Explorer"
                  entries={[
                    { name: 'Sofia', displayName: 'Sofia M.', score: 480, rank: 1 },
                    { name: 'Luka', displayName: 'Luka P.', score: 420, rank: 2 },
                    { name: 'Explorer', displayName: 'You', score: 360, rank: 3 },
                    { name: 'Nina', displayName: 'Nina K.', score: 290, rank: 4 },
                  ]}
                  content={LEADERBOARD_CONTENT}
                />
              </div>
            </div>

            <div className={styles.twoColumn}>
              <div className={styles.sampleCard}>
                <div className={styles.sampleHeader}>
                  <div>
                    <p className={styles.sampleEyebrow}>PLAYER PROGRESS</p>
                    <h3>PlayerScore</h3>
                  </div>
                  <span className={styles.componentTag}>PlayerScore</span>
                </div>
                <div className={styles.scoreStage}>
                  <PlayerScore name="Alex Morgan" points={240} pointsLabel="POINTS" />
                  <span className={styles.stageHint}>FLOATING SCORE PANEL</span>
                </div>
              </div>
              <div className={styles.sampleCard}>
                <div className={styles.sampleHeader}>
                  <div>
                    <p className={styles.sampleEyebrow}>FOCUSED DIALOG</p>
                    <h3>Modal</h3>
                  </div>
                  <span className={styles.componentTag}>Modal</span>
                </div>
                <p className={styles.sampleDescription}>A lightweight dialog surface for custom content.</p>
                <button className={styles.secondaryButton} type="button" onClick={() => setIsModalOpen(true)}>
                  Open modal <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>

            <div className={styles.sampleCard}>
              <div className={styles.sampleHeader}>
                <div>
                  <p className={styles.sampleEyebrow}>COMPOSED CARD DIALOG</p>
                  <h3>CardsModal</h3>
                </div>
                <span className={styles.componentTag}>CardsModal</span>
              </div>
              <p className={styles.sampleDescription}>
                Combine an eyebrow, description, selectable cards, and a footer in one ready-made modal.
              </p>
              <button className={styles.secondaryButton} type="button" onClick={() => setIsCardsModalOpen(true)}>
                Browse game modes <span aria-hidden="true">↗</span>
              </button>
            </div>
          </section>

          <footer className={styles.footer}>
            <span className={styles.brandMark} aria-hidden="true">
              M
            </span>
            <span>Made for curious minds.</span>
            <a href="#top">Back to top ↑</a>
          </footer>
        </div>
      </div>

      <Modal isOpen={isModalOpen} className={styles.modalContent}>
        <button
          className={styles.modalClose}
          type="button"
          onClick={() => setIsModalOpen(false)}
          aria-label="Close dialog"
        >
          ×
        </button>
        <span className={styles.modalIcon}>✦</span>
        <p className={styles.eyebrow}>A REUSABLE DIALOG</p>
        <h2>Make room for a moment.</h2>
        <p>Modal provides the accessible overlay and dialog container. You bring the content that belongs inside.</p>
        <button className={styles.primaryButton} type="button" onClick={() => setIsModalOpen(false)}>
          Got it
        </button>
      </Modal>

      <CardsModal
        isOpen={isCardsModalOpen}
        eyebrow="PICK YOUR PATH"
        title="Choose a game mode"
        description="A CardsModal turns a collection of cards into a complete selection experience."
        backButton={{ onClick: () => setIsCardsModalOpen(false), label: 'Close' }}
        footer={<span className={styles.modalFooterNote}>Three ways to explore Europe</span>}
      >
        {GAME_MODES.map((mode) => (
          <Card
            key={mode.name}
            className={styles.modalCard}
            onClick={() => {
              setSelectedMode(mode.name);
              setIsCardsModalOpen(false);
            }}
          >
            <span className={styles.challengeIcon}>{mode.icon}</span>
            <span className={styles.challengeName}>{mode.name}</span>
            <span className={styles.challengeDescription}>{mode.description}</span>
            <span className={styles.challengeAction}>
              Choose mode <span aria-hidden="true">→</span>
            </span>
          </Card>
        ))}
      </CardsModal>

      <GameplayInstructions
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        backLabel="Back to components"
        eyebrow="HOW TO PLAY"
        title="Explore at your own pace."
        description="A quick guide keeps the rules close and the adventure moving."
        steps={[
          { title: 'Choose a challenge.', description: 'Pick a mode that matches your curiosity.' },
          { title: 'Find the answer.', description: 'Use the map and hints to explore each question.' },
          { title: 'Collect your points.', description: 'Submit your answer and see how you did.' },
        ]}
      />
      {isSpinnerOpen && <LoadingSpinner className={styles.spinnerOverlay} aria-label="Loading demo content" />}
    </main>
  );
};

export default App;
