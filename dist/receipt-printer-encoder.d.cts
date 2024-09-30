declare const printerDefinitions: {
    'bixolon-srp350': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: never[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'bixolon-srp350iii': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
                C: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'citizen-ct-s310ii': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
                C: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'epson-tm-p20ii': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
                C: {
                    size: string;
                    columns: number;
                };
                D: {
                    size: string;
                    columns: number;
                };
                E: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            images: {
                mode: string;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'epson-tm-t20iii': {
        vendor: string;
        model: string;
        interfaces: {
            usb: {
                productName: string;
            };
        };
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'epson-tm-t70': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            images: {
                mode: string;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'epson-tm-t70ii': {
        vendor: string;
        model: string;
        interface: {
            usb: {
                productName: string;
            };
        };
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            images: {
                mode: string;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'epson-tm-t88ii': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'epson-tm-t88iii': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'epson-tm-t88iv': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'epson-tm-t88v': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'epson-tm-t88vi': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'epson-tm-t88vii': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'fujitsu-fp1000': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
                C: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'hp-a779': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            newline: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
                fallback: {
                    type: string;
                    symbology: number;
                };
            };
            cutter: {
                feed: number;
            };
        };
    };
    'metapace-t1': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: never[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'mpt-ii': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
                C: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: never[];
            };
            pdf417: {
                supported: boolean;
            };
        };
    };
    'pos-5890': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            images: {
                mode: string;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'pos-8360': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            images: {
                mode: string;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'star-mc-print2': {
        vendor: string;
        model: string;
        interfaces: {
            usb: {
                productName: string;
            };
        };
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'star-mpop': {
        vendor: string;
        model: string;
        interfaces: {
            usb: {
                productName: string;
            };
        };
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'star-sm-l200': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
                C: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
        };
    };
    'star-tsp100iii': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'star-tsp100iv': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'star-tsp650': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: never[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'star-tsp650ii': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'xprinter-xp-n160ii': {
        vendor: string;
        model: string;
        interfaces: {
            usb: {
                productName: string;
            };
        };
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'xprinter-xp-t80q': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
            cutter: {
                feed: number;
            };
        };
    };
    'youku-58t': {
        vendor: string;
        model: string;
        media: {
            dpi: number;
            width: number;
        };
        capabilities: {
            language: string;
            codepages: string;
            fonts: {
                A: {
                    size: string;
                    columns: number;
                };
                B: {
                    size: string;
                    columns: number;
                };
            };
            barcodes: {
                supported: boolean;
                symbologies: string[];
            };
            qrcode: {
                supported: boolean;
                models: string[];
            };
            pdf417: {
                supported: boolean;
            };
        };
    };
};

type TextItem = {
    type: 'text';
    value: string;
    codepage: string | null;
};
type SpaceItem = {
    type: 'space';
    size: number;
};
type RawItem = {
    type: 'raw';
    value: Command;
};
type AlignItem = {
    type: 'align';
    value: TextAlign;
};
type StyleItem = {
    type: 'style';
    property: StyleProperty;
    value: boolean;
} | {
    type: 'style';
    property: 'size';
    value: Size;
};
type EmptyItem = {
    type: 'empty';
};
type BufferItem = TextItem | SpaceItem | RawItem | AlignItem | StyleItem | EmptyItem;

declare const codepageMappings: {
    'esc-pos': {
        'bixolon/legacy': (string | null)[];
        bixolon: (string | null)[];
        citizen: (string | null)[];
        'epson/legacy': (string | null)[];
        epson: (string | null)[];
        fujitsu: (string | null)[];
        hp: string[];
        metapace: (string | null)[];
        mpt: (string | null)[];
        'pos-5890': (string | null)[];
        'pos-8360': (string | null)[];
        star: (string | null)[];
        xprinter: (string | null)[];
        youku: (string | null)[];
        zijang: (string | null)[];
    };
    'star-prnt': {
        star: (string | null)[];
    };
    'star-line': {
        star: (string | null)[];
    };
};

type PrinterModel = keyof typeof printerDefinitions;
type PrinterLanguage = keyof typeof codepageMappings;
type CodepageName = string;
type CodepageValue = number;
type CodepageMappingIdentifier = Exclude<
	{
		[K in keyof typeof codepageMappings]: keyof (typeof codepageMappings)[K];
	}[keyof typeof codepageMappings],
	undefined
>;
type CodepageMapping = Record<CodepageName, CodepageValue>;

type ErrorLevel = 'relaxed' | 'strict';

interface EncoderConfiguration {
	columns: number;
	language: PrinterLanguage;
	printerModel?: PrinterModel;
	codepageMapping: CodepageMappingIdentifier | CodepageMapping;
	codepageCandidates?: CodepageName[] | null;
	width?: number;
	height?: number;
	imageMode: ImageMode;
	feedBeforeCut: number;
	newline: string;
	debug: boolean;
	embedded: boolean;
	createCanvas?: ((width: number, height: number) => any) | null;
	autoFlush?: boolean;
	errors?: ErrorLevel;
}

type CommandQueue = { commands: BufferItem[]; height: number }[];

interface EncoderOptions extends Partial<EncoderConfiguration> {}

type TextAlign = 'left' | 'center' | 'right';
type VerticalAlign = 'top' | 'bottom';
type StyleProperty = 'bold' | 'italic' | 'underline' | 'invert';
type LineStyle = 'single' | 'double' | 'none';
type Size = { width: number; height: number };
type ImageMode = 'column' | 'raster';

interface FontDefinition {
	size: string;
	columns: number;
}

interface PrinterCapabilities {
	language: PrinterLanguage;
	codepages: CodepageMappingIdentifier;
	newline?: string;
	fonts: {
		A: FontDefinition;
		B?: FontDefinition;
		C?: FontDefinition;
		D?: FontDefinition;
		E?: FontDefinition;
	};
	barcodes: {
		supported: boolean;
		symbologies: string[];
	};
	qrcode: {
		supported: boolean;
		models: string[];
	};
	pdf417: {
		supported: boolean;
		fallback?: {
			type: string;
			symbology: number;
		};
	};
	images?: {
		mode: ImageMode;
	};
	cutter?: {
		feed: number;
	};
}

interface Pdf417Options {
	columns: number;
	rows: number;
	width: number;
	height: number;
	errorlevel: number;
	truncated: boolean;
}

type QrCodeModel = 1 | 2;
type QrCodeSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type QrCodeErrorLevel = 'l' | 'm' | 'q' | 'h';
interface QrCodeOptions {
	model: QrCodeModel;
	size: QrCodeSize;
	errorlevel: QrCodeErrorLevel;
}

interface BarcodeOptions {
	width: number;
	height: number;
	text: boolean;
}

interface BoxOptions {
	style: LineStyle;
	align?: TextAlign;
	width: number;
	marginLeft: number;
	marginRight: number;
	paddingLeft: number;
	paddingRight: number;
}

type Command = number[];

/**
 * Create a byte stream based on commands for receipt printers
 */
declare class ReceiptPrinterEncoder {
    #private;
    /**
     * Create a new object
     *
     * @param  {object}   options   Object containing configuration options
     */
    constructor(options?: EncoderOptions);
    /**
     * Initialize the printer
     *
     * @return {object}          Return the object, for easy chaining commands
     *
     */
    initialize(): ReceiptPrinterEncoder;
    /**
     * Change the code page
     *
     * @param  {string}   codepage  The codepage that we set the printer to
     * @return {object}             Return the object, for easy chaining commands
     *
     */
    codepage(codepage: string): ReceiptPrinterEncoder;
    /**
     * Print text
     *
     * @param  {string}   value  Text that needs to be printed
     * @return {object}          Return the object, for easy chaining commands
     *
     */
    text(value: string): ReceiptPrinterEncoder;
    /**
     * Print a newline
     *
     * @param  {number|string}   value  The number of newlines that need to be printed, defaults to 1
     * @return {object}                 Return the object, for easy chaining commands
     *
     */
    newline(value?: number | string): ReceiptPrinterEncoder;
    /**
     * Print text, followed by a newline
     *
     * @param  {string}   value  Text that needs to be printed
     * @return {object}          Return the object, for easy chaining commands
     *
     */
    line(value: string): ReceiptPrinterEncoder;
    /**
     * Underline text
     *
     * @param  {boolean|number}   value  true to turn on underline, false to turn off, or 2 for double underline
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    underline(value?: boolean): ReceiptPrinterEncoder;
    /**
     * Italic text
     *
     * @param  {boolean}          value  true to turn on italic, false to turn off
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    italic(value?: boolean): ReceiptPrinterEncoder;
    /**
     * Bold text
     *
     * @param  {boolean}          value  true to turn on bold, false to turn off
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    bold(value?: boolean): ReceiptPrinterEncoder;
    /**
     * Invert text
     *
     * @param  {boolean}          value  true to turn on white text on black, false to turn off
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    invert(value?: boolean): ReceiptPrinterEncoder;
    /**
     * Change width of text
     *
     * @param  {number}          width    The width of the text, 1 - 8
     * @return {object}                   Return the object, for easy chaining commands
     *
     */
    width(width?: number): ReceiptPrinterEncoder;
    /**
     * Change height of text
     *
     * @param  {number}          height  The height of the text, 1 - 8
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    height(height?: number): ReceiptPrinterEncoder;
    /**
     * Change text size
     *
     * @param  {Number|string}   width   The width of the text, 1 - 8
     * @param  {Number}          height  The height of the text, 1 - 8
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    size(width?: number | string, height?: number): ReceiptPrinterEncoder;
    /**
     * Choose different font
     *
     * @param  {string}          value   'A', 'B' or others
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    font(value: string): ReceiptPrinterEncoder;
    /**
     * Change text alignment
     *
     * @param  {string}          value   left, center or right
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    align(value: TextAlign): ReceiptPrinterEncoder;
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
    table(columns: {
        width: number;
        align: TextAlign;
        verticalAlign?: VerticalAlign;
        marginLeft?: number;
        marginRight?: number;
    }[], data: (string | ((encoder: ReceiptPrinterEncoder) => void))[][]): ReceiptPrinterEncoder;
    /**
     * Insert a horizontal rule
     *
     * @param  {object}          options  And object with the following properties:
     *                                    - style: The style of the line, either single or double
     *                                    - width: The width of the line, by default the width of the paper
     * @return {object}                   Return the object, for easy chaining commands
     *
     */
    rule(options?: {
        style: string;
        width: number;
    }): ReceiptPrinterEncoder;
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
    box(options: BoxOptions, contents: string | ((encoder: ReceiptPrinterEncoder) => void)): ReceiptPrinterEncoder;
    /**
     * Barcode
     *
     * @param  {string}           value  the value of the barcode
     * @param  {string|number}           symbology  the type of the barcode
     * @param  {number|object}    height  Either the configuration object, or backwards compatible height of the barcode
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    barcode(value: string, symbology: string | number, height?: number | BarcodeOptions): ReceiptPrinterEncoder;
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
    qrcode(value: string, model?: QrCodeModel | QrCodeOptions, size?: QrCodeSize, errorlevel?: QrCodeErrorLevel): ReceiptPrinterEncoder;
    /**
     * PDF417 code
     *
     * @param  {string}           value     The value of the qr code
     * @param  {object}           options   Configuration object
     * @return {object}                     Return the object, for easy chaining commands
     *
     */
    pdf417(value: string, options: Pdf417Options): ReceiptPrinterEncoder;
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
    image(input: any, width: number, height: number, algorithm?: string, threshold?: number): ReceiptPrinterEncoder;
    /**
     * Cut paper
     *
     * @param  {string}          value   full or partial. When not specified a full cut will be assumed
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    cut(value?: 'full' | 'partial'): ReceiptPrinterEncoder;
    /**
     * Pulse
     *
     * @param  {number}          device  0 or 1 for on which pin the device is connected, default of 0
     * @param  {number}          on      Time the pulse is on in milliseconds, default of 100
     * @param  {number}          off     Time the pulse is off in milliseconds, default of 500
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    pulse(device?: number, on?: number, off?: number): ReceiptPrinterEncoder;
    /**
     * Add raw printer commands
     *
     * @param  {array}           data   raw bytes to be included
     * @return {object}          Return the object, for easy chaining commands
     *
     */
    raw(data: number[]): ReceiptPrinterEncoder;
    /**
     * Get all the commands
     *
     * @return {array}         All the commands currently in the queue
     */
    commands(): CommandQueue;
    /**
     * Encode all previous commands
     *
     * @return {Uint8Array}         Return the encoded bytes
     */
    encode(): Uint8Array;
    /**
     * Get all supported printer models
     *
     * @return {object}         An object with all supported printer models
     */
    static get printerModels(): {
        id: string;
        name: string;
    }[];
    /**
     * Get the current column width
     *
     * @return {number}         The column width in characters
     */
    get columns(): number;
    /**
     * Get the current language
     * @return {string}         The language that is currently used
     */
    get language(): string;
    /**
     * Get the capabilities of the printer
     * @return {object}         The capabilities of the printer
     */
    get printerCapabilities(): PrinterCapabilities;
}

export { ReceiptPrinterEncoder as default };
