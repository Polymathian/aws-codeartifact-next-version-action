# AWS CodeArtifact Next Version action

Uses the AWS CodeArtifact API to fetch the next sequential version from an AWS CodeArtifact package.

This is a third-party action and not maintained by Amazon.

# Inputs

* `domain` The name of the domain that contains the repository that contains the returned package versions (see AWS SDK.)
* `package` The 12-digit account number of the AWS account that owns the domain (see AWS SDK.)
* `repository` The name of the repository that contains the package (see AWS SDK.)
* `format` Optional. The format of the returned packages (see AWS SDK.)
* `prefix` Optional. Package version prefix.
* `increment-amount` Optional. Amount to increment the version number by.
