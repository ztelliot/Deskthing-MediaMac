# MediaMac

## How To

1. Fix `sharp`

```shell
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
  ARCH="x64"
fi
cp "/Applications/DeskThing.app/Contents/Resources/app.asar.unpacked/node_modules/@img/sharp-libvips-darwin-$ARCH/lib/libvips-cpp.42.dylib" /Applications/DeskThing.app/Contents/Frameworks
```

2. Chmod `media-cli`

```shell
chmod +x ~/Library/Application\ Support/deskthing/apps/mediamac/media-cli
```

## Known Issues
