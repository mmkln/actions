export function resourceDeleteDialogView() {
  return `
    <div class="resource-delete-backdrop" data-resource-delete-backdrop hidden>
      <section class="resource-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="resource-delete-title" aria-describedby="resource-delete-message">
        <header class="resource-delete-dialog__header">
          <h2 id="resource-delete-title" data-resource-delete-heading>Delete permanently?</h2>
        </header>
        <div class="resource-delete-dialog__body">
          <p id="resource-delete-message" data-resource-delete-message></p>
          <p class="resource-delete-dialog__error" role="alert" data-resource-delete-error hidden></p>
        </div>
        <footer class="resource-delete-dialog__footer">
          <button type="button" data-resource-delete-cancel>Cancel</button>
          <button class="resource-delete-dialog__confirm" type="button" data-resource-delete-confirm>Delete permanently</button>
        </footer>
      </section>
    </div>
  `;
}
