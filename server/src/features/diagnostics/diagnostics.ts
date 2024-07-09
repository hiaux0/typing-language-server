// type ColumnRange = [start: number, end: number];

export function getFirstDifferentCharIndex(correct: string, given: string): number | undefined {
	let different: number | undefined = undefined;
	for (let i = 0; i < given.length + 1; i++) {
		const isSame = correct[i] === given[i];
		if (isSame) continue;
		if (correct.includes(given)) continue;
		different = i;
		break;
	}

	return different;
}
