interface TextStyleOptions {
	callback: (event: StyleEvent) => void;
}

type StyleEvent =
	| {
			type: 'style';
			property: 'bold' | 'italic' | 'underline' | 'invert';
			value: boolean;
	  }
	| {
			type: 'style';
			property: 'size';
			value: { width: number; height: number };
	  };

interface TextStyleProperties {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	invert: boolean;
	width: number;
	height: number;
}

/**
 * Store and manage text styles
 */
class TextStyle {
	#default: TextStyleProperties = {
		bold: false,
		italic: false,
		underline: false,
		invert: false,
		width: 1,
		height: 1
	};

	#current: TextStyleProperties;
	#callback: (event: StyleEvent) => void;

	/**
	 * Create a new TextStyle object
	 *
	 * @param  {object}   options   Object containing configuration options
	 */
	constructor(options: TextStyleOptions) {
		this.#current = structuredClone(this.#default);
		this.#callback = options.callback || (() => {});
	}

	/**
	 * Return commands to get to the default style from the current style
	 *
	 * @return {array}   Array of modified properties
	 */
	store(): StyleEvent[] {
		const result: StyleEvent[] = [];

		for (const property in this.#current) {
			const key = property as keyof TextStyleProperties;
			const currentValue = this.#current[key];
			const defaultValue = this.#default[key];

			if (currentValue !== defaultValue) {
				if (key === 'width' || key === 'height') {
					result.push({
						type: 'style',
						property: 'size',
						value: { width: defaultValue as number, height: defaultValue as number }
					} as StyleEvent);
				} else {
					result.push({
						type: 'style',
						property: key,
						value: defaultValue as boolean
					} as StyleEvent);
				}
			}
		}

		return result;
	}

	/**
	 * Return commands to get to the current style from the default style
	 *
	 * @return {array}   Array of modified properties
	 */
	restore(): StyleEvent[] {
		const result: StyleEvent[] = [];

		for (const property in this.#current) {
			const key = property as keyof TextStyleProperties;
			const currentValue = this.#current[key];
			const defaultValue = this.#default[key];

			if (currentValue !== defaultValue) {
				if (key === 'width' || key === 'height') {
					result.push({
						type: 'style',
						property: 'size',
						value: { width: currentValue as number, height: currentValue as number }
					} as StyleEvent);
				} else {
					result.push({
						type: 'style',
						property: key,
						value: currentValue as boolean
					} as StyleEvent);
				}
			}
		}

		return result;
	}

	/**
	 * Set the bold property
	 *
	 * @param  {boolean}   value   Is bold enabled, or not?
	 */
	set bold(value: boolean) {
		if (value !== this.#current.bold) {
			this.#current.bold = value;

			this.#callback({
				type: 'style',
				property: 'bold',
				value
			});
		}
	}

	/**
	 * Get the bold property
	 *
	 * @return {boolean}   Is bold enabled, or not?
	 */
	get bold(): boolean {
		return this.#current.bold;
	}

	/**
	 * Set the italic property
	 *
	 * @param  {boolean}   value   Is italic enabled, or not?
	 */
	set italic(value: boolean) {
		if (value !== this.#current.italic) {
			this.#current.italic = value;

			this.#callback({
				type: 'style',
				property: 'italic',
				value
			});
		}
	}

	/**
	 * Get the italic property
	 *
	 * @return {boolean}   Is italic enabled, or not?
	 */
	get italic(): boolean {
		return this.#current.italic;
	}

	/**
	 * Set the underline property
	 *
	 * @param  {boolean}   value   Is underline enabled, or not?
	 */
	set underline(value: boolean) {
		if (value !== this.#current.underline) {
			this.#current.underline = value;

			this.#callback({
				type: 'style',
				property: 'underline',
				value
			});
		}
	}

	/**
	 * Get the underline property
	 *
	 * @return {boolean}   Is underline enabled, or not?
	 */
	get underline(): boolean {
		return this.#current.underline;
	}

	/**
	 * Set the invert property
	 *
	 * @param  {boolean}   value   Is invert enabled, or not?
	 */
	set invert(value: boolean) {
		if (value !== this.#current.invert) {
			this.#current.invert = value;

			this.#callback({
				type: 'style',
				property: 'invert',
				value
			});
		}
	}

	/**
	 * Get the invert property
	 *
	 * @return {boolean}   Is invert enabled, or not?
	 */
	get invert(): boolean {
		return this.#current.invert;
	}

	/**
	 * Set the width property
	 *
	 * @param  {number}   value   The width of a character
	 */
	set width(value: number) {
		if (value !== this.#current.width) {
			this.#current.width = value;

			this.#callback({
				type: 'style',
				property: 'size',
				value: { width: this.#current.width, height: this.#current.height }
			});
		}
	}

	/**
	 * Get the width property
	 *
	 * @return {number}   The width of a character
	 */
	get width(): number {
		return this.#current.width;
	}

	/**
	 * Set the height property
	 *
	 * @param  {number}   value   The height of a character
	 */
	set height(value: number) {
		if (value !== this.#current.height) {
			this.#current.height = value;

			this.#callback({
				type: 'style',
				property: 'size',
				value: { width: this.#current.width, height: this.#current.height }
			});
		}
	}

	/**
	 * Get the height property
	 *
	 * @return {number}   The height of a character
	 */
	get height(): number {
		return this.#current.height;
	}
}

export default TextStyle;
