import Dither from 'canvas-dither';
import Flatten from 'canvas-flatten';
import CodepageEncoder from '@point-of-sale/codepage-encoder';
import ImageData from '@canvas/image-data';
import resizeImageData from 'resize-image-data';

/* Import local dependencies */

import LanguageEscPos from './languages/esc-pos';
import LanguageStarPrnt from './languages/star-prnt';
import LineComposer, { LineCommands, type BufferItem } from './line-composer';
import type {
	PrinterDefinition,
	FontType,
	TextAlign,
	StyleProperty,
	Size,
	Pdf417Options,
	BoxOptions,
	BarcodeOptions,
	QrCodeOptions,
	VerticalAlign,
	QrCodeErrorLevel,
	QrCodeSize,
	QrCodeModel,
	PrinterCapabilities,
	CommandArray,
	Command,
	RuleOptions
} from './types/printers';
import type {
	EncoderOptions,
	EncoderConfiguration,
	CodepageName,
	CodepageValue,
	CodepageDefinitions,
	CodepageMapping,
	ErrorLevel,
	CommandQueue,
	CodepageMappingIdentifier
} from './types/receipt-printer-encoder';

/* Import generated data */

import codepageMappingData from '../generated/mapping';
import printerDefinitionsMap from '../generated/printers';

const printerDefinitions = printerDefinitionsMap as Record<string, PrinterDefinition>;
const codepageMappings = codepageMappingData as CodepageDefinitions;

const defaultConfiguration: EncoderConfiguration = {
	columns: 42,
	language: 'esc-pos',
	imageMode: 'column',
	feedBeforeCut: 0,
	newline: '\n\r',
	codepageMapping: 'epson',
	// codepageCandidates: null,
	debug: false,
	embedded: false,
	createCanvas: null,
	errors: 'relaxed'
};

/**
 * Create a byte stream based on commands for receipt printers
 */
class ReceiptPrinterEncoder {
	#options: EncoderConfiguration = defaultConfiguration;
	#queue: BufferItem[][] = [];

	#language: LanguageEscPos | LanguageStarPrnt;
	#composer: LineComposer;

