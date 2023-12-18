// You can see this code on GitHub
// https://github.com/enkoder/beanstalk/api/src/lib/ranking.ts
import { TournamentType } from "../schema.js";

// Sets the number of players who will be receiving any points. Defined as a percentage
// of total players i.e. value of .5 implies half of the field will get points
export const PERCENT_RECEIVING_POINTS = 0.5;

// Sets the percentage of the total adjusted point total first place receives
// i.e. 0.15 implies that first place will get 15% of the total available points for that tournament
export const PERCENT_FOR_FIRST_PLACE = 0.15;

// Defines how many additional points are added per player to the total available point
// This is used to increase the overall payout for large tournaments
export const EXTRA_POINTS_PER_PERSON = 20;

// Sets a baseline number of players a tournament must have in order to receive any points at all
// This means that small tournaments are not eligible for point payouts
export const MIN_PLAYERS_TO_BE_LEGAL = 12;

// Defines the baseline point total per tournament type before the additional points per player is added
export const TOURNAMENT_POINTS: Partial<Record<TournamentType, number>> = {
  "worlds championship": 4000,
  "continental championship": 2000,
  "national championship": 1000,
  "intercontinental championship": 200,
  "circuit opener": 50,
};

// Defines the number of tournaments a person can get points for
// We take the top values if a person attends more than the defined max
export const MAX_TOURNAMENTS_PER_TYPE: Partial<Record<TournamentType, number>> =
  {
    "worlds championship": 1,
    "continental championship": 1,
    "national championship": 3,
    "intercontinental championship": 1,
    "circuit opener": 5,
  };

/**
 * Given the various input params, calculates the point distribution for a tournament.
 *
 * @param totalPoints Baseline number of total points the tournament will distribute amongst players
 * @param numPlayers Total number of players in the tournament
 * @param firstPlacePercentage Flat percentage of points first place receives from the adjusted total point pool
 * @param percentReceivingPoints Percentage of the field that should receive any points
 * @param extraPointsPerPerson Extra points to add to the total point pool per person
 * @param tournamentType Type of tournament which is used to conditionally change the payout structure
 */
export function calculateTournamentPointDistribution(
  totalPoints: number,
  numPlayers: number,
  tournamentType?: TournamentType,
  firstPlacePercentage: number = PERCENT_FOR_FIRST_PLACE,
  percentReceivingPoints: number = PERCENT_RECEIVING_POINTS,
  extraPointsPerPerson: number = EXTRA_POINTS_PER_PERSON,
) {
  // Interconts is winner take all!!
  if (tournamentType === "intercontinental championship") {
    return {
      points: Array.from([totalPoints, ...Array(numPlayers).fill(0).slice(1)]),
      adjustedTotalPoints: totalPoints,
    };
  }

  // Must have enough players to earn any points
  if (numPlayers < MIN_PLAYERS_TO_BE_LEGAL) {
    return {
      points: Array(numPlayers).fill(0),
      adjustedTotalPoints: totalPoints,
    };
  }

  let points: number[] = [];
  let sum = 0;

  // Adjust the total point pool based upon the total number of players
  const adjustedTotalPoints = totalPoints + numPlayers * extraPointsPerPerson;

  // Limit the number of point winners to be based upon the given arg
  const totalWinners = Math.ceil(numPlayers * percentReceivingPoints);

  // Calculate the number of points going to first place. This value sets the starting place
  // for the exponential decaying distribution.
  const firstPlacePoints = adjustedTotalPoints * firstPlacePercentage;

  // Binary search - find an acceptable value for alpha that hits the sweet spot where
  // the payout distribution matches our adjusted total points.
  let lower = 0;
  let upper = 3;

  // Sets a target threshold for margin for error while performing the binary search
  // meaning when our upper and lower are within this threshold, we've found our
  // ideal distribution. Making this smaller makes the distribution more precise but
  // involves more work.
  const threshold = 0.001;

  while (upper - lower > threshold) {
    const alpha = (upper + lower) / 2;
    points = [];
    sum = 0;

    for (let i = 1; i <= numPlayers; i++) {
      let pointsAtIndex = 0;
      // Only the top % gets points, starting with an index of 1, hence <= totalWinners
      if (i <= totalWinners) {
        // Calculates the point value for the given alpha at the given index
        // This is the function that generates the slope and exponential decaying values
        // of the payout structure.
        pointsAtIndex = firstPlacePoints / i ** alpha;
      }

      points.push(pointsAtIndex);
      sum += pointsAtIndex;
    }

    // Adjust binary search params for next iteration
    if (sum > adjustedTotalPoints) {
      lower = alpha;
    } else {
      upper = alpha;
    }
  }

  // we got there!
  return { points, adjustedTotalPoints };
}
