// NullPass Popup Script
// Handles the extension popup interface

class NullPassPopup {
  constructor() {
    this.currentSite = '';
    this.currentTab = null;
    this.init();
  }

  async init() {
    await this.getCurrentTab();
    this.setupEventListeners();
    this.loadSettings();
    await this.loadProfiles();
    this.updateCurrentSite();
  }

  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      if (tab && tab.url) {
        const url = new URL(tab.url);
        this.currentSite = url.hostname.replace(/^www\./, '');
      }
    } catch (error) {
      console.error('Failed to get current tab:', error);
      this.currentSite = 'unknown';
    }
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Generate form
    document.getElementById('generateForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.generatePassword();
    });

    // Length slider
    const lengthInput = document.getElementById('lengthInput');
    const lengthDisplay = document.querySelector('.length-display');
    lengthInput.addEventListener('input', (e) => {
      lengthDisplay.textContent = e.target.value;
    });

    // Copy button
    document.getElementById('copyBtn').addEventListener('click', () => this.copyPassword());

    // Save profile button
    document.getElementById('saveProfileBtn').addEventListener('click', () => this.saveProfile());

    // Password visibility toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        const input = document.getElementById(targetId);
        if (input.type === 'password') {
          input.type = 'text';
          e.target.textContent = '🙈';
        } else {
          input.type = 'password';
          e.target.textContent = '👁️';
        }
      });
    });

    // Refresh profiles
    document.getElementById('refreshProfilesBtn').addEventListener('click', () => this.loadProfiles());

    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });

    // Footer links
    document.getElementById('aboutLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.showAbout();
    });

    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load specific tab data
    if (tabName === 'profiles') {
      this.loadProfiles();
    }
  }

  updateCurrentSite() {
    document.getElementById('currentSite').textContent = this.currentSite || 'No site detected';
    document.getElementById('siteInput').value = this.currentSite || '';
  }

  async generatePassword() {
    const site = document.getElementById('siteInput').value;
    const login = document.getElementById('loginInput').value;
    const masterPassword = document.getElementById('masterInput').value;
    const length = document.getElementById('lengthInput').value;
    const exclude = document.getElementById('excludeInput').value;

    const options = {
      lowercase: document.getElementById('lowercaseCheck').checked,
      uppercase: document.getElementById('uppercaseCheck').checked,
      digits: document.getElementById('digitsCheck').checked,
      symbols: document.getElementById('symbolsCheck').checked
    };

    if (!masterPassword) {
      this.showError('Master password is required');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generatePassword',
        data: { site, login, masterPassword, length, exclude, options }
      });

      if (response.success) {
        document.getElementById('generatedPassword').value = response.password;
        this.showSuccess('Password generated successfully');
      } else {
        this.showError('Failed to generate password: ' + response.error);
      }
    } catch (error) {
      this.showError('Error generating password: ' + error.message);
    }
  }

  async copyPassword() {
    const password = document.getElementById('generatedPassword').value;
    if (!password) {
      this.showError('No password to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
      const copyBtn = document.getElementById('copyBtn');
      copyBtn.textContent = '✓';
      copyBtn.classList.add('copied');
      this.showSuccess('Password copied to clipboard');
      
      setTimeout(() => {
        copyBtn.textContent = '📋';
        copyBtn.classList.remove('copied');
      }, 2000);
    } catch (error) {
      this.showError('Failed to copy password');
    }
  }

  async saveProfile() {
    const site = document.getElementById('siteInput').value;
    const login = document.getElementById('loginInput').value;

    if (!site) {
      this.showError('Site is required');
      return;
    }

    const options = {
      lowercase: document.getElementById('lowercaseCheck').checked,
      uppercase: document.getElementById('uppercaseCheck').checked,
      digits: document.getElementById('digitsCheck').checked,
      symbols: document.getElementById('symbolsCheck').checked,
      length: document.getElementById('lengthInput').value,
      exclude: document.getElementById('excludeInput').value
    };

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveProfile',
        data: { site, login, options }
      });

      if (response.success) {
        this.showSuccess('Profile saved successfully');
        this.loadProfiles();
      } else {
        this.showError('Failed to save profile: ' + response.error);
      }
    } catch (error) {
      this.showError('Error saving profile: ' + error.message);
    }
  }

  async loadProfiles() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getAllProfiles' });
      
      if (response.success) {
        this.displayProfiles(response.profiles);
      } else {
        this.showError('Failed to load profiles');
      }
    } catch (error) {
      this.showError('Error loading profiles');
    }
  }

  displayProfiles(profiles) {
    const profilesList = document.getElementById('profilesList');
    
    if (Object.keys(profiles).length === 0) {
      profilesList.innerHTML = '<p class="no-profiles">No saved profiles yet</p>';
      return;
    }

    profilesList.innerHTML = '';
    
    Object.entries(profiles).forEach(([site, profile]) => {
      const profileItem = document.createElement('div');
      profileItem.className = 'profile-item';
      
      profileItem.innerHTML = `
        <div class="profile-info">
          <div class="profile-site">${this.escapeHtml(site)}</div>
          <div class="profile-login">${this.escapeHtml(profile.login || 'No login')}</div>
        </div>
        <div class="profile-actions">
          <button class="profile-btn load" data-site="${this.escapeHtml(site)}">Load</button>
          <button class="profile-btn delete" data-site="${this.escapeHtml(site)}">Delete</button>
        </div>
      `;
      
      profilesList.appendChild(profileItem);
    });

    // Add event listeners to profile buttons
    profilesList.querySelectorAll('.load').forEach(btn => {
      btn.addEventListener('click', (e) => this.loadProfile(e.target.dataset.site));
    });

    profilesList.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', (e) => this.deleteProfile(e.target.dataset.site));
    });
  }

  async loadProfile(site) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getProfile',
        data: { site }
      });

      if (response.success && response.profile) {
        const profile = response.profile;
        
        // Switch to generate tab
        this.switchTab('generate');
        
        // Fill form
        document.getElementById('siteInput').value = profile.site;
        document.getElementById('loginInput').value = profile.login || '';
        
        if (profile.options) {
          document.getElementById('lowercaseCheck').checked = profile.options.lowercase !== false;
          document.getElementById('uppercaseCheck').checked = profile.options.uppercase !== false;
          document.getElementById('digitsCheck').checked = profile.options.digits !== false;
          document.getElementById('symbolsCheck').checked = profile.options.symbols !== false;
          document.getElementById('lengthInput').value = profile.options.length || 16;
          document.getElementById('excludeInput').value = profile.options.exclude || '';
          document.querySelector('.length-display').textContent = profile.options.length || 16;
        }
        
        this.showSuccess('Profile loaded');
      } else {
        this.showError('Failed to load profile');
      }
    } catch (error) {
      this.showError('Error loading profile');
    }
  }

  async deleteProfile(site) {
    if (!confirm(`Are you sure you want to delete the profile for ${site}?`)) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'deleteProfile',
        data: { site }
      });

      if (response.success) {
        this.showSuccess('Profile deleted');
        this.loadProfiles();
      } else {
        this.showError('Failed to delete profile');
      }
    } catch (error) {
      this.showError('Error deleting profile');
    }
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      
      if (response.success) {
        const settings = response.settings;
        
        document.getElementById('autoDetectCheck').checked = settings.autoDetect !== false;
        document.getElementById('defaultLengthInput').value = settings.defaultLength || 16;
        
        if (settings.defaultOptions) {
          document.getElementById('defaultLowercaseCheck').checked = settings.defaultOptions.lowercase !== false;
          document.getElementById('defaultUppercaseCheck').checked = settings.defaultOptions.uppercase !== false;
          document.getElementById('defaultDigitsCheck').checked = settings.defaultOptions.digits !== false;
          document.getElementById('defaultSymbolsCheck').checked = settings.defaultOptions.symbols !== false;
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    const settings = {
      autoDetect: document.getElementById('autoDetectCheck').checked,
      defaultLength: parseInt(document.getElementById('defaultLengthInput').value),
      defaultOptions: {
        lowercase: document.getElementById('defaultLowercaseCheck').checked,
        uppercase: document.getElementById('defaultUppercaseCheck').checked,
        digits: document.getElementById('defaultDigitsCheck').checked,
        symbols: document.getElementById('defaultSymbolsCheck').checked
      }
    };

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'updateSettings',
        data: settings
      });

      if (response.success) {
        this.showSuccess('Settings saved');
      } else {
        this.showError('Failed to save settings');
      }
    } catch (error) {
      this.showError('Error saving settings');
    }
  }

  showAbout() {
    alert(`NullPass Browser Extension v1.0.0

A stateless password manager that generates unique passwords for each site using your master password.

Features:
• Generate strong, unique passwords
• Auto-detect password fields
• Save profiles for quick access
• No cloud storage required
• Compatible with NullPass CLI

For more information, visit: https://github.com/metacritical/nullpass`);
  }

  showHelp() {
    alert(`How to use NullPass:

1. Generate Password:
   • Enter your master password
   • Adjust options as needed
   • Click "Generate Password"
   • Copy or save the profile

2. Save Profiles:
   • Fill in your login and preferences
   • Click "Save Profile" for quick access

3. Auto-fill:
   • On login pages, NullPass will detect password fields
   • Click the "🔑 Autofill" button to generate and fill

4. Keyboard Shortcut:
   • Use Ctrl+Shift+N (Cmd+Shift+N on Mac) to open NullPass

Security:
• Your master password is never stored
• Passwords are generated locally
• No data is sent to external servers`);
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      padding: '10px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10000',
      maxWidth: '300px',
      wordWrap: 'break-word',
      backgroundColor: type === 'error' ? '#ef4444' : '#10b981',
      color: 'white',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      animation: 'slideIn 0.3s ease-out'
    });

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => new NullPassPopup());