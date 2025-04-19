/**
 * Common styles for all components
 * Using Profullstack, Inc. theme variables
 */
export const commonStyles = `
  :host {
    display: block;
    font-family: var(--font-family);
    line-height: var(--line-height-normal);
    color: var(--text-primary);
  }

  .container {
    display: flex;
    gap: var(--spacing-lg);
  }

  .editor-container, .preview-container {
    flex: 1;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-md);
    background-color: var(--card-background);
    box-shadow: var(--shadow-sm);
  }

  textarea {
    width: 100%;
    height: 400px;
    font-family: monospace;
    padding: var(--spacing-md);
    border: 1px solid var(--input-border);
    border-radius: var(--border-radius-md);
    resize: vertical;
    background-color: var(--input-background);
    color: var(--text-primary);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  iframe {
    width: 100%;
    height: 400px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    background-color: var(--background-color);
  }

  .buttons {
    margin-top: var(--spacing-lg);
    text-align: center;
  }

  button {
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: var(--primary-color);
    color: var(--text-on-primary);
    border: none;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    font-size: var(--font-size-md);
    margin: 0 var(--spacing-sm);
    font-weight: var(--font-weight-medium);
    transition: background-color var(--transition-fast), transform var(--transition-fast);
  }

  button:hover {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
  }

  button:active {
    transform: translateY(0);
  }

  .pdf-button {
    background-color: var(--error-color);
  }

  .pdf-button:hover {
    background-color: #d32f2f;
  }

  .doc-button {
    background-color: var(--primary-color);
  }

  .doc-button:hover {
    background-color: var(--primary-dark);
  }

  .excel-button {
    background-color: var(--success-color);
  }

  .excel-button:hover {
    background-color: var(--secondary-dark);
  }

  .ppt-button {
    background-color: var(--warning-color);
  }

  .ppt-button:hover {
    background-color: #F57C00;
  }

  .md-button {
    background-color: #9C27B0;
  }

  .md-button:hover {
    background-color: #7B1FA2;
  }

  .status {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-md);
    border-radius: var(--border-radius-md);
    text-align: center;
    display: none;
  }

  .success {
    background-color: rgba(16, 185, 129, 0.1);
    border-left: 4px solid var(--success-color);
    color: var(--success-color);
  }

  .error {
    background-color: rgba(239, 68, 68, 0.1);
    border-left: 4px solid var(--error-color);
    color: var(--error-color);
  }

  .preview-html {
    padding: var(--spacing-lg);
    overflow: auto;
    color: var(--text-primary);
  }

  h2 {
    margin-top: 0;
    color: var(--text-primary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-xl);
  }

  /* Table styles for the preview */
  .preview-html table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--spacing-lg);
  }

  .preview-html th,
  .preview-html td {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-color);
    text-align: left;
  }

  .preview-html th {
    font-weight: var(--font-weight-semibold);
    background-color: var(--surface-variant);
  }

  /* Form styles for the preview */
  .preview-html input,
  .preview-html select,
  .preview-html textarea {
    padding: var(--spacing-sm);
    border: 1px solid var(--input-border);
    border-radius: var(--border-radius-sm);
    background-color: var(--input-background);
    color: var(--text-primary);
  }

  .preview-html label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
  }

  /* Link styles for the preview */
  .preview-html a {
    color: var(--primary-color);
    text-decoration: none;
  }

  .preview-html a:hover {
    text-decoration: underline;
  }

  /* Code block styles for the preview */
  .preview-html pre,
  .preview-html code {
    font-family: monospace;
    background-color: var(--surface-variant);
    padding: var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    overflow-x: auto;
  }
`;