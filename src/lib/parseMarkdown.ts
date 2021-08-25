import moo from 'moo';
import { LogBit } from 'logbit';
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
const lexer = moo.compile({
	header: /^#+\s*.*$/,
	link: /\[.+\]\(.+\)/,
	boldAndItalic: /\*\*\*.+\*\*\*/,
	bold: /\*\*.+\*\*/,
	italic: /\*.+\*/,
	listItem: /^[-*]\s+/,
	text: { match: /[\S\s]/, lineBreaks: true }
});
export type MAst = Header | Bold | Italic | Text | ListBullet | Link | BoldAndItalic;
interface Header {
	type: 'header';
	level: number;
	text: string;
}
interface BoldAndItalic {
	type: 'boldAndItalic';
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
interface ListBullet {
	type: 'listBullet';
}
interface Link {
	type: 'link';
	text: string;
	url: string;
}

export function parseMarkdown(md: string): MAst[] {
	lexer.reset(md);
	const stream = new ParserStream<{
		type: 'text' | 'bold' | 'italic' | 'header' | 'listItem' | 'link' | 'boldAndItalic';
		text: string;
	}>(Array.from(lexer));
	const ast: MAst[] = [];
	let stringBuffer = '';
	log.debug('Parsing markdown');
	while (!stream.atEnd) {
		const token = stream.consume();
		if (token.type !== 'text') {
			if (stringBuffer.length > 0) {
				ast.push({ type: 'text', text: stringBuffer });
				stringBuffer = '';
			}
		}
		if (token.type === 'text') {
			stringBuffer += token.text;
		} else if (token.type === 'header') {
			ast.push({
				type: 'header',
				level: token.text.match(/^#+/)[0].length,
				text: token.text.replace(/^#+/, '')
			});
		} else if (token.type === 'boldAndItalic') {
			ast.push({
				type: 'boldAndItalic',
				text: token.text.replace(/\*\*\*(.*)\*\*\*/, '$1')
			});
		} else if (token.type === 'bold') {
			ast.push({
				type: 'bold',
				text: token.text.replace(/^\*\*(.+)\*\*/, '$1')
			});
		} else if (token.type === 'italic') {
			ast.push({
				type: 'italic',
				text: token.text.replace(/^\*(.+)\*$/, '$1')
			});
		} else if (token.type === 'listItem') {
			ast.push({
				type: 'listBullet'
			});
			ast.push({
				type: 'text',
				text: token.text.replace(/^[-*]/, '')
			});
		} else if (token.type === 'link') {
			ast.push({
				type: 'link',
				text: token.text.replace(/\[(.+)\]\((.+)\)/, '$1'),
				url: token.text.replace(/\[(.+)\]\((.+)\)/, '$2')
			});
		}
	}
	if (stringBuffer) {
		ast.push({ type: 'text', text: stringBuffer });
	}
	return ast;
}
