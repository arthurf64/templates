import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";

import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import run from "@rollup/plugin-run";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import prettier from "rollup-plugin-prettier";

const VALID_EXTENSION = ["js", "ts", "jsx", "tsx", "mjs", "cjs", "mts", "cts"].join("|");
const MAIN_FILE_REGEX = new RegExp(`^main.(?:${VALID_EXTENSION})$`);

const fromCwd = (...path) => resolve(cwd(), ...path);
const fromSrc = (...path) => fromCwd("src", ...path);
const fromDist = (...path) => fromCwd("dist", ...path);

const MAIN_FILE = fromSrc(readdirSync(fromSrc())
    .filter((file) => MAIN_FILE_REGEX.test(file))
    .at(0));

/** @type {string[]} */
const DEPENDECIES = Object.keys(JSON.parse(readFileSync(fromCwd("package.json")))["dependencies"] ?? {});

const WATCHING = process.env["ROLLUP_WATCH"] === "true";
const EXTERNAL_ENGINE = process.env["EXTERNAL_ENGINE"] === "true";

/** @type {import("rollup-plugin-prettier").Options} */
const PRETTIER_OPTIONS = {
    parser: "typescript",
    printWidth: 115,
    tabWidth: 4,
    useTabs: true,
    trailingComma: "es5",
    bracketSameLine: true,
    singleAttributePerLine: true,
};

/** @type {import("rollup").RollupOptions} */
const BUNDLE_OPTIONS = {
    input: MAIN_FILE,
    output: {
        file: fromDist(WATCHING ? "main.watch.js" : "main.js"),
        format: "esm",
    },
    watch: { include: fromSrc() + "/**/*" },
    plugins: [
        typescript({ noEmitOnError: !WATCHING }),
        commonjs(),
        nodeResolve({ browser: true }),
        WATCHING && prettier(PRETTIER_OPTIONS),
        (WATCHING && !EXTERNAL_ENGINE) && run(),
        !WATCHING && terser({
            keep_classnames: true,
            keep_fnames: true,
        })
    ],
    external: [
        ...(WATCHING ? DEPENDECIES : [])
    ],
};

/** @type {import("rollup").RollupOptions} */
const DECLARATION_OPTIONS = {
    input: MAIN_FILE,
    output: {
        file: fromDist("main.d.ts"),
        format: "esm"
    },
    watch: false,
    plugins: [
        typescript(),
        nodeResolve(),
        dts({ respectExternal: true }),
        prettier(PRETTIER_OPTIONS),
    ],
    external: [...DEPENDECIES],
};

export {
    BUNDLE_OPTIONS,
    DECLARATION_OPTIONS,
    DEPENDECIES
};