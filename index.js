const core = require('@actions/core');
const aws = require('aws-sdk');

// most @actions toolkit packages have async methods
async function run() {
  try {
    // Get input
    const domainName = core.getInput("domain", {required: true});
    const packageName = core.getInput("package", {required: true});
    const repositoryName = core.getInput("repository", {required: true});
    const format = core.getInput("format", {required: false}) || "npm";
    const prefix = core.getInput("prefix", {required: false});
    const increment = core.getInput("increment-amount", {required: false}) || 1;

    // Create required resources
    const ca = new aws.CodeArtifact();

    core.info(`Fetching latest package version for ${repositoryName}:${packageName}`);
    const listVersionsResp = await ca.listPackageVersions({
      domain: domainName,
      format,
      package: packageName,
      repository: repositoryName,
    }).promise();

    let fetchedVersion;
    if (prefix) {
      // Search for the first (latest) version matching the prefix.
      for (const version in listVersionsResp.versions) {
        if (version.version.startsWith(prefix)) {
          fetchedVersion = version.version;
          break;
        }
      }

      // No version was found that matched the prefix.
      if (!fetchedVersion) {
        throw new Error(`Failed to locate version matching prefix ${prefix}`);
      }
    } else {
      fetchedVersion = listVersionsResp.defaultDisplayVersion.split(".");
    }

    let versionParts = fetchedVersion.split(".");
    const lastIndex = versionParts.length - 1;

    versionParts[lastIndex] = String(Number(versionParts[lastIndex]) + Number(increment));
    const versionString = versionParts.join(".");

    core.info(`Fetched package version ${fetchedVersion}. New version ${versionString}`);

    core.setOutput('version_number', versionString);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
