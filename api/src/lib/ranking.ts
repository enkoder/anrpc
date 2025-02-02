// You can see this code on GitHub
// https://github.com/enkoder/beanstalk/api/src/lib/ranking.ts
import type { TournamentType } from "../schema.js";

export enum Tournament {
  Worlds = "worlds championship",
  Continental = "continental championship",
  National = "national championship",
  Intercontinental = "intercontinental championship",
  CircuitOpener = "circuit opener",
  CircuitBreaker = "circuit breaker",
  CircuitBreakerInvitational = "circuit breaker invitational",
  PlayersCircuit = "players circuit",
  CasualTournamentKit = "casual tournament kit",
}

// Default configuration (Season 0)
export const DEFAULT_CONFIG: Record<string, Record<Tournament, number>> = {
  // Defines how many points are added per player registered to the tournament
  // Used to scale the number of points for large tournaments
  POINTS_PER_PLAYER: {
    [Tournament.Worlds]: 2,
    [Tournament.Continental]: 2,
    [Tournament.National]: 2,
    [Tournament.Intercontinental]: 0,
    [Tournament.CircuitOpener]: 1,
    [Tournament.CircuitBreaker]: 2,
    [Tournament.CircuitBreakerInvitational]: 2,
    [Tournament.PlayersCircuit]: 2,
    [Tournament.CasualTournamentKit]: 1,
  },
  // Flat points added to the total point pool that gets awarded to 1st place
  // Each tournament gets a different point total to reflect the tournament prestige
  BASELINE_POINTS: {
    [Tournament.Worlds]: 250,
    [Tournament.Continental]: 250,
    [Tournament.National]: 100,
    [Tournament.Intercontinental]: 200,
    [Tournament.CircuitOpener]: 15,
    [Tournament.CircuitBreaker]: 200,
    [Tournament.CircuitBreakerInvitational]: 200,
    [Tournament.PlayersCircuit]: 25,
    [Tournament.CasualTournamentKit]: 15,
  },
  // Sets a baseline number of players a tournament must have in order to distribute any points at all
  // This means that small tournaments are not eligible for payouts
  MIN_PLAYERS_TO_BE_LEGAL: {
    [Tournament.Worlds]: 8,
    [Tournament.Continental]: 8,
    [Tournament.National]: 12,
    [Tournament.Intercontinental]: 8,
    [Tournament.CircuitOpener]: 8,
    [Tournament.CircuitBreaker]: 8,
    [Tournament.CircuitBreakerInvitational]: 8,
    [Tournament.PlayersCircuit]: 8,
    [Tournament.CasualTournamentKit]: 8,
  },
  // Defines the max number of tournaments a person can get points for
  // We take the top values if a person attends more than the defined max
  MAX_TOURNAMENTS_PER_TYPE: {
    [Tournament.Worlds]: 1,
    [Tournament.Continental]: 1,
    [Tournament.National]: 3,
    [Tournament.Intercontinental]: 1,
    [Tournament.CircuitOpener]: 5,
    [Tournament.CircuitBreaker]: 1,
    [Tournament.CircuitBreakerInvitational]: 1,
    [Tournament.PlayersCircuit]: 1,
    [Tournament.CasualTournamentKit]: 5,
  },
  // Defines the bottom anchor point which means the last place player will receive less than the value provided
  // This is used to help set the rate of decay and the payout slope. A higher number indicates a more gradual slope
  BOTTOM_THRESHOLD: {
    [Tournament.Worlds]: 1,
    [Tournament.Continental]: 1,
    [Tournament.National]: 1,
    [Tournament.Intercontinental]: 20,
    [Tournament.CircuitOpener]: 1,
    [Tournament.CircuitBreaker]: 1,
    [Tournament.CircuitBreakerInvitational]: 1,
    [Tournament.PlayersCircuit]: 1,
    [Tournament.CasualTournamentKit]: 1,
  },
};

// Season 3 configuration
export const SEASON_3_CONFIG = {
  ...DEFAULT_CONFIG,
  BASELINE_POINTS: {
    ...DEFAULT_CONFIG.BASELINE_POINTS,
    [Tournament.Worlds]: 0,
    [Tournament.Continental]: 0,
    [Tournament.National]: 0,
    [Tournament.Intercontinental]: 0,
    [Tournament.CircuitOpener]: 0,
    [Tournament.CircuitBreaker]: 0,
    [Tournament.CircuitBreakerInvitational]: 0,
    [Tournament.PlayersCircuit]: 0,
    [Tournament.CasualTournamentKit]: 0,
  },
  POINTS_PER_PLAYER: {
    ...DEFAULT_CONFIG.POINTS_PER_PLAYER,
    [Tournament.Worlds]: 1.5,
    [Tournament.Continental]: 2,
    [Tournament.National]: 1.5,
    // special case since we use num players as total number of players across continental championships
    [Tournament.Intercontinental]: 0.25,
    [Tournament.CircuitOpener]: 1,
    [Tournament.CircuitBreaker]: 1,
    [Tournament.CircuitBreakerInvitational]: 1,
    [Tournament.PlayersCircuit]: 1,
    [Tournament.CasualTournamentKit]: 1,
  },
};

// Map of season IDs to their configurations
export const SEASON_CONFIGS = {
  0: DEFAULT_CONFIG,
  1: DEFAULT_CONFIG,
  2: SEASON_3_CONFIG,
  3: SEASON_3_CONFIG,
};

export function getSeasonConfig(seasonId?: number) {
  if (seasonId === undefined) return DEFAULT_CONFIG;
  return SEASON_CONFIGS[seasonId] || DEFAULT_CONFIG;
}

export function calculatePointDistribution(
  numPlayers: number,
  tournamentType: TournamentType,
  customPointsForFirst?: number,
  seasonId?: number,
): {
  totalPoints: number;
  points: number[];
} {
  const config = getSeasonConfig(seasonId);

  let pointsForFirst: number;
  if (customPointsForFirst) {
    pointsForFirst = customPointsForFirst;
  } else {
    pointsForFirst =
      numPlayers * config.POINTS_PER_PLAYER[tournamentType] +
      config.BASELINE_POINTS[tournamentType];
  }

  // Must have enough players to earn any points
  if (numPlayers < config.MIN_PLAYERS_TO_BE_LEGAL[tournamentType]) {
    return {
      points: Array(numPlayers).fill(0),
      totalPoints: 0,
    };
  }

  let points: number[] = [];
  let totalPoints = 0;

  /* Calculate the correct rate of decay. The formula for the number of points
  that player i receives is (pointsForFirst)*ratio**(i-1). We want player with index
  totalWinners to receive BOTTOM_THRESHOLD[tournamentType] points. Thus, we solve the
  equation (pointsForFirst)*ratio**(totalWinners-1) = BOTTOM_THRESHOLD[tournamentType]
  for ratio to find the correct rate.
  */
  const ratio =
    (config.BOTTOM_THRESHOLD[tournamentType] / pointsForFirst) **
    (1 / (numPlayers - 1));

  // Create array of points for each player
  points = [pointsForFirst];
  totalPoints = pointsForFirst;

  for (let i = 1; i < numPlayers; i++) {
    const pointsAtIndex = i < numPlayers ? points[i - 1] * ratio : 0;
    points.push(pointsAtIndex);
    totalPoints += pointsAtIndex;
  }

  return {
    points: points,
    totalPoints: totalPoints,
  };
}
