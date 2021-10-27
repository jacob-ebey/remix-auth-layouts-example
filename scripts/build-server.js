let path = require("path");

let esbuild = require("esbuild");

let basePath = process.cwd();

esbuild
  .build({
    write: true,
    outfile: path.join(basePath, "server.js"),
    entryPoints: [path.join(basePath, "server.ts")],
    sourcemap: "inline",
    platform: "node",
    format: "cjs",
    bundle: true,
    plugins: [
      {
        name: "remix-bundle-external",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (
              (!args.path.startsWith("commerce-provider") &&
                !args.path.startsWith(".") &&
                !args.path.startsWith("/")) ||
              args.path.includes("node_modules") ||
              args.resolveDir.includes("node_modules") ||
              args.importer.includes("node_modules")
            ) {
              return {
                external: true,
              };
            }
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
