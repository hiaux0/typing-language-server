const lettersByFrequency = [
  "E",
  "N",
  "I",
  "A",
  "R",
  "L",
  "T",
  "O",
  "S",
  "U",
  "D",
  "Y",
  "C",
  "G",
  "H",
  "P",
  "M",
  "K",
  "B",
  "W",
  "F",
  "Z",
  "V",
  "X",
  "Q",
  "J",
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

//const gen = getNextLetterByFrequencyForIgnore();
//console.log("gen.next().value ", gen.next().value);
//console.log("gen.next().value ", gen.next().value);
//console.log("gen.next().value ", gen.next().value);
//console.log("gen.next().value ", gen.next().value);
