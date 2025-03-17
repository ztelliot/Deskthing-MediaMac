# MediaMac

## Tips

You should fix `sharp` before use

```shell
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
  ARCH="x64"
fi
cp "/Applications/DeskThing.app/Contents/Resources/app.asar.unpacked/node_modules/@img/sharp-libvips-darwin-$ARCH/lib/libvips-cpp.42.dylib" /Applications/DeskThing.app/Contents/Frameworks
```

## Known Issues
