# AWS CodeArtifact Next Version action

Uses the AWS CodeArtifact API to fetch the next sequential version from an AWS CodeArtifact package.

This is a third-party action and not maintained by Amazon.

# Inputs

* `domain` The name of the domain that contains the repository that contains the returned package versions (see [AWS API reference](https://docs.aws.amazon.com/codeartifact/latest/APIReference/API_ListPackageVersions.html#API_ListPackageVersions_RequestSyntax)).
* `package` The 12-digit account number of the AWS account that owns the domain (see [AWS API reference](https://docs.aws.amazon.com/codeartifact/latest/APIReference/API_ListPackageVersions.html#API_ListPackageVersions_RequestSyntax)).
* `repository` The name of the repository that contains the package (see [AWS API reference](https://docs.aws.amazon.com/codeartifact/latest/APIReference/API_ListPackageVersions.html#API_ListPackageVersions_RequestSyntax)).
* `format` Optional. The format of the returned packages (see [AWS API reference](https://docs.aws.amazon.com/codeartifact/latest/APIReference/API_ListPackageVersions.html#API_ListPackageVersions_RequestSyntax)).
* `prefix` Optional. Package version prefix.
* `die-on-missing` Optional `true` or `false`. Fail if no matching existing version was found. Deafults to `false`.
* `increment-amount` Optional. Amount to increment the version number by. Defaults to 1.

# Behaviour

The behaviour depends on whether you've provided a prefix, and what is found on CodeArtifact.

This action only works with numeric, dot-separated version strings e.g. `1.2.3.4`. It will fail on other strings e.g. `1.2+beta`.

## Prefix Mode

In this example we'll use a prefix value of `4.5` and the default increment-amount.

The versions are sorted by "latest", which is based on `PUBLISHED_TIME`, not comparison of the version numbers.

| `die-on-missing` | No Match        | Sub-version match (e.g. `4.5.2`) |
|------------------|-----------------|----------------------------------|
| `true`           | Step fails      | Outputs `4.5.3`                  |
| `false`          | Outputs `4.5.1` | Outputs `4.5.3`                  |

## Non-Prefix Mode

In this example we'll use the default increment-amount.

Non-prefix mode uses `defaultDisplayVersion` as a shortcut value for "latest". It then increments the final segment.

| `die-on-missing` | Missing `defaultDisplayVersion` | `defaultDisplayVersion` is `4` | `defaultDisplayVersion` is `5.6.7` |
|------------------|---------------------------------|--------------------------------|------------------------------------|
| `true`           | Step fails                      | Outputs `5`                    | Outputs `5.6.8`                    |
| `false`          | Outputs `1`                     | Outputs `5`                    | Outputs `5.6.8`                    |
