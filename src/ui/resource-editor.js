export function resourceEditorView() {
  return `
    <div class="resource-editor-backdrop" data-resource-editor-backdrop hidden>
      <section class="resource-editor" role="dialog" aria-modal="true" aria-labelledby="resource-editor-title">
        <header class="resource-editor__header">
          <div>
            <h2 id="resource-editor-title" data-resource-editor-heading>Edit item</h2>
            <p data-resource-editor-source></p>
          </div>
          <button type="button" aria-label="Close editor" data-resource-editor-close>×</button>
        </header>
        <label class="resource-editor__field">
          <span>TITLE</span>
          <input type="text" autocomplete="off" data-resource-editor-input>
          <textarea rows="5" data-resource-editor-textarea hidden></textarea>
        </label>
        <p class="resource-editor__error" role="alert" data-resource-editor-error hidden></p>
        <footer class="resource-editor__footer">
          <button type="button" data-resource-editor-cancel>Cancel</button>
          <button class="resource-editor__save" type="button" data-resource-editor-save>Save</button>
        </footer>
      </section>
    </div>
  `;
}
