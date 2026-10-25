import rankings from "../../contracts/rankings.json";

export type RankingRecord = (typeof rankings)[number];

export const RANKINGS: RankingRecord[] = rankings;

export function findRanking(slug: string | undefined): RankingRecord | undefined {
  return RANKINGS.find((ranking) => ranking.slug === slug);
}
