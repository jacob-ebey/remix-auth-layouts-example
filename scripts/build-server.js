let path = require("path");

let esbuild = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");

let basePath = process.cwd();

esbuild
  .build({
    write: true,
    outfile: path.join(basePath, "server.js"),
    entryPoints: [path.join(basePath, "server.ts")],
    platform: "node",
    format: "cjs",
    bundle: true,
    plugins: [
      nodeExternalsPlugin({
        packagePath: path.join(basePath, "package.json"),
      }),
      {
        name: "remix-bundle-external",
        setup(build) {
          build.onResolve({ filter: /^\.\/build$/ }, ({ path, resolveDir }) => {
            return {
              external: true,
            };
          });
        },
      },
    ],
  })
  .then((buildResult) => {
    if (buildResult.warnings.length) {
      console.log(
        esbuild.formatMessages(buildResult.warnings, { kind: "warning" })
      );
    }
    if (buildResult.errors.length) {
      console.log(
        esbuild.formatMessages(buildResult.errors, { kind: "error" })
      );

      process.exit(1);
    }

    console.log("Server build succeeded");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
