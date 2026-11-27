export function resourceEditorView() {
  return `
    <div class="resource-editor-backdrop" data-resource-editor-backdrop hidden>
      <section class="resource-editor" role="dialog" aria-modal="true" aria-labelledby="resource-editor-title">
        <header class="resource-editor__header">
          <h2 id="resource-editor-title" data-resource-editor-heading>Edit item</h2>
          <button type="button" aria-label="Close editor" data-resource-editor-close>×</button>
        </header>
        <div class="resource-editor__field">
          <input type="text" aria-label="Title" autocomplete="off" data-resource-editor-input>
          <textarea rows="5" aria-label="Title" data-resource-editor-textarea hidden></textarea>
        </div>
        <p class="resource-editor__error" role="alert" data-resource-editor-error hidden></p>
        <footer class="resource-editor__footer">
          <button class="resource-editor__delete" type="button" data-resource-editor-delete>Delete permanently…</button>
          <button class="resource-editor__save" type="button" data-resource-editor-save>Save</button>
        </footer>
      </section>
    </div>
  `;
}
