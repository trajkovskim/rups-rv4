import { useCallback, useRef, useState } from 'react';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import './App.css';
import './theme.css';
import styles from './App.module.css';
import { GAME_MODES, LEADERBOARD_CONTENT, QUESTIONS, type GameModeName } from './demoContent';
import EuropeMap, {
  type EuropeMapClickEvent,
  type EuropeMapDisplay,
  type EuropeMapRefHandle,
} from './components/EuropeMap';
import Card from './components/Card';
import CardsModal from './components/CardsModal';
import FloatingPanel from './components/FloatingPanel';
import Leaderboards, { type LeaderboardEntry } from './components/Leaderboards';
import GameButton from './components/GameButton';
import Overlay from './components/Overlay';
import PlayerScore from './components/PlayerScore';
import QuestionPanel from './components/QuestionPanel';
import ResultSummary, { type QuestionResult, type ResultSummaryContent } from './components/ResultSummary';
import GameplayInstructions from './components/GameplayInstructions';
import geojson from './europe.geo.json';

type GameState = 'ready' | 'selecting' | 'started' | 'paused' | 'completed';

const RESULT_SUMMARY_CONTENT: ResultSummaryContent = {
  heading: 'End of game',
  pointsLabel: (maximumPoints: number) => `out of ${maximumPoints} points`,
  resultMessage: (correctAnswers: number, totalQuestions: number, percentage: number) =>
    percentage === 100
      ? 'Excellent work — you got every question right.'
      : `${correctAnswers} of ${totalQuestions} questions answered correctly`,
  correctLabel: 'Correct',
  incorrectLabel: 'Incorrect',
  reviewLabel: 'Review',
  answersHeading: 'Your answers',
  questionLabel: (questionNumber: number) => `Question ${questionNumber}`,
  correctAnswerLabel: (answer) => <>Answer: {answer}</>,
  pointsUnit: 'points',
  replayLabel: 'Play again',
};

