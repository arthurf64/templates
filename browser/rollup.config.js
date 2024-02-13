import { BUNDLE_OPTIONS, DECLARATION_OPTIONS } from "./build/utils.js";

/** @type {import("rollup").RollupOptions[]} */
export default [
    { ...BUNDLE_OPTIONS },
    { ...DECLARATION_OPTIONS },
];