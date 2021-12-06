import { getDb } from 'src/data/connect';

export async function getContentDifficulty(
  lang: string,
  lemmas: string[],
  tradLemmas?: string[],
) {
  const db = await getDb();
  const frequency = await db.collection('frequency');
  const { freqDict, tradFreqDict } = await frequency.findOne({ lang });
  const mostFrequentLemmas = Object.keys(freqDict).sort(
    (a, b) => freqDict[b] - freqDict[a],
  );
  const mostFrequentTradLemmas = Object.keys(tradFreqDict).sort(
    (a, b) => tradFreqDict[b] - tradFreqDict[a],
  );
  const difficulty = getDifficultyScore(mostFrequentLemmas, lemmas);
  const tradDifficulty = tradLemmas?.length
    ? getDifficultyScore(mostFrequentTradLemmas, tradLemmas)
    : difficulty;
  return { difficulty, tradDifficulty };
}

function getDifficultyScore(mostFrequentLemmas: string[], lemmas: string[]) {
  let i = 0;
  const cutoff = 0.9;
  let understoodLemmas = 0;
  const lemmasSet = new Set(lemmas);
  const totalLemmas = lemmas.length;
  while (i < mostFrequentLemmas.length) {
    const lemma = mostFrequentLemmas[i];
    if (lemmasSet.has(lemma)) {
      understoodLemmas++;
    }
    if (understoodLemmas / totalLemmas >= cutoff) {
      return i;
    }
    i++;
  }
  return i;
}
