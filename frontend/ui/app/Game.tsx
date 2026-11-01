'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  EuropeMapClickEvent,
  EuropeMapDisplay,
  EuropeMapRefHandle,
  QuestionFeedback,
} from '@meridiani/components';
import {
  Card,
  CardsModal,
  EuropeMap,
  FloatingPanel,
  GameButton,
  GameplayInstructions,
  Leaderboards,
  LoadingSpinner,
  Overlay,
  PlayerScore,
  QuestionPanel,
  ResultSummary,
} from '@meridiani/components';
import type {
  LeaderboardContent,
  LeaderboardEntry as ComponentLeaderboardEntry,
  ResultSummaryContent,
} from '@meridiani/components';
import { getBundledMapGeoData } from '@/api/apiGeoService';
import { getMapGeoData } from '@/service/geoService';
import { checkQuestionAnswer, getLeaderboard, getQuestionsForType } from '@/service/questionsService';
import { formatCoordinates, formatPlaceName, gameText } from './gameText';
import { GAME_MODES, type GameMode, type GamePhase, type QuestionResult, useGame } from './useGame';
import AppLoadingSpinner from './AppLoadingSpinner';
import PointsAward from './PointsAward';
import styles from './page.module.css';

import { LngLat as MapLngLat, Marker, setWorkerUrl } from 'maplibre-gl';
setWorkerUrl('maplibre-gl-worker.mjs');

const LEADERBOARD_CONTENT: LeaderboardContent = {
  ...gameText.leaderboard,
};

const RESULT_SUMMARY_CONTENT: ResultSummaryContent = {
  ...gameText.results,
  correctAnswerLabel: (answer) => gameText.results.correctAnswerLabel(String(answer)),
};
const LEADERBOARD_TABS = GAME_MODES.map(({ id, name }) => ({
  id: String(id),
  label: name,
}));

const currentPlayer = gameText.playerName;
const pointsPerCorrectAnswer = 10;
const DEFAULT_DISPLAY: EuropeMapDisplay = { country: true };

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : gameText.errors.unknown);

