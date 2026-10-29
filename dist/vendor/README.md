# HEIC decoder

`heic-to.js` is the unchanged CSP browser build of heic-to 1.6.7.
Source: https://github.com/hoppergee/heic-to
Package source: https://www.npmjs.com/package/heic-to/v/1.6.7
License: LGPL-3.0, included in heic-to.LICENSE.
Uses libheif 1.23.7 (https://github.com/strukturag/libheif) and libde265 (https://github.com/strukturag/libde265).

To refresh the pinned browser copy after npm ci:
```sh
cp node_modules/heic-to/dist/csp/heic-to.min.js dist/vendor/heic-to.js
cp node_modules/heic-to/LICENSE dist/vendor/heic-to.LICENSE
```
The module is loaded from this app only when native HEIC decoding fails. Original photos stay on the device; only the compressed avatar is saved.
