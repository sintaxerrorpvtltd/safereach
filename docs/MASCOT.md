# Choosing Poki's character

The current blue brand SVG is a placeholder. Hemang selected a soft2D waving-person
direction for personal avatars; see AVATAR_STYLE.md. Every friend has their own
avatar and display name; a shared brand character cannot identify the sender. Keep the code and character licensing separate: third-party
artwork does not become Apache-2.0 just because this repository is.

Start with a transparent SVG and its editable source. For independently moving a
hand, eyes or body, keep those parts as named groups/layers. PNG is an acceptable
fallback for raster artwork. JPG loses transparency; MP4/video frames are not the
primary source for an interactive character. Rive (.riv) or Lottie JSON would be a
later animation choice, with a still SVG/PNG fallback and an asset license that
permits distributing the source in this public repository.

Candidates checked 2026-11-02:

- [DiceBear styles](https://www.dicebear.com/styles/): customizable avatar choices.
  Check the chosen style's artwork license; the software license is not a blanket
  license for every character. [Bottts](https://www.dicebear.com/styles/bottts/) is
  a robot option; not yet selected or licensed into this repo.
- [Open Peeps](https://www.openpeeps.com/): modular hand-drawn people, SVG/PNG,
  explicitly CC0. Good when the character should be human.
- [Free Gophers](https://github.com/MariaLetta/free-gophers-pack): mascot poses,
  CC0 collection, but strongly associated with Go; consider identity fit.
- [Rive Marketplace](https://rive.app/marketplace/): animated character inspiration.
  Not a blanket open-source asset collection; check the specific asset license
  and source/export availability before choosing.

Current site artwork lives at `site/assets/poki.svg`; its references share that
one file. The older local inbox uses a CSS character. When a replacement is
chosen, update both surfaces to consume the same canonical asset, include its
license/source record, and verify still, hello and reduced-motion states. Do not
silently substitute a different character or vendor API URL.
