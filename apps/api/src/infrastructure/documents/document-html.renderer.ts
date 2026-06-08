import { WillDocument } from '@will-maker/will-domain';

export class DocumentHtmlRenderer {
  render(document: WillDocument): string {
    const sectionsHtml = document.sections
      .map(
        (section) => `
    <section id="${section.id}" class="will-section">
      <h2>${escapeHtml(section.title)}</h2>
      <div class="section-content">${formatContent(section.content)}</div>
    </section>`,
      )
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Last Will and Testament — ${escapeHtml(document.testatorName)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; color: #1a1a1a; line-height: 1.6; }
    h1 { text-align: center; font-size: 1.75rem; margin-bottom: 0.25rem; }
    .meta { text-align: center; color: #555; margin-bottom: 2rem; font-size: 0.95rem; }
    h2 { font-size: 1.15rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; margin-top: 1.75rem; }
    .section-content { white-space: pre-wrap; margin-top: 0.75rem; }
    footer { margin-top: 3rem; font-size: 0.85rem; color: #666; text-align: center; }
  </style>
</head>
<body>
  <h1>Last Will and Testament</h1>
  <p class="meta">
    ${escapeHtml(document.testatorName)} · Revision ${document.revision}
  </p>
  ${sectionsHtml}
  <footer>Generated ${document.generatedAt.toISOString()}</footer>
</body>
</html>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatContent(content: string): string {
  return escapeHtml(content).replace(/\n/g, '<br />');
}
