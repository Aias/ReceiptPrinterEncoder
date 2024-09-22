import TextStyle from './text-style.js';
import TextWrap from './text-wrap.js';

type Alignment = 'left' | 'center' | 'right';
type StyleProperty = 'bold' | 'italic' | 'underline' | 'invert';
type Size = { width: number; height: number };

export type TextItem = {
	type: 'text';
	value: string;
	codepage: number | null;
};
export type SpaceItem = {
	type: 'space';
	size: number;
};
export type RawItem = {
	type: 'raw';
	value: number[];
};
export type AlignItem = {
	type: 'align';
	value: Alignment;
};
export type StyleItem =
	| {
			type: 'style';
			property: StyleProperty;
			value: boolean;
	  }
	| {
			type: 'style';
			property: 'size';
			value: Size;
	  };
export type EmptyItem = {
	type: 'empty';
};

export type BufferItem = TextItem | SpaceItem | RawItem | AlignItem | StyleItem | EmptyItem;

export interface LineComposerOptions {
	embedded?: boolean;
	columns?: number;
	align?: Alignment;
	callback?: (value: any) => void;
}

interface BufferOptions {
	forceNewline?: boolean;
}

/**
 * Compose lines of text and commands
 */
class LineComposer {
	private style: TextStyle;

	#embedded;
	#columns;
	#align;
	#callback;

	#cursor = 0;
	#stored;
	#buffer: BufferItem[] = [];

	/**
	 * Create a new LineComposer object
	 *
	 * @param  {object}   options   Object containing configuration options
	 */
	constructor(options: LineComposerOptions) {
		this.#embedded = options.embedded || false;
		this.#columns = options.columns || 42;
		this.#align = options.align || 'left';
		this.#callback = options.callback || (() => {});

		this.style = new TextStyle({
			callback: (value) => {
				this.add(value, 0);
			}
		});

		this.#stored = this.style.store();
	}

