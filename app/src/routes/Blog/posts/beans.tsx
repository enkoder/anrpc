import { useQuery } from "@tanstack/react-query";
import { LeaderboardService, type RankingConfig } from "../../../client";
import { Link } from "../../../components/Link";
import { Sep } from "../../../components/Sep";
import { capStr } from "../../../util";
import { BlogContent, Section } from "../components/BlogSections";
import type { BlogPost } from "../types";

export const Beans: BlogPost = {
  id: "beans",
  title: "Beans: The Beanstalk Scoring System",
  date: "2024-01-01",
  showTOC: true,
  showInList: false,
  component: ({ onSectionsChange }) => {
    const { data: rankingConfig } = useQuery<RankingConfig>({
      queryKey: ["rankingConfig"],
      queryFn: () => LeaderboardService.getGetRankingConfig(),
    });

    const tournamentConfigs = Object.values(
      rankingConfig?.tournament_configs || {},
    );

    return (
      <BlogContent onSectionsChange={onSectionsChange}>
        <Section title="Introduction">
          <p>
            The goal of this guide is to share the thought process behind the
            Beanstalk scoring system. Our goal is to be as transparent as
            possible and equip everyone with an equitable level of context and
            information. We are always looking for feedback to make the
            Beanstalk better.
          </p>
        </Section>

        <Section title="Decaying Distribution">
          <p>
            The{" "}
            <Link to={"https://en.wikipedia.org/wiki/Pareto_principle"}>
              Pareto Principle
            </Link>{" "}
            states that 20% of the input yields 80% of the output. This is also
            known as the 80/20 rule and it can be found in a number of places.
            This principle was a motivating factor for me to initially pursue an
            exponential decaying distribution, or a power law function and not
            something linear or bucketed. Initially, my goal was to set a
            configurable % of total beans that the top % of players should
            receive. For example, I wanted to set a target of the top 20% of
            players receiving 80% of the total beans. I would then calculate the
            appropriate rate of decay based upon those constraints. This was
            mostly working, but I wanted to find a simpler solution that players
            could reason about.
            <Sep className={"mb-2"} />
            The current algorithm is much simpler, but still follows a
            non-linear decaying distribution. We set a bean value for first
            place and then look for a rate of decay so that a certain percentage
            of players receive points.
            <Sep className={"mb-2"} />
            You can find more details and a well documented and tested algorithm
            over at the <Link to={"/code"}>Code</Link> page.
          </p>
        </Section>

        <Section title="Tournament Tiers">
          <p className={"pl-2"}>
            The Netrunner tournament season follows a natural tiered progression
            with COs, Nationals, Continentals, and then Worlds. The bean value
            distributed at each level needs to intuitively match the level of
            the tournament. For example, Continentals should almost always
            distribute more beans than nationals. We achieve this goal by
            implementing a tiered bean system where a baseline bean value
            correspond to the various tournament types.
            <Sep className={"my-2"} />
            The following tiers are
            <ul className={"list-disc px-8"}>
              {tournamentConfigs.map((tc) => (
                <li>
                  <div className={"flex w-full flex-row"}>
                    <span className={"w-5/6 lg:w-2/6 sm:w-4/6"}>
                      {capStr(tc.code)}
                    </span>
                    <span className={"w-1/6"}>{tc.baseline_points}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Sep className={"my-2"} />
            You can find this configured in{" "}
            <Link className={"text-cyan-600 text-lg"} to={"/code"}>
              Code
            </Link>
            , or you can view them in the{" "}
            <Link className={"text-cyan-600 text-lg"} to={"/sim"}>
              Sim
            </Link>
            .
          </p>
        </Section>

        <Section title="Scaling Beans on Tournament Size" id="scaling-beans">
          <p className={"pl-2"}>
            Winning a large Nationals tournament with 100 players should award
            more beans than a 16-person Nationals. The difference in bean totals
            should be grounded in the difficulty required to win that
            tournament. Additionally, instead of scaling beans by a flat value,
            we use different values for different tournament types. This is
            incredibly helpful to balance COs and other tournament types.
            <Sep className={"my-2"} />
            The current beans added per player is as follows follows:
            <ul className={"list-disc px-8"}>
              {tournamentConfigs.map((tc) => (
                <li>
                  <div className={"flex w-full flex-row"}>
                    <span className={"w-5/6 lg:w-2/6 sm:w-4/6"}>
                      {capStr(tc.code)}
                    </span>
                    <span className={"w-1/6"}>{tc.points_per_player}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Sep className={"my-2"} />
            Again, head over to the{" "}
            <Link className={"text-cyan-600 text-lg"} to={"/sim"}>
              Sim
            </Link>{" "}
            to take a look at how the bean values change as you add more
            players.
          </p>
        </Section>

        <Section title="Beans for Top of Swiss">
          <p className={"pl-2"}>
            Setting a well-known bean value for first place makes it easy to
            reason about the system. Based upon the inputs discussed above, we
            calculate the awarded beans for first place as follows
            <Sep className={"my-2"} />
            First Place Points = Baseline Points + (Beans Per Players * Num
            Players)
            <Sep className={"my-2"} />
            The following bean values are for 50 person tournaments of each
            type.
            <ul className={"list-disc px-8"}>
              {tournamentConfigs.map((tc) => (
                <>
                  {tc.code !== "intercontinental championship" && (
                    <li>
                      <div className={"flex w-full flex-row"}>
                        <span className={"w-5/6 lg:w-2/6 sm:w-4/6"}>
                          {capStr(tc.code)}
                        </span>
                        <span className={"w-1/6"}>
                          {tc.baseline_points + 50 * tc.points_per_player}
                        </span>
                      </div>
                    </li>
                  )}
                </>
              ))}
            </ul>
          </p>
        </Section>

        <Section title="Beans for top cut vs swiss" id="cut-beans">
          <p className={"pl-2"}>
            In Netrunner tournaments, there is a swiss placement and a cut
            placement. We experimented with separate beans for cut and swiss
            placement to account for the situation where a player got top of
            swiss, but then got out quickly in the cut. Having a way to award
            swiss placement intuitively felt right, but in practice it created a
            complicated system where beans were not monotonically decreasing
            from 1st down to last. Simplicity of the ranking system is an
            important feature and seeing top cut bean payouts jump all over the
            place, didn't feel right. So we rolled it back to keep it simple and
            easy to reason about.
            <Sep className={"my-2"} />
            Additionally, after thinking about it more, your award for placing
            high in swiss means you get a better chance at making a higher
            placement in the cut. You get to pick your first matchup and have
            advantage for higher seed. This give you a higher chance to win more
            beans in the cut, so we feel this is award enough for making top of
            swiss.
          </p>
        </Section>

        <Section title="Minimum Players">
          <p className={"pl-2"}>
            Circuit Openers and Nationals can be as small as 8 players and get
            up to 100. In order to keep things balanced we've set minimum player
            limits.
            <ul className={"list-disc px-8"}>
              {tournamentConfigs.map((tc) => (
                <>
                  {(tc.code === "national championship" ||
                    tc.code === "circuit opener") && (
                    <li>
                      <div className={"flex w-full flex-row"}>
                        <span className={"w-5/6 lg:w-2/6 sm:w-4/6"}>
                          {capStr(tc.code)}
                        </span>
                        <span className={"w-1/6"}>
                          {tc.min_players_to_be_legal}
                        </span>
                      </div>
                    </li>
                  )}
                </>
              ))}
            </ul>
          </p>
        </Section>

        <Section title="Intercontinental Championships" id="interconts">
          <p className={"pl-2"}>
            Interconts has been a difficult tournament to appropriately weight.
            Each contestant was required to place top 4 of a continental which
            is a huge accomplishment. We should be awarding people for this
            accomplishment, but also this tournaments tends to be more of a
            "victory lap" where people have a lot of fun and celebrate the game
            with a very unique tournament format. We need to balance how many
            beans Interconts awards because if it's too much then getting top 4
            at a continental could not be balanced, but at the same time, this
            is taking the top 4 from all continentals and letting them duke it
            out. How we approach this is highly subjective. Some believe it
            should be weighted heavy and others, not as much.
            <Sep className={"my-2"} />
            We've landed on a pretty interesting balancing mechanic. Since
            Intercontinentals is a culmination of three continental tournaments
            with hundreds of players, we thought it could be interesting to
            scale the beans based upon the total number of contestants who
            registered across all continentals. During Season 0 we saw 305
            players, which seemed to fit well with the overall balancing of
            beans. For every player registered, this adds 1 bean to the
            potential pool for first place. For intercontinentals that don't
            have a season associated with it, they receive a flat{" "}
            {rankingConfig?.tournament_configs["intercontinental championship"]
              ?.baseline_points ?? 0}{" "}
            beans.
          </p>
        </Section>

        <Section title="Limits Per Tournament Type" id="tournament-limits">
          <p className={"pl-2"}>
            We don't want the Beanstalk to be "pay-to-win". For those that are
            fortunate enough to be able to travel to every Continental and
            National Tournament, they shouldn't get points for every tournaments
            as this will create a clear advantage over those that cannot. To
            make things more equitable across a season, we've implemented a
            limit per tournament type. A player can attend as many tournaments
            as they like, and we will take the top N tournaments for that type.
            <Sep className={"my-2"} />
            The following limits are
            <ul className={"list-disc px-8"}>
              {tournamentConfigs.map((tc) => (
                <li>
                  <div className={"flex w-full flex-row"}>
                    <span className={"w-5/6 lg:w-2/6 sm:w-4/6"}>
                      {capStr(tc.code)}
                    </span>
                    <span className={"w-1/6"}>Limit {tc.tournament_limit}</span>
                  </div>
                </li>
              ))}
            </ul>
          </p>
        </Section>
      </BlogContent>
    );
  },
};
