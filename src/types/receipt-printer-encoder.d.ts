import { BufferItem } from 'src/line-composer';
import codepageMappings from '../../generated/mapping';
import { ImageMode } from './printers';

export type PrinterModel = keyof typeof import('../../generated/printers').default;
export type PrinterLanguage = keyof typeof codepageMappings;
export type CodepageName = string;
export type CodepageValue = number;
export type CodepageMappingIdentifier = Exclude<
	{
		[K in keyof typeof codepageMappings]: keyof (typeof codepageMappings)[K];
	}[keyof typeof codepageMappings],
	undefined
>;
export type CodepageMapping = Record<CodepageName, CodepageValue>;
export type CodepageDefinitions = Record<PrinterLanguage, Record<CodepageMappingIdentifier, (CodepageName | null)[]>>;

export type ErrorLevel = 'relaxed' | 'strict';

export interface BaseEncoderOptions {}

export interface EncoderConfiguration {
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

export type CommandQueue = { commands: BufferItem[]; height: number }[];

export interface EncoderOptions extends Partial<EncoderConfiguration> {}
