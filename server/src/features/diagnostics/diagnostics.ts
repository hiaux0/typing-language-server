// type ColumnRange = [start: number, end: number];

export function getFirstDifferentCharIndex(correct: string, given: string): number | undefined {
	let different;

	for (let i = 0; i < given.length + 1; i++) {
		const isSame = correct[i] === given[i];
		if (isSame) continue;
		else {
			different = i;
			break;
		}
	}

	return different;
}
