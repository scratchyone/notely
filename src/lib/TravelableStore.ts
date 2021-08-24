import LogBit from 'logbit';
const console = new LogBit('TravelableStore');
/**
 * @class TravelableStore
 * @classdesc A store that can be traveled through in time.
 */
export class TravelableStore<T> {
	undoQueue: T[];
	redoQueue: T[];
	maxHistory;
	logStateFunction: () => T;
	public constructor(logState: () => T, initialState?: T[], maxHistory?: number) {
		this.undoQueue = initialState || [];
		this.redoQueue = [];
		this.maxHistory = maxHistory || 20;
		this.logStateFunction = logState;
		console.info('TravelableStore initialized');
	}
	public undo(): T | null {
		if (this.undoQueue.length > 0) {
			const nextVal = this.undoQueue.pop();
			this.redoQueue.push(this.logStateFunction());
			console.debug('Reverting to state: ', nextVal);
			return nextVal;
		} else {
			console.warn('Nothing to undo');
			return null;
		}
	}
	public redo(): T | null {
		if (this.redoQueue.length > 0) {
			const nextVal = this.redoQueue.pop();
			this.undoQueue.push(this.logStateFunction());
			console.debug('Redoing to state: ', nextVal);
			return nextVal;
		} else {
			console.warn('Nothing to redo');
			return null;
		}
	}
	// Add a new state to the store
	public snapshot(state: T): void {
		console.info('Saving state: ', state);
		this.undoQueue.push(state);
		if (this.undoQueue.length > this.maxHistory) {
			this.undoQueue.shift();
		}
		if (this.redoQueue.length > 0) {
			console.debug('Clearing redo queue');
		}
		this.redoQueue = [];
		console.trace('History: ', this.undoQueue);
		console.trace('Redo History: ', this.redoQueue);
	}
}
