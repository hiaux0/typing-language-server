const input = [
    'the', 'to', 'i', 'and',
]

// const ignore = ['v', ' z', ' j', ' h'];
const ignore = ['v', 'z', 'j', 'h'];

function filterByIgnore(wordPool: string[]): string[] {
    /* D. */
    if (ignore.length === 0) return wordPool
    console.log("[scratchpad.ts,15] ignore: ", ignore);
    wordPool = wordPool.filter(word => {
        const asht = ignore.every(ignoreElement => {
            console.log(word);
            console.log(ignoreElement);
            const ar = !word.includes(ignoreElement)
            console.log(ar);
            return ar
        })
        console.log(asht);
        return asht
    });
    return wordPool;
}

console.log(!"the".includes("h"));
const result = filterByIgnore(input)
console.log("[scratchpad.ts,19] result: ", result);

