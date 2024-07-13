import * as WordsData from './words.json'

export function getRandomWords(amount: number = 10): string[] {
    const len = WordsData.length;
    const rndArr = Array.from({ length: amount }, () => Math.floor(Math.random() * len));
    const chosenWords = rndArr.map(i => WordsData[i]);
    return chosenWords;
}
