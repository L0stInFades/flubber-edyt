# flubber-edyt LTS Policy

## Active LTS Line

- Line: `0.3.x`
- LTS branch: `lts/0.3`
- First LTS snapshot tag: `v0.3.1-lts.0`
- Support window: 12 months from release date

## What LTS Receives

- Critical bug fixes
- Security fixes
- Runtime compatibility fixes (for declared supported environments)

## What LTS Does Not Receive

- Breaking API changes
- Feature work that changes morph behavior by default
- Large refactors without clear production need

## Upgrade Recommendation

- Pin to a specific snapshot tag for strict reproducibility.
- Use the rolling LTS branch only if you want ongoing patch backports.
