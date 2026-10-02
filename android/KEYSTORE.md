# The signing key

Android only installs an update over an app signed with the same key. `mooncart.keystore` is
that key for Mooncart: it is kept here, in the open, on purpose, so that every build (on any
computer, or GitHub's build servers, in 20 years) can make an update that installs over the
copy on your phone without losing your games or saves.

| | |
|---|---|
| file | `android/mooncart.keystore` (PKCS12) |
| alias | `mooncart` |
| passwords | `mooncart` (store and key) |
| valid until | 2126 |
| SHA-256 | `DE:0B:77:4B:6C:EE:7D:98:AF:FA:8A:8F:51:55:FD:DF:DD:45:8C:E5:DD:D4:9A:E9:40:C3:68:11:4B:66:0C:5F` |

Because it is public, anyone could sign an app that claims to be Mooncart. That only matters
if you install Mooncart from somewhere other than this repository's Releases page. To use a
private key instead, set `MOONCART_KEYSTORE`, `MOONCART_KEYSTORE_PASS`, `MOONCART_KEY_ALIAS` and
`MOONCART_KEY_PASS` when running `android/build.sh` (on GitHub: repository secrets, see the
workflow). Switching keys means uninstalling the old app once, so back up first
(File › Back up everything…) and restore after.
