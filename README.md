# NullPass

## The Password Manager That's Literally Nothing

NullPass is a stateless password manager that's so lightweight, it's practically *null* in size.

Stop wasting your time synchronizing your encrypted vault. Remember one master password to access your passwords, anywhere, anytime. No sync needed. No Python bloat. No dependencies. Just pure, unadulterated bash magic.

## How to use NullPass

### Command Line Interface

If you want to use NullPass in your terminal, just download the script and make it executable:

```bash
wget https://raw.githubusercontent.com/yourusername/nullpass/main/nullpass
chmod +x nullpass
./nullpass --help
```

### Web extensions

We don't have web extensions. We're too *null* for that.

### Mobile application

We don't have a mobile app. We're too *null* for that.

### Web site

We don't have a website. We're too *null* for that.

## Why NullPass?

- **Size matters**: While LessPass weighs in at thousands of lines of Python, NullPass is just a few hundred lines of bash. That's a *null* difference in size!
- **Minimal dependencies**: Aside from Python 3 for PBKDF2, it's just bash and ubiquitous Unix tools.
- **Stateless**: Like LessPass, NullPass doesn't store any passwords. It generates them on the fly.
- **LessPass compatible**: Uses the same PBKDF2-HMAC-SHA256 derivation as the official LessPass CLI, so outputs match for identical inputs.
- **Punny**: We're not afraid to make a *null* joke or two.

## Examples

```bash
# Generate a password for a site
nullpass example.com myuser mymasterpassword

# Generate a password without symbols
nullpass example.com myuser mymasterpassword --no-symbols

# Generate a password with only lowercase, uppercase, and digits (shortcut)
nullpass example.com myuser mymasterpassword -lud

# Generate a password with only digits and length of 8
nullpass example.com myuser mymasterpassword -d -L 8

# Use environment variable for master password
NULLPASS_MASTER_PASSWORD="mymasterpassword" nullpass example.com myuser

# Prompt for values interactively
nullpass -p

# Copy password to clipboard
nullpass example.com myuser mymasterpassword -c
```

Here's a sample invocation showing the prompt and resulting password:

```bash
$ ./nullpass example.org alice -L 16
Master Password: resilient-otter
!u7FW%9mG4^bR1P?
```

## Todo

- [ ] :speech_balloon: Add more *null* puns
- [ ] :memo: Write a guide on how to be even more *null*
- [ ] :rocket: Add a feature that's literally nothing

## Questions

If you have any questions, create an [issue](https://github.com/yourusername/nullpass/issues). Protip: do a quick search first to see if someone else has asked the same question before!

You can also reach me at contact@nullpass.com (which is also *null*).

## Special Thank you

Based on an original idea from [LessPass](https://github.com/lesspass/lesspass) but with a *null* twist :heart:
Thanks to LessPass for the great idea, which we managed to fit into a file smaller than their requirements.txt.

## License

This project is licensed under the terms of the GNU GPLv3.

## Contributors

This project exists thanks to all the people who contribute to the project. [You can help too! There are many ways to help make NullPass more *null*.](CONTRIBUTING.md)

[![Contributors list](https://opencollective.com/nullpass/contributors.svg?width=890)](https://github.com/yourusername/nullpass/graphs/contributors)
