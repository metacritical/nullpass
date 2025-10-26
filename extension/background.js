// NullPass Background Script
// Handles extension lifecycle and storage

importScripts('nullpass-core.js');

class NullPassBackground {
  constructor() {
    this.nullpass = new NullPassCore();
    this.init();
  }

  init() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.onInstall();
      } else if (details.reason === 'update') {
        this.onUpdate();
      }
    });

    // Handle messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle action button click
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });
  }

  onInstall() {
    console.log('NullPass extension installed');
    // Initialize default settings
    chrome.storage.local.set({
      profiles: {},
      settings: {
        autoDetect: true,
        defaultLength: 16,
        defaultOptions: {
          lowercase: true,
          uppercase: true,
          digits: true,
          symbols: true
        }
      }
    });
  }

  onUpdate() {
    console.log('NullPass extension updated');
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'generatePassword':
          const password = await this.generatePassword(request.data);
          sendResponse({ success: true, password });
          break;
          
        case 'saveProfile':
          await this.saveProfile(request.data);
          sendResponse({ success: true });
          break;
          
        case 'getProfile':
          const profile = await this.getProfile(request.data.site);
          sendResponse({ success: true, profile });
          break;
          
        case 'deleteProfile':
          await this.deleteProfile(request.data.site);
          sendResponse({ success: true });
          break;
          
        case 'getAllProfiles':
          const profiles = await this.getAllProfiles();
          sendResponse({ success: true, profiles });
          break;
          
        case 'getSettings':
          const settings = await this.getSettings();
          sendResponse({ success: true, settings });
          break;
          
        case 'updateSettings':
          await this.updateSettings(request.data);
          sendResponse({ success: true });
          break;
          
        case 'openSettings':
          await this.openSettings();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async generatePassword(data) {
    const { site, login, masterPassword, length, exclude, options } = data;
    
    try {
      // Use the NullPassCore implementation
      return await this.nullpass.generatePassword(site, login, masterPassword, {
        length,
        exclude,
        ...options
      });
    } catch (error) {
      throw new Error('Password generation failed: ' + error.message);
    }
  }

  async saveProfile(data) {
    const { site, login, options } = data;
    const result = await chrome.storage.local.get(['profiles']);
    const profiles = result.profiles || {};
    
    profiles[site] = {
      site,
      login: login || '',
      options: options || {},
      savedAt: Date.now()
    };
    
    await chrome.storage.local.set({ profiles });
  }

  async getProfile(site) {
    const result = await chrome.storage.local.get(['profiles']);
    const profiles = result.profiles || {};
    return profiles[site] || null;
  }

  async deleteProfile(site) {
    const result = await chrome.storage.local.get(['profiles']);
    const profiles = result.profiles || {};
    delete profiles[site];
    await chrome.storage.local.set({ profiles });
  }

  async getAllProfiles() {
    const result = await chrome.storage.local.get(['profiles']);
    return result.profiles || {};
  }

  async getSettings() {
    const result = await chrome.storage.local.get(['settings']);
    return result.settings || {};
  }

  async updateSettings(settings) {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    await chrome.storage.local.set({ settings: newSettings });
  }

  async openSettings() {
    // Open the popup or a dedicated settings page
    chrome.action.openPopup();
  }

  handleActionClick(tab) {
    // Handle toolbar button click
    chrome.action.openPopup();
  }
}

// Initialize the background script
new NullPassBackground();