	/**
	 * Add text to the line, potentially wrapping it
	 *
	 * @param  {string}   value   Text to add to the line
	 * @param  {number}   codepage   Codepage to use for the text
	 */
	text(value: string, codepage: number) {
		const lines = TextWrap.wrap(value, { columns: this.#columns, width: this.style.width, indent: this.#cursor });

		for (let i = 0; i < lines.length; i++) {
			if (lines[i].length) {
				/* Add the line to the buffer */
				this.add({ type: 'text', value: lines[i], codepage }, lines[i].length * this.style.width);

				/* If it is not the last line, flush the buffer */
				if (i < lines.length - 1) {
					this.flush();
				}
			} else {
				/* In case the line is empty, flush the buffer */
				this.flush({ forceNewline: true });
			}
		}
	}

	/**
	 * Add spaces to the line
	 *
	 * @param {number} size Number of spaces to add to the line
	 */
	space(size: number) {
		this.add({ type: 'space', size }, size);
	}

	/**
	 * Add raw bytes to to the line
	 *
	 * @param  {array}   value   Array of bytes to add to the line
	 * @param  {number}  length  Length in characters of the value
	 */
	raw(value: number[], length: number) {
		if (value instanceof Array) {
			value = value.flat();
		}

		this.add({ type: 'raw', value }, length || 0);
	}

	/**
	 * Add an item to the line buffer, potentially flushing it
	 *
	 * @param  {object}   value   Item to add to the line buffer
	 * @param  {number}   length  Length in characters of the value
	 */
	add(value: BufferItem, length: number) {
		if (length + this.#cursor > this.#columns) {
			this.flush();
		}

		this.#cursor += length;
		this.#buffer = this.#buffer.concat(value);
	}

	/**
	 * Move the cursor to the end of the line, forcing a flush
	 * with the next item to add to the line buffer
	 */
	end() {
		this.#cursor = this.#columns;
	}

	/**
	 * Fetch the contents of line buffer
	 *
	 * @param  {options}   options   Options for flushing the buffer
	 * @return {array}               Array of items in the line buffer
	 */
	fetch(options: BufferOptions): BufferItem[] {
		if (this.#cursor === 0 && !options.forceNewline) {
			if (!this.#buffer.length) {
				return [];
			}

			const result = this.#merge([...this.#buffer]);
			this.#buffer = [];
			return result;
		}

		let result: BufferItem[] = [];

		const restore = this.style.restore();
		const store = this.style.store();

		function isTextOrSpaceItem(item: BufferItem): item is TextItem | SpaceItem {
			return item.type === 'text' || item.type === 'space';
		}

		if (this.#align === 'right') {
			let last;

			for (let i = this.#buffer.length - 1; i >= 0; i--) {
				if (isTextOrSpaceItem(this.#buffer[i])) {
					last = i;
					break;
				}
			}

			if (typeof last === 'number') {
				const lastItem = this.#buffer[last];
				if (lastItem.type === 'space' && lastItem.size > this.style.width) {
					lastItem.size -= this.style.width;
					this.#cursor -= this.style.width;
				}

				if (lastItem.type === 'text' && lastItem.value.endsWith(' ')) {
					lastItem.value = lastItem.value.slice(0, -1);
					this.#cursor -= this.style.width;
				}
			}

			result = this.#merge([
				{ type: 'space', size: this.#columns - this.#cursor },
				...this.#stored,
				...this.#buffer,
				...store
			]);
		}

		if (this.#align === 'center') {
			const left = (this.#columns - this.#cursor) >> 1;

			result = this.#merge([
				{ type: 'space', size: left },
				...this.#stored,
				...this.#buffer,
				...store,
				{ type: 'space', size: this.#embedded ? this.#columns - this.#cursor - left : 0 }
			]);
		}

		if (this.#align === 'left') {
			result = this.#merge([
				...this.#stored,
				...this.#buffer,
				...store,
				{ type: 'space', size: this.#embedded ? this.#columns - this.#cursor : 0 }
			]);
		}

		this.#stored = restore;
		this.#buffer = [];
		this.#cursor = 0;

		if (result.length === 0 && options.forceNewline) {
			result.push({ type: 'empty' });
		}

		return result;
	}

	/**
	 * Flush the contents of the line buffer
	 *
	 * @param  {options}   options   Options for flushing the buffer
	 */
	flush(options?: BufferOptions) {
		options = Object.assign(
			{
				forceNewline: false
			},
			options || {}
		);

		const align: { current: Alignment; next: Alignment | null } = {
			current: this.#align,
			next: null
		};

		for (let i = 0; i < this.#buffer.length - 1; i++) {
			if (this.#buffer[i].type === 'align') {
				align.current = (this.#buffer[i] as AlignItem).value;
			}
		}

		/* Check the last item in the buffer, to see if it changes the alignment, then save it for the next line */

		if (this.#buffer.length) {
			const last = this.#buffer[this.#buffer.length - 1];

			if (last.type === 'align') {
				align.next = last.value;
			}
		}

		/* Fetch the contents of the line buffer */

		this.#align = align.current;

		const result = this.fetch(options);

		if (result.length) {
			this.#callback(result);
		}

		if (align.next) {
			this.#align = align.next;
		}
	}

	/**
	 * Merge text items and spaces in the line buffer
	 *
	 * @param  {array}   items   Array of items
	 * @return {array}           Array of merged items
	 */
	#merge(items: BufferItem[]): BufferItem[] {
		const result: BufferItem[] = [];
		let last = -1;

		function isTextItem(item: BufferItem): item is TextItem {
			return item.type === 'text';
		}

		for (let item of items) {
			if (item.type === 'space' && 'size' in item && item.size > 0) {
				item = { type: 'text', value: ' '.repeat(item.size), codepage: null };
			}

			if (isTextItem(item)) {
				const lastItem = result[last];
				const allowMerge =
					last >= 0 &&
					isTextItem(lastItem) &&
					(lastItem.codepage === item.codepage || lastItem.codepage === null || item.codepage === null);

				if (allowMerge) {
					lastItem.value += item.value;
					lastItem.codepage = lastItem.codepage || item.codepage;
					continue;
				}

				result.push(item);
				last++;
			} else if (item.type === 'style' || item.type === 'raw') {
				result.push(item);
				last++;
			}
		}

		return result;
	}

	/**
	 * Get the current position of the cursor
	 *
	 * @return {number}   Current position of the cursor
	 */
	get cursor(): number {
		return this.#cursor;
	}

	/**
	 * Set the alignment of the current line
	 *
	 * @param  {string}   value   Text alignment, can be 'left', 'center', or 'right'
	 */
	set align(value: Alignment) {
		this.add({ type: 'align', value }, 0);
	}

	/**
	 * Get the alignment of the current line
	 *
	 * @return {string}   Text alignment, can be 'left', 'center', or 'right'
	 */
	get align(): Alignment {
		let align = this.#align;

		for (let i = 0; i < this.#buffer.length; i++) {
			if (this.#buffer[i].type === 'align') {
				align = (this.#buffer[i] as AlignItem).value;
			}
		}

		return align;
	}

	/**
	 * Set the number of columns of the current line
	 *
	 * @param  {number}   value   columns of the line
	 */
	set columns(value: number) {
		this.#columns = value;
	}

	/**
	 * Get the number of columns of the current line
	 *
	 * @return {number}   columns of the line
	 */
	get columns(): number {
		return this.#columns;
	}
}

export default LineComposer;
