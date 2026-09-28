// Auto-inject --webpack flag for `next dev` and `next build` to work around
// Turbopack not being supported on platforms without native bindings.
const cmd = process.argv[2];
if ((cmd === "dev" || cmd === "build") && !process.argv.includes("--webpack") && !process.argv.includes("--turbopack") && !process.argv.includes("--turbo")) {
  process.argv.splice(3, 0, "--webpack");
}
