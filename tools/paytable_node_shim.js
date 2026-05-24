'use strict';
/**
 * paytable_node_shim.js — Node.js loader for paytable.js (Monte Carlo use)
 * Modern Node has crypto built-in. We use vm to load paytable.js with a custom sandbox
 * that provides exactly the globals it needs, bypassing the read-only global.crypto issue.
 */
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const nc   = require('crypto');

// Build a sandbox that looks like a browser for paytable.js
const sandbox = {
  crypto: {
    getRandomValues(buf) {
      const bytes = nc.randomBytes(buf.byteLength);
      const u32   = new Uint32Array(bytes.buffer, bytes.byteOffset, buf.length);
      buf.set(u32);
      return buf;
    }
  },
  Uint32Array,
  Math, console, parseInt, parseFloat, isNaN, Object, Array, String, Number, Boolean,
  module: { exports: {} },
  require,
};
sandbox.exports = sandbox.module.exports;

const src = fs.readFileSync(path.join(__dirname, '..', 'paytable.js'), 'utf8');
vm.runInNewContext(src, sandbox);

module.exports = sandbox.module.exports;
