const numWords = 1;
const delta = 0.422;
const perWord = delta / numWords;
console.log("[scratchpad.ts,4] perWord: ", perWord);
const perMinute = 60 / perWord;
console.log("[scratchpad.ts,6] perMinute: ", perMinute);
const rounded = Math.round(perMinute);
console.log("[scratchpad.ts,6] rounded: ", rounded);
// const wpm =
