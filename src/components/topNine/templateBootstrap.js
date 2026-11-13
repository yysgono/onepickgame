// The server embeds only the same public fields used by loadTemplatePage.
export function readTemplateBootstrap(templateId) {
  if (typeof document === 'undefined') return null;
  try {
    const node = document.getElementById('top-nine-template-data');
    const cup = node ? JSON.parse(node.textContent) : null;
    if (cup?.id !== templateId || !Array.isArray(cup.data)) return null;
    if (!cup.data.some(candidate => candidate?.image || candidate?.image_url || candidate?.url)) return null;
    return cup;
  } catch { return null; }
}
