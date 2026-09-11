/**
 * Where the active row goes next, given the key that was pressed.
 *
 * FOUR LINES OF ARITHMETIC, EXTRACTED BECAUSE THE COUNT STOPPED BEING A
 * CONSTANT. The jump box walks two lists with one index — the legend while the
 * field is empty, the results afterwards — so the length comes from a variable
 * rather than from an array named beside the arithmetic that uses it. The
 * first time that changed, the guard and the clamp were updated and three of
 * these four branches were not: they went on reading the result list's length,
 * which is zero while the legend is up, and every ArrowDown pinned the reader
 * to the first row. None of it was reachable by a test while it lived inside
 * the component.
 *
 * `undefined` means "this key is not ours" and the caller must not prevent it:
 * Home and End belong to the CARET until a row is chosen, and taking them
 * before that would strand a reader editing a long query.
 */
export function rovedIndex(key: string, active: number, count: number): number | undefined {
	if (count <= 0) return undefined;
	switch (key) {
		// Both wrap, and both are reachable from nothing chosen (`active` is
		// -1): Down opens at the first row and Up at the last, which is what
		// makes Up a way to reach the end of a long list in one press.
		case 'ArrowDown':
			return active >= count - 1 ? 0 : active + 1;
		case 'ArrowUp':
			return active <= 0 ? count - 1 : active - 1;
		case 'Home':
			return active >= 0 ? 0 : undefined;
		case 'End':
			return active >= 0 ? count - 1 : undefined;
		default:
			return undefined;
	}
}