	#printerCapabilities: PrinterCapabilities = {
		language: defaultConfiguration.language,
		codepages: defaultConfiguration.codepageMapping as CodepageMappingIdentifier,
		fonts: {
			A: { size: '12x24', columns: 42 },
			B: { size: '9x24', columns: 56 }
		},
		barcodes: {
			supported: true,
			symbologies: [
				'upca',
				'upce',
				'ean13',
				'ean8',
				'code39',
				'itf',
				'codabar',
				'code93',
				'code128',
				'gs1-databar-omni',
				'gs1-databar-truncated',
				'gs1-databar-limited',
				'gs1-databar-expanded'
			]
		},
		qrcode: {
			supported: true,
			models: ['1', '2']
		},
		pdf417: {
			supported: true
		}
	};

	#codepageMapping: CodepageMapping;
	#codepageCandidates: CodepageName[];
	#codepage: CodepageName = 'cp437';

	#state: {
		codepage: CodepageValue;
		font: FontType;
	} = {
		codepage: 0,
		font: 'A'
	};

	/**
	 * Create a new object
	 *
	 * @param  {object}   options   Object containing configuration options
	 */
	constructor(options?: EncoderOptions) {
		options = options || {};

		const defaults: EncoderConfiguration = {
			...defaultConfiguration
		};

		/* Determine default settings based on the printer language */

		if (typeof options.language === 'string') {
			defaults.columns = options.language === 'esc-pos' ? 42 : 48;
			defaults.codepageMapping = options.language === 'esc-pos' ? 'epson' : 'star';
		}

		/* Determine default settings based on the printer model */

		if (typeof options.printerModel === 'string') {
			if (typeof printerDefinitions[options.printerModel] === 'undefined') {
				throw new Error('Unknown printer model');
			}

			this.#printerCapabilities = printerDefinitions[options.printerModel].capabilities;

			/* Apply the printer definition to the defaults */

			defaults.columns = this.#printerCapabilities.fonts['A'].columns;
			defaults.language = this.#printerCapabilities.language;
			defaults.codepageMapping = this.#printerCapabilities.codepages || defaults.codepageMapping;
			defaults.newline = this.#printerCapabilities?.newline || defaults.newline;
			defaults.feedBeforeCut = this.#printerCapabilities?.cutter?.feed || defaults.feedBeforeCut;
			defaults.imageMode = this.#printerCapabilities?.images?.mode || defaults.imageMode;
		}

		/* Merge options */

		if (options) {
			this.#options = Object.assign(defaults, options);
		}

		/* Backwards compatibility for the width option */

		if (this.#options.width) {
			this.#options.columns = this.#options.width;
		}

		/* Get the printer language */

		if (this.#options.language === 'esc-pos') {
			this.#language = new LanguageEscPos();
		} else if (this.#options.language === 'star-prnt' || this.#options.language === 'star-line') {
			this.#language = new LanguageStarPrnt();
		} else {
			throw new Error('The specified language is not supported');
		}

		/* Determine autoflush settings */
		/*

        StarPRNT printers are set up to have print start control set to page units.
        That means the printer will only print after it has received a cut or ff command.
        This is not ideal, so we set autoFlush to true by default, which will force
        the printer to print after each encode().

        One problem, we do not want to do this for embedded content. Only the top level
        encoder should flush the buffer.

        ESC/POS and Star Line Mode printers are set up to have print start control set to
        line units, which means the printer will print after each line feed command.
        We do not need to flush the buffer for these printers.

    */

		if (typeof this.#options.autoFlush === 'undefined') {
			this.#options.autoFlush = !this.#options.embedded && this.#options.language == 'star-prnt';
		}

		/* Check column width */

		if (![32, 35, 42, 44, 48].includes(this.#options.columns) && !this.#options.embedded) {
			throw new Error('The width of the paper must me either 32, 35, 42, 44 or 48 columns');
		}

		/* Determine codepage mapping and candidates */

		if (typeof this.#options.codepageMapping === 'string') {
			if (typeof codepageMappings[this.#options.language][this.#options.codepageMapping] === 'undefined') {
				throw new Error('Unknown codepage mapping');
			}

			this.#codepageMapping = Object.fromEntries(
				codepageMappings[this.#options.language][this.#options.codepageMapping]
					.map((v, i) => [v, i])
					.filter((i) => i)
			);
		} else {
			this.#codepageMapping = this.#options.codepageMapping;
		}

		if (this.#options.codepageCandidates) {
			this.#codepageCandidates = this.#options.codepageCandidates;
		} else {
			this.#codepageCandidates = Object.keys(this.#codepageMapping);
		}

		/* Create our line composer */

		this.#composer = new LineComposer({
			embedded: this.#options.embedded,
			columns: this.#options.columns,
			align: 'left',
			// size: 1,

			callback: (value) => this.#queue.push(value)
		});

		this.#reset();
	}

	/**
	 * Reset the state of the object
	 */
	#reset() {
		this.#queue = [];
		this.#codepage = this.#options.language == 'esc-pos' ? 'cp437' : 'star/standard';
		this.#state.codepage = 0;
		this.#state.font = 'A';
	}

	/**
	 * Initialize the printer
	 *
	 * @return {object}          Return the object, for easy chaining commands
	 *
	 */
	initialize(): ReceiptPrinterEncoder {
		if (this.#options.embedded) {
			throw new Error('Initialize is not supported in table cells or boxes');
		}

		this.#composer.raw(this.#language.initialize());

		return this;
	}

	/**
	 * Change the code page
	 *
	 * @param  {string}   codepage  The codepage that we set the printer to
	 * @return {object}             Return the object, for easy chaining commands
	 *
	 */
	codepage(codepage: string): ReceiptPrinterEncoder {
		if (codepage === 'auto') {
			this.#codepage = codepage;
			return this;
		}

		if (!CodepageEncoder.supports(codepage)) {
			throw new Error('Unknown codepage');
		}

		if (typeof this.#codepageMapping[codepage] !== 'undefined') {
			this.#codepage = codepage;
		} else {
			throw new Error('Codepage not supported by printer');
		}

		return this;
	}

	/**
	 * Print text
	 *
	 * @param  {string}   value  Text that needs to be printed
	 * @return {object}          Return the object, for easy chaining commands
	 *
	 */
	text(value: string): ReceiptPrinterEncoder {
		this.#composer.text(value, this.#codepage);

		return this;
	}

	/**
	 * Print a newline
	 *
	 * @param  {number|string}   value  The number of newlines that need to be printed, defaults to 1
	 * @return {object}                 Return the object, for easy chaining commands
	 *
	 */
	newline(value: number | string = 1): ReceiptPrinterEncoder {
		if (typeof value === 'string') {
			value = parseInt(value, 10) || 1;
		}

		for (let i = 0; i < value; i++) {
			this.#composer.flush({ forceNewline: true });
		}

		return this;
	}

	/**
	 * Print text, followed by a newline
	 *
	 * @param  {string}   value  Text that needs to be printed
	 * @return {object}          Return the object, for easy chaining commands
	 *
	 */
	line(value: string): ReceiptPrinterEncoder {
		this.text(value);
		this.newline();

		return this;
	}

	/**
	 * Underline text
	 *
	 * @param  {boolean|number}   value  true to turn on underline, false to turn off, or 2 for double underline
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	underline(value?: boolean): ReceiptPrinterEncoder {
		if (typeof value === 'undefined') {
			this.#composer.style.underline = !this.#composer.style.underline;
		} else {
			this.#composer.style.underline = value;
		}

		return this;
	}

	/**
	 * Italic text
	 *
	 * @param  {boolean}          value  true to turn on italic, false to turn off
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	italic(value?: boolean): ReceiptPrinterEncoder {
		if (typeof value === 'undefined') {
			this.#composer.style.italic = !this.#composer.style.italic;
		} else {
			this.#composer.style.italic = value;
		}

		return this;
	}

	/**
	 * Bold text
	 *
	 * @param  {boolean}          value  true to turn on bold, false to turn off
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	bold(value?: boolean): ReceiptPrinterEncoder {
		if (typeof value === 'undefined') {
			this.#composer.style.bold = !this.#composer.style.bold;
		} else {
			this.#composer.style.bold = value;
		}

		return this;
	}

	/**
	 * Invert text
	 *
	 * @param  {boolean}          value  true to turn on white text on black, false to turn off
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	invert(value?: boolean): ReceiptPrinterEncoder {
		if (typeof value === 'undefined') {
			this.#composer.style.invert = !this.#composer.style.invert;
		} else {
			this.#composer.style.invert = value;
		}

		return this;
	}

	/**
	 * Change width of text
	 *
	 * @param  {number}          width    The width of the text, 1 - 8
	 * @return {object}                   Return the object, for easy chaining commands
	 *
	 */
	width(width?: number): ReceiptPrinterEncoder {
		if (typeof width === 'undefined') {
			width = 1;
		}

		if (typeof width !== 'number') {
			throw new Error('Width must be a number');
		}

		if (width < 1 || width > 8) {
			throw new Error('Width must be between 1 and 8');
		}

		this.#composer.style.width = width;

		return this;
	}

	/**
	 * Change height of text
	 *
	 * @param  {number}          height  The height of the text, 1 - 8
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	height(height?: number): ReceiptPrinterEncoder {
		if (typeof height === 'undefined') {
			height = 1;
		}

		if (typeof height !== 'number') {
			throw new Error('Height must be a number');
		}

		if (height < 1 || height > 8) {
			throw new Error('Height must be between 1 and 8');
		}

		this.#composer.style.height = height;

		return this;
	}

	/**
	 * Change text size
	 *
	 * @param  {Number|string}   width   The width of the text, 1 - 8
	 * @param  {Number}          height  The height of the text, 1 - 8
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	size(width?: number | string, height?: number): ReceiptPrinterEncoder {
		/* Backwards compatiblity for changing the font */
		if (typeof width === 'string') {
			return this.font(width === 'small' ? 'B' : 'A');
		}

		if (typeof height === 'undefined') {
			height = width;
		}

		this.width(width);
		this.height(height);

		return this;
	}

	/**
	 * Choose different font
	 *
	 * @param  {string}          value   'A', 'B' or others
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	font(value: string): ReceiptPrinterEncoder {
		if (this.#options.embedded) {
			throw new Error('Changing fonts is not supported in table cells or boxes');
		}

		if (this.#composer.cursor > 0) {
			throw new Error('Changing fonts is not supported in the middle of a line');
		}

		/* If size is specified, find the matching font */

		let matchedFontType: FontType | undefined;
		const matches = value.match(/^[0-9]+x[0-9]+$/);
		if (matches) {
			matchedFontType = Object.entries(this.#printerCapabilities.fonts).find(
				(i) => i[1].size == matches[0]
			)?.[0] as FontType | undefined;
		}

		/* Make sure the font name is uppercase */

		matchedFontType = (matchedFontType?.toUpperCase() || 'A') as FontType;
		const matchedFont = this.#printerCapabilities.fonts[matchedFontType];

		/* Check if the font is supported */

		if (!matchedFont) {
			return this.#error('This font is not supported by this printer', 'relaxed');
		}

		/* Change the font */

		this.#composer.raw(this.#language.font(matchedFontType));

		this.#state.font = matchedFontType;

		/* Change the width of the composer */

		if (matchedFontType === 'A') {
			this.#composer.columns = this.#options.columns;
		} else {
			this.#composer.columns =
				(this.#options.columns / this.#printerCapabilities.fonts['A'].columns) * matchedFont.columns;
		}

		return this;
	}

	/**
	 * Change text alignment
	 *
	 * @param  {string}          value   left, center or right
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	align(value: TextAlign): ReceiptPrinterEncoder {
		const alignments: TextAlign[] = ['left', 'center', 'right'];

		if (!alignments.includes(value)) {
			throw new Error('Unknown alignment');
		}

		this.#composer.align = value;

		return this;
	}

	/**
	 * Insert a table
	 *
	 * @param  {array}           columns  The column definitions
	 * @param  {array}           data     Array containing rows. Each row is an array containing cells.
	 *                                    Each cell can be a string value, or a callback function.
	 *                                    The first parameter of the callback is the encoder object on
	 *                                    which the function can call its methods.
	 * @return {object}                   Return the object, for easy chaining commands
	 *
	 */
	table(
		columns: {
			width: number;
			align: TextAlign;
			verticalAlign?: VerticalAlign;
			marginLeft?: number;
			marginRight?: number;
		}[],
		data: (string | ((encoder: ReceiptPrinterEncoder) => void))[][]
	): ReceiptPrinterEncoder {
		this.#composer.flush();

		/* Process all lines */

		for (let r = 0; r < data.length; r++) {
			const lines = [];
			let maxLines = 0;

			/* Render all columns */

			for (let c = 0; c < columns.length; c++) {
				const columnEncoder = new ReceiptPrinterEncoder(
					Object.assign({}, this.#options, {
						width: columns[c].width,
						embedded: true
					})
				);

				const cellData = data[r][c];

				columnEncoder.codepage(this.#codepage);
				columnEncoder.align(columns[c].align);

				if (typeof cellData === 'string') {
					columnEncoder.text(cellData);
				}

				if (typeof cellData === 'function') {
					cellData(columnEncoder);
				}

				const cell = columnEncoder.commands();

				/* Determine the height in lines of the row */

				maxLines = Math.max(maxLines, cell.length);

				lines[c] = cell;
			}

			/* Pad the cells in this line to the same height */

			for (let c = 0; c < columns.length; c++) {
				if (lines[c].length >= maxLines) {
					continue;
				}

				for (let p = lines[c].length; p < maxLines; p++) {
					let verticalAlign = 'top';
					if (typeof columns[c].verticalAlign !== 'undefined') {
						verticalAlign = columns[c].verticalAlign as VerticalAlign;
					}

					const line: LineCommands = { commands: [{ type: 'space', size: columns[c].width }], height: 1 };

					if (verticalAlign == 'bottom') {
						lines[c].unshift(line);
					} else {
						lines[c].push(line);
					}
				}
			}

			/* Add the lines to the composer */

			for (let l = 0; l < maxLines; l++) {
				for (let c = 0; c < columns.length; c++) {
					if (typeof columns[c].marginLeft !== 'undefined') {
						this.#composer.space(columns[c].marginLeft || 0);
					}

					this.#composer.add(lines[c][l].commands, columns[c].width);

					if (typeof columns[c].marginRight !== 'undefined') {
						this.#composer.space(columns[c].marginRight || 0);
					}
				}

				this.#composer.flush();
			}
		}

		return this;
	}

	/**
	 * Insert a horizontal rule
	 *
	 * @param  {object}          options  And object with the following properties:
	 *                                    - style: The style of the line, either single or double
	 *                                    - width: The width of the line, by default the width of the paper
	 * @return {object}                   Return the object, for easy chaining commands
	 *
	 */
	rule(options?: Partial<RuleOptions>): ReceiptPrinterEncoder {
		const defaultOptions: RuleOptions = {
			style: 'single',
			width: this.#options.columns || 10
		};
		const mergedOptions = { ...defaultOptions, ...options };

		this.#composer.flush();

		this.#composer.text((mergedOptions.style === 'double' ? '═' : '─').repeat(mergedOptions.width), 'cp437');
		this.#composer.flush();

		return this;
	}

	/**
	 * Insert a box
	 *
	 * @param  {object}           options   And object with the following properties:
	 *                                      - style: The style of the border, either single or double
	 *                                      - width: The width of the box, by default the width of the paper
	 *                                      - marginLeft: Space between the left border and the left edge
	 *                                      - marginRight: Space between the right border and the right edge
	 *                                      - paddingLeft: Space between the contents and the left border of the box
	 *                                      - paddingRight: Space between the contents and the right border of the box
	 * @param  {string|function}  contents  A string value, or a callback function.
	 *                                      The first parameter of the callback is the encoder object on
	 *                                      which the function can call its methods.
	 * @return {object}                     Return the object, for easy chaining commands
	 *
	 */
	box(
		options: Partial<BoxOptions>,
		contents: string | ((encoder: ReceiptPrinterEncoder) => void)
	): ReceiptPrinterEncoder {
		const defaultOptions: BoxOptions = {
			style: 'single',
			align: 'left',
			width: this.#options.columns,
			marginLeft: 0,
			marginRight: 0,
			paddingLeft: 0,
			paddingRight: 0
		};
		const mergedOptions = { ...defaultOptions, ...options };

		if (mergedOptions.width + mergedOptions.marginLeft + mergedOptions.marginRight > this.#options.columns) {
			throw new Error('Box is too wide');
		}

		let elements: string[] = [];

		if (mergedOptions.style == 'single') {
			elements = ['┌', '┐', '└', '┘', '─', '│'];
		} else if (mergedOptions.style == 'double') {
			elements = ['╔', '╗', '╚', '╝', '═', '║'];
		}

		/* Render the contents of the box */

		const columnEncoder = new ReceiptPrinterEncoder(
			Object.assign({}, this.#options, {
				width:
					mergedOptions.width -
					(mergedOptions.style == 'none' ? 0 : 2) -
					mergedOptions.paddingLeft -
					mergedOptions.paddingRight,
				embedded: true
			})
		);

		columnEncoder.codepage(this.#codepage);
		columnEncoder.align(mergedOptions.align);

		if (typeof contents === 'function') {
			contents(columnEncoder);
		}

		if (typeof contents === 'string') {
			columnEncoder.text(contents);
		}

		const lines = columnEncoder.commands();

		/* Header */

		this.#composer.flush();

		if (mergedOptions.style != 'none') {
			this.#composer.space(mergedOptions.marginLeft);
			this.#composer.text(elements[0], 'cp437');
			this.#composer.text(elements[4].repeat(mergedOptions.width - 2), 'cp437');
			this.#composer.text(elements[1], 'cp437');
			this.#composer.space(mergedOptions.marginRight);
			this.#composer.flush();
		}

		/* Content */

		for (let i = 0; i < lines.length; i++) {
			this.#composer.space(mergedOptions.marginLeft);

			if (mergedOptions.style != 'none') {
				this.#composer.style.height = lines[i].height;
				this.#composer.text(elements[5], 'cp437');
				this.#composer.style.height = 1;
			}

			this.#composer.space(mergedOptions.paddingLeft);
			this.#composer.add(
				lines[i].commands,
				mergedOptions.width -
					(mergedOptions.style == 'none' ? 0 : 2) -
					mergedOptions.paddingLeft -
					mergedOptions.paddingRight
			);
			this.#composer.space(mergedOptions.paddingRight);

			if (mergedOptions.style != 'none') {
				this.#composer.style.height = lines[i].height;
				this.#composer.text(elements[5], 'cp437');
				this.#composer.style.height = 1;
			}

			this.#composer.space(mergedOptions.marginRight);
			this.#composer.flush();
		}

		/* Footer */

		if (mergedOptions.style != 'none') {
			this.#composer.space(mergedOptions.marginLeft);
			this.#composer.text(elements[2], 'cp437');
			this.#composer.text(elements[4].repeat(mergedOptions.width - 2), 'cp437');
			this.#composer.text(elements[3], 'cp437');
			this.#composer.space(mergedOptions.marginRight);
			this.#composer.flush();
		}

		return this;
	}

	/**
	 * Barcode
	 *
	 * @param  {string}           value  the value of the barcode
	 * @param  {string|number}           symbology  the type of the barcode
	 * @param  {number|object}    height  Either the configuration object, or backwards compatible height of the barcode
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	barcode(
		value: string,
		symbology: string | number,
		height?: number | Partial<BarcodeOptions>
	): ReceiptPrinterEncoder {
		let options: BarcodeOptions = {
			height: 60,
			width: 2,
			text: false
		};

		if (typeof height === 'object') {
			options = Object.assign(options, height);
		}

		if (typeof height === 'number') {
			options.height = height;
		}

		if (this.#options.embedded) {
			throw new Error('Barcodes are not supported in table cells or boxes');
		}

		if (this.#printerCapabilities.barcodes.supported === false) {
			return this.#error('Barcodes are not supported by this printer', 'relaxed');
		}

		if (typeof symbology === 'string' && !this.#printerCapabilities.barcodes.symbologies.includes(symbology)) {
			return this.#error(`Symbology '${symbology}' not supported by this printer`, 'relaxed');
		}

		/* Force printing the print buffer and moving to a new line */

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		/* Set alignment */

		if (this.#composer.align !== 'left') {
			this.#composer.raw(this.#language.align(this.#composer.align));
		}

		/* Barcode */

		this.#composer.raw(this.#language.barcode(value, symbology, options));

		/* Reset alignment */

		if (this.#composer.align !== 'left') {
			this.#composer.raw(this.#language.align('left'));
		}

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		return this;
	}

	/**
	 * QR code
	 *
	 * @param  {string}           value       The value of the qr code
	 * @param  {number|object}    model       Either the configuration object, or
	 *                                        backwards compatible model of the qrcode, either 1 or 2
	 * @param  {number}           size        Backwards compatible size of the qrcode, a value between 1 and 8
	 * @param  {string}           errorlevel  Backwards compatible the amount of error correction used,
	 *                                        either 'l', 'm', 'q', 'h'
	 * @return {object}                       Return the object, for easy chaining commands
	 */
	qrcode(
		value: string,
		model?: QrCodeModel | Partial<QrCodeOptions>,
		size?: QrCodeSize,
		errorlevel?: QrCodeErrorLevel
	): ReceiptPrinterEncoder {
		let options: QrCodeOptions = {
			model: 2,
			size: 6,
			errorlevel: 'm'
		};

		if (typeof model === 'object') {
			options = Object.assign(options, model);
		}

		if (typeof model === 'number') {
			options.model = model;
		}

		if (typeof size === 'number') {
			options.size = size;
		}

		if (typeof errorlevel === 'string') {
			options.errorlevel = errorlevel;
		}

		if (this.#options.embedded) {
			throw new Error('QR codes are not supported in table cells or boxes');
		}

		if (this.#printerCapabilities.qrcode.supported === false) {
			return this.#error('QR codes are not supported by this printer', 'relaxed');
		}

		if (options.model && !this.#printerCapabilities.qrcode.models.includes(String(options.model))) {
			return this.#error('QR code model is not supported by this printer', 'relaxed');
		}

		/* Force printing the print buffer and moving to a new line */

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		/* Set alignment */

		if (this.#composer.align !== 'left') {
			this.#composer.raw(this.#language.align(this.#composer.align));
		}

		/* QR code */

		this.#composer.raw(this.#language.qrcode(value, options));

		/* Reset alignment */

		if (this.#composer.align !== 'left') {
			this.#composer.raw(this.#language.align('left'));
		}

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		return this;
	}

	/**
	 * PDF417 code
	 *
	 * @param  {string}           value     The value of the qr code
	 * @param  {object}           options   Configuration object
	 * @return {object}                     Return the object, for easy chaining commands
	 *
	 */
	pdf417(value: string, options: Partial<Pdf417Options>): ReceiptPrinterEncoder {
		const defaultOptions: Pdf417Options = {
			width: 3,
			height: 3,
			columns: 0,
			rows: 0,
			errorlevel: 1,
			truncated: false
		};
		const mergedOptions = { ...defaultOptions, ...options };

		if (this.#options.embedded) {
			throw new Error('PDF417 codes are not supported in table cells or boxes');
		}

		if (this.#printerCapabilities.pdf417.supported === false) {
			/* If possible, fallback to a barcode with symbology */

			if (typeof this.#printerCapabilities.pdf417.fallback === 'object') {
				return this.barcode(value, this.#printerCapabilities.pdf417.fallback.symbology);
			}

			return this.#error('PDF417 codes are not supported by this printer', 'relaxed');
		}

		/* Force printing the print buffer and moving to a new line */

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		/* Set alignment */

		if (this.#composer.align !== 'left') {
			this.#composer.raw(this.#language.align(this.#composer.align));
		}

		/* PDF417 code */

		this.#composer.raw(this.#language.pdf417(value, mergedOptions));

		/* Reset alignment */

		if (this.#composer.align !== 'left') {
			this.#composer.raw(this.#language.align('left'));
		}

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		return this;
	}

	/**
	 * Image
	 *
	 * @param  {object}         input  an element, like a canvas or image that needs to be printed
	 * @param  {number}         width  width of the image on the printer
	 * @param  {number}         height  height of the image on the printer
	 * @param  {string}         algorithm  the dithering algorithm for making the image black and white
	 * @param  {number}         threshold  threshold for the dithering algorithm
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	image(input: any, width: number, height: number, algorithm?: string, threshold?: number): ReceiptPrinterEncoder {
		if (this.#options.embedded) {
			throw new Error('Images are not supported in table cells or boxes');
		}

		if (width % 8 !== 0) {
			throw new Error('Width must be a multiple of 8');
		}

		if (height % 8 !== 0) {
			throw new Error('Height must be a multiple of 8');
		}

		if (typeof algorithm === 'undefined') {
			algorithm = 'threshold';
		}

		if (typeof threshold === 'undefined') {
			threshold = 128;
		}

		/* Determine the type of the input */

		const name = input.constructor.name;
		let type;

		name.endsWith('Element') ? (type = 'element') : null;
		name == 'ImageData' ? (type = 'imagedata') : null;
		name == 'Canvas' && typeof input.getContext !== 'undefined' ? (type = 'node-canvas') : null;
		name == 'Image' ? (type = 'node-canvas-image') : null;
		name == 'Image' && typeof input.frames !== 'undefined' ? (type = 'node-read-image') : null;
		name == 'Object' && input.data && input.info ? (type = 'node-sharp') : null;
		name == 'View3duint8' && input.data && input.shape ? (type = 'ndarray') : null;
		name == 'Object' && input.data && input.width && input.height ? (type = 'object') : null;

		if (!type) {
			throw new Error('Could not determine the type of image input');
		}

		/* Turn provided data into an ImageData object */

		let image;

		if (type == 'element') {
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext('2d');
			if (context) {
				context.drawImage(input, 0, 0, width, height);
				image = context.getImageData(0, 0, width, height);
			} else {
				throw new Error('Failed to get 2D rendering context');
			}
		}

		if (type == 'node-canvas') {
			const context = input.getContext('2d');
			image = context.getImageData(0, 0, input.width, input.height);
		}

		if (type == 'node-canvas-image') {
			if (typeof this.#options.createCanvas !== 'function') {
				throw new Error(
					'Canvas is not supported in this environment, specify a createCanvas function in the options'
				);
			}

			const canvas = this.#options.createCanvas(width, height);
			const context = canvas.getContext('2d');
			context.drawImage(input, 0, 0, width, height);
			image = context.getImageData(0, 0, width, height);
		}

		if (type == 'node-read-image') {
			image = new ImageData(input.width, input.height);
			image.data.set(input.frames[0].data);
		}

		if (type == 'node-sharp') {
			image = new ImageData(input.info.width, input.info.height);
			image.data.set(input.data);
		}

		if (type == 'ndarray') {
			image = new ImageData(input.shape[0], input.shape[1]);
			image.data.set(input.data);
		}

		if (type == 'object') {
			image = new ImageData(input.width, input.height);
			image.data.set(input.data);
		}

		if (type == 'imagedata') {
			image = input;
		}

		if (!image) {
			throw new Error('Image could not be loaded');
		}

		/* Resize image */

		if (width !== image.width || height !== image.height) {
			image = resizeImageData(image, width, height, 'bilinear-interpolation');
		}

		/* Check if the image has the correct dimensions */

		if (width !== image.width || height !== image.height) {
			throw new Error('Image could not be resized');
		}

		/* Flatten the image and dither it */

		image = Flatten.flatten(image, [0xff, 0xff, 0xff]);

		switch (algorithm) {
			case 'threshold':
				image = Dither.threshold(image, threshold);
				break;
			case 'bayer':
				image = Dither.bayer(image, threshold);
				break;
			case 'floydsteinberg':
				image = Dither.floydsteinberg(image);
				break;
			case 'atkinson':
				image = Dither.atkinson(image);
				break;
		}

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		/* Set alignment */

		if (this.#composer.align !== 'left') {
			this.#composer.raw(this.#language.align(this.#composer.align));
		}

		/* Encode the image data */

		this.#composer.raw(this.#language.image(image, width, height, this.#options.imageMode));

		/* Reset alignment */

		if (this.#composer.align !== 'left') {
			this.#composer.raw(this.#language.align('left'));
		}

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		return this;
	}

	/**
	 * Cut paper
	 *
	 * @param  {string}          value   full or partial. When not specified a full cut will be assumed
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	cut(value?: 'full' | 'partial'): ReceiptPrinterEncoder {
		if (this.#options.embedded) {
			throw new Error('Cut is not supported in table cells or boxes');
		}

		for (let i = 0; i < this.#options.feedBeforeCut; i++) {
			this.#composer.flush({ forceNewline: true });
		}

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		this.#composer.raw(this.#language.cut(value));

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		return this;
	}

	/**
	 * Pulse
	 *
	 * @param  {number}          device  0 or 1 for on which pin the device is connected, default of 0
	 * @param  {number}          on      Time the pulse is on in milliseconds, default of 100
	 * @param  {number}          off     Time the pulse is off in milliseconds, default of 500
	 * @return {object}                  Return the object, for easy chaining commands
	 *
	 */
	pulse(device?: number, on?: number, off?: number): ReceiptPrinterEncoder {
		if (this.#options.embedded) {
			throw new Error('Pulse is not supported in table cells or boxes');
		}

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		this.#composer.raw(this.#language.pulse(device, on, off));

		this.#composer.flush({ forceFlush: true, ignoreAlignment: true });

		return this;
	}

	/**
	 * Add raw printer commands
	 *
	 * @param  {array}           data   raw bytes to be included
	 * @return {object}          Return the object, for easy chaining commands
	 *
	 */
	raw(data: number[]): ReceiptPrinterEncoder {
		this.#composer.raw(data);

		return this;
	}

	/**
	 * Internal function for encoding style changes
	 * @param  {string}          property  The property that needs to be changed
	 * @param  {boolean}         value     Is the property enabled or disabled
	 * @return {array}                     Return the encoded bytes
	 */
	#encodeStyle(property: StyleProperty | 'size', value: boolean | Size): Command {
		if (property === 'bold') {
			return this.#language.bold(value as boolean);
		}

		if (property === 'underline') {
			return this.#language.underline(value as boolean);
		}

		if (property === 'italic') {
			return this.#language.italic(value as boolean);
		}

		if (property === 'invert') {
			return this.#language.invert(value as boolean);
		}

		if (property === 'size') {
			return this.#language.size((value as Size).width, (value as Size).height);
		}

		return [];
	}

	/**
	 * Internal function for encoding text in the correct codepage
	 * @param  {string}          value  The text that needs to be encoded
	 * @param  {string}          codepage  The codepage that needs to be used
	 * @return {array}                   Return the encoded bytes
	 */
	#encodeText(value: string, codepage: string): number[] {
		if (codepage !== 'auto') {
			const fragment = CodepageEncoder.encode(value, codepage);

			if (this.#state.codepage != this.#codepageMapping[codepage]) {
				this.#state.codepage = this.#codepageMapping[codepage];

				return [...this.#language.codepage(this.#codepageMapping[codepage]), ...fragment];
			}

			return [...fragment];
		}

		const fragments = CodepageEncoder.autoEncode(value, this.#codepageCandidates);
		const buffer = [];

		for (const fragment of fragments) {
			this.#state.codepage = this.#codepageMapping[fragment.codepage];
			buffer.push(...this.#language.codepage(this.#codepageMapping[fragment.codepage]), ...fragment.bytes);
		}

		return buffer;
	}

	/**
	 * Get all the commands
	 *
	 * @return {array}         All the commands currently in the queue
	 */
	commands(): CommandQueue {
		/* Flush the printer line buffer if needed */

		if (this.#options.autoFlush && !this.#options.embedded) {
			this.#composer.raw(this.#language.flush());
		}

		const result: CommandQueue = [];

		const remaining = this.#composer.fetch({ forceFlush: true, ignoreAlignment: true });

		if (remaining.length) {
			this.#queue.push(remaining);
		}

		/* Process all lines in the queue */

		while (this.#queue.length) {
			const line = this.#queue.shift() as BufferItem[];
			const height = line
				.filter((i) => i.type === 'style' && i.property === 'size')
				.map((i) => i.value.height)
				.reduce((a, b) => Math.max(a, b), 1);

			if (this.#options.debug) {
				console.log(
					'|' +
						line
							.filter((i) => i.type === 'text')
							.map((i) => i.value)
							.join('') +
						'|',
					height
				);
			}

			result.push({
				commands: line,
				height: height
			});
		}

		if (this.#options.debug) {
			console.log('commands', result);
		}

		this.#reset();

		return result;
	}

	/**
	 * Encode all previous commands
	 *
	 * @return {Uint8Array}         Return the encoded bytes
	 */
	encode(): Uint8Array {
		const commands = this.commands();
		const result: CommandArray = [];

		for (const line of commands) {
			for (const item of line.commands) {
				if (item.type === 'raw') {
					result.push(item.value);
				}

				if (item.type === 'text') {
					result.push(this.#encodeText(item.value, item.codepage ?? 'auto'));
				}

				if (item.type === 'style') {
					result.push(this.#encodeStyle(item.property, item.value));
				}
			}

			if (this.#options.newline === '\n\r') {
				result.push([0x0a, 0x0d]);
			}

			if (this.#options.newline === '\n') {
				result.push([0x0a]);
			}
		}

		return Uint8Array.from(result.flat());
	}

	/**
	 * Throw an error
	 *
	 * @param  {string}          message  The error message
	 * @param  {string}          level    The error level, if level is strict,
	 *                                    an error will be thrown, if level is relaxed,
	 *                                    a warning will be logged
	 * @return {object}          Return the object, for easy chaining commands
	 */
	#error(message: string, level: ErrorLevel): ReceiptPrinterEncoder {
		if (level === 'strict' || this.#options.errors === 'strict') {
			throw new Error(message);
		}

		console.warn(message);

		return this;
	}

	/**
	 * Get all supported printer models
	 *
	 * @return {object}         An object with all supported printer models
	 */
	static get printerModels(): { id: string; name: string }[] {
		return Object.entries(printerDefinitions).map((i) => ({ id: i[0], name: i[1].vendor + ' ' + i[1].model }));
	}

	/**
	 * Get the current column width
	 *
	 * @return {number}         The column width in characters
	 */
	get columns(): number {
		return this.#composer.columns;
	}

	/**
	 * Get the current language
	 * @return {string}         The language that is currently used
	 */
	get language(): string {
		return this.#options.language;
	}

	/**
	 * Get the capabilities of the printer
	 * @return {object}         The capabilities of the printer
	 */
	get printerCapabilities(): PrinterCapabilities {
		return this.#printerCapabilities;
	}
}

export default ReceiptPrinterEncoder;
