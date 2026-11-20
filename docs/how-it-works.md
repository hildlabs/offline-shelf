# How it works

## The mechanism

libkiwix (the library behind kiwix-serve) reads the environment variable
`KIWIX_SERVE_CUSTOMIZED_RESOURCES` once at startup. If it is set, it reads the
file it points to. Each line has three fields separated by whitespace:

```
<url> <mime-type> <path-to-local-file>
```

For every request whose path matches `<url>`, kiwix-serve returns the content
of the local file with the given MIME type instead of the built-in resource.

Source: `src/server/internalServer.cpp` in
[kiwix/libkiwix](https://github.com/kiwix/libkiwix) (class
`InternalServer::CustomizedResources`). It is covered by the libkiwix tests
`CustomizedServerTest.NewResourcesCanBeAdded` and
`CustomizedServerTest.ContentOfAnyServableUrlCanBeOverriden`. The variable is
not mentioned in the kiwix-serve documentation.

## Observed behaviour

Tested with kiwix-serve 3.5.0 / libkiwix 12.1.1:

- Overriding `/skin/index.css` works. The query string Kiwix adds
  (`?cacheid=...`) is ignored when matching, so the override still applies.
- Overridden files are sent with `Cache-Control: max-age=0, must-revalidate`,
  so browsers pick up theme changes without clearing their cache.
- New URLs that kiwix-serve does not know can be added too. A theme can ship
  its own fonts or images this way.
- kiwix-serve prints `Populating customized resources` and one `Got ...` line
  per entry at startup. That is the quickest way to confirm a theme is active.
- The file is read once at startup. Restart kiwix-serve after changing
  `resources.txt`. Content of the mapped files is read per request.

## Limits

- A file replaces the stock file completely. There is no way to append CSS to
  a stock file, so themes contain a full copy of the CSS they change.
- HTML templates are compiled into libkiwix and cannot be replaced this way.
  Themes can only change CSS, JavaScript, images and fonts that the pages load
  by URL. The welcome page itself can be replaced with kiwix-serve's
  `--customIndex` option.
- Paths in `resources.txt` must not contain spaces.
- Class names and file layout can change between Kiwix releases. A theme made
  for one version may look broken on another.
- The variable is undocumented. Kiwix gives no guarantee that it stays.
