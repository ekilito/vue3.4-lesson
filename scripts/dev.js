// 这个文件会帮我们打包 packages 下的模块，最终打包出 js 文件
// package.json
// "scripts": {
//   "dev": "node scripts/dev.js reactivity -f esm"
// },
// node dev.js (要打包的名字 -f 打包的格式) === argv

import minimist from "minimist";

import { resolve, dirname } from "path";

import { fileURLToPath } from "url";

import { createRequire } from "module";

import esbuild from "esbuild";

// node 中的命令函参数通过 process 来获取 process.argv
const args = minimist(process.argv.slice(2));

// esm 使用commonjs 变量
const __filename = fileURLToPath(import.meta.url); // 获取文件的绝对路径 file: => /usr
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const target = args._[0] || "reactivity"; // 打包哪个项目
const format = args.f || "iife"; // 打包后的模块化规范

console.log(args); // { _: [ 'reactivity' ], f: 'esm' }
console.log(target, format); // reactivity esm

// node 中的esm 模块没有 __dirname
console.log(__filename, __dirname, require); // /Users/kilito/Desktop/vue3.4-lesson/scripts/dev.js /Users/kilito/Desktop/vue3.4-lesson/scripts

// 入口文件 根据命令行提供的路径来解析
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);

const pkg = resolve(`../packages/${target}/package.json`);

console.log(entry); // /Users/kilito/Desktop/vue3.4-lesson/packages/reactivity/src/index.ts

// 根据需要进行打包
esbuild
  .context({
    // 入口
    entryPoints: [entry],
    // 出口
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),
    bundle: true, // reactivity => shared 会打包到一起
    platform: "browser", // 打包后给浏览器使用
    sourcemap: true, // 可以调试源代码
    format, // cjs esm iife
    globalName: pkg.buildOptions?.name,
  })
  .then((ctx) => {
    console.log("start dev");

    return ctx.watch();  // 监控入口文件持续进行打包处理
  });

