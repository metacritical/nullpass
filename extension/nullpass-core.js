// NullPass Password Generation Logic
// Extracted from the original bash script implementation

class NullPassCore {
  constructor() {
    this.characterSets = {
      lowercase: "abcdefghijklmnopqrstuvwxyz",
      uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", 
      digits: "0123456789",
      symbols: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
    };
  }

  async generatePassword(site, login, masterPassword, options = {}) {
    const {
      length = 16,
      counter = 1,
      lowercase = true,
      uppercase = true,
      digits = true,
      symbols = true,
      exclude = ''
    } = options;

    // Validate inputs
    if (!site || !masterPassword) {
      throw new Error('Site and master password are required');
    }

    if (length < 5 || length > 35) {
      throw new Error('Password length must be between 5 and 35');
    }

    // Build character set
    let charset = '';
    if (lowercase) charset += this.characterSets.lowercase;
    if (uppercase) charset += this.characterSets.uppercase;
    if (digits) charset += this.characterSets.digits;
    if (symbols) charset += this.characterSets.symbols;

    // Remove excluded characters
    if (exclude) {
      charset = charset.split('').filter(char => !exclude.includes(char)).join('');
    }

    if (!charset) {
      throw new Error('No valid characters available after exclusions');
    }

    // Generate entropy using PBKDF2 (same as original)
    const salt = site + login + counter.toString(16);
    const entropy = await this.pbkdf2(masterPassword, salt, 100000, 32);
    
    // Generate password using the same algorithm as the original
    return this.renderPassword(entropy, {
      length,
      rules: this.getRules(lowercase, uppercase, digits, symbols),
      exclude
    });
  }

  getRules(lowercase, uppercase, digits, symbols) {
    const rules = [];
    if (lowercase) rules.push('lowercase');
    if (uppercase) rules.push('uppercase');
    if (digits) rules.push('digits');
    if (symbols) rules.push('symbols');
    return rules;
  }

  async pbkdf2(password, salt, iterations, keyLen) {
    // Web Crypto API implementation of PBKDF2-HMAC-SHA256
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      keyLen * 8
    );

    // Convert to big integer
    const hashArray = Array.from(new Uint8Array(derivedBits));
    return hashArray.reduce((acc, byte) => (acc << 8) + byte, 0n);
  }

  renderPassword(entropy, profile) {
    const { length, rules, exclude } = profile;
    
    // Get character set
    let charset = '';
    for (const rule of rules) {
      charset += this.removeExcludedChars(this.characterSets[rule], exclude);
    }

    // Generate base password
    const baseLength = Math.max(0, length - rules.length);
    let password = '';
    let remainingEntropy = entropy;

    // Generate base characters
    for (let i = 0; i < baseLength; i++) {
      const charsetLength = BigInt(charset.length);
      const index = remainingEntropy % charsetLength;
      password += charset[Number(index)];
      remainingEntropy = remainingEntropy / charsetLength;
    }

    // Add one character from each rule
    const extraChars = [];
    for (const rule of rules) {
      const ruleCharset = this.removeExcludedChars(this.characterSets[rule], exclude);
      const charsetLength = BigInt(ruleCharset.length);
      const index = remainingEntropy % charsetLength;
      extraChars.push(ruleCharset[Number(index)]);
      remainingEntropy = remainingEntropy / charsetLength;
    }

    // Insert extra characters pseudo-randomly
    return this.insertStringPseudoRandomly(password, entropy, extraChars);
  }

  removeExcludedChars(characters, exclude) {
    if (!exclude) return characters;
    return characters.split('').filter(char => !exclude.includes(char)).join('');
  }

  insertStringPseudoRandomly(password, entropy, extraChars) {
    let result = password;
    let currentEntropy = entropy;

    for (const char of extraChars) {
      if (result.length === 0) {
        result = char;
      } else {
        const index = Number(currentEntropy % BigInt(result.length + 1));
        result = result.slice(0, index) + char + result.slice(index);
        currentEntropy = currentEntropy / BigInt(result.length + 1);
      }
    }

    return result;
  }

  // Compatibility method to match bash script output exactly
  async generatePasswordCompatible(site, login, masterPassword, args) {
    // Parse command line arguments like the bash script
    const options = this.parseArguments(args);
    
    return await this.generatePassword(site, login, masterPassword, options);
  }

  parseArguments(args) {
    const options = {
      length: 16,
      counter: 1,
      lowercase: true,
      uppercase: true,
      digits: true,
      symbols: true,
      exclude: ''
    };

    if (!args) return options;

    // Simple argument parser (basic implementation)
    const parts = args.split(' ');
    for (let i = 0; i < parts.length; i++) {
      const arg = parts[i];
      
      if (arg === '-L' && i + 1 < parts.length) {
        options.length = parseInt(parts[++i]);
      } else if (arg === '--no-symbols') {
        options.symbols = false;
      } else if (arg === '--no-lowercase') {
        options.lowercase = false;
      } else if (arg === '--no-uppercase') {
        options.uppercase = false;
      } else if (arg === '--no-digits') {
        options.digits = false;
      } else if (arg === '--exclude' && i + 1 < parts.length) {
        options.exclude = parts[++i];
      } else if (arg.startsWith('-')) {
        // Handle combined flags like -lud
        if (arg.includes('l')) options.lowercase = true;
        if (arg.includes('u')) options.uppercase = true;
        if (arg.includes('d')) options.digits = true;
        if (arg.includes('s')) options.symbols = true;
      }
    }

    return options;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NullPassCore;
} else if (typeof self !== 'undefined') {
  self.NullPassCore = NullPassCore;
}