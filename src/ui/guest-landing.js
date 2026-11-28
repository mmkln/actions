import { icon } from './icons.js';

export function guestLandingView() {
  return `
    <section class="guest-landing" aria-labelledby="guest-landing-title" data-guest-landing hidden>
      <div class="guest-landing__panel">
        <div class="guest-landing__copy">
          <h1 id="guest-landing-title">Your actions, in one place</h1>
          <p>Bring thoughts, tasks, and goals together on a single canvas.</p>
          <button class="guest-landing__sign-in" type="button" data-guest-sign-in>
            Sign in
          </button>
          <small data-guest-status>Uses your Majom ID</small>
        </div>

        <div class="guest-preview" aria-hidden="true">
          <svg class="guest-preview__connections" viewBox="0 0 320 220" preserveAspectRatio="none">
            <path d="M94 48 C196 48 222 68 250 108" />
            <path d="M104 174 C198 174 224 146 250 112" />
          </svg>

          <div class="guest-preview__card is-thought">
            <span class="guest-preview__icon">${icon('thought')}</span>
            <span class="guest-preview__card-copy">
              <small>Thought</small>
              <strong>Capture the idea</strong>
            </span>
          </div>

          <div class="guest-preview__card is-action">
            <span class="guest-preview__icon">${icon('action')}</span>
            <span class="guest-preview__card-copy">
              <small>Action</small>
              <strong>Shape the next move</strong>
            </span>
          </div>

          <div class="guest-preview__card is-task">
            <span class="guest-preview__icon">${icon('check')}</span>
            <span class="guest-preview__card-copy">
              <small>Task</small>
              <strong>Make it concrete</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  `;
}
