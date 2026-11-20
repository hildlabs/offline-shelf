# offline-shelf

Unofficial offline themes for [kiwix-serve](https://github.com/kiwix/kiwix-tools), the
web server that serves Wikipedia and other ZIM archives without internet.

> This is a community project. It is not affiliated with or endorsed by the
> Kiwix project.

## Goals

- **Fully offline.** Once the repository is on your machine, nothing is ever
  downloaded at runtime. Themes must not reference web fonts, CDNs or any
  external URL.
- **No extra software.** No proxy, no fork, no rebuild of Kiwix. Themes use a
  mechanism kiwix-serve already ships.
- **Small.** A theme is a handful of CSS files, plus local fonts or images if
  it needs them. Runs fine on a Raspberry Pi.

## How it works

kiwix-serve reads the environment variable `KIWIX_SERVE_CUSTOMIZED_RESOURCES`.
It points to a text file where each line maps a URL to a local file:

```
/skin/index.css text/css /themes/mytheme/files/skin/index.css
```

kiwix-serve then serves that file instead of its built-in one. A theme in this
repository is a folder whose `files/` directory mirrors the URLs it replaces,
plus a generated `resources.txt`. Details and caveats are in
[docs/how-it-works.md](docs/how-it-works.md).

## Use a theme

With Docker, mount the `themes/` folder and set the variable to the theme's
`resources.txt`:

```yaml
volumes:
  - ./offline-shelf/themes:/themes:ro
environment:
  KIWIX_SERVE_CUSTOMIZED_RESOURCES: /themes/<theme>/resources.txt
```

A complete file is in [examples/docker-compose.yml](examples/docker-compose.yml).
Without Docker, run `tools/kiwix-theme build <theme> /path/to/offline-shelf/themes`
first, so `resources.txt` contains paths that exist on your machine.

To return to the stock look, remove the variable and restart kiwix-serve.

## Available themes

None yet.

## Make a theme

```sh
tools/kiwix-theme new mytheme
tools/kiwix-theme base mytheme http://localhost:8080   # copy stock CSS from your server
# edit themes/mytheme/files/skin/*.css
tools/kiwix-theme build mytheme
tools/kiwix-theme check mytheme http://localhost:8080  # after restarting kiwix-serve with the theme
```

The helper is a plain POSIX shell script. It is only needed to create themes,
not to run them.

## Compatibility

| kiwix-serve | libkiwix | Mechanism works |
| ----------- | -------- | --------------- |
| 3.5.0       | 12.1.1   | yes (tested)    |
| latest      | 15.x     | present in source, not yet tested end to end |

Stock CSS changes between Kiwix releases. Each theme notes the version it was
tested with.

## License

GPL-3.0-or-later, the same license as Kiwix. Themes are usually derived from
Kiwix's own CSS, so they inherit its license.
