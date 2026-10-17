/* Optional audience summary. Input is FPResultReport's viewer-safe snapshot. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FPAudienceResult = api;
})(globalThis, () => {
  'use strict';
  const HOME = 'https://osakenpiro.github.io/fineplay/home/';
  const count = n => Number.isSafeInteger(n) && n >= 0 ? n : null;
  const finished = new Set(['確定', '正解・拍手受付中', '答え合わせ・拍手受付中']);

  function project(report) {
    const round = report?.round;
    if (!round || !finished.has(round.status)) return null;
    const questions = count(round.questions), guesses = count(round.guesses);
    if (questions === null || guesses === null) return null;
    let fineplays = null;
    if (Array.isArray(round.players) && round.players.length) {
      let total = 0;
      for (const player of round.players) {
        const value = count(player?.fineplays);
        if (value === null || !Number.isSafeInteger(total + value)) { total = null; break; }
        total += value;
      }
      fineplays = total;
    }
    // No names, answer, scope, timestamps, score rows, IDs, tokens or source URLs.
    return Object.freeze({questions, guesses, fineplays, final:round.status === '確定'});
  }

  function format(report) {
    const summary = project(report);
    if (!summary) return '';
    const lines = ['FINEPLAY — いい質問に、拍手。',
      'このお題：質問 ' + summary.questions + '回・解答 ' + summary.guesses + '回'];
    if (summary.fineplays !== null) lines.push('FinePlay ' + summary.fineplays + '回');
    if (!summary.final) lines.push('お題終了・拍手集計中');
    lines.push('', '次の通話、これで遊ぼう。', '紹介・ひとりで試す：' + HOME);
    return lines.join('\n');
  }

  return Object.freeze({project, format});
});
