"use strict";
/* Copyright (c) 2023 Richard Rodger, MIT License */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path_1 = __importDefault(require("path"));
const gubu_1 = require("gubu");
const jsonic_next_1 = require("@jsonic/jsonic-next");
// import type { Generator } from './gubu-gen'
const gubu_gen_1 = require("./gubu-gen");
run(process.argv, {
    console,
    exit: (code) => process.exit(code),
}).catch((e) => console.error(e));
async function run(argv, ctx) {
    let args = handle_args(parse_args(argv), ctx);
    const mod = resolve_source(args, ctx);
    const target = resolve_target(args, ctx);
    const shape = resolve_shape(args, ctx, mod);
    const gubugen = new gubu_gen_1.GubuGen();
    const carn = gubugen.generate({
        shape,
        generator: args.generator,
        format: args.format,
        target,
    });
    return carn;
    // const generate = resolve_generate(args, ctx)
    // const carn = new Carn()
    // generate(shape, carn)
    // let text = load_file(target)
    // let out = carn.inject(text, args.generator, MarkerMap[args.format])
    // save_file(target, out)
    // return carn
}
function resolve_source(args, ctx) {
    try {
        let fullsource = args.source;
        if (!path_1.default.isAbsolute(fullsource)) {
            fullsource = path_1.default.join(process.cwd(), fullsource);
        }
        return require(fullsource);
    }
    catch (e) {
        args.errs.push(`Cannot load module (${args.source}): ` + e.message);
        return handle_errs(args, ctx);
    }
}
function resolve_shape(args, ctx, mod) {
    let origprop = args.property;
    // Supports . paths
    let ref = jsonic_next_1.util.prop(mod, origprop, undefined);
    if (null == ref) {
        args.errs.push('Cannot find shape at: ' + origprop + ' in file: ' + args.source);
    }
    // FIX: should infer GubuShape
    const shape = (0, gubu_1.Gubu)(ref);
    handle_errs(args, ctx);
    return shape;
}
function resolve_target(args, ctx) {
    try {
        let fulltarget = args.target;
        if (null == fulltarget || '' === fulltarget) {
            args.errs.push('Target is not defined');
            return handle_errs(args, ctx);
        }
        if (!path_1.default.isAbsolute(fulltarget)) {
            fulltarget = path_1.default.join(process.cwd(), fulltarget);
        }
        return fulltarget;
    }
    catch (e) {
        args.errs.push(`Cannot resolve target (${args.target}): ` + e.message);
        return handle_errs(args, ctx);
    }
}
function handle_args(args, ctx) {
    // resolve file paths etc
    handle_errs(args, ctx);
    if (args.help) {
        help(ctx);
        ctx.exit(0);
    }
    return args;
}
function handle_errs(args, ctx) {
    if (0 < args.errs.length) {
        args.errs.map((err) => {
            console.log('ERROR: ' + err);
        });
        ctx.exit(1);
    }
    return args;
}
function parse_args(argv) {
    const args = {
        // TODO: move to ctx
        errs: [],
        help: false,
        source: '', // Source file containing GubuShape
        property: 'defaults', // Property path to GubuShape in required source file
        target: '', // Target file to update with generated code
        format: 'md', // Target file format
        generator: 'options', // Code generator function
    };
    let accept_args = true;
    for (let aI = 2; aI < argv.length; aI++) {
        let arg = argv[aI];
        if (accept_args && arg.startsWith('-')) {
            if ('--' === arg) {
                accept_args = false;
            }
            else if ('--source' === arg || '-s' === arg) {
                args.source = argv[++aI];
            }
            else if ('--property' === arg || '-p' === arg) {
                args.property = argv[++aI];
            }
            else if ('--target' === arg || '-t' === arg) {
                args.target = argv[++aI];
            }
            else if ('--format' === arg || '-f' === arg) {
                args.format = argv[++aI];
            }
            else if ('--generator' === arg || '-g' === arg) {
                args.generator = argv[++aI];
            }
            else if ('--help' === arg || '-h' === arg) {
                args.help = true;
            }
            else {
                args.errs.push('Unknown command option: ' + arg);
            }
        }
        else if ('' === args.source) {
            args.source = arg;
        }
        else {
            args.errs.push('Extra source file specified (only one is needed): ' + arg);
        }
    }
    return args;
}
function help(ctx) {
    let s = `
Help for gubu-gen.
`;
    ctx.console.log(s);
}
//# sourceMappingURL=gubu-gen-cli.js.map