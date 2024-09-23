const printerDefinitions = {
	'bixolon-srp350': {
		vendor: 'Bixolon',
		model: 'SRP-350',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'bixolon/legacy',
			fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'bixolon-srp350iii': {
		vendor: 'Bixolon',
		model: 'SRP-350III',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'bixolon',
			fonts: {
				A: { size: '12x24', columns: 42 },
				B: { size: '9x17', columns: 56 },
				C: { size: '9x24', columns: 56 }
			}
		},
		features: { cutter: { feed: 4 } }
	},
	'citizen-ct-s310ii': {
		vendor: 'Citizen',
		model: 'CT-S310II',
		media: { dpi: 203, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'citizen',
			fonts: {
				A: { size: '12x24', columns: 48 },
				B: { size: '9x24', columns: 64 },
				C: { size: '8x16', columns: 72 }
			}
		},
		features: { cutter: { feed: 3 } }
	},
	'epson-tm-p20ii': {
		vendor: 'Epson',
		model: 'TM-P20II',
		media: { dpi: 203, width: 58 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'epson',
			fonts: {
				A: { size: '12x24', columns: 32 },
				B: { size: '9x24', columns: 42 },
				C: { size: '9x17', columns: 42 },
				D: { size: '10x24', columns: 38 },
				E: { size: '8x16', columns: 48 }
			}
		},
		features: { images: { mode: 'raster' }, cutter: { feed: 3 } }
	},
	'epson-tm-t20iii': {
		vendor: 'Epson',
		model: 'TM-T20III',
		interfaces: { usb: { productName: 'TM-T20III' } },
		media: { dpi: 203, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'epson',
			fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x17', columns: 64 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'epson-tm-t70': {
		vendor: 'Epson',
		model: 'TM-T70',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'epson/legacy',
			fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } }
		},
		features: { images: { mode: 'raster' }, cutter: { feed: 4 } }
	},
	'epson-tm-t70ii': {
		vendor: 'Epson',
		model: 'TM-T70II',
		interface: { usb: { productName: 'TM-T70II' } },
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'epson',
			fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } }
		},
		features: { images: { mode: 'raster' }, cutter: { feed: 4 } }
	},
	'epson-tm-t88ii': {
		vendor: 'Epson',
		model: 'TM-T88II',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'epson/legacy',
			fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'epson-tm-t88iii': {
		vendor: 'Epson',
		model: 'TM-T88III',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'epson/legacy',
			fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'epson-tm-t88iv': {
		vendor: 'Epson',
		model: 'TM-T88IV',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'epson/legacy',
			fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'epson-tm-t88v': {
		vendor: 'Epson',
		model: 'TM-T88V',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'epson',
			fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'epson-tm-t88vi': {
		vendor: 'Epson',
		model: 'TM-T88VI',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'epson',
			fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'epson-tm-t88vii': {
		vendor: 'Epson',
		model: 'TM-T88VII',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'epson',
			fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'fujitsu-fp1000': {
		vendor: 'Fujitsu',
		model: 'FP-1000',
		media: { dpi: 203, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'fujitsu',
			fonts: {
				A: { size: '12x24', columns: 48 },
				B: { size: '9x24', columns: 56 },
				C: { size: '8x16', columns: 64 }
			}
		},
		features: { cutter: { feed: 4 } }
	},
	'hp-a779': {
		vendor: 'HP',
		model: 'A779',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'hp',
			newline: '\n',
			fonts: { A: { size: '12x24', columns: 44 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'metapace-t1': {
		vendor: 'Metapace',
		model: 'T-1',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'metapace',
			fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'mpt-ii': {
		vendor: '',
		model: 'MPT-II',
		media: { dpi: 180, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'mpt',
			fonts: {
				A: { size: '12x24', columns: 48 },
				B: { size: '9x17', columns: 64 },
				C: { size: '0x0', columns: 64 }
			}
		}
	},
	'pos-5890': {
		vendor: '',
		model: 'POS-5890',
		media: { dpi: 203, width: 58 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'pos-5890',
			fonts: { A: { size: '12x24', columns: 32 }, B: { size: '9x17', columns: 42 } }
		},
		features: { images: { mode: 'raster' }, cutter: { feed: 1 } }
	},
	'pos-8360': {
		vendor: '',
		model: 'POS-8360',
		media: { dpi: 203, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'pos-8360',
			fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x17', columns: 64 } }
		},
		features: { images: { mode: 'raster' }, cutter: { feed: 4 } }
	},
	'star-mc-print2': {
		vendor: 'Star',
		model: 'mC-Print2',
		interfaces: { usb: { productName: 'mC-Print2' } },
		media: { dpi: 203, width: 58 },
		capabilities: {
			language: 'star-prnt',
			codepages: 'star',
			fonts: { A: { size: '12x24', columns: 32 }, B: { size: '9x24', columns: 42 } }
		},
		features: { cutter: { feed: 3 } }
	},
	'star-mpop': {
		vendor: 'Star',
		model: 'mPOP',
		interfaces: { usb: { productName: 'mPOP' } },
		media: { dpi: 203, width: 58 },
		capabilities: {
			language: 'star-prnt',
			codepages: 'star',
			fonts: { A: { size: '12x24', columns: 32 }, B: { size: '9x24', columns: 42 } }
		},
		features: { cutter: { feed: 3 } }
	},
	'star-sm-l200': {
		vendor: 'Star',
		model: 'SM-L200',
		media: { dpi: 203, width: 58 },
		capabilities: {
			language: 'star-prnt',
			codepages: 'star',
			fonts: {
				A: { size: '12x24', columns: 32 },
				B: { size: '9x24', columns: 42 },
				C: { size: '9x17', columns: 42 }
			}
		}
	},
	'star-tsp100iv': {
		vendor: 'Star',
		model: 'TSP100IV',
		media: { dpi: 203, width: 80 },
		capabilities: {
			language: 'star-prnt',
			codepages: 'star',
			fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x24', columns: 64 } }
		},
		features: { cutter: { feed: 3 } }
	},
	'star-tsp650ii': {
		vendor: 'Star',
		model: 'TSP650II',
		media: { dpi: 203, width: 80 },
		capabilities: {
			language: 'star-line',
			codepages: 'star',
			fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x24', columns: 64 } }
		},
		features: { cutter: { feed: 3 } }
	},
	'xprinter-xp-n160ii': {
		vendor: 'Xprinter',
		model: 'XP-N160II',
		interfaces: { usb: { productName: 'Printer-80\u0000' } },
		media: { dpi: 203, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'xprinter',
			fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x17', columns: 64 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'xprinter-xp-t80q': {
		vendor: 'Xprinter',
		model: 'XP-T80Q',
		media: { dpi: 203, width: 80 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'xprinter',
			fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x17', columns: 64 } }
		},
		features: { cutter: { feed: 4 } }
	},
	'youku-58t': {
		vendor: 'Youku',
		model: '58T',
		media: { dpi: 203, width: 58 },
		capabilities: {
			language: 'esc-pos',
			codepages: 'youku',
			fonts: { A: { size: '12x24', columns: 32 }, B: { size: '9x24', columns: 42 } }
		}
	}
};

export default printerDefinitions;
