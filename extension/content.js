// NullPass Content Script
// Detects password fields and provides autofill functionality

importScripts('nullpass-core.js');

class NullPassContentScript {
  constructor() {
    this.site = this.getSiteFromUrl();
    this.loginField = null;
    this.passwordField = null;
    this.nullpass = new NullPassCore();
    this.init();
  }

  async init() {
    this.detectPasswordFields();
    this.setupMutationObserver();
  }

  getSiteFromUrl() {
    const url = new URL(window.location.href);
    return url.hostname.replace(/^www\./, '');
  }

  detectPasswordFields() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(passwordInput => {
      const loginInput = this.findLoginField(passwordInput);
      if (loginInput) {
        this.addNullPassUI(loginInput, passwordInput);
      }
    });
  }

  findLoginField(passwordInput) {
    const form = passwordInput.form;
    
    if (form) {
      const selectors = [
        'input[type="email"]',
        'input[type="text"]',
        'input[name*="email"]',
        'input[name*="user"]',
        'input[name*="login"]',
        'input[id*="email"]',
        'input[id*="user"]',
        'input[id*="login"]'
      ];
      
      for (const selector of selectors) {
        const field = form.querySelector(selector);
        if (field && field !== passwordInput) {
          return field;
        }
      }
    }
    
    let prevElement = passwordInput.previousElementSibling;
    while (prevElement) {
      if (prevElement.tagName === 'INPUT' && 
          (prevElement.type === 'email' || prevElement.type === 'text')) {
        return prevElement;
      }
      prevElement = prevElement.previousElementSibling;
    }
    
    return null;
  }

  addNullPassUI(loginInput, passwordInput) {
    this.loginField = loginInput;
    this.passwordField = passwordInput;

    const container = document.createElement('div');
    container.className = 'nullpass-container';
    
    const generateBtn = document.createElement('button');
    generateBtn.className = 'nullpass-btn nullpass-generate';
    generateBtn.innerHTML = '⚡ Generate';
    generateBtn.title = 'Generate password with NullPass';
    
    const autofillBtn = document.createElement('button');
    autofillBtn.className = 'nullpass-btn nullpass-autofill';
    autofillBtn.innerHTML = '🔑 Autofill';
    autofillBtn.title = 'Autofill login and password';
    
    container.appendChild(generateBtn);
    container.appendChild(autofillBtn);
    
    passwordInput.parentNode.insertBefore(container, passwordInput.nextSibling);
    
    generateBtn.addEventListener('click', () => this.showGenerateDialog());
    autofillBtn.addEventListener('click', () => this.autofill());
  }

  async showGenerateDialog() {
    const login = this.loginField.value || '';
    
    const dialog = this.createDialog();
    dialog.innerHTML = `
      <div class="nullpass-dialog-header">
        <h3>NullPass Password Generator</h3>
        <button class="nullpass-close">&times;</button>
      </div>
      <div class="nullpass-dialog-body">
        <div class="nullpass-form-group">
          <label>Site:</label>
          <input type="text" id="nullpass-site" value="${this.site}" readonly>
        </div>
        <div class="nullpass-form-group">
          <label>Login:</label>
          <input type="text" id="nullpass-login" value="${login}" placeholder="Enter login">
        </div>
        <div class="nullpass-form-group">
          <label>Master Password:</label>
          <input type="password" id="nullpass-master" placeholder="Enter master password">
        </div>
        <div class="nullpass-options">
          <label><input type="checkbox" id="nullpass-lowercase" checked> Lowercase</label>
          <label><input type="checkbox" id="nullpass-uppercase" checked> Uppercase</label>
          <label><input type="checkbox" id="nullpass-digits" checked> Digits</label>
          <label><input type="checkbox" id="nullpass-symbols" checked> Symbols</label>
        </div>
        <div class="nullpass-form-group">
          <label>Options:</label>
          <input type="text" id="nullpass-options" placeholder="e.g., -L 16 --no-symbols">
        </div>
        <div class="nullpass-generated">
          <label>Generated Password:</label>
          <div class="nullpass-password-display">
            <input type="text" id="nullpass-generated" readonly>
            <button id="nullpass-copy" class="nullpass-copy-btn">📋</button>
          </div>
        </div>
      </div>
      <div class="nullpass-dialog-footer">
        <button id="nullpass-generate-btn" class="nullpass-btn-primary">Generate</button>
        <button id="nullpass-fill-btn" class="nullpass-btn-secondary">Fill Fields</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    this.setupDialogListeners(dialog);
  }

  createDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'nullpass-dialog';
    return dialog;
  }

  setupDialogListeners(dialog) {
    const closeBtn = dialog.querySelector('.nullpass-close');
    const generateBtn = dialog.querySelector('#nullpass-generate-btn');
    const fillBtn = dialog.querySelector('#nullpass-fill-btn');
    const copyBtn = dialog.querySelector('#nullpass-copy');
    
    closeBtn.addEventListener('click', () => this.closeDialog(dialog));
    
    generateBtn.addEventListener('click', async () => {
      const password = await this.generatePassword(dialog);
      if (password) {
        dialog.querySelector('#nullpass-generated').value = password;
      }
    });
    
    fillBtn.addEventListener('click', () => {
      const generatedPassword = dialog.querySelector('#nullpass-generated').value;
      const login = dialog.querySelector('#nullpass-login').value;
      if (generatedPassword) {
        this.fillFields(login, generatedPassword);
        this.closeDialog(dialog);
      }
    });
    
    copyBtn.addEventListener('click', () => {
      const password = dialog.querySelector('#nullpass-generated').value;
      if (password) {
        navigator.clipboard.writeText(password);
        copyBtn.textContent = '✓';
        setTimeout(() => copyBtn.textContent = '📋', 2000);
      }
    });
    
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        this.closeDialog(dialog);
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDialog(dialog);
      }
    });
  }

  async generatePassword(dialog) {
    const site = dialog.querySelector('#nullpass-site').value;
    const login = dialog.querySelector('#nullpass-login').value;
    const masterPassword = dialog.querySelector('#nullpass-master').value;
    const customOptions = dialog.querySelector('#nullpass-options').value;
    
    if (!masterPassword) {
      alert('Master password is required');
      return null;
    }

    try {
      const options = {
        lowercase: dialog.querySelector('#nullpass-lowercase').checked,
        uppercase: dialog.querySelector('#nullpass-uppercase').checked,
        digits: dialog.querySelector('#nullpass-digits').checked,
        symbols: dialog.querySelector('#nullpass-symbols').checked
      };

      // Add custom options parsing
      if (customOptions) {
        const parsed = this.nullpass.parseArguments(customOptions);
        Object.assign(options, parsed);
      }

      return await this.nullpass.generatePassword(site, login, masterPassword, options);
    } catch (error) {
      console.error('NullPass error:', error);
      alert('Error generating password: ' + error.message);
      return null;
    }
  }

  fillFields(login, password) {
    if (this.loginField && login) {
      this.loginField.value = login;
      this.loginField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (this.passwordField && password) {
      this.passwordField.value = password;
      this.passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  async autofill() {
    try {
      // Try to get saved profile for this site
      const response = await chrome.runtime.sendMessage({
        action: 'getProfile',
        data: { site: this.site }
      });
      
      if (response.success && response.profile) {
        this.fillFields(response.profile.login, '');
        this.showGenerateDialog();
      } else {
        this.showGenerateDialog();
      }
    } catch (error) {
      console.error('NullPass autofill error:', error);
      this.showGenerateDialog();
    }
  }

  closeDialog(dialog) {
    dialog.remove();
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const passwordInputs = node.querySelectorAll ? 
                node.querySelectorAll('input[type="password"]') : [];
              passwordInputs.forEach(input => this.detectPasswordFields());
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new NullPassContentScript());
} else {
  new NullPassContentScript();
}