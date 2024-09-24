'use strict';

var Dither = require('canvas-dither');
var Flatten = require('canvas-flatten');
var CodepageEncoder = require('@point-of-sale/codepage-encoder');
var ImageData = require('@canvas/image-data');
var resizeImageData = require('resize-image-data');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class LanguageEscPos {
    /**
     * Initialize the printer
     * @returns {Array}         Array of bytes to send to the printer
     */
    initialize() {
        return [
            /* Initialize printer */
            0x1b, 0x40,
            /* Cancel Kanji mode */
            0x1c, 0x2e,
            /* Set the font to A */
            0x1b, 0x4d, 0x00
        ];
    }
    /**
     * Change the font
     * @param {string} type     Font type ('A', 'B', or more)
     * @returns {Array}         Array of bytes to send to the printer
     */
    font(type) {
        let value = type.charCodeAt(0) - 0x41;
        return [0x1b, 0x4d, value];
    }
    /**
     * Change the alignment
     * @param {string} value    Alignment value ('left', 'center', 'right')
     * @returns {Array}         Array of bytes to send to the printer
     */
    align(value) {
        let align;
        switch (value) {
            case 'center':
                align = 0x01;
                break;
            case 'right':
                align = 0x02;
                break;
            case 'left':
            default:
                align = 0x00;
        }
        return [0x1b, 0x61, align];
    }
    /**
     * Generate a barcode
     * @param {string} value        Value to encode
     * @param {string} symbology    Barcode symbology
     * @param {object} options      Configuration object
     * @returns {Array}             Array of bytes to send to the printer
     */
    barcode(value, symbology, options) {
        let result = [];
        const symbologies = {
            'upca': 0x00,
            'upce': 0x01,
            'ean13': 0x02,
            'ean8': 0x03,
            'code39': 0x04,
            'coda39': 0x04 /* typo, leave here for backwards compatibility */,
            'itf': 0x05,
            'interleaved-2-of-5': 0x05,
            'nw-7': 0x06,
            'codabar': 0x06,
            'code93': 0x48,
            'code128': 0x49,
            'gs1-128': 0x48,
            'gs1-databar-omni': 0x4b,
            'gs1-databar-truncated': 0x4c,
            'gs1-databar-limited': 0x4d,
            'gs1-databar-expanded': 0x4e,
            'code128-auto': 0x4f
        };
        if (typeof symbologies[symbology] === 'undefined') {
            throw new Error('Symbology not supported by printer');
        }
        /* Calculate segment width */
        if (options.width < 1 || options.width > 3) {
            throw new Error('Width must be between 1 and 3');
        }
        let width = options.width + 1;
        if (symbology === 'itf') {
            width = options.width * 2;
        }
        if (symbology === 'gs1-128' ||
            symbology == 'gs1-databar-omni' ||
            symbology == 'gs1-databar-truncated' ||
            symbology == 'gs1-databar-limited' ||
            symbology == 'gs1-databar-expanded') {
            width = options.width;
        }
        /* Set barcode options */
        result.push(0x1d, 0x68, options.height, 0x1d, 0x77, width, 0x1d, 0x48, options.text ? 0x02 : 0x00);
        /* Encode barcode */
        if (symbology == 'code128' && !value.startsWith('{')) {
            value = '{B' + value;
        }
        if (symbology == 'gs1-128') {
            console.log('gs1-128', value, value.replace(/[\(\)\*]/g, ''));
            value = value.replace(/[\(\)\*]/g, '');
        }
        const bytes = CodepageEncoder.encode(value, 'ascii');
        if (symbologies[symbology] > 0x40) {
            /* Function B symbologies */
            result.push(0x1d, 0x6b, symbologies[symbology], bytes.length, ...bytes);
        }
        else {
            /* Function A symbologies */
            result.push(0x1d, 0x6b, symbologies[symbology], ...bytes, 0x00);
        }
        return result;
    }
    /**
     * Generate a QR code
     * @param {string} value        Value to encode
     * @param {object} options      Configuration object
     * @returns {Array}             Array of bytes to send to the printer
     */
    qrcode(value, options) {
        let result = [];
        /* Model */
        const models = {
            1: 0x31,
            2: 0x32
        };
        if (options.model in models) {
            result.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, models[options.model], 0x00);
        }
        else {
            throw new Error('Model must be 1 or 2');
        }
        /* Size */
        if (typeof options.size !== 'number') {
            throw new Error('Size must be a number');
        }
        if (options.size < 1 || options.size > 8) {
            throw new Error('Size must be between 1 and 8');
        }
        result.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, options.size);
        /* Error level */
        const errorlevels = {
            l: 0x30,
            m: 0x31,
            q: 0x32,
            h: 0x33
        };
        if (options.errorlevel in errorlevels) {
            result.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, errorlevels[options.errorlevel]);
        }
        else {
            throw new Error('Error level must be l, m, q or h');
        }
        /* Data */
        const bytes = CodepageEncoder.encode(value, 'iso8859-1');
        const length = bytes.length + 3;
        result.push(0x1d, 0x28, 0x6b, length & 0xff, (length >> 8) & 0xff, 0x31, 0x50, 0x30, ...bytes);
        /* Print QR code */
        result.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
        return result;
    }
    /**
     * Generate a PDF417 code
     * @param {string} value        Value to encode
     * @param {object} options      Configuration object
     * @returns {Array}             Array of bytes to send to the printer
     */
    pdf417(value, options) {
        let result = [];
        /* Columns */
        if (typeof options.columns !== 'number') {
            throw new Error('Columns must be a number');
        }
        if (options.columns !== 0 && (options.columns < 1 || options.columns > 30)) {
            throw new Error('Columns must be 0, or between 1 and 30');
        }
        result.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x41, options.columns);
        /* Rows */
        if (typeof options.rows !== 'number') {
            throw new Error('Rows must be a number');
        }
        if (options.rows !== 0 && (options.rows < 3 || options.rows > 90)) {
            throw new Error('Rows must be 0, or between 3 and 90');
        }
        result.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x42, options.rows);
        /* Width */
        if (typeof options.width !== 'number') {
            throw new Error('Width must be a number');
        }
        if (options.width < 2 || options.width > 8) {
            throw new Error('Width must be between 2 and 8');
        }
        result.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x43, options.width);
        /* Height */
        if (typeof options.height !== 'number') {
            throw new Error('Height must be a number');
        }
        if (options.height < 2 || options.height > 8) {
            throw new Error('Height must be between 2 and 8');
        }
        result.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x44, options.height);
        /* Error level */
        if (typeof options.errorlevel !== 'number') {
            throw new Error('Errorlevel must be a number');
        }
        if (options.errorlevel < 0 || options.errorlevel > 8) {
            throw new Error('Errorlevel must be between 0 and 8');
        }
        result.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x30, 0x45, 0x30, options.errorlevel + 0x30);
        /* Model: standard or truncated */
        result.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x46, options.truncated ? 0x01 : 0x00);
        /* Data */
        const bytes = CodepageEncoder.encode(value, 'ascii');
        const length = bytes.length + 3;
        result.push(0x1d, 0x28, 0x6b, length & 0xff, (length >> 8) & 0xff, 0x30, 0x50, 0x30, ...bytes);
        /* Print PDF417 code */
        result.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x30, 0x51, 0x30);
        return result;
    }
    /**
     * Encode an image
     * @param {ImageData} image     ImageData object
     * @param {number} width        Width of the image
     * @param {number} height       Height of the image
     * @param {string} mode         Image encoding mode ('column' or 'raster')
     * @returns {Array}             Array of bytes to send to the printer
     */
    image(image, width, height, mode) {
        let result = [];
        const getPixel = (x, y) => x < width && y < height ? (image.data[(width * y + x) * 4] > 0 ? 0 : 1) : 0;
        const getColumnData = (width, height) => {
            const data = [];
            for (let s = 0; s < Math.ceil(height / 24); s++) {
                const bytes = new Uint8Array(width * 3);
                for (let x = 0; x < width; x++) {
                    for (let c = 0; c < 3; c++) {
                        for (let b = 0; b < 8; b++) {
                            bytes[x * 3 + c] |= getPixel(x, s * 24 + b + 8 * c) << (7 - b);
                        }
                    }
                }
                data.push(bytes);
            }
            return data;
        };
        const getRowData = (width, height) => {
            const bytes = new Uint8Array((width * height) >> 3);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x = x + 8) {
                    for (let b = 0; b < 8; b++) {
                        bytes[y * (width >> 3) + (x >> 3)] |= getPixel(x + b, y) << (7 - b);
                    }
                }
            }
            return bytes;
        };
        /* Encode images with ESC * */
        if (mode == 'column') {
            result.push(0x1b, 0x33, 0x24);
            getColumnData(width, height).forEach((bytes) => {
                result.push(0x1b, 0x2a, 0x21, width & 0xff, (width >> 8) & 0xff, ...bytes, 0x0a);
            });
            result.push(0x1b, 0x32);
        }
        /* Encode images with GS v */
        if (mode == 'raster') {
            result.push(0x1d, 0x76, 0x30, 0x00, (width >> 3) & 0xff, ((width >> 3) >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff, ...getRowData(width, height));
        }
        return result;
    }
    /**
     * Cut the paper
     * @param {string} value    Cut type ('full' or 'partial')
     * @returns {Array}         Array of bytes to send to the printer
     */
    cut(value) {
        let data = 0x00;
        if (value == 'partial') {
            data = 0x01;
        }
        return [0x1d, 0x56, data];
    }
    /**
     * Send a pulse to the cash drawer
     * @param {number} device   Device number
     * @param {number} on       Pulse ON time
     * @param {number} off      Pulse OFF time
     * @returns {Array}         Array of bytes to send to the printer
     */
    pulse(device, on, off) {
        if (typeof device === 'undefined') {
            device = 0;
        }
        if (typeof on === 'undefined') {
            on = 100;
        }
        if (typeof off === 'undefined') {
            off = 500;
        }
        on = Math.min(500, Math.round(on / 2));
        off = Math.min(500, Math.round(off / 2));
        return [0x1b, 0x70, device ? 1 : 0, on & 0xff, off & 0xff];
    }
    /**
     * Enable or disable bold text
     * @param {boolean} value   Enable or disable bold text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    bold(value) {
        let data = 0x00;
        if (value) {
            data = 0x01;
        }
        return [0x1b, 0x45, data];
    }
    /**
     * Enable or disable underline text
     * @param {boolean} value   Enable or disable underline text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    underline(value) {
        let data = 0x00;
        if (value) {
            data = 0x01;
        }
        return [0x1b, 0x2d, data];
    }
    /**
     * Enable or disable italic text
     * @param {boolean} value   Enable or disable italic text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    italic(value) {
        let data = 0x00;
        if (value) {
            data = 0x01;
        }
        return [0x1b, 0x34, data];
    }
    /**
     * Enable or disable inverted text
     * @param {boolean} value   Enable or disable inverted text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    invert(value) {
        let data = 0x00;
        if (value) {
            data = 0x01;
        }
        return [0x1d, 0x42, data];
    }
    /**
     * Change text size
     * @param {number} width    Width of the text (1-8)
     * @param {number} height   Height of the text (1-8)
     * @returns {Array}         Array of bytes to send to the printer
     */
    size(width, height) {
        return [0x1d, 0x21, (height - 1) | ((width - 1) << 4)];
    }
    /**
     * Change the codepage
     * @param {number} value    Codepage value
     * @returns {Array}         Array of bytes to send to the printer
     */
    codepage(value) {
        return [0x1b, 0x74, value];
    }
    /**
     * Flush the printers line buffer
     * @returns {Array}         Array of bytes to send to the printer
     */
    flush() {
        return [];
    }
}

