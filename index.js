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
    const dieOnMissing = core.getInput("die-on-missing", {required: false});
    const increment = core.getInput("increment-amount", {required: false}) || 1;

    // Create required resources
    const ca = new aws.CodeArtifact();

    const listPackageConfig = {
      domain: domainName,
      format,
      package: packageName,
      repository: repositoryName,
      status: "Published",
      sortBy: "PUBLISHED_TIME",
    };

    core.info(`Fetching latest package version for ${repositoryName}:${packageName}`);

    let listVersionsResp = await ca.listPackageVersions(listPackageConfig).promise();
    let nextToken = listVersionsResp.nextToken;

    let fetchedVersion;
    if (prefix) {
      // Search for the first (latest) version matching the prefix.
      while (nextToken && !fetchedVersion) {
        for (const index in listVersionsResp.versions) {
          const version = listVersionsResp.versions[index];
          if (version.version.startsWith(prefix)) {
            fetchedVersion = version.version;
            break;
          }
        }

        listVersionsResp = await ca.listPackageVersions({...listPackageConfig, nextToken}).promise();
        nextToken = listVersionsResp.nextToken;
      }

      // No version was found that matched the prefix.
      if (!fetchedVersion) {
        if (dieOnMissing) {
          throw new Error(`Failed to locate version matching prefix ${prefix}`);
        } else {
          // Otherwise, return minor version 0 (will be incremented to 1).
          fetchedVersion = prefix.concat(".0");
          core.info(`${prefix} version not found, creating new version...`);
        }
      }
    } else {
      fetchedVersion = listVersionsResp.defaultDisplayVersion;
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
