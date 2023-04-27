const AWS = require('aws-sdk-mock');
const {incrementVersionString, computeVersion} = require("./versioner");

AWS.mock('CodeArtifact', 'listPackageVersions', function (){
    throw new Error("Not mocked for test, danger!");
});

/**
 * Used in the tests to set what the next call to listPackageVersions should return
 */
function mockListPackageVersionsReturn(versions, defaultDisplayVersion) {
    AWS.remock('CodeArtifact', 'listPackageVersions', function (params, callback){
        callback(null, {
            "defaultDisplayVersion": defaultDisplayVersion,
            // None of the values after here should matter in this case
            "format": "pypi",
            "package": "package",
            "versions": versions.map((v) => ({
                "version": v,
                // Other values shouldn't matter here, just keeping for consistency
                "revision": "mfyYo1yIpfLUg8nuL+uq9IseJDdyUrrfZdHnTECCSVY=",
                "status": "Published",
                "origin": {
                    "domainEntryPoint": {
                        "repositoryName": "python"
                    },
                    "originType": "INTERNAL"
                }
            })),
        });
    });
}

describe("incrementVersionString", () => {
    test.each([
        {version: "1", increment: 1, expected: "2"},
        {version: "1.1", increment: 1, expected: "1.2"},
        {version: "2.3.4", increment: 1, expected: "2.3.5"},
        {version: "2.3.4", increment: 10, expected: "2.3.14"},
        {version: "2.3.4", increment: -1, expected: "2.3.3"},
    ])('incrementVersionString($version, $increment)', ({version, increment, expected}) => {
        expect(incrementVersionString(version, increment)).toBe(expected);
    });
})

describe('computeVersion no-prefix', () => {
    test.each([
        {version: "1", expected: "2"},
        {version: "1.2", expected: "1.3"},
        {version: undefined, expected: "1"},
    ])('defaultDisplayVersion ($version)', async ({version, expected}) => {
        // Have the versions list be some other version so we're sure it's using defaultDisplayVersion
        mockListPackageVersionsReturn(["aaaa"], version);
        const res = await computeVersion("domain", "package", "repository", "format", "", false, 1);
        expect(res).toBe(expected);
    });

    test('defaultDisplayVersion missing, die-on-missing', async () => {
        // Have the versions list be some other version so we're sure it's using defaultDisplayVersion
        mockListPackageVersionsReturn(["aaaa"], undefined);
        // Note not awaiting here
        const res = computeVersion("domain", "package", "repository", "format", "", true, 1);
        await expect(res).rejects.toThrow();
    });
});

describe('computeVersion prefix', () => {
    test.each([
        // Ordering is important on the versions for how we search them
        {versions: ["1"], prefix: "1", expected: "1.1"},
        // 10 matches "prefix" of 1, make sure we're breaking on dots properly
        {versions: ["10", "1"], prefix: "1", expected: "1.1"},
        {versions: ["1.2"], prefix: "1", expected: "1.3"},
        {versions: ["1", "1.1"], prefix: "1", expected: "1.2"},
        {versions: ["1.1", "1"], prefix: "1", expected: "1.2"},
    ])('prefix $prefix in $versions', async ({versions, prefix, expected}) => {
        mockListPackageVersionsReturn(versions, "aaa");
        const res = await computeVersion("domain", "package", "repository", "format", prefix, false, 1);
        expect(res).toBe(expected);
    });

    test.each([
        // Ordering is important on the versions for how we search them
        {versions: [], prefix: "1"},
        {versions: ["10"], prefix: "1"},
        {versions: ["2"], prefix: "1"},
        {versions: ["1"], prefix: "1.3"},
    ])('prefix $prefix in $versions, die-on-missing', async ({versions, prefix}) => {
        mockListPackageVersionsReturn(versions, "aaa");
        // Note not awaiting here
        const res = computeVersion("domain", "package", "repository", "format", prefix, true, 1);
        await expect(res).rejects.toThrow();
    });
});
