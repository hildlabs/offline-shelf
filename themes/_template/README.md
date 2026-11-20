# Theme template

Copy this folder with `tools/kiwix-theme new <name>`.

Everything under `files/` is served by kiwix-serve **at the same URL path**.
`files/skin/index.css` replaces `/skin/index.css`, and so on.

Notes:

- A file replaces the stock file completely. Start from the stock CSS with
  `tools/kiwix-theme base <name> http://<your-server>:<port>` and edit it.
- Keep everything local: no web fonts, CDNs or other external URLs. Fonts and
  images go into `files/` as well.
- Run `tools/kiwix-theme build <name>` after adding or removing files. This
  writes `resources.txt`, the only file kiwix-serve reads.
- Note the kiwix-serve version you tested against in this README.

## Metadata

- Name:
- Author:
- Tested with kiwix-serve:
- License: GPL-3.0-or-later
