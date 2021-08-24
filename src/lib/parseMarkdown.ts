import moo from 'moo';
import LogBit from 'logbit';
const log = new LogBit('MarkdownParser');

class ParserStream<T> {
	public characters: T[];
	public count: number;
	public constructor(input: T[]) {
		this.characters = input;
		this.count = 0;
	}
	public get atEnd(): boolean {
		return !this.characters.length;
	}
	public peek(n?: number): T | undefined {
		if (this.characters.length <= (n || 0)) return undefined;
		return this.characters[n || 0];
	}
	public consume(n?: number): T | undefined {
		if (this.characters.length <= (n || 0)) return undefined;
		return this.characters.splice(n || 0, 1)[0];
	}
	public nextn(n: number): T[] {
		return this.characters.slice(0, n);
	}
	public clone(): ParserStream<T> {
		const tmp = new ParserStream(this.characters.slice(0));
		tmp.count = this.count;
		return tmp;
	}
	public consumen(n: number): T[] {
		return this.characters.splice(0, n);
	}
}
let lexer = moo.compile({
	header: /^#+\s*.*$/,
	bold: /\*\*.*\*\*/,
	italic: /\*.*\*/,
	text: { match: /[\S\s]+?/, lineBreaks: true }
});
export type MAst = Header | Bold | Italic | Text;
interface Header {
	type: 'header';
	level: number;
	text: string;
}
interface Bold {
	type: 'bold';
	text: string;
}
interface Italic {
	type: 'italic';
	text: string;
}
interface Text {
	type: 'text';
	text: string;
}

export function parseMarkdown(md: string): MAst[] {
	lexer.reset(md);
	const stream = new ParserStream<{ type: 'text' | 'bold' | 'italic' | 'header'; text: string }>(
		Array.from(lexer)
	);
	const ast: MAst[] = [];
	let stringBuffer = '';
	log.debug('Parsing markdown');
	while (!stream.atEnd) {
		const token = stream.consume();
		if (token.type === 'text') {
			stringBuffer += token.text;
			continue;
		} else if (token.type === 'header') {
			if (stringBuffer.length > 0) {
				ast.push({ type: 'text', text: stringBuffer });
				stringBuffer = '';
			}
			ast.push({
				type: 'header',
				level: token.text.match(/^#+/)[0].length,
				text: token.text.replace(/^#+/, '')
			});
		} else if (token.type === 'bold') {
			if (stringBuffer.length > 0) {
				ast.push({ type: 'text', text: stringBuffer });
				stringBuffer = '';
			}
			ast.push({
				type: 'bold',
				text: token.text.replace(/^\*\*(.*)\*\*/, '$1')
			});
		} else if (token.type === 'italic') {
			if (stringBuffer.length > 0) {
				ast.push({ type: 'text', text: stringBuffer });
				stringBuffer = '';
			}
			ast.push({
				type: 'italic',
				text: token.text.replace(/^\*(.*)\*$/, '$1')
			});
		}
	}
	if (stringBuffer) {
		ast.push({ type: 'text', text: stringBuffer });
	}
	return ast;
}
