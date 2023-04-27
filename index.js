const core = require('@actions/core');
const {computeVersion} = require("./versioner");

/**
 * Actions entrypoint
 */
async function run() {
    // Get input
    const domainName = core.getInput("domain", {required: true});
    const packageName = core.getInput("package", {required: true});
    const repositoryName = core.getInput("repository", {required: true});
    const format = core.getInput("format", {required: false}) || "npm";
    const prefix = core.getInput("prefix", {required: false});
    const dieOnMissing = core.getInput("die-on-missing", {required: false}) === "true";
    const increment = parseInt(core.getInput("increment-amount", {required: false}) || 1, 10);

    // We only have 1 output, this structure means we can just use "return" and "throw" in the logic
    try {
        const output = await computeVersion(
            domainName,
            packageName,
            repositoryName,
            format,
            prefix,
            dieOnMissing,
            increment,
        );
        core.info(`Outputting version_number: ${output}`);
        core.setOutput('version_number', output);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
