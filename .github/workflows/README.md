# Writer's Helper desktop — release pipeline

Three GitHub Actions workflows, all triggered by pushing a `v*.*.*` git tag:

| Workflow | Runner | Outputs | Required secrets |
|---|---|---|---|
| `release-mac.yml`     | `macos-latest`   | `.dmg` (notarized, Developer ID-signed) + `.pkg` (Mac App Store) | Apple cert + provisioning bundle (see below) |
| `release-windows.yml` | `windows-latest` | `.exe` (NSIS installer) + portable `.exe`                        | Optional Windows code-sign cert |
| `release-linux.yml`   | `ubuntu-latest`  | `.AppImage`                                                       | None — `GITHUB_TOKEN` only |

All three: use Node 22.12, install with frozen lockfile, build with `yarn release:*`, attach binaries to the auto-created GitHub Release for that tag, and upload artifacts to the workflow run for 30 days.

## How to cut a release

```bash
# from your Mac, after merging features into main:
cd Writers_Helper
npm version --prefix desktop 1.0.1     # bumps desktop/package.json
git add desktop/package.json
git commit -m "release: desktop 1.0.1"
git tag v1.0.1
git push origin main v1.0.1
```

That single tag push triggers all three workflows in parallel. ~10 minutes later a draft release at https://github.com/SilverWolfe7/Writers_Helper/releases/tag/v1.0.1 has the `.dmg`, `.pkg`, `.exe`, and `.AppImage` attached.

## Required GitHub repo secrets — `release-mac.yml`

Go to **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | What it is | How to produce it |
|---|---|---|
| `APPLE_ID` | Your Apple Developer account email | — |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for notarization | https://appleid.apple.com → Sign-In and Security → App-Specific Passwords |
| `APPLE_TEAM_ID` | 10-char Team ID | https://developer.apple.com/account → Membership |
| `CSC_LINK` | Base64-encoded `.p12` containing **"Developer ID Application"** + **"3rd Party Mac Developer Application"** certs | `security export -k login.keychain -t identities -f pkcs12 -o certs.p12` (set a strong export password), then `base64 -i certs.p12 \| pbcopy` |
| `CSC_KEY_PASSWORD` | The password you used when exporting `certs.p12` | — |
| `MAS_INSTALLER_CSC_LINK` | Base64-encoded `.p12` containing **"3rd Party Mac Developer Installer"** cert (used to sign the `.pkg`) | Same export technique with just that one identity |
| `MAS_INSTALLER_CSC_KEY_PASSWORD` | Password for that installer `.p12` | — |
| `MAS_PROVISIONING_PROFILE` | Base64-encoded `embedded.provisionprofile` | `base64 -i embedded.provisionprofile \| pbcopy` |

After the first successful run, the `.pkg` will be on the GitHub release page. Drag it into Apple's **Transporter** app to upload to App Store Connect for review.

## Optional — Windows code-signing (`release-windows.yml`)

If you've bought a Windows code-signing certificate (DigiCert, SSL.com, etc.):

| Secret | What it is |
|---|---|
| `WIN_CSC_LINK` | Base64-encoded `.pfx` of your code-signing cert |
| `WIN_CSC_KEY_PASSWORD` | Password for the `.pfx` |

Without these, Windows binaries still build — they're just unsigned and SmartScreen will warn first-time users. Many Electron apps ship unsigned in the early days; you can add the cert later without touching the workflow.

## Local sanity check before pushing the tag

```bash
cd desktop
nvm use                         # picks up .nvmrc -> Node 22.12.0
yarn install --frozen-lockfile
yarn package:linux              # works on any OS, fastest smoke test
```

If that produces `dist/Writer's Helper-X.Y.Z.AppImage`, your CI will work too.
