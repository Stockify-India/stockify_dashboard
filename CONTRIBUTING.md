# Contributing

## Workflow

1. Create a branch off `main` for your change.
2. Push your branch and open a pull request into `main`.
3. The CI workflow (lint, typecheck, build) runs automatically on the PR — make sure it passes.
4. A repo admin/owner reviews the PR and approves it.
5. Only a repo admin/owner merges the PR into `main`. Do not push directly to `main`.

> Note: this process is not yet enforced by GitHub branch protection — the org's
> current plan (Free) doesn't support protection rules on private repos. If the
> org upgrades to GitHub Team, or the repo becomes public, enable a branch
> protection rule on `main` requiring a pull request, at least one approval,
> and a passing CI check before merge.