const App = () => {
  const [display, setDisplay] = useState<EuropeMapDisplay>({ country: true });
  const [gameState, setGameState] = useState<GameState>('ready');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<GameModeName | null>(null);
  const [points, setPoints] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const isQuizComplete = gameState === 'completed';
  const isPaused = gameState === 'paused';
  const isModalOpen = gameState === 'selecting' || isPaused;

  const europeMap = useRef<EuropeMapRefHandle>(null);

  const questions = activeMode ? QUESTIONS[activeMode] : [];
  const currentQuestion = questions[questionIndex];
  const currentQuestionResult = questionResults[questionIndex];
  const feedback = currentQuestionResult
    ? currentQuestionResult.isCorrect
      ? 'correct'
      : 'incorrect'
    : undefined;
  const isAnswerSubmitted = feedback !== undefined;

  const currentPlayer = 'Explorer';
  const leaderboards: LeaderboardEntry[] = [];

  const handleMapClick = (data: EuropeMapClickEvent) => {
    if (gameState !== 'started') {
      return;
    }

    if (isAnswerSubmitted) {
      return;
    }

    const answer = data.city ? `${data.city}, ${data.country}` : data.country;
    if (answer) {
      europeMap.current?.addMarker(data.lngLat);
      setSelectedAnswer(answer);
    }
  };

  const clear = useCallback(() => {
    setPoints(0);
    setCorrectAnswers(0);
    setQuestionResults([]);
    setSelectedAnswer(null);
    setQuestionIndex(0);
    europeMap.current?.removeMarker();
    europeMap.current?.removePopup();
  }, []);

  const handleResume = () => {
    setGameState('started');
  };

  const handlePause = () => {
    if (gameState === 'started') {
      setGameState('paused');
    }
  };

  const handleStop = () => {
    clear();
    setActiveMode(null);
    setGameState('ready');
  };

  const handleNewGame = () => {
    clear();
    setActiveMode(null);
    setGameState('selecting');
  };

  const handleStartGame = () => {
    setIsHelpOpen(false);
    setGameState('selecting');
  };

  const handleBackFromGameModes = () => {
    setActiveMode(null);
    setGameState('ready');
  };

  const handleSubmitQuestion = (answer: string) => {
    if (gameState === 'started' && currentQuestion && answer && !isAnswerSubmitted) {
      const selectedCountry = answer.split(',').at(-1)?.trim();
      const isCorrect = selectedCountry?.toLocaleLowerCase() === currentQuestion.country.toLocaleLowerCase();
      setQuestionResults((results) => [
        ...results,
        {
          prompt: currentQuestion.prompt,
          submittedAnswer: answer,
          correctAnswer: currentQuestion.country,
          isCorrect,
        },
      ]);

      const markerLngLat = europeMap.current?.marker()?.getLngLat();
      if (markerLngLat) {
        europeMap.current?.addPopup(markerLngLat, currentQuestion.fact);
      }
      if (isCorrect) {
        setPoints((currentPoints) => currentPoints + 10);
        setCorrectAnswers((currentCorrectAnswers) => currentCorrectAnswers + 1);
      }
    }
  };

  const handleNextQuestion = () => {
    if (!isAnswerSubmitted) {
      return;
    }

    if (questionIndex === questions.length - 1) {
      if (gameState === 'started') {
        setGameState('completed');
      }
      return;
    }

    setQuestionIndex((index) => index + 1);
    setSelectedAnswer(null);
    europeMap.current?.removeMarker();
    europeMap.current?.removePopup();
  };

  const handleGameModeSelect = (mode: (typeof GAME_MODES)[number]) => {
    clear();
    setActiveMode(mode.name);
    setGameState('started');
    setDisplay(mode.display);
  };

  return (
    <main className={styles.shell}>
      <div className={styles.map}>
        <EuropeMap
          ref={europeMap}
          geojson={geojson as FeatureCollection<Geometry, GeoJsonProperties>}
          display={display}
          style={{ width: '100vw', height: '100vh' }}
          onClick={handleMapClick}
        />
      </div>
      {gameState !== 'started' && (
        <Overlay blur className={styles.mapBlurOverlay}>
          {gameState === 'ready' && !isHelpOpen && (
            <GameButton type="start" label="Start game" onClick={handleStartGame} />
          )}
          {isQuizComplete && (
            <ResultSummary
              points={points}
              correctAnswers={correctAnswers}
              totalQuestions={questions.length}
              pointsPerCorrectAnswer={10}
              questionResults={questionResults}
              onReplay={handleNewGame}
              content={RESULT_SUMMARY_CONTENT}
            />
          )}
        </Overlay>
      )}
      <GameplayInstructions
        isOpen={gameState === 'ready' && isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        backLabel="Back"
        eyebrow="HOW TO PLAY"
        title="Explore Europe, one question at a time."
        description="Choose a challenge, find the answer on the map, and submit it to score points."
        steps={[
          { title: 'Choose a challenge.', description: 'Pick a game mode to begin.' },
          {
            title: 'Find the answer.',
            description: 'Read the question and hint, then select a place on the map.',
          },
          {
            title: 'Submit and score.',
            description: 'Earn 10 points for each correct answer across five questions.',
          },
        ]}
      />
      {gameState === 'ready' && !isHelpOpen && (
        <FloatingPanel position="top-left" priority="high">
          <GameButton type="help" label="How to play" onClick={() => setIsHelpOpen(true)} />
        </FloatingPanel>
      )}
      {gameState === 'started' && (
        <FloatingPanel position="top-left" priority="high" className={styles.gameControls}>
          <span className={styles.activeMode}>{activeMode}</span>
          <GameButton type="pause" label="Pause game" onClick={handlePause} />
          <GameButton type="stop" label="Stop game" onClick={handleStop} />
        </FloatingPanel>
      )}
      {activeMode ? (
        <>
          {!isQuizComplete && <PlayerScore name={currentPlayer} points={points} pointsLabel="Points" />}
          {gameState === 'started' && (
            <FloatingPanel position="bottom-center">
              <QuestionPanel
                question={currentQuestion}
                selectedAnswer={selectedAnswer ?? undefined}
                onSubmit={handleSubmitQuestion}
                feedback={feedback}
                onNext={handleNextQuestion}
                questionLabel={`Question ${questionIndex + 1} of ${questions.length}`}
                selectedAnswerLabel="Selected:"
                submitLabel="Submit answer"
                nextLabel="Next question"
              />
            </FloatingPanel>
          )}
        </>
      ) : null}
      {(!activeMode || isQuizComplete) && (
        <Leaderboards entries={leaderboards} currentPlayerName={currentPlayer} content={LEADERBOARD_CONTENT} />
      )}
      <>
        <CardsModal
          isOpen={isModalOpen}
          backButton={
            gameState === 'selecting'
              ? { onClick: handleBackFromGameModes, label: 'Back' }
              : undefined
          }
          eyebrow={isPaused ? 'GAME PAUSED' : 'READY TO EXPLORE?'}
          title={isPaused ? 'Game paused' : 'Choose your game mode'}
          description={
            isPaused ? 'Resume your current game or start a new one.' : 'Pick a challenge and start exploring Europe.'
          }
          footer={
            activeMode && (
              <div className={styles.pauseActions}>
                <GameButton type="resume" label="Resume game" onClick={handleResume} />
                <GameButton type="new-game" label="Start a new game" onClick={handleNewGame} />
              </div>
            )
          }
        >
          {!activeMode &&
            GAME_MODES.map((mode) => (
              <Card key={mode.name} onClick={() => handleGameModeSelect(mode)}>
                <span className={styles.cardIcon}>{mode.icon}</span>
                <span className={styles.cardTitle}>{mode.name}</span>
                <span className={styles.cardDescription}>{mode.description}</span>
                <span className={styles.cardAction}>
                  Start mode
                  <span> →</span>
                </span>
              </Card>
            ))}
        </CardsModal>
      </>
      <footer className={styles.projectFooter}>
        <strong>Meridiani</strong>
        <span>School Project</span>
      </footer>
    </main>
  );
};

export default App;
