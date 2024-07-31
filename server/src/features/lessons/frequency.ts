export const lettersByFrequency = [
  "e",
  "n",
  "i",
  "a",
  "r",
  "l",
  "t",
  "o",
  "s",
  "u",
  "d",
  "y",
  "c",
  "g",
  "h",
  "p",
  "m",
  "k",
  "b",
  "w",
  "f",
  "z",
  "v",
  "x",
  "q",
  "j",
];

const startIndex = 6;
export function* getNextLetterByFrequency() {
  let start = lettersByFrequency.slice(0, startIndex);
  for (let i = startIndex; i < lettersByFrequency.length - 1; i += 1) {
    start = lettersByFrequency.slice(0, i);
    yield start;
  }
  return start;
}
export const lettersByFrequencyStart = getNextLetterByFrequency().next().value;

/**
 * [a,b,c,d,e]
 * start = 2
 * "normal" => [a,b]
 * "forIgnore" => [c,d,e]
 */
export function* getNextLetterByFrequencyForIgnore() {
  let start = lettersByFrequency.slice(0, startIndex);
  for (let i = startIndex; i < lettersByFrequency.length - 1; i += 1) {
    start = lettersByFrequency.slice(i, lettersByFrequency.length);
    yield start;
  }
  return start;
}

export function getCurrentLetterFromIgnore(ignoreLetters: string[]) {
  const index = lettersByFrequency.length - ignoreLetters.length;
  const letter = lettersByFrequency[index - 1]; // 0 based index
  return letter;
}

//const gen = getNextLetterByFrequencyForIgnore();
////console.log("gen.next().value ", gen.next().value);
////console.log("gen.next().value ", gen.next().value);
////console.log("gen.next().value ", gen.next().value);
//console.log("gen.next().value ", gen.next().value);
//const val = gen.next().value;
///*prettier-ignore*/ console.log("[frequency.ts,69] val: ", val);
//const result = getCurrentLetterFromIgnore(val);
///*prettier-ignore*/ console.log("[frequency.ts,69] result: ", result);