function Game() {
  const [game, dispatch] = useGame();
  const mapRef = useRef<EuropeMapRefHandle>(null);
  const gameStateRef = useRef(game.phase);
  const selectedMarker = useRef<Marker | null>(null);
  const checkingAnswer = useRef(false);
  const modeRequestId = useRef(0);
  const answerRequestId = useRef(0);
  const [geojson, setGeojson] = useState(getBundledMapGeoData);
  const [mapDataVersion, setMapDataVersion] = useState(0);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<{
    modeId: number;
    entries: ComponentLeaderboardEntry[];
  } | null>(null);
  const [leaderboardModeId, setLeaderboardModeId] = useState(GAME_MODES[0].id);
  const [loadingLeaderboardModeId, setLoadingLeaderboardModeId] = useState<
    number | null
  >(GAME_MODES[0].id);
  const leaderboardRequestId = useRef(0);
  const [mapError, setMapError] = useState<string | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const gameState = game.phase;
  const display = game.activeMode?.display ?? DEFAULT_DISPLAY;
  const leaderboards =
    leaderboardData?.modeId === leaderboardModeId
      ? leaderboardData.entries
      : [];
  const isLoadingLeaderboards =
    loadingLeaderboardModeId === leaderboardModeId;
  const activeLeaderboardError =
    loadingLeaderboardModeId === null ? leaderboardError : null;
  const currentQuestion = game.questions[game.questionIndex];
  const isAnswerSubmitted = game.questionResults[game.questionIndex] !== undefined;
  const feedback = game.answerFeedbacks[game.questionIndex];
  const isQuizComplete = game.phase === 'completed';
  const isPaused = game.phase === 'paused';
  const isModalOpen = game.phase === 'selecting' || isPaused;
  const notices = [mapError, activeLeaderboardError, game.error].filter(
    (notice): notice is string => notice !== null,
  );

  useEffect(() => {
    gameStateRef.current = game.phase;
  }, [game.phase]);

  const clearMap = () => {
    selectedMarker.current = null;
    mapRef.current?.clear();
  };

  const resetGame = (phase: GamePhase) => {
    modeRequestId.current += 1;
    answerRequestId.current += 1;
    checkingAnswer.current = false;
    clearMap();
    dispatch({ type: 'reset', phase });
  };

  const start = () => {
    dispatch({ type: 'error', message: null });
    dispatch({ type: 'phase', phase: 'selecting' });
  };

  const back = () => resetGame('ready');
  const stop = () => resetGame('ready');
  const newGame = () => resetGame('selecting');
  const pause = () => dispatch({ type: 'phase', phase: 'paused' });
  const resume = () => dispatch({ type: 'phase', phase: 'started' });

  const selectMode = async (mode: GameMode) => {
    resetGame('selecting');
    const requestId = ++modeRequestId.current;
    dispatch({ type: 'loading', modeId: mode.id });
    try {
      const questions = await getQuestionsForType(mode.type);
      if (requestId !== modeRequestId.current) return;
      if (questions.length === 0) {
        dispatch({ type: 'error', message: gameText.errors.noQuestions });
        return;
      }
      dispatch({ type: 'modeLoaded', mode, questions });
    } catch (error) {
      if (requestId === modeRequestId.current) {
        dispatch({
          type: 'error',
          message: gameText.errors.loadQuestions(errorMessage(error)),
        });
      }
    } finally {
      if (requestId === modeRequestId.current) {
        dispatch({ type: 'loading', modeId: null });
      }
    }
  };

  const selectMapLocation = (data: EuropeMapClickEvent) => {
    if (game.phase !== 'started' || isAnswerSubmitted || checkingAnswer.current) {
      return;
    }
    const coordinates = { lng: data.lngLat.lng, lat: data.lngLat.lat };
    const answer = formatPlaceName(data.city, data.country, coordinates);
    if (selectedMarker.current) {
      mapRef.current?.remove(selectedMarker.current);
    }
    selectedMarker.current = mapRef.current?.addMarker(data.lngLat) ?? null;
    dispatch({ type: 'selectAnswer', coordinates, answer });
  };

  const submitAnswer = async (answer: string) => {
    if (
      game.phase !== 'started' ||
      !currentQuestion ||
      !game.selectedCoordinates ||
      !answer ||
      isAnswerSubmitted ||
      checkingAnswer.current
    ) {
      return;
    }

    checkingAnswer.current = true;
    const requestId = ++answerRequestId.current;
    dispatch({ type: 'error', message: null });
    try {
      const result = await checkQuestionAnswer({
        questionId: currentQuestion.id,
        answer: game.selectedCoordinates,
      });
      if (requestId !== answerRequestId.current) return;

      const correctLocation = new MapLngLat(result.correctAnswer.lng, result.correctAnswer.lat);
      mapRef.current?.addMarker(correctLocation);
      mapRef.current?.addPopup(
        correctLocation,
        gameText.feedback.correctLocation(formatCoordinates(result.correctAnswer)),
      );

      const answerFeedback: QuestionFeedback =
        result.correctness === 'yes' ? 'correct' : result.correctness === 'partially' ? 'close' : 'incorrect';
      const feedbackMessage =
        result.correctness === 'yes'
          ? gameText.feedback.correct
          : result.correctness === 'partially'
            ? gameText.feedback.partiallyCorrect
            : gameText.feedback.correctLocation(formatCoordinates(result.correctAnswer));
      const markerCoordinates = selectedMarker.current?.getLngLat();
      if (markerCoordinates) {
        mapRef.current?.addPopup(markerCoordinates, `${currentQuestion.fact} ${feedbackMessage}`);
      }

      const questionResult: QuestionResult = {
        prompt: currentQuestion.prompt,
        submittedAnswer: answer,
        correctAnswer: formatCoordinates(result.correctAnswer),
        isCorrect: result.correctness === 'yes',
        pointsEarned: result.points,
      };
      dispatch({
        type: 'submitAnswer',
        feedback: answerFeedback,
        result: questionResult,
      });
    } catch (error) {
      if (requestId === answerRequestId.current) {
        dispatch({
          type: 'error',
          message: gameText.errors.checkAnswer(errorMessage(error)),
        });
      }
    } finally {
      if (requestId === answerRequestId.current) {
        checkingAnswer.current = false;
      }
    }
  };

  const nextQuestion = () => {
    if (!isAnswerSubmitted || checkingAnswer.current) return;
    if (game.questionIndex === game.questions.length - 1) {
      dispatch({ type: 'phase', phase: 'completed' });
      return;
    }
    clearMap();
    dispatch({ type: 'nextQuestion' });
  };

  useEffect(() => {
    const controller = new AbortController();
    void getMapGeoData(controller.signal)
      .then((mapData) => {
        if (gameStateRef.current !== 'ready') {
          return;
        }
        setIsMapLoaded(false);
        setGeojson(mapData);
        setMapDataVersion((version) => version + 1);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMapError(gameText.errors.mapApiFallback(errorMessage(error)));
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const requestId = ++leaderboardRequestId.current;

    void getLeaderboard(leaderboardModeId)
      .then((entries) => {
        if (requestId === leaderboardRequestId.current) {
          setLeaderboardData({ modeId: leaderboardModeId, entries });
        }
      })
      .catch((error: unknown) => {
        if (requestId === leaderboardRequestId.current) {
          setLeaderboardError(
            gameText.errors.leaderboardUnavailable(errorMessage(error)),
          );
        }
      })
      .finally(() => {
        if (requestId === leaderboardRequestId.current) {
          setLoadingLeaderboardModeId(null);
        }
      });

    return () => {
      if (requestId === leaderboardRequestId.current) {
        leaderboardRequestId.current += 1;
      }
    };
  }, [leaderboardModeId]);

  const selectLeaderboardMode = (tabId: string) => {
    const modeId = Number(tabId);
    if (modeId === leaderboardModeId) return;
    setLeaderboardModeId(modeId);
    setLoadingLeaderboardModeId(modeId);
    setLeaderboardError(null);
  };

  return (
    <main className={styles.shell}>
      <div className={styles.map}>
        <EuropeMap
          key={mapDataVersion}
          ref={mapRef}
          geojson={geojson}
          display={display}
          style={{ width: '100vw', height: '100vh' }}
          onClick={selectMapLocation}
          onLoaded={() => setIsMapLoaded(true)}
        />
      </div>
      {gameState !== 'started' && (
        <Overlay blur className={styles.mapBlurOverlay}>
          {gameState === 'ready' && !isHelpOpen && (
            <div className={styles.startButton}>
              <GameButton
                type="start"
                disabled={!isMapLoaded}
                onClick={() => {
                  setIsHelpOpen(false);
                  start();
                }}
              />
              {!isMapLoaded && (
                <LoadingSpinner
                  className={styles.startSpinner}
                  role="status"
                  aria-label={gameText.map.loadingState}
                />
              )}
            </div>
          )}
          {isQuizComplete && (
            <ResultSummary
              points={game.points}
              correctAnswers={game.correctAnswers}
              totalQuestions={game.questions.length}
              pointsPerCorrectAnswer={pointsPerCorrectAnswer}
              questionResults={game.questionResults}
              onReplay={newGame}
              content={RESULT_SUMMARY_CONTENT}
            />
          )}
        </Overlay>
      )}
      <GameplayInstructions
        isOpen={gameState === 'ready' && isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        backLabel={gameText.instructions.backLabel}
        eyebrow={gameText.instructions.eyebrow}
        title={gameText.instructions.title}
        description={gameText.instructions.description}
        steps={[...gameText.instructions.steps]}
      />
      {notices.length > 0 && (
        <div className={styles.notices}>
          {notices.map((notice) => (
            <p key={notice}>{notice}</p>
          ))}
        </div>
      )}
      {gameState === 'ready' && !isHelpOpen && (
        <FloatingPanel position="top-left" priority="high">
          <GameButton
            type="help"
            label={gameText.instructions.eyebrow}
            hover
            onClick={() => setIsHelpOpen(true)}
          />
        </FloatingPanel>
      )}
      {gameState === 'started' && (
        <FloatingPanel position="top-left" priority="high" className={styles.gameControls}>
          <span className={styles.activeMode}>{game.activeMode?.name}</span>
          <GameButton type="pause" label={gameText.controls.pause} hover onClick={pause} />
          <GameButton type="stop" label={gameText.controls.stop} hover onClick={stop} />
        </FloatingPanel>
      )}
      {game.activeMode && (
        <>
          {!isQuizComplete && (
            <PlayerScore name={currentPlayer} points={game.points} pointsLabel={gameText.playerPointsLabel} />
          )}
          {isAnswerSubmitted && (
            <PointsAward points={game.questionResults[game.questionIndex].pointsEarned} />
          )}
          {gameState === 'started' && (
            <FloatingPanel position="bottom-center">
              <QuestionPanel
                question={currentQuestion}
                selectedAnswer={game.selectedAnswer ?? undefined}
                onSubmit={submitAnswer}
                feedback={feedback}
                onNext={nextQuestion}
                questionLabel={gameText.question.label(game.questionIndex + 1, game.questions.length)}
              />
            </FloatingPanel>
          )}
        </>
      )}
      {(!game.activeMode || isQuizComplete) && (
        <Leaderboards
          entries={leaderboards}
          currentPlayerName={currentPlayer}
          content={LEADERBOARD_CONTENT}
          tabs={LEADERBOARD_TABS}
          activeTabId={String(leaderboardModeId)}
          onTabChange={selectLeaderboardMode}
          isLoading={isLoadingLeaderboards}
          loadingLabel={<AppLoadingSpinner label={gameText.leaderboard.loadingState} />}
        />
      )}
      <CardsModal
        isOpen={isModalOpen}
        backButton={
          gameState === 'selecting'
            ? {
                onClick: back,
                label: gameText.controls.back,
              }
            : undefined
        }
        eyebrow={isPaused ? gameText.controls.pausedEyebrow : gameText.controls.readyEyebrow}
        title={isPaused ? gameText.controls.pausedTitle : gameText.controls.chooseModeTitle}
        description={isPaused ? gameText.controls.pausedDescription : gameText.controls.chooseModeDescription}
        footer={
          game.activeMode && (
            <div className={styles.pauseActions}>
              <GameButton type="resume" label={gameText.controls.resume} onClick={resume} />
              <GameButton type="new-game" label={gameText.controls.newGame} onClick={newGame} />
            </div>
          )
        }
      >
        {!game.activeMode &&
          GAME_MODES.map((mode) => (
            <Card key={mode.name} onClick={() => void selectMode(mode)}>
              <span className={styles.cardIcon}>{mode.icon}</span>
              <span className={styles.cardTitle}>{mode.name}</span>
              <span className={styles.cardDescription}>{mode.description}</span>
              <span className={styles.cardAction}>
                {game.loadingModeId === mode.id ? gameText.modes.loadingAction : gameText.modes.startAction}
                {game.loadingModeId !== mode.id && <span> {gameText.modes.actionArrow}</span>}
              </span>
            </Card>
          ))}
      </CardsModal>
      <footer className={styles.projectFooter}>
        <strong>{gameText.footer.name}</strong>
        <span>{gameText.footer.description}</span>
      </footer>
    </main>
  );
}

export default Game;