class LanguageStarPrnt {
    /**
     * Initialize the printer
     * @returns {Array}         Array of bytes to send to the printer
     */
    initialize() {
        return [
            /* Initialize printer */
            0x1b, 0x40, 0x18
        ];
    }
    /**
     * Change the font
     * @param {string} type     Font type ('A', 'B' or 'C')
     * @returns {Array}         Array of bytes to send to the printer
     */
    font(type) {
        let value;
        switch (type) {
            case 'B':
                value = 0x01;
                break;
            case 'C':
                value = 0x02;
                break;
            case 'A':
            default:
                value = 0x00;
        }
        return [0x1b, 0x1e, 0x46, value];
    }
    /**
     * Change the alignment
     * @param {string} value    Alignment value ('left', 'center', 'right')
     * @returns {Array}         Array of bytes to send to the printer
     */
    align(value) {
        let align = 0x00;
        if (value === 'center') {
            align = 0x01;
        }
        else if (value === 'right') {
            align = 0x02;
        }
        return [0x1b, 0x1d, 0x61, align];
    }
    /**
     * Generate a barcode
     * @param {string} value        Value to encode
     * @param {string} symbology    Barcode symbology
     * @param {object} options      Configuration object
     * @returns {Array}             Array of bytes to send to the printer
     */
    barcode(value, symbology, options) {
        let result = [];
        const symbologies = {
            'upce': 0x00,
            'upca': 0x01,
            'ean8': 0x02,
            'ean13': 0x03,
            'code39': 0x04,
            'itf': 0x05,
            'interleaved-2-of-5': 0x05,
            'code128': 0x06,
            'code93': 0x07,
            'nw-7': 0x08,
            'codabar': 0x08,
            'gs1-128': 0x09,
            'gs1-databar-omni': 0x0a,
            'gs1-databar-truncated': 0x0b,
            'gs1-databar-limited': 0x0c,
            'gs1-databar-expanded': 0x0d
        };
        if (typeof symbologies[symbology] === 'undefined') {
            throw new Error('Symbology not supported by printer');
        }
        if (options.width < 1 || options.width > 3) {
            throw new Error('Width must be between 1 and 3');
        }
        /* Selecting mode A, B or C for Code128 is not supported for StarPRNT, so ignore it and let the printer choose */
        if (symbology === 'code128' && value.startsWith('{')) {
            value = value.slice(2);
        }
        /* Encode the barcode value */
        const bytes = CodepageEncoder.encode(value, 'ascii');
        result.push(0x1b, 0x62, symbologies[symbology], options.text ? 0x02 : 0x01, options.width, options.height, ...bytes, 0x1e);
        return result;
    }
    /**
     * Generate a QR code
     * @param {string} value        Value to encode
     * @param {object} options      Configuration object
     * @returns {Array}             Array of bytes to send to the printer
     */
    qrcode(value, options) {
        let result = [];
        /* Model */
        const models = {
            1: 0x01,
            2: 0x02
        };
        if (options.model in models) {
            result.push(0x1b, 0x1d, 0x79, 0x53, 0x30, models[options.model]);
        }
        else {
            throw new Error('Model must be 1 or 2');
        }
        /* Size */
        if (typeof options.size !== 'number') {
            throw new Error('Size must be a number');
        }
        if (options.size < 1 || options.size > 8) {
            throw new Error('Size must be between 1 and 8');
        }
        result.push(0x1b, 0x1d, 0x79, 0x53, 0x32, options.size);
        /* Error level */
        const errorlevels = {
            l: 0x00,
            m: 0x01,
            q: 0x02,
            h: 0x03
        };
        if (options.errorlevel in errorlevels) {
            result.push(0x1b, 0x1d, 0x79, 0x53, 0x31, errorlevels[options.errorlevel]);
        }
        else {
            throw new Error('Error level must be l, m, q or h');
        }
        /* Data */
        const bytes = CodepageEncoder.encode(value, 'iso8859-1');
        const length = bytes.length;
        result.push(0x1b, 0x1d, 0x79, 0x44, 0x31, 0x00, length & 0xff, (length >> 8) & 0xff, ...bytes);
        /* Print QR code */
        result.push(0x1b, 0x1d, 0x79, 0x50);
        return result;
    }
    /**
     * Generate a PDF417 code
     * @param {string} value        Value to encode
     * @param {object} options      Configuration object
     * @returns {Array}             Array of bytes to send to the printer
     */
    pdf417(value, options) {
        let result = [];
        /* Columns and Rows */
        if (typeof options.columns !== 'number') {
            throw new Error('Columns must be a number');
        }
        if (options.columns !== 0 && (options.columns < 1 || options.columns > 30)) {
            throw new Error('Columns must be 0, or between 1 and 30');
        }
        if (typeof options.rows !== 'number') {
            throw new Error('Rows must be a number');
        }
        if (options.rows !== 0 && (options.rows < 3 || options.rows > 90)) {
            throw new Error('Rows must be 0, or between 3 and 90');
        }
        result.push(0x1b, 0x1d, 0x78, 0x53, 0x30, 0x01, options.rows, options.columns);
        /* Width */
        if (typeof options.width !== 'number') {
            throw new Error('Width must be a number');
        }
        if (options.width < 2 || options.width > 8) {
            throw new Error('Width must be between 2 and 8');
        }
        result.push(0x1b, 0x1d, 0x78, 0x53, 0x32, options.width);
        /* Height */
        if (typeof options.height !== 'number') {
            throw new Error('Height must be a number');
        }
        if (options.height < 2 || options.height > 8) {
            throw new Error('Height must be between 2 and 8');
        }
        result.push(0x1b, 0x1d, 0x78, 0x53, 0x33, options.height);
        /* Error level */
        if (typeof options.errorlevel !== 'number') {
            throw new Error('Errorlevel must be a number');
        }
        if (options.errorlevel < 0 || options.errorlevel > 8) {
            throw new Error('Errorlevel must be between 0 and 8');
        }
        result.push(0x1b, 0x1d, 0x78, 0x53, 0x31, options.errorlevel);
        /* Data */
        const bytes = CodepageEncoder.encode(value, 'ascii');
        const length = bytes.length;
        result.push(0x1b, 0x1d, 0x78, 0x44, length & 0xff, (length >> 8) & 0xff, ...bytes);
        /* Print PDF417 code */
        result.push(0x1b, 0x1d, 0x78, 0x50);
        return result;
    }
    /**
     * Encode an image
     * @param {ImageData} image     ImageData object
     * @param {number} width        Width of the image
     * @param {number} height       Height of the image
     * @param {string} mode         Image encoding mode (value is ignored)
     * @returns {Array}             Array of bytes to send to the printer
     */
    image(image, width, height, mode) {
        let result = [];
        const getPixel = (x, y) => typeof image.data[(width * y + x) * 4] === 'undefined' || image.data[(width * y + x) * 4] > 0 ? 0 : 1;
        result.push(0x1b, 0x30);
        for (let s = 0; s < height / 24; s++) {
            const y = s * 24;
            const bytes = new Uint8Array(width * 3);
            for (let x = 0; x < width; x++) {
                const i = x * 3;
                bytes[i] =
                    (getPixel(x, y + 0) << 7) |
                        (getPixel(x, y + 1) << 6) |
                        (getPixel(x, y + 2) << 5) |
                        (getPixel(x, y + 3) << 4) |
                        (getPixel(x, y + 4) << 3) |
                        (getPixel(x, y + 5) << 2) |
                        (getPixel(x, y + 6) << 1) |
                        getPixel(x, y + 7);
                bytes[i + 1] =
                    (getPixel(x, y + 8) << 7) |
                        (getPixel(x, y + 9) << 6) |
                        (getPixel(x, y + 10) << 5) |
                        (getPixel(x, y + 11) << 4) |
                        (getPixel(x, y + 12) << 3) |
                        (getPixel(x, y + 13) << 2) |
                        (getPixel(x, y + 14) << 1) |
                        getPixel(x, y + 15);
                bytes[i + 2] =
                    (getPixel(x, y + 16) << 7) |
                        (getPixel(x, y + 17) << 6) |
                        (getPixel(x, y + 18) << 5) |
                        (getPixel(x, y + 19) << 4) |
                        (getPixel(x, y + 20) << 3) |
                        (getPixel(x, y + 21) << 2) |
                        (getPixel(x, y + 22) << 1) |
                        getPixel(x, y + 23);
            }
            result.push(0x1b, 0x58, width & 0xff, (width >> 8) & 0xff, ...bytes, 0x0a, 0x0d);
        }
        result.push(0x1b, 0x7a, 0x01);
        return result;
    }
    /**
     * Cut the paper
     * @param {string} value    Cut type ('full' or 'partial')
     * @returns {Array}         Array of bytes to send to the printer
     */
    cut(value) {
        let data = 0x00;
        if (value == 'partial') {
            data = 0x01;
        }
        return [0x1b, 0x64, data];
    }
    /**
     * Send a pulse to the cash drawer
     * @param {number} device   Device number
     * @param {number} on       Pulse ON time
     * @param {number} off      Pulse OFF time
     * @returns {Array}         Array of bytes to send to the printer
     */
    pulse(device, on, off) {
        if (typeof device === 'undefined') {
            device = 0;
        }
        if (typeof on === 'undefined') {
            on = 200;
        }
        if (typeof off === 'undefined') {
            off = 200;
        }
        on = Math.min(127, Math.round(on / 10));
        off = Math.min(127, Math.round(off / 10));
        return [0x1b, 0x07, on & 0xff, off & 0xff, device ? 0x1a : 0x07];
    }
    /**
     * Enable or disable bold text
     * @param {boolean} value   Enable or disable bold text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    bold(value) {
        let data = 0x46;
        if (value) {
            data = 0x45;
        }
        return [0x1b, data];
    }
    /**
     * Enable or disable underline text
     * @param {boolean} value   Enable or disable underline text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    underline(value) {
        let data = 0x00;
        if (value) {
            data = 0x01;
        }
        return [0x1b, 0x2d, data];
    }
    /**
     * Enable or disable italic text
     * @param {boolean} value   Enable or disable italic text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    italic(value) {
        return [];
    }
    /**
     * Enable or disable inverted text
     * @param {boolean} value   Enable or disable inverted text, optional, default toggles between states
     * @returns {Array}         Array of bytes to send to the printer
     */
    invert(value) {
        let data = 0x35;
        if (value) {
            data = 0x34;
        }
        return [0x1b, data];
    }
    /**
     * Change text size
     * @param {number} width    Width of the text (1-8)
     * @param {number} height   Height of the text (1-8)
     * @returns {Array}         Array of bytes to send to the printer
     */
    size(width, height) {
        return [0x1b, 0x69, height - 1, width - 1];
    }
    /**
     * Change the codepage
     * @param {number} value    Codepage value
     * @returns {Array}         Array of bytes to send to the printer
     */
    codepage(value) {
        return [0x1b, 0x1d, 0x74, value];
    }
    /**
     * Flush the printers line buffer
     * @returns {Array}         Array of bytes to send to the printer
     */
    flush() {
        return [0x1b, 0x1d, 0x50, 0x30, 0x1b, 0x1d, 0x50, 0x31];
    }
}

