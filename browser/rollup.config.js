import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import run from "@rollup/plugin-run";
import { dts } from "rollup-plugin-dts";
import prettier from "rollup-plugin-prettier";

const EXTS = ["js", "ts", "jsx", "tsx", "mjs", "cjs", "mts", "cts"].join("|");
const MAIN_REGEX = RegExp(`^main.(?:${EXTS})$`);

const fromSrc = (...path) => resolve(cwd(), "src", ...path);;
const fromDist = (...path) => resolve(cwd(), "dist", ...path);;

const mainFile = () => fromSrc(readdirSync(fromSrc()).filter((f) => MAIN_REGEX.test(f))[0]);

const packageDependencies = () => {
    const PACKAGE = JSON.parse(readFileSync(resolve(cwd(), "package.json"), "utf-8"));
    let depsList = [];

    if (PACKAGE.dependencies) depsList = [...depsList, ...Object.keys(PACKAGE.dependencies)];
    if (PACKAGE.devDependencies) depsList = [...depsList, ...Object.keys(PACKAGE.devDependencies)];

    return depsList;
};

const WATCHING = process.env.ROLLUP_WATCH === "true";

/** @type {import("rollup").RollupOptions[]} */
export default [
    {
        input: mainFile(),
        output: {
            file: fromDist(WATCHING ? "main.dev.js" : "main.dist.js"),
            format: "esm"
        },
        plugins: [
            typescript({ noEmitOnError: WATCHING }),
            (!WATCHING) && terser({
                keep_classnames: true,
                keep_fnames: true
            }),
            WATCHING && run(),
        ],
        watch: {
            include: fromSrc() + "/**/*",
        },
    },
    {
        input: mainFile(),
        output: {
            file: fromDist("main.d.ts"),
            format: "esm"
        },
        watch: false,
        plugins: [
            typescript(),
            dts({ respectExternal: true }),
            prettier({
                parser: "typescript",
                printWidth: 115,
                tabWidth: 4,
                useTabs: true,
                trailingComma: "es5",
                bracketSameLine: true,
                singleAttributePerLine: true,
            }),
        ],
    }
];