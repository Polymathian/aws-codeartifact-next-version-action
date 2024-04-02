const aws = require("aws-sdk");
const core = require("@actions/core");

/**
 * Finds the "latest" version on the remote CodeArtifact service which matches a given prefix
 */
async function findOnCodeartifactByPrefix(domainName, format, packageName, repositoryName, prefix) {
    const ca = new aws.CodeArtifact();

    let nextToken = undefined;
    do {
        try {
            const listVersionsResp = await ca
              .listPackageVersions({
                domain: domainName,
                format: format,
                package: packageName,
                repository: repositoryName,
                status: "Published",
                sortBy: "PUBLISHED_TIME",
                nextToken: nextToken,
              })
              .promise();
            for (const index in listVersionsResp.versions) {
              const version = listVersionsResp.versions[index];
              core.debug(`Saw version ${version.version}`);
              if (version.version.startsWith(prefix + ".")) {
                return version.version;
              }
            }
            nextToken = listVersionsResp.nextToken;
        } catch (e) {
            // Temporary solution to catch if the package does not yet exist on code artifact.
            if (e.code === "ResourceNotFoundException") {
                return null
            }
        }
    } while (nextToken !== undefined);
    return null;
}

/**
 * Takes a dot-separated version string, increments the last segment by `increment` and returns the new version string
 * @param {string} version
 * @param {number} increment
 */
function incrementVersionString(version, increment) {
    const parts = version.split(".").map((s) => parseInt(s, 10));
    parts.push(parts.pop() + increment);
    return parts.join(".");
}

/**
 * Main function with GitHub Actions abstracted away in run
 * Tests us this as the main function
 * @returns {Promise<string>}
 */
async function computeVersion(
    domainName,
    packageName,
    repositoryName,
    format,
    prefix,
    dieOnMissing,
    increment,
) {
    // Prefix ends up practically defining two modes. See README for more details
    if (prefix) {
        core.info(`Scanning CodeArtifact for latest package version for ${repositoryName}:${packageName} with prefix ${prefix}`);
        const remoteVersion = await findOnCodeartifactByPrefix(domainName, format, packageName, repositoryName, prefix);
        if (remoteVersion === null) {
            if (dieOnMissing) {
                throw new Error("No versions found matching prefix");
            } else {
                // Return a new "first version" under the prefix
                return prefix + ".1";
            }
        }
        return incrementVersionString(remoteVersion, increment);
    } else {
        core.info("No prefix provided, fetching defaultDisplayVersion");

        // Do a list versions with minimum limit since we just want defaultDisplayVersion
        const ca = new aws.CodeArtifact();
        const listVersionsResp = await ca.listPackageVersions({
            domain: domainName,
            format,
            package: packageName,
            repository: repositoryName,
        }).promise();
        const defaultDisplayVersion = listVersionsResp.defaultDisplayVersion;
        core.info(`defaultDisplayVersion: ${defaultDisplayVersion}`);

        // Deal with missing
        if (defaultDisplayVersion === undefined) {
            if (dieOnMissing) {
                throw new Error(`No defaultDisplayVersion found`);
            } else {
                return "1";
            }
        }

        return incrementVersionString(defaultDisplayVersion, increment);
    }
}


module.exports = {
    findOnCodeartifactByPrefix,
    incrementVersionString,
    computeVersion,
}
