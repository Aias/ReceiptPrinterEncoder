**NOTE:** This library is a fork of Niels Leenheer's [ReceiptPrinterEncoder](https://github.com/NielsLeenheer/ReceiptPrinterEncoder), updated to add Typescript support with corresponding changes to the build process and test framework.

I originally intended to submit a PR to reintegrate into the main repo, but the parent repo is under active development and so I'm putting this on hold for a while. Might pick it back up again in the future.

Types and functionality match the original library as of commit [1c718bc](https://github.com/NielsLeenheer/ReceiptPrinterEncoder/commit/1c718bc45278f2d2432ed0336c51f5caad9b0338).

# ReceiptPrinterEncoder

**Formally known as EscPosEncoder, StarPrntEncoder and ThermalPrinterEncoder**

<br>

Create a set of commands that can be send to any receipt printer that supports ESC/POS, StarLine or StarPRNT.

-   [About ReceiptPrinterEncoder](README.md)
-   [Usage and installation](documentation/usage.md)
-   [Configuration options](documentation/configuration.md)
-   [Handling text](documentation/text.md)
-   [Commands for creating receipts](documentation/commands.md)
-   [Printing receipts](documentation/printing.md)
-   [Changes from version 2 to version 3](documentation/changes.md)

<br>

[![npm](https://img.shields.io/npm/v/@point-of-sale/receipt-printer-encoder)](https://www.npmjs.com/@point-of-sale/receipt-printer-encoder)
![GitHub License](https://img.shields.io/github/license/NielsLeenheer/ReceiptPrinterEncoder)

<br>

## About ReceiptPrinterEncoder

This library allows you to run commands to add content, such as text, images and barcodes to a receipt and encode that content to ESC/POS, StarLine and StarPRNT commands.

```js
let encoder = new ReceiptPrinterEncoder();

let result = encoder.line('The is the first line').line('And this is the second').encode();

/* To do: send result to the printer */
```

Once you have the encoded commands you need a method to send those commands to the receipt printer - to actually print the receipt. And for that we have a list of sister libraries.

<br>

---

<br>

This library has been created by Niels Leenheer under the [MIT license](LICENSE). Feel free to use it in your products. The development of this library is sponsored by Salonhub.

<a href="https://salohub.nl"><img src="https://salonhub.nl/assets/images/salonhub.svg" width=140></a>
