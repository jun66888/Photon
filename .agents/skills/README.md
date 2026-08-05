# Presentation skills

This project vendors two official OpenAI skills:

- `slides`: editable PowerPoint authoring with PptxGenJS plus rendering,
  overflow, montage, and font-substitution checks. It is pinned to the last
  curated version from `openai/skills` commit `82d2c5b4`.
- `imagegen`: presentation artwork generation and editing guidance from
  `openai/skills` commit `49f948faa9258a0c61caceaf225e179651397431`.

Install the JavaScript runtime used by `slides`:

```bash
npm ci --prefix .agents/skills/slides
```

Install its Python validation dependencies:

```bash
python3 -m pip install pillow pdf2image python-pptx numpy
```

Rendering and font checks also require LibreOffice, Poppler, and Fontconfig.
On Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y libreoffice-impress poppler-utils fontconfig
```

The service-specific Google Slides, SharePoint, Canva, and Figma skills are
not vendored here. They require their corresponding authenticated connector;
the Cursor environment already provides its own Figma Slides integration.
