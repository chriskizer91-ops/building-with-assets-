#!/usr/bin/env python3
"""Make a new Mooncart.apk from an earlier one, with today's console (web/) and games (build/collection/).

For a computer without the Android SDK: the app's Java code doesn't change, so its compiled parts
(classes.dex, the manifest, the icons) are taken from an earlier build (from the Releases page) and only
the assets are replaced. Then it is aligned and signed with the same key (android/mooncart.keystore), so it
installs over the copy on the phone and keeps every save. Signing uses uber-apk-signer
(https://github.com/patrickfav/uber-apk-signer, which carries Google's apksigner and zipalign).

    python3 android/repack.py BASE.apk OUT.apk [--signer uber-apk-signer.jar]

Use android/build.sh instead when the Java code changed or the Android SDK is there.
"""
import os, sys, zipfile, subprocess, shutil, tempfile, argparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CERT_SHA256 = 'de0b774b6cee7d98affa8a8f5155fddfdd458ce5ddd49ae940c368114b660c5f'

ap = argparse.ArgumentParser()
ap.add_argument('base'); ap.add_argument('out')
ap.add_argument('--signer', default=os.path.join(ROOT, 'build', 'uber-apk-signer.jar'))
ap.add_argument('--collection', default=os.path.join(ROOT, 'build', 'collection'))
a = ap.parse_args()

tmp = tempfile.mkdtemp()
unsigned = os.path.join(tmp, 'Mooncart-unsigned.apk')
with zipfile.ZipFile(a.base) as src, zipfile.ZipFile(unsigned, 'w') as out:
    for e in src.infolist():
        if e.filename.startswith(('META-INF/', 'assets/web/', 'assets/collection/')):
            continue
        # keep each part exactly as it was stored (resources.arsc must stay uncompressed)
        out.writestr(e, src.read(e.filename), compress_type=e.compress_type)
    def add(folder, prefix):
        n = 0
        for d, _, files in os.walk(folder):
            for f in sorted(files):
                p = os.path.join(d, f)
                name = prefix + os.path.relpath(p, folder).replace(os.sep, '/')
                zi = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
                zi.compress_type = zipfile.ZIP_DEFLATED
                with open(p, 'rb') as fh:
                    out.writestr(zi, fh.read(), compresslevel=6)
                n += 1
        return n
    w = add(os.path.join(ROOT, 'web'), 'assets/web/')
    c = add(a.collection, 'assets/collection/') if os.path.exists(os.path.join(a.collection, 'collection.json')) else 0
print(f'console files: {w}, game files: {c}')

ks = os.path.join(ROOT, 'android', 'mooncart.keystore')
signed_dir = os.path.join(tmp, 'signed')
r = subprocess.run(['java', '-jar', a.signer, '-a', unsigned, '-o', signed_dir,
                    '--ks', ks, '--ksAlias', 'mooncart', '--ksPass', 'mooncart', '--ksKeyPass', 'mooncart',
                    '--verifySha256', CERT_SHA256], capture_output=True, text=True)
print('\n'.join(l for l in r.stdout.splitlines() if l.strip() and 'JAVA_TOOL_OPTIONS' not in l)[-2500:])
if r.returncode:
    print(r.stderr[-2000:]); sys.exit(1)
made = [f for f in os.listdir(signed_dir) if f.endswith('.apk')]
shutil.move(os.path.join(signed_dir, made[0]), a.out)
shutil.rmtree(tmp)
print(f'{a.out}  {os.path.getsize(a.out) / 1048576:.0f} MB')
