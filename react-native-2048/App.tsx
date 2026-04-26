import React, { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  type Board,
  type Direction,
  createInitialGame,
  getBestTile,
  makeMove,
} from "./src/game";

const SWIPE_THRESHOLD = 30;
const CELL_GAP = 8;

type TouchPoint = { x: number; y: number } | null;

const TILE_COLORS: Record<number, string> = {
  0: "#cdc1b4",
  2: "#eee4da",
  4: "#ede0c8",
  8: "#f2b179",
  16: "#f59563",
  32: "#f67c5f",
  64: "#f65e3b",
  128: "#edcf72",
  256: "#edcc61",
  512: "#edc850",
  1024: "#edc53f",
  2048: "#edc22e",
};

function getTileBackground(value: number): string {
  if (value in TILE_COLORS) {
    return TILE_COLORS[value];
  }

  if (value > 2048) {
    return "#3c3a32";
  }

  return TILE_COLORS[0];
}

function getTileTextColor(value: number): string {
  return value <= 4 ? "#776e65" : "#f9f6f2";
}

function getDirectionFromSwipe(start: TouchPoint, end: TouchPoint): Direction | null {
  if (!start || !end) {
    return null;
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) {
    return null;
  }

  if (absX > absY) {
    return dx > 0 ? "right" : "left";
  }

  return dy > 0 ? "down" : "up";
}

function BoardGrid({ board }: { board: Board }) {
  const flattened = board.flat();

  return (
    <View style={styles.board}>
      {flattened.map((value, index) => (
        <View
          key={`${index}-${value}`}
          style={[
            styles.tile,
            {
              backgroundColor: getTileBackground(value),
            },
          ]}
        >
          {value > 0 ? (
            <Text
              style={[
                styles.tileText,
                {
                  color: getTileTextColor(value),
                  fontSize: value >= 1024 ? 24 : 28,
                },
              ]}
            >
              {value}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export default function App() {
  const [game, setGame] = useState(createInitialGame);
  const [bestScore, setBestScore] = useState(0);
  const [touchStart, setTouchStart] = useState<TouchPoint>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPoint>(null);

  const bestTile = useMemo(() => getBestTile(game.board), [game.board]);

  const handleMove = (direction: Direction) => {
    setGame((prev) => {
      const next = makeMove(prev, direction);
      setBestScore((currentBest) => Math.max(currentBest, next.score));
      return next;
    });
  };

  const onRelease = () => {
    const direction = getDirectionFromSwipe(touchStart, touchEnd);
    if (direction) {
      handleMove(direction);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>2048</Text>
            <Text style={styles.subtitle}>Join the tiles and reach 2048!</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setGame(createInitialGame())}
            style={({ pressed }) => [
              styles.newGameButton,
              pressed ? styles.newGameButtonPressed : null,
            ]}
          >
            <Text style={styles.newGameText}>New Game</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SCORE</Text>
            <Text style={styles.statValue}>{game.score}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>BEST SCORE</Text>
            <Text style={styles.statValue}>{bestScore}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>BEST TILE</Text>
            <Text style={styles.statValue}>{bestTile}</Text>
          </View>
        </View>

        <View
          style={styles.boardContainer}
          onTouchStart={(event) => {
            const { pageX, pageY } = event.nativeEvent;
            setTouchStart({ x: pageX, y: pageY });
            setTouchEnd({ x: pageX, y: pageY });
          }}
          onTouchMove={(event) => {
            const { pageX, pageY } = event.nativeEvent;
            setTouchEnd({ x: pageX, y: pageY });
          }}
          onTouchEnd={onRelease}
        >
          <BoardGrid board={game.board} />
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.controlButton} onPress={() => handleMove("up")}>
            <Text style={styles.controlButtonText}>↑</Text>
          </Pressable>
          <View style={styles.middleControls}>
            <Pressable style={styles.controlButton} onPress={() => handleMove("left")}>
              <Text style={styles.controlButtonText}>←</Text>
            </Pressable>
            <Pressable style={styles.controlButton} onPress={() => handleMove("right")}>
              <Text style={styles.controlButtonText}>→</Text>
            </Pressable>
          </View>
          <Pressable style={styles.controlButton} onPress={() => handleMove("down")}>
            <Text style={styles.controlButtonText}>↓</Text>
          </Pressable>
        </View>

        {game.gameOver ? (
          <View style={styles.gameOverCard}>
            <Text style={styles.gameOverTitle}>Game Over</Text>
            <Text style={styles.gameOverText}>No more possible moves.</Text>
          </View>
        ) : null}

        {game.won ? (
          <View style={styles.winCard}>
            <Text style={styles.winTitle}>You reached 2048!</Text>
            <Text style={styles.winText}>Keep going to chase a bigger tile.</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#faf8ef",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 14,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    color: "#776e65",
    fontSize: 48,
    fontWeight: "800",
    lineHeight: 48,
  },
  subtitle: {
    color: "#8f7a66",
    fontSize: 14,
    marginTop: 3,
  },
  newGameButton: {
    backgroundColor: "#8f7a66",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  newGameButtonPressed: {
    opacity: 0.8,
  },
  newGameText: {
    color: "#f9f6f2",
    fontSize: 14,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#bbada0",
    borderRadius: 10,
    flex: 1,
    paddingVertical: 10,
  },
  statLabel: {
    color: "#eee4da",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  boardContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  board: {
    aspectRatio: 1,
    backgroundColor: "#bbada0",
    borderRadius: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CELL_GAP,
    padding: CELL_GAP,
    width: "100%",
  },
  tile: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: "center",
    width: "23%",
  },
  tileText: {
    fontWeight: "800",
  },
  controls: {
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  middleControls: {
    flexDirection: "row",
    gap: 8,
  },
  controlButton: {
    alignItems: "center",
    backgroundColor: "#8f7a66",
    borderRadius: 10,
    justifyContent: "center",
    minWidth: 64,
    paddingVertical: 10,
  },
  controlButtonText: {
    color: "#f9f6f2",
    fontSize: 22,
    fontWeight: "700",
  },
  gameOverCard: {
    alignItems: "center",
    backgroundColor: "#edc22e",
    borderRadius: 10,
    marginBottom: 10,
    paddingVertical: 12,
  },
  gameOverTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  gameOverText: {
    color: "#fff8db",
    fontSize: 14,
    marginTop: 2,
  },
  winCard: {
    alignItems: "center",
    backgroundColor: "#6aaa64",
    borderRadius: 10,
    paddingVertical: 12,
  },
  winTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  winText: {
    color: "#e8f5e1",
    fontSize: 14,
    marginTop: 2,
  },
});
