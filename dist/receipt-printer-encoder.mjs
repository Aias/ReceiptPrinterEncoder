"use strict";
var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/receipt-printer-encoder.ts
import Dither from "canvas-dither";
import Flatten from "canvas-flatten";
import CodepageEncoder3 from "@point-of-sale/codepage-encoder";
import ImageData from "@canvas/image-data";
import resizeImageData from "resize-image-data";

// src/languages/esc-pos.ts
import CodepageEncoder from "@point-of-sale/codepage-encoder";
var LanguageEscPos = class {
  /**
   * Initialize the printer
   * @returns {Array}         Array of bytes to send to the printer
   */
  initialize() {
    return [
      /* Initialize printer */
      [27, 64],
      /* Cancel Kanji mode */
      [28, 46],
      /* Set the font to A */
      [27, 77, 0]
    ];
  }
  /**
   * Change the font
   * @param {string} type     Font type ('A', 'B', or more)
   * @returns {Array}         Array of bytes to send to the printer
   */
  font(type) {
    let value = type.charCodeAt(0) - 65;
    return [27, 77, value];
  }
  /**
   * Change the alignment
   * @param {string} value    Alignment value ('left', 'center', 'right')
   * @returns {Array}         Array of bytes to send to the printer
   */
  align(value) {
    let align;
    switch (value) {
      case "center":
        align = 1;
        break;
      case "right":
        align = 2;
        break;
      case "left":
      default:
        align = 0;
    }
    return [27, 97, align];
  }
  /**
   * Generate a barcode
   * @param {string} value        Value to encode
   * @param {string|number} symbology    Barcode symbology
   * @param {object} options      Configuration object
   * @returns {Array}             Array of bytes to send to the printer
   */
  barcode(value, symbology, options) {
    let result = [];
    const symbologies = {
      "upca": 0,
      "upce": 1,
      "ean13": 2,
      "ean8": 3,
      "code39": 4,
      "coda39": 4,
      "itf": 5,
      "interleaved-2-of-5": 5,
      "nw-7": 6,
      "codabar": 6,
      "code93": 72,
      "code128": 73,
      "gs1-128": 72,
      "gs1-databar-omni": 75,
      "gs1-databar-truncated": 76,
      "gs1-databar-limited": 77,
      "gs1-databar-expanded": 78,
      "code128-auto": 79
    };
    if (typeof symbology === "string" && typeof symbologies[symbology] === "undefined") {
      throw new Error(`Symbology '${symbology}' not supported by language`);
    }
    if (options.width < 1 || options.width > 3) {
      throw new Error("Width must be between 1 and 3");
    }
    let width = options.width + 1;
    if (symbology === "itf") {
      width = options.width * 2;
    }
    if (symbology === "gs1-128" || symbology == "gs1-databar-omni" || symbology == "gs1-databar-truncated" || symbology == "gs1-databar-limited" || symbology == "gs1-databar-expanded") {
      width = options.width;
    }
    result.push([29, 104, options.height], [29, 119, width], [29, 72, options.text ? 2 : 0]);
    if (symbology == "code128" && !value.startsWith("{")) {
      value = "{B" + value;
    }
    if (symbology == "gs1-128") {
      console.log("gs1-128", value, value.replace(/[\(\)\*]/g, ""));
      value = value.replace(/[\(\)\*]/g, "");
    }
    const bytes = CodepageEncoder.encode(value, "ascii");
    const identifier = typeof symbology === "string" ? symbologies[symbology] : symbology;
    if (identifier > 64) {
      result.push([29, 107, identifier, bytes.length, ...bytes]);
    } else {
      result.push([29, 107, identifier, ...bytes, 0]);
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
    if (typeof options.model === "number") {
      const models = {
        1: 49,
        2: 50
      };
      if (options.model in models) {
        result.push([29, 40, 107, 4, 0, 49, 65, models[options.model], 0]);
      } else {
        throw new Error("Model must be 1 or 2");
      }
    }
    if (typeof options.size !== "number") {
      throw new Error("Size must be a number");
    }
    if (options.size < 1 || options.size > 8) {
      throw new Error("Size must be between 1 and 8");
    }
    result.push([29, 40, 107, 3, 0, 49, 67, options.size]);
    const errorlevels = {
      l: 48,
      m: 49,
      q: 50,
      h: 51
    };
    if (options.errorlevel in errorlevels) {
      result.push([29, 40, 107, 3, 0, 49, 69, errorlevels[options.errorlevel]]);
    } else {
      throw new Error("Error level must be l, m, q or h");
    }
    const bytes = CodepageEncoder.encode(value, "iso8859-1");
    const length = bytes.length + 3;
    result.push([29, 40, 107, length & 255, length >> 8 & 255, 49, 80, 48, ...bytes]);
    result.push([29, 40, 107, 3, 0, 49, 81, 48]);
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
    if (typeof options.columns !== "number") {
      throw new Error("Columns must be a number");
    }
    if (options.columns !== 0 && (options.columns < 1 || options.columns > 30)) {
      throw new Error("Columns must be 0, or between 1 and 30");
    }
    result.push([29, 40, 107, 3, 0, 48, 65, options.columns]);
    if (typeof options.rows !== "number") {
      throw new Error("Rows must be a number");
    }
    if (options.rows !== 0 && (options.rows < 3 || options.rows > 90)) {
      throw new Error("Rows must be 0, or between 3 and 90");
    }
    result.push([29, 40, 107, 3, 0, 48, 66, options.rows]);
    if (typeof options.width !== "number") {
      throw new Error("Width must be a number");
    }
    if (options.width < 2 || options.width > 8) {
      throw new Error("Width must be between 2 and 8");
    }
    result.push([29, 40, 107, 3, 0, 48, 67, options.width]);
    if (typeof options.height !== "number") {
      throw new Error("Height must be a number");
    }
    if (options.height < 2 || options.height > 8) {
      throw new Error("Height must be between 2 and 8");
    }
    result.push([29, 40, 107, 3, 0, 48, 68, options.height]);
    if (typeof options.errorlevel !== "number") {
      throw new Error("Errorlevel must be a number");
    }
    if (options.errorlevel < 0 || options.errorlevel > 8) {
      throw new Error("Errorlevel must be between 0 and 8");
    }
    result.push([29, 40, 107, 4, 0, 48, 69, 48, options.errorlevel + 48]);
    result.push([29, 40, 107, 3, 0, 48, 70, options.truncated ? 1 : 0]);
    const bytes = CodepageEncoder.encode(value, "ascii");
    const length = bytes.length + 3;
    result.push([29, 40, 107, length & 255, length >> 8 & 255, 48, 80, 48, ...bytes]);
    result.push([29, 40, 107, 3, 0, 48, 81, 48]);
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
    const getPixel = (x, y) => x < width && y < height ? image.data[(width * y + x) * 4] > 0 ? 0 : 1 : 0;
    const getColumnData = (width2, height2) => {
      const data = [];
      for (let s = 0; s < Math.ceil(height2 / 24); s++) {
        const bytes = new Uint8Array(width2 * 3);
        for (let x = 0; x < width2; x++) {
          for (let c = 0; c < 3; c++) {
            for (let b = 0; b < 8; b++) {
              bytes[x * 3 + c] |= getPixel(x, s * 24 + b + 8 * c) << 7 - b;
            }
          }
        }
        data.push(bytes);
      }
      return data;
    };
    const getRowData = (width2, height2) => {
      const bytes = new Uint8Array(width2 * height2 >> 3);
      for (let y = 0; y < height2; y++) {
        for (let x = 0; x < width2; x = x + 8) {
          for (let b = 0; b < 8; b++) {
            bytes[y * (width2 >> 3) + (x >> 3)] |= getPixel(x + b, y) << 7 - b;
          }
        }
      }
      return bytes;
    };
    if (mode == "column") {
      result.push([27, 51, 36]);
      getColumnData(width, height).forEach((bytes) => {
        result.push([27, 42, 33, width & 255, width >> 8 & 255, ...bytes, 10]);
      });
      result.push([27, 50]);
    }
    if (mode == "raster") {
      result.push([
        29,
        118,
        48,
        0,
        width >> 3 & 255,
        width >> 3 >> 8 & 255,
        height & 255,
        height >> 8 & 255,
        ...getRowData(width, height)
      ]);
    }
    return result;
  }
  /**
   * Cut the paper
   * @param {string} value    Cut type ('full' or 'partial')
   * @returns {Array}         Array of bytes to send to the printer
   */
  cut(value) {
    let data = 0;
    if (value == "partial") {
      data = 1;
    }
    return [29, 86, data];
  }
  /**
   * Send a pulse to the cash drawer
   * @param {number} device   Device number
   * @param {number} on       Pulse ON time
   * @param {number} off      Pulse OFF time
   * @returns {Array}         Array of bytes to send to the printer
   */
  pulse(device, on, off) {
    if (typeof device === "undefined") {
      device = 0;
    }
    if (typeof on === "undefined") {
      on = 100;
    }
    if (typeof off === "undefined") {
      off = 500;
    }
    on = Math.min(500, Math.round(on / 2));
    off = Math.min(500, Math.round(off / 2));
    return [27, 112, device ? 1 : 0, on & 255, off & 255];
  }
  /**
   * Enable or disable bold text
   * @param {boolean} value   Enable or disable bold text, optional, default toggles between states
   * @returns {Array}         Array of bytes to send to the printer
   */
  bold(value) {
    let data = 0;
    if (value) {
      data = 1;
    }
    return [27, 69, data];
  }
  /**
   * Enable or disable underline text
   * @param {boolean} value   Enable or disable underline text, optional, default toggles between states
   * @returns {Array}         Array of bytes to send to the printer
   */
  underline(value) {
    let data = 0;
    if (value) {
      data = 1;
    }
    return [27, 45, data];
  }
  /**
   * Enable or disable italic text
   * @param {boolean} value   Enable or disable italic text, optional, default toggles between states
   * @returns {Array}         Array of bytes to send to the printer
   */
  italic(value) {
    let data = 0;
    if (value) {
      data = 1;
    }
    return [27, 52, data];
  }
  /**
   * Enable or disable inverted text
   * @param {boolean} value   Enable or disable inverted text, optional, default toggles between states
   * @returns {Array}         Array of bytes to send to the printer
   */
  invert(value) {
    let data = 0;
    if (value) {
      data = 1;
    }
    return [29, 66, data];
  }
  /**
   * Change text size
   * @param {number} width    Width of the text (1-8)
   * @param {number} height   Height of the text (1-8)
   * @returns {Array}         Array of bytes to send to the printer
   */
  size(width, height) {
    return [29, 33, height - 1 | width - 1 << 4];
  }
  /**
   * Change the codepage
   * @param {number} value    Codepage value
   * @returns {Array}         Array of bytes to send to the printer
   */
  codepage(value) {
    return [27, 116, value];
  }
  /**
   * Flush the printers line buffer
   * @returns {Array}         Array of bytes to send to the printer
   */
  flush() {
    return [];
  }
};
var esc_pos_default = LanguageEscPos;

// src/languages/star-prnt.ts
import CodepageEncoder2 from "@point-of-sale/codepage-encoder";
var LanguageStarPrnt = class {
  /**
   * Initialize the printer
   * @returns {Array}         Array of bytes to send to the printer
   */
  initialize() {
    return [
      /* Initialize printer */
      27,
      64,
      24
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
      case "B":
        value = 1;
        break;
      case "C":
        value = 2;
        break;
      case "A":
      default:
        value = 0;
    }
    return [27, 30, 70, value];
  }
  /**
   * Change the alignment
   * @param {string} value    Alignment value ('left', 'center', 'right')
   * @returns {Array}         Array of bytes to send to the printer
   */
  align(value) {
    let align = 0;
    if (value === "center") {
      align = 1;
    } else if (value === "right") {
      align = 2;
    }
    return [27, 29, 97, align];
  }
  /**
   * Generate a barcode
   * @param {string} value        Value to encode
   * @param {string|number} symbology    Barcode symbology
   * @param {object} options      Configuration object
   * @returns {Array}             Array of bytes to send to the printer
   */
  barcode(value, symbology, options) {
    let result = [];
    const symbologies = {
      "upce": 0,
      "upca": 1,
      "ean8": 2,
      "ean13": 3,
      "code39": 4,
      "itf": 5,
      "interleaved-2-of-5": 5,
      "code128": 6,
      "code93": 7,
      "nw-7": 8,
      "codabar": 8,
      "gs1-128": 9,
      "gs1-databar-omni": 10,
      "gs1-databar-truncated": 11,
      "gs1-databar-limited": 12,
      "gs1-databar-expanded": 13
    };
    if (typeof symbology === "string" && typeof symbologies[symbology] === "undefined") {
      throw new Error(`Symbology '${symbology}' not supported by language`);
    }
    if (options.width < 1 || options.width > 3) {
      throw new Error("Width must be between 1 and 3");
    }
    if (symbology === "code128" && value.startsWith("{")) {
      value = value.slice(2);
    }
    const bytes = CodepageEncoder2.encode(value, "ascii");
    const identifier = typeof symbology === "string" ? symbologies[symbology] : symbology;
    result.push(27, 98, identifier, options.text ? 2 : 1, options.width, options.height, ...bytes, 30);
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
    const models = {
      1: 1,
      2: 2
    };
    if (options.model in models) {
      result.push([27, 29, 121, 83, 48, models[options.model]]);
    } else {
      throw new Error("Model must be 1 or 2");
    }
    if (typeof options.size !== "number") {
      throw new Error("Size must be a number");
    }
    if (options.size < 1 || options.size > 8) {
      throw new Error("Size must be between 1 and 8");
    }
    result.push([27, 29, 121, 83, 50, options.size]);
    const errorlevels = {
      l: 0,
      m: 1,
      q: 2,
      h: 3
    };
    if (options.errorlevel in errorlevels) {
      result.push([27, 29, 121, 83, 49, errorlevels[options.errorlevel]]);
    } else {
      throw new Error("Error level must be l, m, q or h");
    }
    const bytes = CodepageEncoder2.encode(value, "iso8859-1");
    const length = bytes.length;
    result.push([27, 29, 121, 68, 49, 0, length & 255, length >> 8 & 255, ...bytes]);
    result.push([27, 29, 121, 80]);
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
    if (typeof options.columns !== "number") {
      throw new Error("Columns must be a number");
    }
    if (options.columns !== 0 && (options.columns < 1 || options.columns > 30)) {
      throw new Error("Columns must be 0, or between 1 and 30");
    }
    if (typeof options.rows !== "number") {
      throw new Error("Rows must be a number");
    }
    if (options.rows !== 0 && (options.rows < 3 || options.rows > 90)) {
      throw new Error("Rows must be 0, or between 3 and 90");
    }
    result.push([27, 29, 120, 83, 48, 1, options.rows, options.columns]);
    if (typeof options.width !== "number") {
      throw new Error("Width must be a number");
    }
    if (options.width < 2 || options.width > 8) {
      throw new Error("Width must be between 2 and 8");
    }
    result.push([27, 29, 120, 83, 50, options.width]);
    if (typeof options.height !== "number") {
      throw new Error("Height must be a number");
    }
    if (options.height < 2 || options.height > 8) {
      throw new Error("Height must be between 2 and 8");
    }
    result.push([27, 29, 120, 83, 51, options.height]);
    if (typeof options.errorlevel !== "number") {
      throw new Error("Errorlevel must be a number");
    }
    if (options.errorlevel < 0 || options.errorlevel > 8) {
      throw new Error("Errorlevel must be between 0 and 8");
    }
    result.push([27, 29, 120, 83, 49, options.errorlevel]);
    const bytes = CodepageEncoder2.encode(value, "ascii");
    const length = bytes.length;
    result.push([27, 29, 120, 68, length & 255, length >> 8 & 255, ...bytes]);
    result.push([27, 29, 120, 80]);
    return result;
  }
  /**
   * Encode an image
   * @param {ImageData} image     ImageData object
   * @param {number} width        Width of the image
   * @param {number} height       Height of the image
   * @param {string} _mode         Image encoding mode (value is ignored)
   * @returns {Array}             Array of bytes to send to the printer
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  image(image, width, height, _mode) {
    let result = [];
    const getPixel = (x, y) => typeof image.data[(width * y + x) * 4] === "undefined" || image.data[(width * y + x) * 4] > 0 ? 0 : 1;
    result.push([27, 48]);
    for (let s = 0; s < height / 24; s++) {
      const y = s * 24;
      const bytes = new Uint8Array(width * 3);
      for (let x = 0; x < width; x++) {
        const i = x * 3;
        bytes[i] = getPixel(x, y + 0) << 7 | getPixel(x, y + 1) << 6 | getPixel(x, y + 2) << 5 | getPixel(x, y + 3) << 4 | getPixel(x, y + 4) << 3 | getPixel(x, y + 5) << 2 | getPixel(x, y + 6) << 1 | getPixel(x, y + 7);
        bytes[i + 1] = getPixel(x, y + 8) << 7 | getPixel(x, y + 9) << 6 | getPixel(x, y + 10) << 5 | getPixel(x, y + 11) << 4 | getPixel(x, y + 12) << 3 | getPixel(x, y + 13) << 2 | getPixel(x, y + 14) << 1 | getPixel(x, y + 15);
        bytes[i + 2] = getPixel(x, y + 16) << 7 | getPixel(x, y + 17) << 6 | getPixel(x, y + 18) << 5 | getPixel(x, y + 19) << 4 | getPixel(x, y + 20) << 3 | getPixel(x, y + 21) << 2 | getPixel(x, y + 22) << 1 | getPixel(x, y + 23);
      }
      result.push([27, 88, width & 255, width >> 8 & 255, ...bytes, 10, 13]);
    }
    result.push([27, 122, 1]);
    return result;
  }
  /**
   * Cut the paper
   * @param {string} value    Cut type ('full' or 'partial')
   * @returns {Array}         Array of bytes to send to the printer
   */
  cut(value) {
    let data = 0;
    if (value == "partial") {
      data = 1;
    }
    return [27, 100, data];
  }
  /**
   * Send a pulse to the cash drawer
   * @param {number} device   Device number
   * @param {number} on       Pulse ON time
   * @param {number} off      Pulse OFF time
   * @returns {Array}         Array of bytes to send to the printer
   */
  pulse(device, on, off) {
    if (typeof device === "undefined") {
      device = 0;
    }
    if (typeof on === "undefined") {
      on = 200;
    }
    if (typeof off === "undefined") {
      off = 200;
    }
    on = Math.min(127, Math.round(on / 10));
    off = Math.min(127, Math.round(off / 10));
    return [27, 7, on & 255, off & 255, device ? 26 : 7];
  }
  /**
   * Enable or disable bold text
   * @param {boolean} value   Enable or disable bold text, optional, default toggles between states
   * @returns {Array}         Array of bytes to send to the printer
   */
  bold(value) {
    let data = 70;
    if (value) {
      data = 69;
    }
    return [27, data];
  }
  /**
   * Enable or disable underline text
   * @param {boolean} value   Enable or disable underline text, optional, default toggles between states
   * @returns {Array}         Array of bytes to send to the printer
   */
  underline(value) {
    let data = 0;
    if (value) {
      data = 1;
    }
    return [27, 45, data];
  }
  /**
   * Enable or disable italic text
   * @param {boolean} _value   Enable or disable italic text, optional, default toggles between states (ignored for StarPRNT)
   * @returns {Array}         Array of bytes to send to the printer
   */
  italic(_value) {
    return [];
  }
  /**
   * Enable or disable inverted text
   * @param {boolean} value   Enable or disable inverted text, optional, default toggles between states
   * @returns {Array}         Array of bytes to send to the printer
   */
  invert(value) {
    let data = 53;
    if (value) {
      data = 52;
    }
    return [27, data];
  }
  /**
   * Change text size
   * @param {number} width    Width of the text (1-8)
   * @param {number} height   Height of the text (1-8)
   * @returns {Array}         Array of bytes to send to the printer
   */
  size(width, height) {
    return [27, 105, height - 1, width - 1];
  }
  /**
   * Change the codepage
   * @param {number} value    Codepage value
   * @returns {Array}         Array of bytes to send to the printer
   */
  codepage(value) {
    return [27, 29, 116, value];
  }
  /**
   * Flush the printers line buffer
   * @returns {Array}         Array of bytes to send to the printer
   */
  flush() {
    return [
      [27, 29, 80, 48],
      [27, 29, 80, 49]
    ];
  }
};
var star_prnt_default = LanguageStarPrnt;

// src/text-style.ts
var _default, _current, _callback;
var TextStyle = class {
  /**
   * Create a new TextStyle object
   *
   * @param  {object}   options   Object containing configuration options
   */
  constructor(options) {
    __privateAdd(this, _default, {
      bold: false,
      italic: false,
      underline: false,
      invert: false,
      width: 1,
      height: 1
    });
    __privateAdd(this, _current);
    __privateAdd(this, _callback);
    __privateSet(this, _current, structuredClone(__privateGet(this, _default)));
    __privateSet(this, _callback, options.callback || (() => {
    }));
  }
  /**
   * Return commands to get to the default style from the current style
   *
   * @return {array}   Array of modified properties
   */
  store() {
    const result = [];
    for (const property in __privateGet(this, _current)) {
      const key = property;
      const currentValue = __privateGet(this, _current)[key];
      const defaultValue = __privateGet(this, _default)[key];
      if (currentValue !== defaultValue) {
        if (key === "width" || key === "height") {
          result.push({
            type: "style",
            property: "size",
            value: { width: defaultValue, height: defaultValue }
          });
        } else {
          result.push({
            type: "style",
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
    for (const property in __privateGet(this, _current)) {
      const key = property;
      const currentValue = __privateGet(this, _current)[key];
      const defaultValue = __privateGet(this, _default)[key];
      if (currentValue !== defaultValue) {
        if (key === "width" || key === "height") {
          result.push({
            type: "style",
            property: "size",
            value: { width: currentValue, height: currentValue }
          });
        } else {
          result.push({
            type: "style",
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
    if (value !== __privateGet(this, _current).bold) {
      __privateGet(this, _current).bold = value;
      __privateGet(this, _callback).call(this, {
        type: "style",
        property: "bold",
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
    return __privateGet(this, _current).bold;
  }
  /**
   * Set the italic property
   *
   * @param  {boolean}   value   Is italic enabled, or not?
   */
  set italic(value) {
    if (value !== __privateGet(this, _current).italic) {
      __privateGet(this, _current).italic = value;
      __privateGet(this, _callback).call(this, {
        type: "style",
        property: "italic",
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
    return __privateGet(this, _current).italic;
  }
  /**
   * Set the underline property
   *
   * @param  {boolean}   value   Is underline enabled, or not?
   */
  set underline(value) {
    if (value !== __privateGet(this, _current).underline) {
      __privateGet(this, _current).underline = value;
      __privateGet(this, _callback).call(this, {
        type: "style",
        property: "underline",
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
    return __privateGet(this, _current).underline;
  }
  /**
   * Set the invert property
   *
   * @param  {boolean}   value   Is invert enabled, or not?
   */
  set invert(value) {
    if (value !== __privateGet(this, _current).invert) {
      __privateGet(this, _current).invert = value;
      __privateGet(this, _callback).call(this, {
        type: "style",
        property: "invert",
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
    return __privateGet(this, _current).invert;
  }
  /**
   * Set the width property
   *
   * @param  {number}   value   The width of a character
   */
  set width(value) {
    if (value !== __privateGet(this, _current).width) {
      __privateGet(this, _current).width = value;
      __privateGet(this, _callback).call(this, {
        type: "style",
        property: "size",
        value: { width: __privateGet(this, _current).width, height: __privateGet(this, _current).height }
      });
    }
  }
  /**
   * Get the width property
   *
   * @return {number}   The width of a character
   */
  get width() {
    return __privateGet(this, _current).width;
  }
  /**
   * Set the height property
   *
   * @param  {number}   value   The height of a character
   */
  set height(value) {
    if (value !== __privateGet(this, _current).height) {
      __privateGet(this, _current).height = value;
      __privateGet(this, _callback).call(this, {
        type: "style",
        property: "size",
        value: { width: __privateGet(this, _current).width, height: __privateGet(this, _current).height }
      });
    }
  }
  /**
   * Get the height property
   *
   * @return {number}   The height of a character
   */
  get height() {
    return __privateGet(this, _current).height;
  }
};
_default = new WeakMap();
_current = new WeakMap();
_callback = new WeakMap();
var text_style_default = TextStyle;

// src/text-wrap.ts
var TextWrap = class {
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
    for (const value2 of lines) {
      const chunks = value2.match(/[^\s-]+?-\b|\S+|\s+|\r\n?|\n/g) || ["~~empty~~"];
      for (const chunk of chunks) {
        if (chunk === "~~empty~~") {
          chunkedLines.push(line);
          line = [];
          length = 0;
          continue;
        }
        if (length + chunk.length * width > columns) {
          if (chunk.length * width > columns) {
            const remaining = columns - length;
            const letters = chunk.split("");
            let piece;
            const pieces = [];
            if (remaining > 8 * width) {
              piece = letters.splice(0, Math.floor(remaining / width)).join("");
              line.push(piece);
              chunkedLines.push(line);
              line = [];
              length = 0;
            }
            while ((piece = letters.splice(0, Math.floor(columns / width))).length) {
              pieces.push(piece.join(""));
            }
            for (const piece2 of pieces) {
              if (length + piece2.length * width > columns) {
                chunkedLines.push(line);
                line = [];
                length = 0;
              }
              line.push(piece2);
              length += piece2.length * width;
            }
            continue;
          }
          chunkedLines.push(line);
          line = [];
          length = 0;
        }
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
      let flattenedLine = chunkedLines[i].join("");
      if (i < chunkedLines.length - 1) {
        flattenedLine = flattenedLine.trimEnd();
      }
      result.push(flattenedLine);
    }
    return result;
  }
};
var text_wrap_default = TextWrap;

// src/line-composer.ts
var isCommandArray = (val) => Array.isArray(val) && val.length > 0 && Array.isArray(val[0]);
var isTextItem = (item) => item.type === "text";
var isSpaceItem = (item) => item.type === "space";
var isAlignItem = (item) => item.type === "align";
var isStyleItem = (item) => item.type === "style";
var _embedded, _columns, _align, _callback2, _cursor, _stored, _buffer, _LineComposer_instances, merge_fn;
var LineComposer = class {
  /**
   * Create a new LineComposer object
   *
   * @param  {object}   options   Object containing configuration options
   */
  constructor(options) {
    __privateAdd(this, _LineComposer_instances);
    __publicField(this, "style");
    __privateAdd(this, _embedded);
    __privateAdd(this, _columns);
    __privateAdd(this, _align);
    __privateAdd(this, _callback2);
    __privateAdd(this, _cursor, 0);
    __privateAdd(this, _stored);
    __privateAdd(this, _buffer, []);
    __privateSet(this, _embedded, options.embedded || false);
    __privateSet(this, _columns, options.columns || 42);
    __privateSet(this, _align, options.align || "left");
    __privateSet(this, _callback2, options.callback || (() => {
    }));
    this.style = new text_style_default({
      callback: (value) => {
        this.add(value, 0);
      }
    });
    __privateSet(this, _stored, this.style.store());
  }
  /**
   * Add text to the line, potentially wrapping it
   *
   * @param  {string}   value   Text to add to the line
   * @param  {string}   codepage   Codepage to use for the text
   */
  text(value, codepage) {
    const lines = text_wrap_default.wrap(value, { columns: __privateGet(this, _columns), width: this.style.width, indent: __privateGet(this, _cursor) });
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length) {
        this.add({ type: "text", value: lines[i], codepage }, lines[i].length * this.style.width);
        if (i < lines.length - 1) {
          this.flush();
        }
      } else {
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
    this.add({ type: "space", size }, size);
  }
  /**
   * Add raw bytes to to the line
   *
   * @param  {array}   value   Array of bytes to add to the line
   * @param  {number}  length  Length in characters of the value
   */
  raw(value, length) {
    if (isCommandArray(value)) {
      for (const command of value) {
        this.add({ type: "raw", value: command }, length || 0);
      }
    } else {
      this.add({ type: "raw", value }, length || 0);
    }
  }
  /**
   * Add an item to the line buffer, potentially flushing it
   *
   * @param  {object}   value   Item to add to the line buffer
   * @param  {number}   length  Length in characters of the value
   */
  add(value, length) {
    if (length + __privateGet(this, _cursor) > __privateGet(this, _columns)) {
      this.flush();
    }
    __privateSet(this, _cursor, __privateGet(this, _cursor) + length);
    __privateSet(this, _buffer, __privateGet(this, _buffer).concat(Array.isArray(value) ? value : [value]));
  }
  /**
   * Move the cursor to the end of the line, forcing a flush
   * with the next item to add to the line buffer
   */
  end() {
    __privateSet(this, _cursor, __privateGet(this, _columns));
  }
  /**
   * Fetch the contents of line buffer
   *
   * @param  {options}   options   Options for flushing the buffer
   * @return {array}               Array of items in the line buffer
   */
  fetch(options) {
    if (__privateGet(this, _cursor) === 0 && !options.forceNewline && !options.forceFlush) {
      return [];
    }
    const align = {
      current: __privateGet(this, _align),
      next: null
    };
    for (let i = 0; i < __privateGet(this, _buffer).length - 1; i++) {
      const item = __privateGet(this, _buffer)[i];
      if (isAlignItem(item)) {
        align.current = item.value;
      }
    }
    if (__privateGet(this, _buffer).length) {
      const last = __privateGet(this, _buffer)[__privateGet(this, _buffer).length - 1];
      if (last.type === "align") {
        align.next = last.value;
      }
    }
    __privateSet(this, _align, align.current);
    let result = [];
    const restore = this.style.restore();
    const store = this.style.store();
    if (__privateGet(this, _cursor) === 0 && options.ignoreAlignment) {
      result = __privateMethod(this, _LineComposer_instances, merge_fn).call(this, [...__privateGet(this, _stored), ...__privateGet(this, _buffer), ...store]);
    } else {
      if (__privateGet(this, _align) === "right") {
        let last;
        for (let i = __privateGet(this, _buffer).length - 1; i >= 0; i--) {
          if (__privateGet(this, _buffer)[i].type === "text" || __privateGet(this, _buffer)[i].type === "space") {
            last = i;
            break;
          }
        }
        if (typeof last === "number") {
          const lastItem = __privateGet(this, _buffer)[last];
          if (isSpaceItem(lastItem) && lastItem.size > this.style.width) {
            lastItem.size -= this.style.width;
            __privateSet(this, _cursor, __privateGet(this, _cursor) - this.style.width);
          }
          if (isTextItem(lastItem) && lastItem.value.endsWith(" ")) {
            lastItem.value = lastItem.value.slice(0, -1);
            __privateSet(this, _cursor, __privateGet(this, _cursor) - this.style.width);
          }
        }
        result = __privateMethod(this, _LineComposer_instances, merge_fn).call(this, [
          { type: "space", size: __privateGet(this, _columns) - __privateGet(this, _cursor) },
          ...__privateGet(this, _stored),
          ...__privateGet(this, _buffer),
          ...store
        ]);
      }
      if (__privateGet(this, _align) === "center") {
        const left = __privateGet(this, _columns) - __privateGet(this, _cursor) >> 1;
        result = __privateMethod(this, _LineComposer_instances, merge_fn).call(this, [
          { type: "space", size: left },
          ...__privateGet(this, _stored),
          ...__privateGet(this, _buffer),
          ...store,
          { type: "space", size: __privateGet(this, _embedded) ? __privateGet(this, _columns) - __privateGet(this, _cursor) - left : 0 }
        ]);
      }
      if (__privateGet(this, _align) === "left") {
        result = __privateMethod(this, _LineComposer_instances, merge_fn).call(this, [
          ...__privateGet(this, _stored),
          ...__privateGet(this, _buffer),
          ...store,
          { type: "space", size: __privateGet(this, _embedded) ? __privateGet(this, _columns) - __privateGet(this, _cursor) : 0 }
        ]);
      }
    }
    __privateSet(this, _stored, restore);
    __privateSet(this, _buffer, []);
    __privateSet(this, _cursor, 0);
    if (result.length === 0 && options.forceNewline) {
      result.push({ type: "empty" });
    }
    if (align.next) {
      __privateSet(this, _align, align.next);
    }
    return result;
  }
  /**
   * Flush the contents of the line buffer
   *
   * @param  {options}   options   Options for flushing the buffer
   */
  flush(options) {
    options = Object.assign(
      {
        forceNewline: false,
        forceFlush: false,
        ignoreAlignment: false
      },
      options || {}
    );
    const result = this.fetch(options);
    if (result.length) {
      __privateGet(this, _callback2).call(this, result);
    }
  }
  /**
   * Get the current position of the cursor
   *
   * @return {number}   Current position of the cursor
   */
  get cursor() {
    return __privateGet(this, _cursor);
  }
  /**
   * Set the alignment of the current line
   *
   * @param  {string}   value   Text alignment, can be 'left', 'center', or 'right'
   */
  set align(value) {
    this.add({ type: "align", value }, 0);
  }
  /**
   * Get the alignment of the current line
   *
   * @return {string}   Text alignment, can be 'left', 'center', or 'right'
   */
  get align() {
    let align = __privateGet(this, _align);
    for (let i = 0; i < __privateGet(this, _buffer).length; i++) {
      const item = __privateGet(this, _buffer)[i];
      if (isAlignItem(item)) {
        align = item.value;
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
    __privateSet(this, _columns, value);
  }
  /**
   * Get the number of columns of the current line
   *
   * @return {number}   columns of the line
   */
  get columns() {
    return __privateGet(this, _columns);
  }
};
_embedded = new WeakMap();
_columns = new WeakMap();
_align = new WeakMap();
_callback2 = new WeakMap();
_cursor = new WeakMap();
_stored = new WeakMap();
_buffer = new WeakMap();
_LineComposer_instances = new WeakSet();
/**
 * Merge text items and spaces in the line buffer
 *
 * @param  {array}   items   Array of items
 * @return {array}           Array of merged items
 */
merge_fn = function(items) {
  const result = [];
  let last = -1;
  function isTextItem2(item) {
    return item.type === "text";
  }
  for (let item of items) {
    if (item.type === "space" && "size" in item && item.size > 0) {
      item = { type: "text", value: " ".repeat(item.size), codepage: null };
    }
    if (isTextItem2(item)) {
      const lastItem = result[last];
      const allowMerge = last >= 0 && isTextItem2(lastItem) && (lastItem.codepage === item.codepage || lastItem.codepage === null || item.codepage === null);
      if (allowMerge) {
        lastItem.value += item.value;
        lastItem.codepage = lastItem.codepage || item.codepage;
        continue;
      }
      result.push(item);
      last++;
    } else if (isStyleItem(item) && item.property === "size") {
      const lastItem = result[last];
      const allowMerge = last >= 0 && isStyleItem(lastItem) && lastItem.property === "size";
      if (allowMerge) {
        lastItem.value = item.value;
        continue;
      }
      result.push(item);
      last++;
    } else if (item.type === "style" || item.type === "raw") {
      result.push(item);
      last++;
    }
  }
  return result;
};
var line_composer_default = LineComposer;

// generated/mapping.ts
var codepageMappings = {
  "esc-pos": {
    "bixolon/legacy": [
      "cp437",
      "epson/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
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
      "cp858"
    ],
    bixolon: [
      "cp437",
      "epson/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
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
      "windows1252",
      "cp866",
      "cp852",
      "cp858",
      null,
      "cp862",
      "cp864",
      "thai42",
      "windows1253",
      "windows1254",
      "windows1257",
      null,
      "windows1251",
      "cp737",
      "cp775",
      "thai14",
      "bixolon/hebrew",
      "windows1255",
      "thai11",
      "thai18",
      "cp885",
      "cp857",
      "iso8859-7",
      "thai16",
      "windows1256",
      "windows1258",
      "khmer",
      null,
      null,
      null,
      "bixolon/cp866",
      "windows1250",
      null,
      "tcvn3",
      "tcvn3capitals",
      "viscii"
    ],
    citizen: [
      "cp437",
      "epson/katakana",
      "cp858",
      "cp860",
      "cp863",
      "cp865",
      "cp852",
      "cp866",
      "cp857",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "windows1252",
      null,
      null,
      null,
      null,
      "thai11",
      null,
      null,
      null,
      null,
      "thai13",
      null,
      null,
      null,
      "tcvn3",
      "tcvn3capitals",
      "windows1258",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "cp864"
    ],
    "epson/legacy": [
      "cp437",
      "epson/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
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
      "windows1252",
      "cp866",
      "cp852",
      "cp858"
    ],
    epson: [
      "cp437",
      "epson/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
      null,
      null,
      null,
      null,
      null,
      "cp851",
      "cp853",
      "cp857",
      "cp737",
      "iso8859-7",
      "windows1252",
      "cp866",
      "cp852",
      "cp858",
      "thai42",
      "thai11",
      null,
      null,
      null,
      null,
      "thai13",
      null,
      null,
      null,
      "tcvn3",
      "tcvn3capitals",
      "cp720",
      "cp775",
      "cp855",
      "cp861",
      "cp862",
      "cp864",
      "cp869",
      "epson/iso8859-2",
      "iso8859-15",
      "cp1098",
      "cp774",
      "cp772",
      "cp1125",
      "windows1250",
      "windows1251",
      "windows1253",
      "windows1254",
      "windows1255",
      "windows1256",
      "windows1257",
      "windows1258",
      "rk1048"
    ],
    fujitsu: [
      "cp437",
      "epson/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
      null,
      null,
      "cp857",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "windows1252",
      "cp866",
      "cp852",
      "cp858",
      null,
      null,
      null,
      null,
      null,
      null,
      "thai13",
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
      "cp864"
    ],
    hp: [
      "cp437",
      "cp850",
      "cp852",
      "cp860",
      "cp863",
      "cp865",
      "cp858",
      "cp866",
      "windows1252",
      "cp862",
      "cp737",
      "cp874",
      "cp857",
      "windows1251",
      "windows1255",
      "rk1048"
    ],
    metapace: [
      "cp437",
      "epson/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
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
      "cp858"
    ],
    mpt: [
      "cp437",
      null,
      "cp850",
      "cp860",
      "cp863",
      "cp865",
      "windows1251",
      "cp866",
      "cp3021",
      "cp3012"
    ],
    "pos-5890": [
      "cp437",
      "epson/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
      "iso8859-1",
      null,
      "cp862",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "windows1252",
      "cp866",
      "cp852",
      "cp858",
      null,
      null,
      null,
      "windows1251",
      "cp737",
      "windows1257",
      null,
      "windows1258",
      "cp864",
      null,
      null,
      null,
      "windows1255",
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
      "cp861",
      null,
      null,
      null,
      "cp855",
      "cp857",
      null,
      null,
      null,
      "cp851",
      "cp869",
      null,
      "cp772",
      "cp774",
      null,
      null,
      "windows1250",
      null,
      "cp3840",
      null,
      "cp3843",
      "cp3844",
      "cp3845",
      "cp3846",
      "cp3847",
      "cp3848",
      null,
      "cp771",
      "cp3001",
      "cp3002",
      "cp3011",
      "cp3012",
      null,
      "cp3041",
      "windows1253",
      "windows1254",
      "windows1256",
      "cp720",
      null,
      "cp775"
    ],
    "pos-8360": [
      "cp437",
      "epson/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
      "iso8859-1",
      "windows1253",
      "cp862",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "windows1252",
      "cp866",
      "cp852",
      "cp858",
      null,
      "latvian",
      null,
      "windows1251",
      "cp737",
      "windows1257",
      null,
      "windows1258",
      "cp864",
      null,
      null,
      "pos8360/hebrew",
      "windows1255",
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
      "cp861",
      null,
      null,
      null,
      "cp855",
      "cp857",
      null,
      null,
      null,
      "cp851",
      "cp869",
      null,
      "cp772",
      "cp774",
      null,
      null,
      "windows1250",
      null,
      "cp3840",
      null,
      "cp3843",
      "cp3844",
      "cp3845",
      "cp3846",
      "cp3847",
      "cp3848",
      null,
      "cp771",
      "cp3001",
      "cp3002",
      "cp3011",
      "cp3012",
      null,
      null,
      null,
      "windows1254",
      "windows1256",
      "cp720",
      null,
      "cp775"
    ],
    star: [
      "cp437",
      "star/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
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
      "windows1252",
      "cp866",
      "cp852",
      "cp858",
      "thai42",
      "thai11",
      "thai13",
      "thai14",
      "thai16",
      null,
      "thai18"
    ],
    xprinter: [
      "cp437",
      "epson/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
      "iso8859-1",
      "windows1253",
      "xprinter/hebrew",
      "cp3012",
      null,
      "windows1255",
      null,
      null,
      null,
      null,
      "windows1252",
      "cp866",
      "cp852",
      "cp858",
      null,
      "latvian",
      "cp864",
      "windows1251",
      "cp737",
      "windows1257",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "windows1256"
    ],
    youku: [
      "cp437",
      "epson/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
      "windows1251",
      "cp866",
      "cp3021",
      "cp3012",
      null,
      null,
      null,
      null,
      null,
      "cp862",
      "windows1252",
      null,
      "cp852",
      "cp858",
      null,
      null,
      "cp864",
      "iso8859-1",
      "cp737",
      "windows1257",
      null,
      null,
      "cp855",
      "cp857",
      "windows1250",
      "cp775",
      "windows1254",
      "windows1255",
      "windows1256",
      "windows1258",
      null,
      null,
      "iso8859-1",
      null,
      null,
      null,
      null,
      null,
      "iso8859-15",
      null,
      null,
      "cp874"
    ],
    zijang: [
      "cp437",
      "epson/katakana",
      "cp850",
      "cp860",
      "cp863",
      "cp865",
      "iso8859-1",
      null,
      "cp862",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "windows1252",
      "cp866",
      "cp852",
      "cp858",
      null,
      null,
      null,
      "windows1251",
      "cp737",
      "windows1257",
      null,
      "windows1258",
      "cp864",
      null,
      null,
      null,
      "windows1255",
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
      "cp861",
      null,
      null,
      null,
      "cp855",
      "cp857",
      null,
      null,
      null,
      "cp851",
      "cp869",
      null,
      "cp772",
      "cp774",
      null,
      null,
      "windows1250",
      null,
      "cp3840",
      null,
      "cp3843",
      "cp3844",
      "cp3845",
      "cp3846",
      "cp3847",
      "cp3848",
      null,
      "cp771",
      "cp3001",
      "cp3002",
      "cp3011",
      "cp3012",
      null,
      "cp3041",
      "windows1253",
      "windows1254",
      "windows1256",
      "cp720",
      null,
      "cp775"
    ]
  },
  "star-prnt": {
    star: [
      "star/standard",
      "cp437",
      "star/katakana",
      null,
      "cp858",
      "cp852",
      "cp860",
      "cp861",
      "cp863",
      "cp865",
      "cp866",
      "cp855",
      "cp857",
      "cp862",
      "cp864",
      "cp737",
      "cp851",
      "cp869",
      "star/cp928",
      "cp772",
      "cp774",
      "star/cp874",
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
      "windows1252",
      "windows1250",
      "windows1251",
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
      "cp3840",
      "cp3841",
      "cp3843",
      "cp3844",
      "cp3845",
      "cp3846",
      "cp3847",
      "cp3848",
      "cp1001",
      "cp771",
      "cp3001",
      "cp3002",
      "cp3011",
      "cp3012",
      "cp3021",
      "cp3041"
    ]
  },
  "star-line": {
    star: [
      "star/standard",
      "cp437",
      "star/katakana",
      null,
      "cp858",
      "cp852",
      "cp860",
      "cp861",
      "cp863",
      "cp865",
      "cp866",
      "cp855",
      "cp857",
      "cp862",
      "cp864",
      "cp737",
      "cp851",
      "cp869",
      "star/cp928",
      "cp772",
      "cp774",
      "star/cp874",
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
      "windows1252",
      "windows1250",
      "windows1251",
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
      "cp3840",
      "cp3841",
      "cp3843",
      "cp3844",
      "cp3845",
      "cp3846",
      "cp3847",
      "cp3848",
      "cp1001",
      "cp771",
      "cp3001",
      "cp3002",
      "cp3011",
      "cp3012",
      "cp3021",
      "cp3041"
    ]
  }
};
var mapping_default = codepageMappings;

// generated/printers.ts
var printerDefinitions = {
  "bixolon-srp350": { vendor: "Bixolon", model: "SRP-350", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "bixolon/legacy", fonts: { A: { size: "12x24", columns: 42 }, B: { size: "9x17", columns: 56 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: false, models: [] }, pdf417: { supported: false }, cutter: { feed: 4 } } },
  "bixolon-srp350iii": { vendor: "Bixolon", model: "SRP-350III", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "bixolon", fonts: { A: { size: "12x24", columns: 42 }, B: { size: "9x17", columns: 56 }, C: { size: "9x24", columns: 56 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: ["2"] }, pdf417: { supported: true }, cutter: { feed: 4 } } },
  "citizen-ct-s310ii": { vendor: "Citizen", model: "CT-S310II", media: { dpi: 203, width: 80 }, capabilities: { language: "esc-pos", codepages: "citizen", fonts: { A: { size: "12x24", columns: 48 }, B: { size: "9x24", columns: 64 }, C: { size: "8x16", columns: 72 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 3 } } },
  "epson-tm-p20ii": { vendor: "Epson", model: "TM-P20II", media: { dpi: 203, width: 58 }, capabilities: { language: "esc-pos", codepages: "epson", fonts: { A: { size: "12x24", columns: 32 }, B: { size: "9x24", columns: 42 }, C: { size: "9x17", columns: 42 }, D: { size: "10x24", columns: 38 }, E: { size: "8x16", columns: 48 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded", "code128-auto"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, images: { mode: "raster" }, cutter: { feed: 3 } } },
  "epson-tm-t20iii": { vendor: "Epson", model: "TM-T20III", interfaces: { usb: { productName: "TM-T20III" } }, media: { dpi: 203, width: 80 }, capabilities: { language: "esc-pos", codepages: "epson", fonts: { A: { size: "12x24", columns: 48 }, B: { size: "9x17", columns: 64 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 4 } } },
  "epson-tm-t70": { vendor: "Epson", model: "TM-T70", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "epson/legacy", fonts: { A: { size: "12x24", columns: 42 }, B: { size: "9x17", columns: 56 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, images: { mode: "raster" }, cutter: { feed: 4 } } },
  "epson-tm-t70ii": { vendor: "Epson", model: "TM-T70II", "interface": { usb: { productName: "TM-T70II" } }, media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "epson", fonts: { A: { size: "12x24", columns: 42 }, B: { size: "9x17", columns: 56 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, images: { mode: "raster" }, cutter: { feed: 4 } } },
  "epson-tm-t88ii": { vendor: "Epson", model: "TM-T88II", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "epson/legacy", fonts: { A: { size: "12x24", columns: 42 }, B: { size: "9x17", columns: 56 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 4 } } },
  "epson-tm-t88iii": { vendor: "Epson", model: "TM-T88III", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "epson/legacy", fonts: { A: { size: "12x24", columns: 42 }, B: { size: "9x17", columns: 56 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 4 } } },
  "epson-tm-t88iv": { vendor: "Epson", model: "TM-T88IV", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "epson/legacy", fonts: { A: { size: "12x24", columns: 42 }, B: { size: "9x17", columns: 56 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 4 } } },
  "epson-tm-t88v": { vendor: "Epson", model: "TM-T88V", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "epson", fonts: { A: { size: "12x24", columns: 42 }, B: { size: "9x17", columns: 56 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 4 } } },
  "epson-tm-t88vi": { vendor: "Epson", model: "TM-T88VI", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "epson", fonts: { A: { size: "12x24", columns: 42 }, B: { size: "9x17", columns: 56 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 4 } } },
  "epson-tm-t88vii": { vendor: "Epson", model: "TM-T88VII", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "epson", fonts: { A: { size: "12x24", columns: 42 }, B: { size: "9x17", columns: 56 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded", "code128-auto"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 4 } } },
  "fujitsu-fp1000": { vendor: "Fujitsu", model: "FP-1000", media: { dpi: 203, width: 80 }, capabilities: { language: "esc-pos", codepages: "fujitsu", fonts: { A: { size: "12x24", columns: 48 }, B: { size: "9x24", columns: 56 }, C: { size: "8x16", columns: 64 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: false }, cutter: { feed: 4 } } },
  "hp-a779": { vendor: "HP", model: "A779", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "hp", newline: "\n", fonts: { A: { size: "12x24", columns: 44 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: false, fallback: { type: "barcode", symbology: 75 } }, cutter: { feed: 4 } } },
  "metapace-t1": { vendor: "Metapace", model: "T-1", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "metapace", fonts: { A: { size: "12x24", columns: 42 }, B: { size: "9x17", columns: 56 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: false, models: [] }, pdf417: { supported: false }, cutter: { feed: 4 } } },
  "mpt-ii": { vendor: "", model: "MPT-II", media: { dpi: 180, width: 80 }, capabilities: { language: "esc-pos", codepages: "mpt", fonts: { A: { size: "12x24", columns: 48 }, B: { size: "9x17", columns: 64 }, C: { size: "0x0", columns: 64 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: [] }, pdf417: { supported: false } } },
  "pos-5890": { vendor: "", model: "POS-5890", media: { dpi: 203, width: 58 }, capabilities: { language: "esc-pos", codepages: "pos-5890", fonts: { A: { size: "12x24", columns: 32 }, B: { size: "9x17", columns: 42 } }, barcodes: { supported: true, symbologies: ["upca", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: ["2"] }, pdf417: { supported: true }, images: { mode: "raster" }, cutter: { feed: 1 } } },
  "pos-8360": { vendor: "", model: "POS-8360", media: { dpi: 203, width: 80 }, capabilities: { language: "esc-pos", codepages: "pos-8360", fonts: { A: { size: "12x24", columns: 48 }, B: { size: "9x17", columns: 64 } }, barcodes: { supported: true, symbologies: ["upca", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: ["2"] }, pdf417: { supported: true }, images: { mode: "raster" }, cutter: { feed: 4 } } },
  "star-mc-print2": { vendor: "Star", model: "mC-Print2", interfaces: { usb: { productName: "mC-Print2" } }, media: { dpi: 203, width: 58 }, capabilities: { language: "star-prnt", codepages: "star", fonts: { A: { size: "12x24", columns: 32 }, B: { size: "9x24", columns: 42 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "itf", "codabar", "code93", "code128", "gs1-128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 3 } } },
  "star-mpop": { vendor: "Star", model: "mPOP", interfaces: { usb: { productName: "mPOP" } }, media: { dpi: 203, width: 58 }, capabilities: { language: "star-prnt", codepages: "star", fonts: { A: { size: "12x24", columns: 32 }, B: { size: "9x24", columns: 42 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "itf", "codabar", "code93", "code128", "gs1-128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 3 } } },
  "star-sm-l200": { vendor: "Star", model: "SM-L200", media: { dpi: 203, width: 58 }, capabilities: { language: "star-prnt", codepages: "star", fonts: { A: { size: "12x24", columns: 32 }, B: { size: "9x24", columns: 42 }, C: { size: "9x17", columns: 42 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: ["2"] }, pdf417: { supported: true } } },
  "star-tsp100iii": { vendor: "Star", model: "TSP100III", media: { dpi: 203, width: 80 }, capabilities: { language: "star-prnt", codepages: "star", fonts: { A: { size: "12x24", columns: 48 }, B: { size: "9x24", columns: 64 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 3 } } },
  "star-tsp100iv": { vendor: "Star", model: "TSP100IV", media: { dpi: 203, width: 80 }, capabilities: { language: "star-prnt", codepages: "star", fonts: { A: { size: "12x24", columns: 48 }, B: { size: "9x24", columns: 64 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 3 } } },
  "star-tsp650": { vendor: "Star", model: "TSP650", media: { dpi: 203, width: 80 }, capabilities: { language: "star-line", codepages: "star", fonts: { A: { size: "12x24", columns: 48 }, B: { size: "9x24", columns: 64 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: false, models: [] }, pdf417: { supported: false }, cutter: { feed: 3 } } },
  "star-tsp650ii": { vendor: "Star", model: "TSP650II", media: { dpi: 203, width: 80 }, capabilities: { language: "star-line", codepages: "star", fonts: { A: { size: "12x24", columns: 48 }, B: { size: "9x24", columns: 64 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-128", "gs1-databar-omni", "gs1-databar-truncated", "gs1-databar-limited", "gs1-databar-expanded"] }, qrcode: { supported: true, models: ["1", "2"] }, pdf417: { supported: true }, cutter: { feed: 3 } } },
  "xprinter-xp-n160ii": { vendor: "Xprinter", model: "XP-N160II", interfaces: { usb: { productName: "Printer-80\0" } }, media: { dpi: 203, width: 80 }, capabilities: { language: "esc-pos", codepages: "xprinter", fonts: { A: { size: "12x24", columns: 48 }, B: { size: "9x17", columns: 64 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-128"] }, qrcode: { supported: true, models: ["2"] }, pdf417: { supported: true }, cutter: { feed: 4 } } },
  "xprinter-xp-t80q": { vendor: "Xprinter", model: "XP-T80Q", media: { dpi: 203, width: 80 }, capabilities: { language: "esc-pos", codepages: "xprinter", fonts: { A: { size: "12x24", columns: 48 }, B: { size: "9x17", columns: 64 } }, barcodes: { supported: true, symbologies: ["upca", "upce", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128", "gs1-128"] }, qrcode: { supported: true, models: ["2"] }, pdf417: { supported: true }, cutter: { feed: 4 } } },
  "youku-58t": { vendor: "Youku", model: "58T", media: { dpi: 203, width: 58 }, capabilities: { language: "esc-pos", codepages: "youku", fonts: { A: { size: "12x24", columns: 32 }, B: { size: "9x24", columns: 42 } }, barcodes: { supported: true, symbologies: ["upca", "ean13", "ean8", "code39", "itf", "codabar", "code93", "code128"] }, qrcode: { supported: true, models: ["2"] }, pdf417: { supported: false } } }
};
var printers_default = printerDefinitions;

// src/receipt-printer-encoder.ts
var printerDefinitions2 = printers_default;
var codepageMappings2 = mapping_default;
var defaultConfiguration = {
  columns: 42,
  language: "esc-pos",
  imageMode: "column",
  feedBeforeCut: 0,
  newline: "\n\r",
  codepageMapping: "epson",
  // codepageCandidates: null,
  debug: false,
  embedded: false,
  createCanvas: null,
  errors: "relaxed"
};
var _options, _queue, _language, _composer, _printerCapabilities, _codepageMapping, _codepageCandidates, _codepage, _state, _ReceiptPrinterEncoder_instances, reset_fn, encodeStyle_fn, encodeText_fn, error_fn;
var _ReceiptPrinterEncoder = class _ReceiptPrinterEncoder {
  /**
   * Create a new object
   *
   * @param  {object}   options   Object containing configuration options
   */
  constructor(options) {
    __privateAdd(this, _ReceiptPrinterEncoder_instances);
    __privateAdd(this, _options, defaultConfiguration);
    __privateAdd(this, _queue, []);
    __privateAdd(this, _language);
    __privateAdd(this, _composer);
    __privateAdd(this, _printerCapabilities, {
      language: defaultConfiguration.language,
      codepages: defaultConfiguration.codepageMapping,
      fonts: {
        A: { size: "12x24", columns: 42 },
        B: { size: "9x24", columns: 56 }
      },
      barcodes: {
        supported: true,
        symbologies: [
          "upca",
          "upce",
          "ean13",
          "ean8",
          "code39",
          "itf",
          "codabar",
          "code93",
          "code128",
          "gs1-databar-omni",
          "gs1-databar-truncated",
          "gs1-databar-limited",
          "gs1-databar-expanded"
        ]
      },
      qrcode: {
        supported: true,
        models: ["1", "2"]
      },
      pdf417: {
        supported: true
      }
    });
    __privateAdd(this, _codepageMapping);
    __privateAdd(this, _codepageCandidates);
    __privateAdd(this, _codepage, "cp437");
    __privateAdd(this, _state, {
      codepage: 0,
      font: "A"
    });
    options = options || {};
    const defaults = {
      ...defaultConfiguration
    };
    if (typeof options.language === "string") {
      defaults.columns = options.language === "esc-pos" ? 42 : 48;
      defaults.codepageMapping = options.language === "esc-pos" ? "epson" : "star";
    }
    if (typeof options.printerModel === "string") {
      if (typeof printerDefinitions2[options.printerModel] === "undefined") {
        throw new Error("Unknown printer model");
      }
      __privateSet(this, _printerCapabilities, printerDefinitions2[options.printerModel].capabilities);
      defaults.columns = __privateGet(this, _printerCapabilities).fonts["A"].columns;
      defaults.language = __privateGet(this, _printerCapabilities).language;
      defaults.codepageMapping = __privateGet(this, _printerCapabilities).codepages || defaults.codepageMapping;
      defaults.newline = __privateGet(this, _printerCapabilities)?.newline || defaults.newline;
      defaults.feedBeforeCut = __privateGet(this, _printerCapabilities)?.cutter?.feed || defaults.feedBeforeCut;
      defaults.imageMode = __privateGet(this, _printerCapabilities)?.images?.mode || defaults.imageMode;
    }
    if (options) {
      __privateSet(this, _options, Object.assign(defaults, options));
    }
    if (__privateGet(this, _options).width) {
      __privateGet(this, _options).columns = __privateGet(this, _options).width;
    }
    if (__privateGet(this, _options).language === "esc-pos") {
      __privateSet(this, _language, new esc_pos_default());
    } else if (__privateGet(this, _options).language === "star-prnt" || __privateGet(this, _options).language === "star-line") {
      __privateSet(this, _language, new star_prnt_default());
    } else {
      throw new Error("The specified language is not supported");
    }
    if (typeof __privateGet(this, _options).autoFlush === "undefined") {
      __privateGet(this, _options).autoFlush = !__privateGet(this, _options).embedded && __privateGet(this, _options).language == "star-prnt";
    }
    if (![32, 35, 42, 44, 48].includes(__privateGet(this, _options).columns) && !__privateGet(this, _options).embedded) {
      throw new Error("The width of the paper must me either 32, 35, 42, 44 or 48 columns");
    }
    if (typeof __privateGet(this, _options).codepageMapping === "string") {
      if (typeof codepageMappings2[__privateGet(this, _options).language][__privateGet(this, _options).codepageMapping] === "undefined") {
        throw new Error("Unknown codepage mapping");
      }
      __privateSet(this, _codepageMapping, Object.fromEntries(
        codepageMappings2[__privateGet(this, _options).language][__privateGet(this, _options).codepageMapping].map((v, i) => [v, i]).filter((i) => i)
      ));
    } else {
      __privateSet(this, _codepageMapping, __privateGet(this, _options).codepageMapping);
    }
    if (__privateGet(this, _options).codepageCandidates) {
      __privateSet(this, _codepageCandidates, __privateGet(this, _options).codepageCandidates);
    } else {
      __privateSet(this, _codepageCandidates, Object.keys(__privateGet(this, _codepageMapping)));
    }
    __privateSet(this, _composer, new line_composer_default({
      embedded: __privateGet(this, _options).embedded,
      columns: __privateGet(this, _options).columns,
      align: "left",
      // size: 1,
      callback: (value) => __privateGet(this, _queue).push(value)
    }));
    __privateMethod(this, _ReceiptPrinterEncoder_instances, reset_fn).call(this);
  }
  /**
   * Initialize the printer
   *
   * @return {object}          Return the object, for easy chaining commands
   *
   */
  initialize() {
    if (__privateGet(this, _options).embedded) {
      throw new Error("Initialize is not supported in table cells or boxes");
    }
    __privateGet(this, _composer).raw(__privateGet(this, _language).initialize());
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
    if (codepage === "auto") {
      __privateSet(this, _codepage, codepage);
      return this;
    }
    if (!CodepageEncoder3.supports(codepage)) {
      throw new Error("Unknown codepage");
    }
    if (typeof __privateGet(this, _codepageMapping)[codepage] !== "undefined") {
      __privateSet(this, _codepage, codepage);
    } else {
      throw new Error("Codepage not supported by printer");
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
    __privateGet(this, _composer).text(value, __privateGet(this, _codepage));
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
    if (typeof value === "string") {
      value = parseInt(value, 10) || 1;
    }
    for (let i = 0; i < value; i++) {
      __privateGet(this, _composer).flush({ forceNewline: true });
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
    if (typeof value === "undefined") {
      __privateGet(this, _composer).style.underline = !__privateGet(this, _composer).style.underline;
    } else {
      __privateGet(this, _composer).style.underline = value;
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
    if (typeof value === "undefined") {
      __privateGet(this, _composer).style.italic = !__privateGet(this, _composer).style.italic;
    } else {
      __privateGet(this, _composer).style.italic = value;
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
    if (typeof value === "undefined") {
      __privateGet(this, _composer).style.bold = !__privateGet(this, _composer).style.bold;
    } else {
      __privateGet(this, _composer).style.bold = value;
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
    if (typeof value === "undefined") {
      __privateGet(this, _composer).style.invert = !__privateGet(this, _composer).style.invert;
    } else {
      __privateGet(this, _composer).style.invert = value;
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
    if (typeof width === "undefined") {
      width = 1;
    }
    if (typeof width !== "number") {
      throw new Error("Width must be a number");
    }
    if (width < 1 || width > 8) {
      throw new Error("Width must be between 1 and 8");
    }
    __privateGet(this, _composer).style.width = width;
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
    if (typeof height === "undefined") {
      height = 1;
    }
    if (typeof height !== "number") {
      throw new Error("Height must be a number");
    }
    if (height < 1 || height > 8) {
      throw new Error("Height must be between 1 and 8");
    }
    __privateGet(this, _composer).style.height = height;
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
    if (typeof width === "string") {
      return this.font(width === "small" ? "B" : "A");
    }
    if (typeof height === "undefined") {
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
    if (__privateGet(this, _options).embedded) {
      throw new Error("Changing fonts is not supported in table cells or boxes");
    }
    if (__privateGet(this, _composer).cursor > 0) {
      throw new Error("Changing fonts is not supported in the middle of a line");
    }
    let matchedFontType;
    const matches = value.match(/^[0-9]+x[0-9]+$/);
    if (matches) {
      matchedFontType = Object.entries(__privateGet(this, _printerCapabilities).fonts).find(
        (i) => i[1].size == matches[0]
      )?.[0];
    }
    matchedFontType = matchedFontType?.toUpperCase() || "A";
    const matchedFont = __privateGet(this, _printerCapabilities).fonts[matchedFontType];
    if (!matchedFont) {
      return __privateMethod(this, _ReceiptPrinterEncoder_instances, error_fn).call(this, "This font is not supported by this printer", "relaxed");
    }
    __privateGet(this, _composer).raw(__privateGet(this, _language).font(matchedFontType));
    __privateGet(this, _state).font = matchedFontType;
    if (matchedFontType === "A") {
      __privateGet(this, _composer).columns = __privateGet(this, _options).columns;
    } else {
      __privateGet(this, _composer).columns = __privateGet(this, _options).columns / __privateGet(this, _printerCapabilities).fonts["A"].columns * matchedFont.columns;
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
    const alignments = ["left", "center", "right"];
    if (!alignments.includes(value)) {
      throw new Error("Unknown alignment");
    }
    __privateGet(this, _composer).align = value;
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
    __privateGet(this, _composer).flush();
    for (let r = 0; r < data.length; r++) {
      const lines = [];
      let maxLines = 0;
      for (let c = 0; c < columns.length; c++) {
        const columnEncoder = new _ReceiptPrinterEncoder(
          Object.assign({}, __privateGet(this, _options), {
            width: columns[c].width,
            embedded: true
          })
        );
        const cellData = data[r][c];
        columnEncoder.codepage(__privateGet(this, _codepage));
        columnEncoder.align(columns[c].align);
        if (typeof cellData === "string") {
          columnEncoder.text(cellData);
        }
        if (typeof cellData === "function") {
          cellData(columnEncoder);
        }
        const cell = columnEncoder.commands();
        maxLines = Math.max(maxLines, cell.length);
        lines[c] = cell;
      }
      for (let c = 0; c < columns.length; c++) {
        if (lines[c].length >= maxLines) {
          continue;
        }
        for (let p = lines[c].length; p < maxLines; p++) {
          let verticalAlign = "top";
          if (typeof columns[c].verticalAlign !== "undefined") {
            verticalAlign = columns[c].verticalAlign;
          }
          const line = { commands: [{ type: "space", size: columns[c].width }], height: 1 };
          if (verticalAlign == "bottom") {
            lines[c].unshift(line);
          } else {
            lines[c].push(line);
          }
        }
      }
      for (let l = 0; l < maxLines; l++) {
        for (let c = 0; c < columns.length; c++) {
          if (typeof columns[c].marginLeft !== "undefined") {
            __privateGet(this, _composer).space(columns[c].marginLeft || 0);
          }
          __privateGet(this, _composer).add(lines[c][l].commands, columns[c].width);
          if (typeof columns[c].marginRight !== "undefined") {
            __privateGet(this, _composer).space(columns[c].marginRight || 0);
          }
        }
        __privateGet(this, _composer).flush();
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
    const defaultOptions = {
      style: "single",
      width: __privateGet(this, _options).columns || 10
    };
    const mergedOptions = { ...defaultOptions, ...options };
    __privateGet(this, _composer).flush();
    __privateGet(this, _composer).text((mergedOptions.style === "double" ? "\u2550" : "\u2500").repeat(mergedOptions.width), "cp437");
    __privateGet(this, _composer).flush();
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
    const defaultOptions = {
      style: "single",
      align: "left",
      width: __privateGet(this, _options).columns,
      marginLeft: 0,
      marginRight: 0,
      paddingLeft: 0,
      paddingRight: 0
    };
    const mergedOptions = { ...defaultOptions, ...options };
    if (mergedOptions.width + mergedOptions.marginLeft + mergedOptions.marginRight > __privateGet(this, _options).columns) {
      throw new Error("Box is too wide");
    }
    let elements = [];
    if (mergedOptions.style == "single") {
      elements = ["\u250C", "\u2510", "\u2514", "\u2518", "\u2500", "\u2502"];
    } else if (mergedOptions.style == "double") {
      elements = ["\u2554", "\u2557", "\u255A", "\u255D", "\u2550", "\u2551"];
    }
    const columnEncoder = new _ReceiptPrinterEncoder(
      Object.assign({}, __privateGet(this, _options), {
        width: mergedOptions.width - (mergedOptions.style == "none" ? 0 : 2) - mergedOptions.paddingLeft - mergedOptions.paddingRight,
        embedded: true
      })
    );
    columnEncoder.codepage(__privateGet(this, _codepage));
    columnEncoder.align(mergedOptions.align);
    if (typeof contents === "function") {
      contents(columnEncoder);
    }
    if (typeof contents === "string") {
      columnEncoder.text(contents);
    }
    const lines = columnEncoder.commands();
    __privateGet(this, _composer).flush();
    if (mergedOptions.style != "none") {
      __privateGet(this, _composer).space(mergedOptions.marginLeft);
      __privateGet(this, _composer).text(elements[0], "cp437");
      __privateGet(this, _composer).text(elements[4].repeat(mergedOptions.width - 2), "cp437");
      __privateGet(this, _composer).text(elements[1], "cp437");
      __privateGet(this, _composer).space(mergedOptions.marginRight);
      __privateGet(this, _composer).flush();
    }
    for (let i = 0; i < lines.length; i++) {
      __privateGet(this, _composer).space(mergedOptions.marginLeft);
      if (mergedOptions.style != "none") {
        __privateGet(this, _composer).style.height = lines[i].height;
        __privateGet(this, _composer).text(elements[5], "cp437");
        __privateGet(this, _composer).style.height = 1;
      }
      __privateGet(this, _composer).space(mergedOptions.paddingLeft);
      __privateGet(this, _composer).add(
        lines[i].commands,
        mergedOptions.width - (mergedOptions.style == "none" ? 0 : 2) - mergedOptions.paddingLeft - mergedOptions.paddingRight
      );
      __privateGet(this, _composer).space(mergedOptions.paddingRight);
      if (mergedOptions.style != "none") {
        __privateGet(this, _composer).style.height = lines[i].height;
        __privateGet(this, _composer).text(elements[5], "cp437");
        __privateGet(this, _composer).style.height = 1;
      }
      __privateGet(this, _composer).space(mergedOptions.marginRight);
      __privateGet(this, _composer).flush();
    }
    if (mergedOptions.style != "none") {
      __privateGet(this, _composer).space(mergedOptions.marginLeft);
      __privateGet(this, _composer).text(elements[2], "cp437");
      __privateGet(this, _composer).text(elements[4].repeat(mergedOptions.width - 2), "cp437");
      __privateGet(this, _composer).text(elements[3], "cp437");
      __privateGet(this, _composer).space(mergedOptions.marginRight);
      __privateGet(this, _composer).flush();
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
  barcode(value, symbology, height) {
    let options = {
      height: 60,
      width: 2,
      text: false
    };
    if (typeof height === "object") {
      options = Object.assign(options, height);
    }
    if (typeof height === "number") {
      options.height = height;
    }
    if (__privateGet(this, _options).embedded) {
      throw new Error("Barcodes are not supported in table cells or boxes");
    }
    if (__privateGet(this, _printerCapabilities).barcodes.supported === false) {
      return __privateMethod(this, _ReceiptPrinterEncoder_instances, error_fn).call(this, "Barcodes are not supported by this printer", "relaxed");
    }
    if (typeof symbology === "string" && !__privateGet(this, _printerCapabilities).barcodes.symbologies.includes(symbology)) {
      return __privateMethod(this, _ReceiptPrinterEncoder_instances, error_fn).call(this, `Symbology '${symbology}' not supported by this printer`, "relaxed");
    }
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
    if (__privateGet(this, _composer).align !== "left") {
      __privateGet(this, _composer).raw(__privateGet(this, _language).align(__privateGet(this, _composer).align));
    }
    __privateGet(this, _composer).raw(__privateGet(this, _language).barcode(value, symbology, options));
    if (__privateGet(this, _composer).align !== "left") {
      __privateGet(this, _composer).raw(__privateGet(this, _language).align("left"));
    }
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
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
      errorlevel: "m"
    };
    if (typeof model === "object") {
      options = Object.assign(options, model);
    }
    if (typeof model === "number") {
      options.model = model;
    }
    if (typeof size === "number") {
      options.size = size;
    }
    if (typeof errorlevel === "string") {
      options.errorlevel = errorlevel;
    }
    if (__privateGet(this, _options).embedded) {
      throw new Error("QR codes are not supported in table cells or boxes");
    }
    if (__privateGet(this, _printerCapabilities).qrcode.supported === false) {
      return __privateMethod(this, _ReceiptPrinterEncoder_instances, error_fn).call(this, "QR codes are not supported by this printer", "relaxed");
    }
    if (options.model && !__privateGet(this, _printerCapabilities).qrcode.models.includes(String(options.model))) {
      return __privateMethod(this, _ReceiptPrinterEncoder_instances, error_fn).call(this, "QR code model is not supported by this printer", "relaxed");
    }
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
    if (__privateGet(this, _composer).align !== "left") {
      __privateGet(this, _composer).raw(__privateGet(this, _language).align(__privateGet(this, _composer).align));
    }
    __privateGet(this, _composer).raw(__privateGet(this, _language).qrcode(value, options));
    if (__privateGet(this, _composer).align !== "left") {
      __privateGet(this, _composer).raw(__privateGet(this, _language).align("left"));
    }
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
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
    const defaultOptions = {
      width: 3,
      height: 3,
      columns: 0,
      rows: 0,
      errorlevel: 1,
      truncated: false
    };
    const mergedOptions = { ...defaultOptions, ...options };
    if (__privateGet(this, _options).embedded) {
      throw new Error("PDF417 codes are not supported in table cells or boxes");
    }
    if (__privateGet(this, _printerCapabilities).pdf417.supported === false) {
      if (typeof __privateGet(this, _printerCapabilities).pdf417.fallback === "object") {
        return this.barcode(value, __privateGet(this, _printerCapabilities).pdf417.fallback.symbology);
      }
      return __privateMethod(this, _ReceiptPrinterEncoder_instances, error_fn).call(this, "PDF417 codes are not supported by this printer", "relaxed");
    }
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
    if (__privateGet(this, _composer).align !== "left") {
      __privateGet(this, _composer).raw(__privateGet(this, _language).align(__privateGet(this, _composer).align));
    }
    __privateGet(this, _composer).raw(__privateGet(this, _language).pdf417(value, mergedOptions));
    if (__privateGet(this, _composer).align !== "left") {
      __privateGet(this, _composer).raw(__privateGet(this, _language).align("left"));
    }
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
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
    if (__privateGet(this, _options).embedded) {
      throw new Error("Images are not supported in table cells or boxes");
    }
    if (width % 8 !== 0) {
      throw new Error("Width must be a multiple of 8");
    }
    if (height % 8 !== 0) {
      throw new Error("Height must be a multiple of 8");
    }
    if (typeof algorithm === "undefined") {
      algorithm = "threshold";
    }
    if (typeof threshold === "undefined") {
      threshold = 128;
    }
    const name = input.constructor.name;
    let type;
    name.endsWith("Element") ? type = "element" : null;
    name == "ImageData" ? type = "imagedata" : null;
    name == "Canvas" && typeof input.getContext !== "undefined" ? type = "node-canvas" : null;
    name == "Image" ? type = "node-canvas-image" : null;
    name == "Image" && typeof input.frames !== "undefined" ? type = "node-read-image" : null;
    name == "Object" && input.data && input.info ? type = "node-sharp" : null;
    name == "View3duint8" && input.data && input.shape ? type = "ndarray" : null;
    name == "Object" && input.data && input.width && input.height ? type = "object" : null;
    if (!type) {
      throw new Error("Could not determine the type of image input");
    }
    let image;
    if (type == "element") {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(input, 0, 0, width, height);
        image = context.getImageData(0, 0, width, height);
      } else {
        throw new Error("Failed to get 2D rendering context");
      }
    }
    if (type == "node-canvas") {
      const context = input.getContext("2d");
      image = context.getImageData(0, 0, input.width, input.height);
    }
    if (type == "node-canvas-image") {
      if (typeof __privateGet(this, _options).createCanvas !== "function") {
        throw new Error(
          "Canvas is not supported in this environment, specify a createCanvas function in the options"
        );
      }
      const canvas = __privateGet(this, _options).createCanvas(width, height);
      const context = canvas.getContext("2d");
      context.drawImage(input, 0, 0, width, height);
      image = context.getImageData(0, 0, width, height);
    }
    if (type == "node-read-image") {
      image = new ImageData(input.width, input.height);
      image.data.set(input.frames[0].data);
    }
    if (type == "node-sharp") {
      image = new ImageData(input.info.width, input.info.height);
      image.data.set(input.data);
    }
    if (type == "ndarray") {
      image = new ImageData(input.shape[0], input.shape[1]);
      image.data.set(input.data);
    }
    if (type == "object") {
      image = new ImageData(input.width, input.height);
      image.data.set(input.data);
    }
    if (type == "imagedata") {
      image = input;
    }
    if (!image) {
      throw new Error("Image could not be loaded");
    }
    if (width !== image.width || height !== image.height) {
      image = resizeImageData(image, width, height, "bilinear-interpolation");
    }
    if (width !== image.width || height !== image.height) {
      throw new Error("Image could not be resized");
    }
    image = Flatten.flatten(image, [255, 255, 255]);
    switch (algorithm) {
      case "threshold":
        image = Dither.threshold(image, threshold);
        break;
      case "bayer":
        image = Dither.bayer(image, threshold);
        break;
      case "floydsteinberg":
        image = Dither.floydsteinberg(image);
        break;
      case "atkinson":
        image = Dither.atkinson(image);
        break;
    }
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
    if (__privateGet(this, _composer).align !== "left") {
      __privateGet(this, _composer).raw(__privateGet(this, _language).align(__privateGet(this, _composer).align));
    }
    __privateGet(this, _composer).raw(__privateGet(this, _language).image(image, width, height, __privateGet(this, _options).imageMode));
    if (__privateGet(this, _composer).align !== "left") {
      __privateGet(this, _composer).raw(__privateGet(this, _language).align("left"));
    }
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
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
    if (__privateGet(this, _options).embedded) {
      throw new Error("Cut is not supported in table cells or boxes");
    }
    for (let i = 0; i < __privateGet(this, _options).feedBeforeCut; i++) {
      __privateGet(this, _composer).flush({ forceNewline: true });
    }
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
    __privateGet(this, _composer).raw(__privateGet(this, _language).cut(value));
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
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
    if (__privateGet(this, _options).embedded) {
      throw new Error("Pulse is not supported in table cells or boxes");
    }
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
    __privateGet(this, _composer).raw(__privateGet(this, _language).pulse(device, on, off));
    __privateGet(this, _composer).flush({ forceFlush: true, ignoreAlignment: true });
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
    __privateGet(this, _composer).raw(data);
    return this;
  }
  /**
   * Get all the commands
   *
   * @return {array}         All the commands currently in the queue
   */
  commands() {
    if (__privateGet(this, _options).autoFlush && !__privateGet(this, _options).embedded) {
      __privateGet(this, _composer).raw(__privateGet(this, _language).flush());
    }
    const result = [];
    const remaining = __privateGet(this, _composer).fetch({ forceFlush: true, ignoreAlignment: true });
    if (remaining.length) {
      __privateGet(this, _queue).push(remaining);
    }
    while (__privateGet(this, _queue).length) {
      const line = __privateGet(this, _queue).shift();
      const height = line.filter((i) => i.type === "style" && i.property === "size").map((i) => i.value.height).reduce((a, b) => Math.max(a, b), 1);
      if (__privateGet(this, _options).debug) {
        console.log(
          "|" + line.filter((i) => i.type === "text").map((i) => i.value).join("") + "|",
          height
        );
      }
      result.push({
        commands: line,
        height
      });
    }
    if (__privateGet(this, _options).debug) {
      console.log("commands", result);
    }
    __privateMethod(this, _ReceiptPrinterEncoder_instances, reset_fn).call(this);
    return result;
  }
  /**
   * Encode all previous commands
   *
   * @return {Uint8Array}         Return the encoded bytes
   */
  encode() {
    const commands = this.commands();
    const result = [];
    for (const line of commands) {
      for (const item of line.commands) {
        if (item.type === "raw") {
          result.push(item.value);
        }
        if (item.type === "text") {
          result.push(__privateMethod(this, _ReceiptPrinterEncoder_instances, encodeText_fn).call(this, item.value, item.codepage ?? "auto"));
        }
        if (item.type === "style") {
          result.push(__privateMethod(this, _ReceiptPrinterEncoder_instances, encodeStyle_fn).call(this, item.property, item.value));
        }
      }
      if (__privateGet(this, _options).newline === "\n\r") {
        result.push([10, 13]);
      }
      if (__privateGet(this, _options).newline === "\n") {
        result.push([10]);
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
    return Object.entries(printerDefinitions2).map((i) => ({ id: i[0], name: i[1].vendor + " " + i[1].model }));
  }
  /**
   * Get the current column width
   *
   * @return {number}         The column width in characters
   */
  get columns() {
    return __privateGet(this, _composer).columns;
  }
  /**
   * Get the current language
   * @return {string}         The language that is currently used
   */
  get language() {
    return __privateGet(this, _options).language;
  }
  /**
   * Get the capabilities of the printer
   * @return {object}         The capabilities of the printer
   */
  get printerCapabilities() {
    return __privateGet(this, _printerCapabilities);
  }
};
_options = new WeakMap();
_queue = new WeakMap();
_language = new WeakMap();
_composer = new WeakMap();
_printerCapabilities = new WeakMap();
_codepageMapping = new WeakMap();
_codepageCandidates = new WeakMap();
_codepage = new WeakMap();
_state = new WeakMap();
_ReceiptPrinterEncoder_instances = new WeakSet();
/**
 * Reset the state of the object
 */
reset_fn = function() {
  __privateSet(this, _queue, []);
  __privateSet(this, _codepage, __privateGet(this, _options).language == "esc-pos" ? "cp437" : "star/standard");
  __privateGet(this, _state).codepage = 0;
  __privateGet(this, _state).font = "A";
};
/**
 * Internal function for encoding style changes
 * @param  {string}          property  The property that needs to be changed
 * @param  {boolean}         value     Is the property enabled or disabled
 * @return {array}                     Return the encoded bytes
 */
encodeStyle_fn = function(property, value) {
  if (property === "bold") {
    return __privateGet(this, _language).bold(value);
  }
  if (property === "underline") {
    return __privateGet(this, _language).underline(value);
  }
  if (property === "italic") {
    return __privateGet(this, _language).italic(value);
  }
  if (property === "invert") {
    return __privateGet(this, _language).invert(value);
  }
  if (property === "size") {
    return __privateGet(this, _language).size(value.width, value.height);
  }
  return [];
};
/**
 * Internal function for encoding text in the correct codepage
 * @param  {string}          value  The text that needs to be encoded
 * @param  {string}          codepage  The codepage that needs to be used
 * @return {array}                   Return the encoded bytes
 */
encodeText_fn = function(value, codepage) {
  if (codepage !== "auto") {
    const fragment = CodepageEncoder3.encode(value, codepage);
    if (__privateGet(this, _state).codepage != __privateGet(this, _codepageMapping)[codepage]) {
      __privateGet(this, _state).codepage = __privateGet(this, _codepageMapping)[codepage];
      return [...__privateGet(this, _language).codepage(__privateGet(this, _codepageMapping)[codepage]), ...fragment];
    }
    return [...fragment];
  }
  const fragments = CodepageEncoder3.autoEncode(value, __privateGet(this, _codepageCandidates));
  const buffer = [];
  for (const fragment of fragments) {
    __privateGet(this, _state).codepage = __privateGet(this, _codepageMapping)[fragment.codepage];
    buffer.push(...__privateGet(this, _language).codepage(__privateGet(this, _codepageMapping)[fragment.codepage]), ...fragment.bytes);
  }
  return buffer;
};
/**
 * Throw an error
 *
 * @param  {string}          message  The error message
 * @param  {string}          level    The error level, if level is strict,
 *                                    an error will be thrown, if level is relaxed,
 *                                    a warning will be logged
 * @return {object}          Return the object, for easy chaining commands
 */
error_fn = function(message, level) {
  if (level === "strict" || __privateGet(this, _options).errors === "strict") {
    throw new Error(message);
  }
  console.warn(message);
  return this;
};
var ReceiptPrinterEncoder = _ReceiptPrinterEncoder;
var receipt_printer_encoder_default = ReceiptPrinterEncoder;
export {
  receipt_printer_encoder_default as default
};