var _TextStyle_default, _TextStyle_current, _TextStyle_callback;
/**
 * Store and manage text styles
 */
class TextStyle {
    /**
     * Create a new TextStyle object
     *
     * @param  {object}   options   Object containing configuration options
     */
    constructor(options) {
        _TextStyle_default.set(this, {
            bold: false,
            italic: false,
            underline: false,
            invert: false,
            width: 1,
            height: 1
        });
        _TextStyle_current.set(this, void 0);
        _TextStyle_callback.set(this, void 0);
        __classPrivateFieldSet(this, _TextStyle_current, structuredClone(__classPrivateFieldGet(this, _TextStyle_default, "f")), "f");
        __classPrivateFieldSet(this, _TextStyle_callback, options.callback || (() => { }), "f");
    }
    /**
     * Return commands to get to the default style from the current style
     *
     * @return {array}   Array of modified properties
     */
    store() {
        const result = [];
        for (const property in __classPrivateFieldGet(this, _TextStyle_current, "f")) {
            const key = property;
            const currentValue = __classPrivateFieldGet(this, _TextStyle_current, "f")[key];
            const defaultValue = __classPrivateFieldGet(this, _TextStyle_default, "f")[key];
            if (currentValue !== defaultValue) {
                if (key === 'width' || key === 'height') {
                    result.push({
                        type: 'style',
                        property: 'size',
                        value: { width: defaultValue, height: defaultValue }
                    });
                }
                else {
                    result.push({
                        type: 'style',
                        property: key,
                        value: defaultValue
                    });
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
    restore() {
        const result = [];
        for (const property in __classPrivateFieldGet(this, _TextStyle_current, "f")) {
            const key = property;
            const currentValue = __classPrivateFieldGet(this, _TextStyle_current, "f")[key];
            const defaultValue = __classPrivateFieldGet(this, _TextStyle_default, "f")[key];
            if (currentValue !== defaultValue) {
                if (key === 'width' || key === 'height') {
                    result.push({
                        type: 'style',
                        property: 'size',
                        value: { width: currentValue, height: currentValue }
                    });
                }
                else {
                    result.push({
                        type: 'style',
                        property: key,
                        value: currentValue
                    });
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
    set bold(value) {
        if (value !== __classPrivateFieldGet(this, _TextStyle_current, "f").bold) {
            __classPrivateFieldGet(this, _TextStyle_current, "f").bold = value;
            __classPrivateFieldGet(this, _TextStyle_callback, "f").call(this, {
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
    get bold() {
        return __classPrivateFieldGet(this, _TextStyle_current, "f").bold;
    }
    /**
     * Set the italic property
     *
     * @param  {boolean}   value   Is italic enabled, or not?
     */
    set italic(value) {
        if (value !== __classPrivateFieldGet(this, _TextStyle_current, "f").italic) {
            __classPrivateFieldGet(this, _TextStyle_current, "f").italic = value;
            __classPrivateFieldGet(this, _TextStyle_callback, "f").call(this, {
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
    get italic() {
        return __classPrivateFieldGet(this, _TextStyle_current, "f").italic;
    }
    /**
     * Set the underline property
     *
     * @param  {boolean}   value   Is underline enabled, or not?
     */
    set underline(value) {
        if (value !== __classPrivateFieldGet(this, _TextStyle_current, "f").underline) {
            __classPrivateFieldGet(this, _TextStyle_current, "f").underline = value;
            __classPrivateFieldGet(this, _TextStyle_callback, "f").call(this, {
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
    get underline() {
        return __classPrivateFieldGet(this, _TextStyle_current, "f").underline;
    }
    /**
     * Set the invert property
     *
     * @param  {boolean}   value   Is invert enabled, or not?
     */
    set invert(value) {
        if (value !== __classPrivateFieldGet(this, _TextStyle_current, "f").invert) {
            __classPrivateFieldGet(this, _TextStyle_current, "f").invert = value;
            __classPrivateFieldGet(this, _TextStyle_callback, "f").call(this, {
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
    get invert() {
        return __classPrivateFieldGet(this, _TextStyle_current, "f").invert;
    }
    /**
     * Set the width property
     *
     * @param  {number}   value   The width of a character
     */
    set width(value) {
        if (value !== __classPrivateFieldGet(this, _TextStyle_current, "f").width) {
            __classPrivateFieldGet(this, _TextStyle_current, "f").width = value;
            __classPrivateFieldGet(this, _TextStyle_callback, "f").call(this, {
                type: 'style',
                property: 'size',
                value: { width: __classPrivateFieldGet(this, _TextStyle_current, "f").width, height: __classPrivateFieldGet(this, _TextStyle_current, "f").height }
            });
        }
    }
    /**
     * Get the width property
     *
     * @return {number}   The width of a character
     */
    get width() {
        return __classPrivateFieldGet(this, _TextStyle_current, "f").width;
    }
    /**
     * Set the height property
     *
     * @param  {number}   value   The height of a character
     */
    set height(value) {
        if (value !== __classPrivateFieldGet(this, _TextStyle_current, "f").height) {
            __classPrivateFieldGet(this, _TextStyle_current, "f").height = value;
            __classPrivateFieldGet(this, _TextStyle_callback, "f").call(this, {
                type: 'style',
                property: 'size',
                value: { width: __classPrivateFieldGet(this, _TextStyle_current, "f").width, height: __classPrivateFieldGet(this, _TextStyle_current, "f").height }
            });
        }
    }
    /**
     * Get the height property
     *
     * @return {number}   The height of a character
     */
    get height() {
        return __classPrivateFieldGet(this, _TextStyle_current, "f").height;
    }
}
_TextStyle_default = new WeakMap(), _TextStyle_current = new WeakMap(), _TextStyle_callback = new WeakMap();

/**
 * Wrap text into lines of a specified width.
 */
class TextWrap {
    /**
     * Static function to wrap text into lines of a specified width.
     *
     * @param  {string}   value     Text to wrap
     * @param  {object}   options   Object containing configuration options
     * @return {array}              Array of lines
     */
    static wrap(value, options) {
        const chunkedLines = [];
        let line = [];
        let length = options.indent || 0;
        const width = options.width || 1;
        const columns = options.columns || 42;
        const lines = String(value).split(/\r\n|\n/g);
        for (const value of lines) {
            const chunks = value.match(/[^\s-]+?-\b|\S+|\s+|\r\n?|\n/g) || ['~~empty~~'];
            for (const chunk of chunks) {
                if (chunk === '~~empty~~') {
                    chunkedLines.push(line);
                    line = [];
                    length = 0;
                    continue;
                }
                /* The word does not fit on the line */
                if (length + chunk.length * width > columns) {
                    /* The word is longer than the line */
                    if (chunk.length * width > columns) {
                        /* Calculate the remaining space on the line */
                        const remaining = columns - length;
                        /* Split the word into pieces */
                        const letters = chunk.split('');
                        let piece;
                        const pieces = [];
                        /* If there are at least 8 positions remaining, break early  */
                        if (remaining > 8 * width) {
                            piece = letters.splice(0, Math.floor(remaining / width)).join('');
                            line.push(piece);
                            chunkedLines.push(line);
                            line = [];
                            length = 0;
                        }
                        /* The remaining letters can be split into pieces the size of the width */
                        while ((piece = letters.splice(0, Math.floor(columns / width))).length) {
                            pieces.push(piece.join(''));
                        }
                        for (const piece of pieces) {
                            if (length + piece.length * width >= columns) {
                                chunkedLines.push(line);
                                line = [];
                                length = 0;
                            }
                            line.push(piece);
                            length += piece.length * width;
                        }
                        continue;
                    }
                    /* Word fits on the next line */
                    chunkedLines.push(line);
                    line = [];
                    length = 0;
                }
                /* Check if we are whitespace */
                if (chunk.match(/\s+/) && length == 0) {
                    continue;
                }
                line.push(chunk);
                length += chunk.length * width;
            }
            if (line.length > 0) {
                chunkedLines.push(line);
                line = [];
                length = 0;
            }
        }
        const result = [];
        for (let i = 0; i < chunkedLines.length; i++) {
            let flattenedLine = chunkedLines[i].join('');
            if (i < chunkedLines.length - 1) {
                flattenedLine = flattenedLine.trimEnd();
            }
            result.push(flattenedLine);
        }
        return result;
    }
}

var _LineComposer_instances, _LineComposer_embedded, _LineComposer_columns, _LineComposer_align, _LineComposer_callback, _LineComposer_cursor, _LineComposer_stored, _LineComposer_buffer, _LineComposer_merge;
const isTextItem = (item) => item.type === 'text';
const isSpaceItem = (item) => item.type === 'space';
/**
 * Compose lines of text and commands
 */
class LineComposer {
    /**
     * Create a new LineComposer object
     *
     * @param  {object}   options   Object containing configuration options
     */
    constructor(options) {
        _LineComposer_instances.add(this);
        _LineComposer_embedded.set(this, void 0);
        _LineComposer_columns.set(this, void 0);
        _LineComposer_align.set(this, void 0);
        _LineComposer_callback.set(this, void 0);
        _LineComposer_cursor.set(this, 0);
        _LineComposer_stored.set(this, void 0);
        _LineComposer_buffer.set(this, []);
        __classPrivateFieldSet(this, _LineComposer_embedded, options.embedded || false, "f");
        __classPrivateFieldSet(this, _LineComposer_columns, options.columns || 42, "f");
        __classPrivateFieldSet(this, _LineComposer_align, options.align || 'left', "f");
        __classPrivateFieldSet(this, _LineComposer_callback, options.callback || (() => { }), "f");
        this.style = new TextStyle({
            callback: (value) => {
                this.add(value, 0);
            }
        });
        __classPrivateFieldSet(this, _LineComposer_stored, this.style.store(), "f");
    }
    /**
     * Add text to the line, potentially wrapping it
     *
     * @param  {string}   value   Text to add to the line
     * @param  {string}   codepage   Codepage to use for the text
     */
    text(value, codepage) {
        const lines = TextWrap.wrap(value, { columns: __classPrivateFieldGet(this, _LineComposer_columns, "f"), width: this.style.width, indent: __classPrivateFieldGet(this, _LineComposer_cursor, "f") });
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length) {
                /* Add the line to the buffer */
                this.add({ type: 'text', value: lines[i], codepage }, lines[i].length * this.style.width);
                /* If it is not the last line, flush the buffer */
                if (i < lines.length - 1) {
                    this.flush();
                }
            }
            else {
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
    space(size) {
        this.add({ type: 'space', size }, size);
    }
    /**
     * Add raw bytes to to the line
     *
     * @param  {array}   value   Array of bytes to add to the line
     * @param  {number}  length  Length in characters of the value
     */
    raw(value, length) {
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
    add(value, length) {
        if (length + __classPrivateFieldGet(this, _LineComposer_cursor, "f") > __classPrivateFieldGet(this, _LineComposer_columns, "f")) {
            this.flush();
        }
        __classPrivateFieldSet(this, _LineComposer_cursor, __classPrivateFieldGet(this, _LineComposer_cursor, "f") + length, "f");
        __classPrivateFieldSet(this, _LineComposer_buffer, __classPrivateFieldGet(this, _LineComposer_buffer, "f").concat(Array.isArray(value) ? value : [value]), "f");
    }
    /**
     * Move the cursor to the end of the line, forcing a flush
     * with the next item to add to the line buffer
     */
    end() {
        __classPrivateFieldSet(this, _LineComposer_cursor, __classPrivateFieldGet(this, _LineComposer_columns, "f"), "f");
    }
    /**
     * Fetch the contents of line buffer
     *
     * @param  {options}   options   Options for flushing the buffer
     * @return {array}               Array of items in the line buffer
     */
    fetch(options) {
        /* Unless forced keep style changes for the next line */
        if (__classPrivateFieldGet(this, _LineComposer_cursor, "f") === 0 && !options.forceNewline && !options.forceFlush) {
            return [];
        }
        /* Check the alignment of the current line */
        const align = {
            current: __classPrivateFieldGet(this, _LineComposer_align, "f"),
            next: null
        };
        for (let i = 0; i < __classPrivateFieldGet(this, _LineComposer_buffer, "f").length - 1; i++) {
            if (__classPrivateFieldGet(this, _LineComposer_buffer, "f")[i].type === 'align') {
                align.current = __classPrivateFieldGet(this, _LineComposer_buffer, "f")[i].value;
            }
        }
        /* Check the last item in the buffer, to see if it changes the alignment, then save it for the next line */
        if (__classPrivateFieldGet(this, _LineComposer_buffer, "f").length) {
            const last = __classPrivateFieldGet(this, _LineComposer_buffer, "f")[__classPrivateFieldGet(this, _LineComposer_buffer, "f").length - 1];
            if (last.type === 'align') {
                align.next = last.value;
            }
        }
        __classPrivateFieldSet(this, _LineComposer_align, align.current, "f");
        /* Fetch the contents of the line buffer */
        let result = [];
        const restore = this.style.restore();
        const store = this.style.store();
        if (__classPrivateFieldGet(this, _LineComposer_cursor, "f") === 0 && options.ignoreAlignment) {
            result = __classPrivateFieldGet(this, _LineComposer_instances, "m", _LineComposer_merge).call(this, [...__classPrivateFieldGet(this, _LineComposer_stored, "f"), ...__classPrivateFieldGet(this, _LineComposer_buffer, "f"), ...store]);
        }
        else {
            if (__classPrivateFieldGet(this, _LineComposer_align, "f") === 'right') {
                let last;
                /* Find index of last text or space element */
                for (let i = __classPrivateFieldGet(this, _LineComposer_buffer, "f").length - 1; i >= 0; i--) {
                    if (__classPrivateFieldGet(this, _LineComposer_buffer, "f")[i].type === 'text' || __classPrivateFieldGet(this, _LineComposer_buffer, "f")[i].type === 'space') {
                        last = i;
                        break;
                    }
                }
                /* Remove trailing spaces from lines */
                if (typeof last === 'number') {
                    const lastItem = __classPrivateFieldGet(this, _LineComposer_buffer, "f")[last];
                    if (isSpaceItem(lastItem) && lastItem.size > this.style.width) {
                        lastItem.size -= this.style.width;
                        __classPrivateFieldSet(this, _LineComposer_cursor, __classPrivateFieldGet(this, _LineComposer_cursor, "f") - this.style.width, "f");
                    }
                    if (isTextItem(lastItem) && lastItem.value.endsWith(' ')) {
                        lastItem.value = lastItem.value.slice(0, -1);
                        __classPrivateFieldSet(this, _LineComposer_cursor, __classPrivateFieldGet(this, _LineComposer_cursor, "f") - this.style.width, "f");
                    }
                }
                result = __classPrivateFieldGet(this, _LineComposer_instances, "m", _LineComposer_merge).call(this, [
                    { type: 'space', size: __classPrivateFieldGet(this, _LineComposer_columns, "f") - __classPrivateFieldGet(this, _LineComposer_cursor, "f") },
                    ...__classPrivateFieldGet(this, _LineComposer_stored, "f"),
                    ...__classPrivateFieldGet(this, _LineComposer_buffer, "f"),
                    ...store
                ]);
            }
            if (__classPrivateFieldGet(this, _LineComposer_align, "f") === 'center') {
                const left = (__classPrivateFieldGet(this, _LineComposer_columns, "f") - __classPrivateFieldGet(this, _LineComposer_cursor, "f")) >> 1;
                result = __classPrivateFieldGet(this, _LineComposer_instances, "m", _LineComposer_merge).call(this, [
                    { type: 'space', size: left },
                    ...__classPrivateFieldGet(this, _LineComposer_stored, "f"),
                    ...__classPrivateFieldGet(this, _LineComposer_buffer, "f"),
                    ...store,
                    { type: 'space', size: __classPrivateFieldGet(this, _LineComposer_embedded, "f") ? __classPrivateFieldGet(this, _LineComposer_columns, "f") - __classPrivateFieldGet(this, _LineComposer_cursor, "f") - left : 0 }
                ]);
            }
            if (__classPrivateFieldGet(this, _LineComposer_align, "f") === 'left') {
                result = __classPrivateFieldGet(this, _LineComposer_instances, "m", _LineComposer_merge).call(this, [
                    ...__classPrivateFieldGet(this, _LineComposer_stored, "f"),
                    ...__classPrivateFieldGet(this, _LineComposer_buffer, "f"),
                    ...store,
                    { type: 'space', size: __classPrivateFieldGet(this, _LineComposer_embedded, "f") ? __classPrivateFieldGet(this, _LineComposer_columns, "f") - __classPrivateFieldGet(this, _LineComposer_cursor, "f") : 0 }
                ]);
            }
        }
        __classPrivateFieldSet(this, _LineComposer_stored, restore, "f");
        __classPrivateFieldSet(this, _LineComposer_buffer, [], "f");
        __classPrivateFieldSet(this, _LineComposer_cursor, 0, "f");
        if (result.length === 0 && options.forceNewline) {
            result.push({ type: 'empty' });
        }
        if (align.next) {
            __classPrivateFieldSet(this, _LineComposer_align, align.next, "f");
        }
        return result;
    }
    /**
     * Flush the contents of the line buffer
     *
     * @param  {options}   options   Options for flushing the buffer
     */
    flush(options) {
        options = Object.assign({
            forceNewline: false,
            forceFlush: false,
            ignoreAlignment: false
        }, options || {});
        const result = this.fetch(options);
        if (result.length) {
            __classPrivateFieldGet(this, _LineComposer_callback, "f").call(this, result);
        }
    }
    /**
     * Get the current position of the cursor
     *
     * @return {number}   Current position of the cursor
     */
    get cursor() {
        return __classPrivateFieldGet(this, _LineComposer_cursor, "f");
    }
    /**
     * Set the alignment of the current line
     *
     * @param  {string}   value   Text alignment, can be 'left', 'center', or 'right'
     */
    set align(value) {
        this.add({ type: 'align', value }, 0);
    }
    /**
     * Get the alignment of the current line
     *
     * @return {string}   Text alignment, can be 'left', 'center', or 'right'
     */
    get align() {
        let align = __classPrivateFieldGet(this, _LineComposer_align, "f");
        for (let i = 0; i < __classPrivateFieldGet(this, _LineComposer_buffer, "f").length; i++) {
            if (__classPrivateFieldGet(this, _LineComposer_buffer, "f")[i].type === 'align') {
                align = __classPrivateFieldGet(this, _LineComposer_buffer, "f")[i].value;
            }
        }
        return align;
    }
    /**
     * Set the number of columns of the current line
     *
     * @param  {number}   value   columns of the line
     */
    set columns(value) {
        __classPrivateFieldSet(this, _LineComposer_columns, value, "f");
    }
    /**
     * Get the number of columns of the current line
     *
     * @return {number}   columns of the line
     */
    get columns() {
        return __classPrivateFieldGet(this, _LineComposer_columns, "f");
    }
}
_LineComposer_embedded = new WeakMap(), _LineComposer_columns = new WeakMap(), _LineComposer_align = new WeakMap(), _LineComposer_callback = new WeakMap(), _LineComposer_cursor = new WeakMap(), _LineComposer_stored = new WeakMap(), _LineComposer_buffer = new WeakMap(), _LineComposer_instances = new WeakSet(), _LineComposer_merge = function _LineComposer_merge(items) {
    const result = [];
    let last = -1;
    function isTextItem(item) {
        return item.type === 'text';
    }
    for (let item of items) {
        if (item.type === 'space' && 'size' in item && item.size > 0) {
            item = { type: 'text', value: ' '.repeat(item.size), codepage: null };
        }
        if (isTextItem(item)) {
            const lastItem = result[last];
            const allowMerge = last >= 0 &&
                isTextItem(lastItem) &&
                (lastItem.codepage === item.codepage || lastItem.codepage === null || item.codepage === null);
            if (allowMerge) {
                lastItem.value += item.value;
                lastItem.codepage = lastItem.codepage || item.codepage;
                continue;
            }
            result.push(item);
            last++;
        }
        else if (item.type === 'style' || item.type === 'raw') {
            result.push(item);
            last++;
        }
    }
    return result;
};

const codepageMappings$1 = {
    'esc-pos': {
        'bixolon/legacy': [
            'cp437',
            'epson/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'cp858'
        ],
        bixolon: [
            'cp437',
            'epson/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'windows1252',
            'cp866',
            'cp852',
            'cp858',
            null,
            'cp862',
            'cp864',
            'thai42',
            'windows1253',
            'windows1254',
            'windows1257',
            null,
            'windows1251',
            'cp737',
            'cp775',
            'thai14',
            'bixolon/hebrew',
            'windows1255',
            'thai11',
            'thai18',
            'cp885',
            'cp857',
            'iso8859-7',
            'thai16',
            'windows1256',
            'windows1258',
            'khmer',
            null,
            null,
            null,
            'bixolon/cp866',
            'windows1250',
            null,
            'tcvn3',
            'tcvn3capitals',
            'viscii'
        ],
        citizen: [
            'cp437',
            'epson/katakana',
            'cp858',
            'cp860',
            'cp863',
            'cp865',
            'cp852',
            'cp866',
            'cp857',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'windows1252',
            null,
            null,
            null,
            null,
            'thai11',
            null,
            null,
            null,
            null,
            'thai13',
            null,
            null,
            null,
            'tcvn3',
            'tcvn3capitals',
            'windows1258',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'cp864'
        ],
        'epson/legacy': [
            'cp437',
            'epson/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'windows1252',
            'cp866',
            'cp852',
            'cp858'
        ],
        epson: [
            'cp437',
            'epson/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            null,
            null,
            null,
            null,
            null,
            'cp851',
            'cp853',
            'cp857',
            'cp737',
            'iso8859-7',
            'windows1252',
            'cp866',
            'cp852',
            'cp858',
            'thai42',
            'thai11',
            null,
            null,
            null,
            null,
            'thai13',
            null,
            null,
            null,
            'tcvn3',
            'tcvn3capitals',
            'cp720',
            'cp775',
            'cp855',
            'cp861',
            'cp862',
            'cp864',
            'cp869',
            'epson/iso8859-2',
            'iso8859-15',
            'cp1098',
            'cp774',
            'cp772',
            'cp1125',
            'windows1250',
            'windows1251',
            'windows1253',
            'windows1254',
            'windows1255',
            'windows1256',
            'windows1257',
            'windows1258',
            'rk1048'
        ],
        fujitsu: [
            'cp437',
            'epson/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            null,
            null,
            'cp857',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'windows1252',
            'cp866',
            'cp852',
            'cp858',
            null,
            null,
            null,
            null,
            null,
            null,
            'thai13',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'cp864'
        ],
        hp: [
            'cp437',
            'cp850',
            'cp852',
            'cp860',
            'cp863',
            'cp865',
            'cp858',
            'cp866',
            'windows1252',
            'cp862',
            'cp737',
            'cp874',
            'cp857',
            'windows1251',
            'windows1255',
            'rk1048'
        ],
        metapace: [
            'cp437',
            'epson/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'cp858'
        ],
        mpt: [
            'cp437',
            null,
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            'windows1251',
            'cp866',
            'cp3021',
            'cp3012'
        ],
        'pos-5890': [
            'cp437',
            'epson/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            'iso8859-1',
            null,
            'cp862',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'windows1252',
            'cp866',
            'cp852',
            'cp858',
            null,
            null,
            null,
            'windows1251',
            'cp737',
            'windows1257',
            null,
            'windows1258',
            'cp864',
            null,
            null,
            null,
            'windows1255',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'cp861',
            null,
            null,
            null,
            'cp855',
            'cp857',
            null,
            null,
            null,
            'cp851',
            'cp869',
            null,
            'cp772',
            'cp774',
            null,
            null,
            'windows1250',
            null,
            'cp3840',
            null,
            'cp3843',
            'cp3844',
            'cp3845',
            'cp3846',
            'cp3847',
            'cp3848',
            null,
            'cp771',
            'cp3001',
            'cp3002',
            'cp3011',
            'cp3012',
            null,
            'cp3041',
            'windows1253',
            'windows1254',
            'windows1256',
            'cp720',
            null,
            'cp775'
        ],
        'pos-8360': [
            'cp437',
            'epson/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            'iso8859-1',
            'windows1253',
            'cp862',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'windows1252',
            'cp866',
            'cp852',
            'cp858',
            null,
            'latvian',
            null,
            'windows1251',
            'cp737',
            'windows1257',
            null,
            'windows1258',
            'cp864',
            null,
            null,
            'pos8360/hebrew',
            'windows1255',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'cp861',
            null,
            null,
            null,
            'cp855',
            'cp857',
            null,
            null,
            null,
            'cp851',
            'cp869',
            null,
            'cp772',
            'cp774',
            null,
            null,
            'windows1250',
            null,
            'cp3840',
            null,
            'cp3843',
            'cp3844',
            'cp3845',
            'cp3846',
            'cp3847',
            'cp3848',
            null,
            'cp771',
            'cp3001',
            'cp3002',
            'cp3011',
            'cp3012',
            null,
            null,
            null,
            'windows1254',
            'windows1256',
            'cp720',
            null,
            'cp775'
        ],
        star: [
            'cp437',
            'star/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'windows1252',
            'cp866',
            'cp852',
            'cp858',
            'thai42',
            'thai11',
            'thai13',
            'thai14',
            'thai16',
            null,
            'thai18'
        ],
        xprinter: [
            'cp437',
            'epson/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            'iso8859-1',
            'windows1253',
            'xprinter/hebrew',
            'cp3012',
            null,
            'windows1255',
            null,
            null,
            null,
            null,
            'windows1252',
            'cp866',
            'cp852',
            'cp858',
            null,
            'latvian',
            'cp864',
            'windows1251',
            'cp737',
            'windows1257',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'windows1256'
        ],
        youku: [
            'cp437',
            'epson/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            'windows1251',
            'cp866',
            'cp3021',
            'cp3012',
            null,
            null,
            null,
            null,
            null,
            'cp862',
            'windows1252',
            null,
            'cp852',
            'cp858',
            null,
            null,
            'cp864',
            'iso8859-1',
            'cp737',
            'windows1257',
            null,
            null,
            'cp855',
            'cp857',
            'windows1250',
            'cp775',
            'windows1254',
            'windows1255',
            'windows1256',
            'windows1258',
            null,
            null,
            'iso8859-1',
            null,
            null,
            null,
            null,
            null,
            'iso8859-15',
            null,
            null,
            'cp874'
        ],
        zijang: [
            'cp437',
            'epson/katakana',
            'cp850',
            'cp860',
            'cp863',
            'cp865',
            'iso8859-1',
            null,
            'cp862',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'windows1252',
            'cp866',
            'cp852',
            'cp858',
            null,
            null,
            null,
            'windows1251',
            'cp737',
            'windows1257',
            null,
            'windows1258',
            'cp864',
            null,
            null,
            null,
            'windows1255',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'cp861',
            null,
            null,
            null,
            'cp855',
            'cp857',
            null,
            null,
            null,
            'cp851',
            'cp869',
            null,
            'cp772',
            'cp774',
            null,
            null,
            'windows1250',
            null,
            'cp3840',
            null,
            'cp3843',
            'cp3844',
            'cp3845',
            'cp3846',
            'cp3847',
            'cp3848',
            null,
            'cp771',
            'cp3001',
            'cp3002',
            'cp3011',
            'cp3012',
            null,
            'cp3041',
            'windows1253',
            'windows1254',
            'windows1256',
            'cp720',
            null,
            'cp775'
        ]
    },
    'star-prnt': {
        star: [
            'star/standard',
            'cp437',
            'star/katakana',
            null,
            'cp858',
            'cp852',
            'cp860',
            'cp861',
            'cp863',
            'cp865',
            'cp866',
            'cp855',
            'cp857',
            'cp862',
            'cp864',
            'cp737',
            'cp851',
            'cp869',
            'star/cp928',
            'cp772',
            'cp774',
            'star/cp874',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'windows1252',
            'windows1250',
            'windows1251',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'cp3840',
            'cp3841',
            'cp3843',
            'cp3844',
            'cp3845',
            'cp3846',
            'cp3847',
            'cp3848',
            'cp1001',
            'cp771',
            'cp3001',
            'cp3002',
            'cp3011',
            'cp3012',
            'cp3021',
            'cp3041'
        ]
    },
    'star-line': {
        star: [
            'star/standard',
            'cp437',
            'star/katakana',
            null,
            'cp858',
            'cp852',
            'cp860',
            'cp861',
            'cp863',
            'cp865',
            'cp866',
            'cp855',
            'cp857',
            'cp862',
            'cp864',
            'cp737',
            'cp851',
            'cp869',
            'star/cp928',
            'cp772',
            'cp774',
            'star/cp874',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'windows1252',
            'windows1250',
            'windows1251',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            'cp3840',
            'cp3841',
            'cp3843',
            'cp3844',
            'cp3845',
            'cp3846',
            'cp3847',
            'cp3848',
            'cp1001',
            'cp771',
            'cp3001',
            'cp3002',
            'cp3011',
            'cp3012',
            'cp3021',
            'cp3041'
        ]
    }
};

const printerDefinitions$1 = {
    'bixolon-srp350': { vendor: 'Bixolon', model: 'SRP-350', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'bixolon/legacy', fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } } }, features: { cutter: { feed: 4 } } },
    'bixolon-srp350iii': { vendor: 'Bixolon', model: 'SRP-350III', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'bixolon', fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 }, C: { size: '9x24', columns: 56 } } }, features: { cutter: { feed: 4 } } },
    'citizen-ct-s310ii': { vendor: 'Citizen', model: 'CT-S310II', media: { dpi: 203, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'citizen', fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x24', columns: 64 }, C: { size: '8x16', columns: 72 } } }, features: { cutter: { feed: 3 } } },
    'epson-tm-p20ii': { vendor: 'Epson', model: 'TM-P20II', media: { dpi: 203, width: 58 }, capabilities: { language: 'esc-pos', codepages: 'epson', fonts: { A: { size: '12x24', columns: 32 }, B: { size: '9x24', columns: 42 }, C: { size: '9x17', columns: 42 }, D: { size: '10x24', columns: 38 }, E: { size: '8x16', columns: 48 } } }, features: { images: { mode: 'raster' }, cutter: { feed: 3 } } },
    'epson-tm-t20iii': { vendor: 'Epson', model: 'TM-T20III', interfaces: { usb: { productName: 'TM-T20III' } }, media: { dpi: 203, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'epson', fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x17', columns: 64 } } }, features: { cutter: { feed: 4 } } },
    'epson-tm-t70': { vendor: 'Epson', model: 'TM-T70', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'epson/legacy', fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } } }, features: { images: { mode: 'raster' }, cutter: { feed: 4 } } },
    'epson-tm-t70ii': { vendor: 'Epson', model: 'TM-T70II', 'interface': { usb: { productName: 'TM-T70II' } }, media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'epson', fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } } }, features: { images: { mode: 'raster' }, cutter: { feed: 4 } } },
    'epson-tm-t88ii': { vendor: 'Epson', model: 'TM-T88II', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'epson/legacy', fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } } }, features: { cutter: { feed: 4 } } },
    'epson-tm-t88iii': { vendor: 'Epson', model: 'TM-T88III', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'epson/legacy', fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } } }, features: { cutter: { feed: 4 } } },
    'epson-tm-t88iv': { vendor: 'Epson', model: 'TM-T88IV', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'epson/legacy', fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } } }, features: { cutter: { feed: 4 } } },
    'epson-tm-t88v': { vendor: 'Epson', model: 'TM-T88V', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'epson', fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } } }, features: { cutter: { feed: 4 } } },
    'epson-tm-t88vi': { vendor: 'Epson', model: 'TM-T88VI', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'epson', fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } } }, features: { cutter: { feed: 4 } } },
    'epson-tm-t88vii': { vendor: 'Epson', model: 'TM-T88VII', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'epson', fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } } }, features: { cutter: { feed: 4 } } },
    'fujitsu-fp1000': { vendor: 'Fujitsu', model: 'FP-1000', media: { dpi: 203, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'fujitsu', fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x24', columns: 56 }, C: { size: '8x16', columns: 64 } } }, features: { cutter: { feed: 4 } } },
    'hp-a779': { vendor: 'HP', model: 'A779', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'hp', newline: '\n', fonts: { A: { size: '12x24', columns: 44 } } }, features: { cutter: { feed: 4 } } },
    'metapace-t1': { vendor: 'Metapace', model: 'T-1', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'metapace', fonts: { A: { size: '12x24', columns: 42 }, B: { size: '9x17', columns: 56 } } }, features: { cutter: { feed: 4 } } },
    'mpt-ii': { vendor: '', model: 'MPT-II', media: { dpi: 180, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'mpt', fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x17', columns: 64 }, C: { size: '0x0', columns: 64 } } } },
    'pos-5890': { vendor: '', model: 'POS-5890', media: { dpi: 203, width: 58 }, capabilities: { language: 'esc-pos', codepages: 'pos-5890', fonts: { A: { size: '12x24', columns: 32 }, B: { size: '9x17', columns: 42 } } }, features: { images: { mode: 'raster' }, cutter: { feed: 1 } } },
    'pos-8360': { vendor: '', model: 'POS-8360', media: { dpi: 203, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'pos-8360', fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x17', columns: 64 } } }, features: { images: { mode: 'raster' }, cutter: { feed: 4 } } },
    'star-mc-print2': { vendor: 'Star', model: 'mC-Print2', interfaces: { usb: { productName: 'mC-Print2' } }, media: { dpi: 203, width: 58 }, capabilities: { language: 'star-prnt', codepages: 'star', fonts: { A: { size: '12x24', columns: 32 }, B: { size: '9x24', columns: 42 } } }, features: { cutter: { feed: 3 } } },
    'star-mpop': { vendor: 'Star', model: 'mPOP', interfaces: { usb: { productName: 'mPOP' } }, media: { dpi: 203, width: 58 }, capabilities: { language: 'star-prnt', codepages: 'star', fonts: { A: { size: '12x24', columns: 32 }, B: { size: '9x24', columns: 42 } } }, features: { cutter: { feed: 3 } } },
    'star-sm-l200': { vendor: 'Star', model: 'SM-L200', media: { dpi: 203, width: 58 }, capabilities: { language: 'star-prnt', codepages: 'star', fonts: { A: { size: '12x24', columns: 32 }, B: { size: '9x24', columns: 42 }, C: { size: '9x17', columns: 42 } } } },
    'star-tsp100iv': { vendor: 'Star', model: 'TSP100IV', media: { dpi: 203, width: 80 }, capabilities: { language: 'star-prnt', codepages: 'star', fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x24', columns: 64 } } }, features: { cutter: { feed: 3 } } },
    'star-tsp650ii': { vendor: 'Star', model: 'TSP650II', media: { dpi: 203, width: 80 }, capabilities: { language: 'star-line', codepages: 'star', fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x24', columns: 64 } } }, features: { cutter: { feed: 3 } } },
    'xprinter-xp-n160ii': { vendor: 'Xprinter', model: 'XP-N160II', interfaces: { usb: { productName: 'Printer-80\u0000' } }, media: { dpi: 203, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'xprinter', fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x17', columns: 64 } } }, features: { cutter: { feed: 4 } } },
    'xprinter-xp-t80q': { vendor: 'Xprinter', model: 'XP-T80Q', media: { dpi: 203, width: 80 }, capabilities: { language: 'esc-pos', codepages: 'xprinter', fonts: { A: { size: '12x24', columns: 48 }, B: { size: '9x17', columns: 64 } } }, features: { cutter: { feed: 4 } } },
    'youku-58t': { vendor: 'Youku', model: '58T', media: { dpi: 203, width: 58 }, capabilities: { language: 'esc-pos', codepages: 'youku', fonts: { A: { size: '12x24', columns: 32 }, B: { size: '9x24', columns: 42 } } } },
};

var _ReceiptPrinterEncoder_instances, _ReceiptPrinterEncoder_options, _ReceiptPrinterEncoder_queue, _ReceiptPrinterEncoder_language, _ReceiptPrinterEncoder_composer, _ReceiptPrinterEncoder_fontMapping, _ReceiptPrinterEncoder_codepageMapping, _ReceiptPrinterEncoder_codepageCandidates, _ReceiptPrinterEncoder_codepage, _ReceiptPrinterEncoder_state, _ReceiptPrinterEncoder_reset, _ReceiptPrinterEncoder_encodeStyle, _ReceiptPrinterEncoder_encodeText;
const printerDefinitions = printerDefinitions$1;
const codepageMappings = codepageMappings$1;
const defaultConfiguration = {
    columns: 42,
    language: 'esc-pos',
    imageMode: 'column',
    feedBeforeCut: 0,
    newline: '\n\r',
    codepageMapping: 'epson',
    // codepageCandidates: null,
    debug: false,
    embedded: false,
    createCanvas: null
};
/**
 * Create a byte stream based on commands for receipt printers
 */
class ReceiptPrinterEncoder {
    /**
     * Create a new object
     *
     * @param  {object}   options   Object containing configuration options
     */
    constructor(options) {
        var _a, _b, _c, _d, _e, _f;
        _ReceiptPrinterEncoder_instances.add(this);
        _ReceiptPrinterEncoder_options.set(this, defaultConfiguration);
        _ReceiptPrinterEncoder_queue.set(this, []);
        _ReceiptPrinterEncoder_language.set(this, void 0);
        _ReceiptPrinterEncoder_composer.set(this, void 0);
        _ReceiptPrinterEncoder_fontMapping.set(this, {
            A: { size: '12x24', columns: 42 },
            B: { size: '9x24', columns: 56 }
        });
        _ReceiptPrinterEncoder_codepageMapping.set(this, void 0);
        _ReceiptPrinterEncoder_codepageCandidates.set(this, void 0);
        _ReceiptPrinterEncoder_codepage.set(this, 'cp437');
        _ReceiptPrinterEncoder_state.set(this, {
            codepage: 0,
            font: 'A'
        });
        options = options || {};
        const defaults = Object.assign({}, defaultConfiguration);
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
            const printerDefinition = printerDefinitions[options.printerModel];
            /* Apply the printer definition to the defaults */
            defaults.columns = printerDefinition.capabilities.fonts['A'].columns;
            defaults.language = printerDefinition.capabilities.language;
            defaults.codepageMapping = printerDefinition.capabilities.codepages;
            defaults.newline = (_b = (_a = printerDefinition.capabilities) === null || _a === void 0 ? void 0 : _a.newline) !== null && _b !== void 0 ? _b : defaults.newline;
            defaults.feedBeforeCut = ((_d = (_c = printerDefinition.features) === null || _c === void 0 ? void 0 : _c.cutter) === null || _d === void 0 ? void 0 : _d.feed) || defaults.feedBeforeCut;
            defaults.imageMode = ((_f = (_e = printerDefinition.features) === null || _e === void 0 ? void 0 : _e.images) === null || _f === void 0 ? void 0 : _f.mode) || defaults.imageMode;
            /* Apply the font mapping */
            __classPrivateFieldSet(this, _ReceiptPrinterEncoder_fontMapping, printerDefinition.capabilities.fonts, "f");
        }
        /* Merge options */
        if (options) {
            __classPrivateFieldSet(this, _ReceiptPrinterEncoder_options, Object.assign(defaults, options), "f");
        }
        /* Backwards compatibility for the width option */
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").width) {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").columns = __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").width;
        }
        /* Get the printer language */
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").language === 'esc-pos') {
            __classPrivateFieldSet(this, _ReceiptPrinterEncoder_language, new LanguageEscPos(), "f");
        }
        else if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").language === 'star-prnt' || __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").language === 'star-line') {
            __classPrivateFieldSet(this, _ReceiptPrinterEncoder_language, new LanguageStarPrnt(), "f");
        }
        else {
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
        if (typeof __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").autoFlush === 'undefined') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").autoFlush = !__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded && __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").language == 'star-prnt';
        }
        /* Check column width */
        if (![32, 35, 42, 44, 48].includes(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").columns) && !__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded) {
            throw new Error('The width of the paper must me either 32, 35, 42, 44 or 48 columns');
        }
        /* Determine codepage mapping and candidates */
        if (typeof __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").codepageMapping === 'string') {
            if (typeof codepageMappings[__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").language][__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").codepageMapping] === 'undefined') {
                throw new Error('Unknown codepage mapping');
            }
            __classPrivateFieldSet(this, _ReceiptPrinterEncoder_codepageMapping, Object.fromEntries(codepageMappings[__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").language][__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").codepageMapping]
                .map((v, i) => [v, i])
                .filter((i) => i)), "f");
        }
        else {
            __classPrivateFieldSet(this, _ReceiptPrinterEncoder_codepageMapping, __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").codepageMapping, "f");
        }
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").codepageCandidates) {
            __classPrivateFieldSet(this, _ReceiptPrinterEncoder_codepageCandidates, __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").codepageCandidates, "f");
        }
        else {
            __classPrivateFieldSet(this, _ReceiptPrinterEncoder_codepageCandidates, Object.keys(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_codepageMapping, "f")), "f");
        }
        /* Create our line composer */
        __classPrivateFieldSet(this, _ReceiptPrinterEncoder_composer, new LineComposer({
            embedded: __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded,
            columns: __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").columns,
            align: 'left',
            // size: 1,
            callback: (value) => __classPrivateFieldGet(this, _ReceiptPrinterEncoder_queue, "f").push(value)
        }), "f");
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_instances, "m", _ReceiptPrinterEncoder_reset).call(this);
    }
    /**
     * Initialize the printer
     *
     * @return {object}          Return the object, for easy chaining commands
     *
     */
    initialize() {
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded) {
            throw new Error('Initialize is not supported in table cells or boxes');
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").initialize());
        return this;
    }
    /**
     * Change the code page
     *
     * @param  {string}   codepage  The codepage that we set the printer to
     * @return {object}             Return the object, for easy chaining commands
     *
     */
    codepage(codepage) {
        if (codepage === 'auto') {
            __classPrivateFieldSet(this, _ReceiptPrinterEncoder_codepage, codepage, "f");
            return this;
        }
        if (!CodepageEncoder.supports(codepage)) {
            throw new Error('Unknown codepage');
        }
        if (typeof __classPrivateFieldGet(this, _ReceiptPrinterEncoder_codepageMapping, "f")[codepage] !== 'undefined') {
            __classPrivateFieldSet(this, _ReceiptPrinterEncoder_codepage, codepage, "f");
        }
        else {
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
    text(value) {
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").text(value, __classPrivateFieldGet(this, _ReceiptPrinterEncoder_codepage, "f"));
        return this;
    }
    /**
     * Print a newline
     *
     * @param  {number|string}   value  The number of newlines that need to be printed, defaults to 1
     * @return {object}                 Return the object, for easy chaining commands
     *
     */
    newline(value = 1) {
        if (typeof value === 'string') {
            value = parseInt(value, 10) || 1;
        }
        for (let i = 0; i < value; i++) {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceNewline: true });
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
    line(value) {
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
    underline(value) {
        if (typeof value === 'undefined') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.underline = !__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.underline;
        }
        else {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.underline = value;
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
    italic(value) {
        if (typeof value === 'undefined') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.italic = !__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.italic;
        }
        else {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.italic = value;
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
    bold(value) {
        if (typeof value === 'undefined') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.bold = !__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.bold;
        }
        else {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.bold = value;
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
    invert(value) {
        if (typeof value === 'undefined') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.invert = !__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.invert;
        }
        else {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.invert = value;
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
    width(width) {
        if (typeof width === 'undefined') {
            width = 1;
        }
        if (typeof width !== 'number') {
            throw new Error('Width must be a number');
        }
        if (width < 1 || width > 8) {
            throw new Error('Width must be between 1 and 8');
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.width = width;
        return this;
    }
    /**
     * Change height of text
     *
     * @param  {number}          height  The height of the text, 1 - 8
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    height(height) {
        if (typeof height === 'undefined') {
            height = 1;
        }
        if (typeof height !== 'number') {
            throw new Error('Height must be a number');
        }
        if (height < 1 || height > 8) {
            throw new Error('Height must be between 1 and 8');
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.height = height;
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
    size(width, height) {
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
    font(value) {
        var _a;
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded) {
            throw new Error('Changing fonts is not supported in table cells or boxes');
        }
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").cursor > 0) {
            throw new Error('Changing fonts is not supported in the middle of a line');
        }
        /* If size is specified, find the matching font */
        let matchedFontType;
        const matches = value.match(/^[0-9]+x[0-9]+$/);
        if (matches) {
            matchedFontType = (_a = Object.entries(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_fontMapping, "f")).find((i) => i[1].size == matches[0])) === null || _a === void 0 ? void 0 : _a[0];
        }
        /* Make sure the font name is uppercase */
        matchedFontType = ((matchedFontType === null || matchedFontType === void 0 ? void 0 : matchedFontType.toUpperCase()) || 'A');
        /* Check if the font is supported */
        if (typeof __classPrivateFieldGet(this, _ReceiptPrinterEncoder_fontMapping, "f")[value] === 'undefined') {
            throw new Error('Unsupported font');
        }
        /* Change the font */
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").font(matchedFontType));
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_state, "f").font = matchedFontType;
        /* Change the width of the composer */
        if (matchedFontType === 'A') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").columns = __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").columns;
        }
        else {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").columns =
                (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").columns / __classPrivateFieldGet(this, _ReceiptPrinterEncoder_fontMapping, "f")['A'].columns) * __classPrivateFieldGet(this, _ReceiptPrinterEncoder_fontMapping, "f")[matchedFontType].columns;
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
    align(value) {
        const alignments = ['left', 'center', 'right'];
        if (!alignments.includes(value)) {
            throw new Error('Unknown alignment');
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align = value;
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
    table(columns, data) {
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush();
        /* Process all lines */
        for (let r = 0; r < data.length; r++) {
            const lines = [];
            let maxLines = 0;
            /* Render all columns */
            for (let c = 0; c < columns.length; c++) {
                const columnEncoder = new ReceiptPrinterEncoder(Object.assign({}, __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f"), {
                    width: columns[c].width,
                    embedded: true
                }));
                const cellData = data[r][c];
                columnEncoder.codepage(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_codepage, "f"));
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
                        verticalAlign = columns[c].verticalAlign;
                    }
                    const line = { commands: [{ type: 'space', size: columns[c].width }], height: 1 };
                    if (verticalAlign == 'bottom') {
                        lines[c].unshift(line);
                    }
                    else {
                        lines[c].push(line);
                    }
                }
            }
            /* Add the lines to the composer */
            for (let l = 0; l < maxLines; l++) {
                for (let c = 0; c < columns.length; c++) {
                    if (typeof columns[c].marginLeft !== 'undefined') {
                        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").space(columns[c].marginLeft || 0);
                    }
                    __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").add(lines[c][l].commands, columns[c].width);
                    if (typeof columns[c].marginRight !== 'undefined') {
                        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").space(columns[c].marginRight || 0);
                    }
                }
                __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush();
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
    rule(options) {
        options = Object.assign({
            style: 'single',
            width: __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").columns || 10
        }, options || {});
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush();
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").text((options.style === 'double' ? '═' : '─').repeat(options.width), 'cp437');
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush();
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
    box(options, contents) {
        options = Object.assign({
            style: 'single',
            width: __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").columns,
            marginLeft: 0,
            marginRight: 0,
            paddingLeft: 0,
            paddingRight: 0
        }, options || {});
        if (options.width + options.marginLeft + options.marginRight > __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").columns) {
            throw new Error('Box is too wide');
        }
        let elements = [];
        if (options.style == 'single') {
            elements = ['┌', '┐', '└', '┘', '─', '│'];
        }
        else if (options.style == 'double') {
            elements = ['╔', '╗', '╚', '╝', '═', '║'];
        }
        /* Render the contents of the box */
        const columnEncoder = new ReceiptPrinterEncoder(Object.assign({}, __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f"), {
            width: options.width - (options.style == 'none' ? 0 : 2) - options.paddingLeft - options.paddingRight,
            embedded: true
        }));
        columnEncoder.codepage(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_codepage, "f"));
        columnEncoder.align(options.align || 'left');
        if (typeof contents === 'function') {
            contents(columnEncoder);
        }
        if (typeof contents === 'string') {
            columnEncoder.text(contents);
        }
        const lines = columnEncoder.commands();
        /* Header */
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush();
        if (options.style != 'none') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").space(options.marginLeft);
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").text(elements[0], 'cp437');
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").text(elements[4].repeat(options.width - 2), 'cp437');
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").text(elements[1], 'cp437');
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").space(options.marginRight);
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush();
        }
        /* Content */
        for (let i = 0; i < lines.length; i++) {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").space(options.marginLeft);
            if (options.style != 'none') {
                __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.height = lines[i].height;
                __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").text(elements[5], 'cp437');
                __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.height = 1;
            }
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").space(options.paddingLeft);
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").add(lines[i].commands, options.width - (options.style == 'none' ? 0 : 2) - options.paddingLeft - options.paddingRight);
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").space(options.paddingRight);
            if (options.style != 'none') {
                __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.height = lines[i].height;
                __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").text(elements[5], 'cp437');
                __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").style.height = 1;
            }
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").space(options.marginRight);
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush();
        }
        /* Footer */
        if (options.style != 'none') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").space(options.marginLeft);
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").text(elements[2], 'cp437');
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").text(elements[4].repeat(options.width - 2), 'cp437');
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").text(elements[3], 'cp437');
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").space(options.marginRight);
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush();
        }
        return this;
    }
    /**
     * Barcode
     *
     * @param  {string}           value  the value of the barcode
     * @param  {string}           symbology  the type of the barcode
     * @param  {number|object}    height  Either the configuration object, or backwards compatible height of the barcode
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    barcode(value, symbology, height) {
        let options = {
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
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded) {
            throw new Error('Barcodes are not supported in table cells or boxes');
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
        /* Set alignment */
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align !== 'left') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").align(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align));
        }
        /* Barcode */
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").barcode(value, symbology, options));
        /* Reset alignment */
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align !== 'left') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").align('left'));
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
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
    qrcode(value, model, size, errorlevel) {
        let options = {
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
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded) {
            throw new Error('QR codes are not supported in table cells or boxes');
        }
        /* Force printing the print buffer and moving to a new line */
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
        /* Set alignment */
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align !== 'left') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").align(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align));
        }
        /* QR code */
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").qrcode(value, options));
        /* Reset alignment */
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align !== 'left') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").align('left'));
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
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
    pdf417(value, options) {
        options = Object.assign({
            width: 3,
            height: 3,
            columns: 0,
            rows: 0,
            errorlevel: 1,
            truncated: false
        }, options || {});
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded) {
            throw new Error('PDF417 codes are not supported in table cells or boxes');
        }
        /* Force printing the print buffer and moving to a new line */
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
        /* Set alignment */
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align !== 'left') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").align(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align));
        }
        /* PDF417 code */
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").pdf417(value, options));
        /* Reset alignment */
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align !== 'left') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").align('left'));
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
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
    image(input, width, height, algorithm, threshold) {
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded) {
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
            }
            else {
                throw new Error('Failed to get 2D rendering context');
            }
        }
        if (type == 'node-canvas') {
            const context = input.getContext('2d');
            image = context.getImageData(0, 0, input.width, input.height);
        }
        if (type == 'node-canvas-image') {
            if (typeof __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").createCanvas !== 'function') {
                throw new Error('Canvas is not supported in this environment, specify a createCanvas function in the options');
            }
            const canvas = __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").createCanvas(width, height);
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
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
        /* Set alignment */
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align !== 'left') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").align(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align));
        }
        /* Encode the image data */
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").image(image, width, height, __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").imageMode));
        /* Reset alignment */
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").align !== 'left') {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").align('left'));
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
        return this;
    }
    /**
     * Cut paper
     *
     * @param  {string}          value   full or partial. When not specified a full cut will be assumed
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
    cut(value) {
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded) {
            throw new Error('Cut is not supported in table cells or boxes');
        }
        for (let i = 0; i < __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").feedBeforeCut; i++) {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceNewline: true });
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").cut(value));
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
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
    pulse(device, on, off) {
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded) {
            throw new Error('Pulse is not supported in table cells or boxes');
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").pulse(device, on, off));
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").flush({ forceFlush: true, ignoreAlignment: true });
        return this;
    }
    /**
     * Add raw printer commands
     *
     * @param  {array}           data   raw bytes to be included
     * @return {object}          Return the object, for easy chaining commands
     *
     */
    raw(data) {
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").raw(data);
        return this;
    }
    /**
     * Get all the commands
     *
     * @return {array}         All the commands currently in the queue
     */
    commands() {
        const result = [];
        const remaining = __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").fetch({ forceFlush: true, ignoreAlignment: true });
        if (remaining.length) {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_queue, "f").push(remaining);
        }
        /* Flush the printer line buffer if needed */
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").autoFlush && !__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").embedded) {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_queue, "f").push([{ type: 'raw', value: __classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").flush() }]);
        }
        /* Process all lines in the queue */
        while (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_queue, "f").length) {
            const line = __classPrivateFieldGet(this, _ReceiptPrinterEncoder_queue, "f").shift();
            const height = line
                .filter((i) => i.type === 'style' && i.property === 'size')
                .map((i) => i.value.height)
                .reduce((a, b) => Math.max(a, b), 1);
            if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").debug) {
                console.log('|' +
                    line
                        .filter((i) => i.type === 'text')
                        .map((i) => i.value)
                        .join('') +
                    '|', height);
            }
            result.push({
                commands: line,
                height: height
            });
        }
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").debug) {
            console.log('commands', result);
        }
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_instances, "m", _ReceiptPrinterEncoder_reset).call(this);
        return result;
    }
    /**
     * Encode all previous commands
     *
     * @return {Uint8Array}         Return the encoded bytes
     */
    encode() {
        var _a;
        const commands = this.commands();
        const result = [];
        for (const line of commands) {
            for (const item of line.commands) {
                if (item.type === 'raw') {
                    result.push(item.value);
                }
                if (item.type === 'text') {
                    result.push(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_instances, "m", _ReceiptPrinterEncoder_encodeText).call(this, item.value, (_a = item.codepage) !== null && _a !== void 0 ? _a : 'auto'));
                }
                if (item.type === 'style') {
                    result.push(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_instances, "m", _ReceiptPrinterEncoder_encodeStyle).call(this, item.property, item.value));
                }
            }
            if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").newline === '\n\r') {
                result.push([0x0a, 0x0d]);
            }
            if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").newline === '\n') {
                result.push([0x0a]);
            }
        }
        return Uint8Array.from(result.flat());
    }
    /**
     * Get all supported printer models
     *
     * @return {object}         An object with all supported printer models
     */
    static get printerModels() {
        return Object.entries(printerDefinitions).map((i) => ({ id: i[0], name: i[1].vendor + ' ' + i[1].model }));
    }
    /**
     * Get the current column width
     *
     * @return {number}         The column width in characters
     */
    get columns() {
        return __classPrivateFieldGet(this, _ReceiptPrinterEncoder_composer, "f").columns;
    }
    /**
     * Get the current language
     * @return {string}         The language that is currently used
     */
    get language() {
        return __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").language;
    }
}
_ReceiptPrinterEncoder_options = new WeakMap(), _ReceiptPrinterEncoder_queue = new WeakMap(), _ReceiptPrinterEncoder_language = new WeakMap(), _ReceiptPrinterEncoder_composer = new WeakMap(), _ReceiptPrinterEncoder_fontMapping = new WeakMap(), _ReceiptPrinterEncoder_codepageMapping = new WeakMap(), _ReceiptPrinterEncoder_codepageCandidates = new WeakMap(), _ReceiptPrinterEncoder_codepage = new WeakMap(), _ReceiptPrinterEncoder_state = new WeakMap(), _ReceiptPrinterEncoder_instances = new WeakSet(), _ReceiptPrinterEncoder_reset = function _ReceiptPrinterEncoder_reset() {
    __classPrivateFieldSet(this, _ReceiptPrinterEncoder_queue, [], "f");
    __classPrivateFieldSet(this, _ReceiptPrinterEncoder_codepage, __classPrivateFieldGet(this, _ReceiptPrinterEncoder_options, "f").language == 'esc-pos' ? 'cp437' : 'star/standard', "f");
    __classPrivateFieldGet(this, _ReceiptPrinterEncoder_state, "f").codepage = 0;
    __classPrivateFieldGet(this, _ReceiptPrinterEncoder_state, "f").font = 'A';
}, _ReceiptPrinterEncoder_encodeStyle = function _ReceiptPrinterEncoder_encodeStyle(property, value) {
    if (property === 'bold') {
        return __classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").bold(value);
    }
    if (property === 'underline') {
        return __classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").underline(value);
    }
    if (property === 'italic') {
        return __classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").italic(value);
    }
    if (property === 'invert') {
        return __classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").invert(value);
    }
    if (property === 'size') {
        return __classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").size(value.width, value.height);
    }
    return [];
}, _ReceiptPrinterEncoder_encodeText = function _ReceiptPrinterEncoder_encodeText(value, codepage) {
    if (codepage !== 'auto') {
        const fragment = CodepageEncoder.encode(value, codepage);
        if (__classPrivateFieldGet(this, _ReceiptPrinterEncoder_state, "f").codepage != __classPrivateFieldGet(this, _ReceiptPrinterEncoder_codepageMapping, "f")[codepage]) {
            __classPrivateFieldGet(this, _ReceiptPrinterEncoder_state, "f").codepage = __classPrivateFieldGet(this, _ReceiptPrinterEncoder_codepageMapping, "f")[codepage];
            return [...__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").codepage(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_codepageMapping, "f")[codepage]), ...fragment];
        }
        return [...fragment];
    }
    const fragments = CodepageEncoder.autoEncode(value, __classPrivateFieldGet(this, _ReceiptPrinterEncoder_codepageCandidates, "f"));
    const buffer = [];
    for (const fragment of fragments) {
        __classPrivateFieldGet(this, _ReceiptPrinterEncoder_state, "f").codepage = __classPrivateFieldGet(this, _ReceiptPrinterEncoder_codepageMapping, "f")[fragment.codepage];
        buffer.push(...__classPrivateFieldGet(this, _ReceiptPrinterEncoder_language, "f").codepage(__classPrivateFieldGet(this, _ReceiptPrinterEncoder_codepageMapping, "f")[fragment.codepage]), ...fragment.bytes);
    }
    return buffer;
};

module.exports = ReceiptPrinterEncoder;
