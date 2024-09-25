import fs from 'node:fs';
import path from 'node:path';
import { stringify } from 'javascript-stringify';

// Add this function at the beginning of the file
function ensureDirectoryExistence(filePath: string) {
	const dirname = path.dirname(filePath);
	if (fs.existsSync(dirname)) {
		return true;
	}
	ensureDirectoryExistence(dirname);
	fs.mkdirSync(dirname);
}

function generatePrinters() {
	let output = '';
	output += `const printerDefinitions = {\n`;

	try {
		let files = fs.readdirSync('data/printers');

		for (let file of files) {
			let data = fs.readFileSync('data/printers/' + file, 'utf8');
			let printer;

			let definition = {};

			try {
				definition = JSON.parse(data);
			} catch (err) {
				console.log('Error parsing file: ' + file);
				console.log(data);
				throw err;
			}

			let name = file.replace(/\.json$/, '');

			output += `\t'${name}': ${stringify(definition)},\n`;
		}
	} catch (err) {
		console.error(err);
	}

	output += '};\n\n';
	output += 'export default printerDefinitions;\n';

	const outputPath = 'generated/printers.ts';
	ensureDirectoryExistence(outputPath);
	fs.writeFileSync(outputPath, output, 'utf8');
}

function generateMappings() {
	const codepageMappings: { [key: string]: any } = {};

	try {
		codepageMappings['esc-pos'] = {};

		let files = fs.readdirSync('data/mappings/esc-pos');

		for (let file of files) {
			let data = fs.readFileSync('data/mappings/esc-pos/' + file, 'utf8');
			let lines = data.split('\n');

			let name = file.replace(/\.txt$/, '').replace(/-legacy/g, '/legacy');
			let list = new Map<number, string>();

			for (let line of lines) {
				if (line.length > 1 && line.charAt(0) != '#') {
					let [skip, key, value] = line.split(/\t/);
					list.set(parseInt(key, 16), value.trim());
				}
			}

			let mapping = new Array(Math.max(...list.keys()) + 1).fill(null).map((_, idx) => list.get(idx) || null);

			codepageMappings['esc-pos'][name] = mapping;
		}

		// Adding 'zijang' as an alias to 'pos-5890'
		if (codepageMappings['esc-pos']['pos-5890']) {
			codepageMappings['esc-pos']['zijang'] = codepageMappings['esc-pos']['pos-5890'];
		} else {
			console.warn("Alias 'zijang' could not be created because 'pos-5890' mapping does not exist.");
		}
	} catch (err) {
		console.error(err);
	}

	try {
		codepageMappings['star-prnt'] = {};

		let files = fs.readdirSync('data/mappings/star-prnt');

		for (let file of files) {
			let data = fs.readFileSync('data/mappings/star-prnt/' + file, 'utf8');
			let lines = data.split('\n');

			let name = file.replace(/\.txt$/, '').replace(/-legacy/g, '/legacy');
			let list = new Map<number, string>();

			for (let line of lines) {
				if (line.length > 1 && line.charAt(0) != '#') {
					let [skip, key, value] = line.split(/\t/);
					list.set(parseInt(key, 16), value.trim());
				}
			}

			let mapping = new Array(Math.max(...list.keys()) + 1).fill(null).map((_, idx) => list.get(idx) || null);

			codepageMappings['star-prnt'][name] = mapping;
		}

		// Adding 'star-line' as an alias to 'star-prnt'
		if (codepageMappings['star-prnt']) {
			codepageMappings['star-line'] = codepageMappings['star-prnt'];
		} else {
			console.warn("Alias 'star-line' could not be created because 'star-prnt' mapping does not exist.");
		}
	} catch (err) {
		console.error(err);
	}

	const mappingString = stringify(codepageMappings, null, 2);

	const output = `const codepageMappings = ${mappingString};\n\nexport default codepageMappings;\n`;

	const outputPath = 'generated/mapping.ts';
	ensureDirectoryExistence(outputPath);
	fs.writeFileSync(outputPath, output, 'utf8');
}

generateMappings();
generatePrinters();
