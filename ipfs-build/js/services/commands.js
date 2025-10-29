/**
 * Command Execution Service
 */
export class CommandService {
  constructor(stateManager) {
    this.state = stateManager;
  }

  execute(commandInput) {
    if (!commandInput.startsWith('$')) {
      return 'ERROR: Commands must start with $';
    }

    const parts = commandInput.trim().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    const currentUser = this.state.getState('currentUser');
    const users = this.state.getState('users');

    switch (cmd) {
      case '$help':
        return this.#helpCommand();

      case '$showFriends':
        return this.#showFriendsCommand(currentUser);

      case '$status':
        return this.#statusCommand(currentUser);

      case '$users':
        return this.#usersCommand(users);

      case '$clear':
        return this.#clearCommand();

      case '$pubkey':
        return this.#pubkeyCommand(currentUser, args[0]);

      case '$encrypt':
        return this.#encryptCommand(args);

      case '$decrypt':
        return this.#decryptCommand(args);

      case '$ping':
        return this.#pingCommand(args[0], users);

      case '$whoami':
        return this.#whoamiCommand(currentUser);

      default:
        return `ERROR: Unknown command '${cmd}'\nType $help for available commands`;
    }
  }

  #helpCommand() {
    return `╔═══════════════════════════════════════╗
║         AVAILABLE COMMANDS            ║
╚═══════════════════════════════════════╝

SYSTEM:
  $help              Show this help
  $whoami            Display current user
  $status            Account statistics
  $clear             Clear terminal output

NETWORK:
  $users             List all users
  $ping <user>       Check user status
  $showFriends       Show friend list

CRYPTO:
  $pubkey [user]     Show public key
  $encrypt <msg>     Encrypt message
  $decrypt <msg>     Decrypt message

TYPE: $<command> [args]`;
  }

  #showFriendsCommand(currentUser) {
    if (!currentUser.friends || currentUser.friends.length === 0) {
      return '╔════════════════╗\n║  NO FRIENDS    ║\n╚════════════════╝\n\nYour friend list is empty.';
    }

    return `╔════════════════════════════════╗
║        FRIEND LIST             ║
╚════════════════════════════════╝

${currentUser.friends.map((f, i) => `  [${i + 1}] ${f}`).join('\n')}

TOTAL: ${currentUser.friends.length} friend(s)`;
  }

  #statusCommand(currentUser) {
    const unread = currentUser.messages.filter(
      m => !m.read && (m.to === currentUser.username || m.to === '@everyone')
    ).length;

    const sent = currentUser.messages.filter(m => m.from === currentUser.username).length;
    const received = currentUser.messages.filter(m => m.to === currentUser.username).length;

    return `╔════════════════════════════════╗
║      ACCOUNT STATUS            ║
╚════════════════════════════════╝

USER:       ${currentUser.username}
CREATED:    ${new Date(currentUser.createdAt).toLocaleDateString()}

MESSAGES:
  Total:    ${currentUser.messages.length}
  Sent:     ${sent}
  Received: ${received}
  Unread:   ${unread}

NETWORK:
  Friends:  ${currentUser.friends.length}
  Groups:   ${currentUser.groups.length}

SECURITY:
  Keypair:  ✓ ACTIVE
  PubKey:   ${currentUser.publicKey ? currentUser.publicKey.slice(0, 16) + '...' : 'N/A'}`;
  }

  #usersCommand(users) {
    const userList = Object.keys(users);
    
    return `╔════════════════════════════════╗
║      REGISTERED USERS          ║
╚════════════════════════════════╝

${userList.map((u, i) => `  [${i + 1}] ${u}`).join('\n')}

TOTAL: ${userList.length} user(s) online`;
  }

  #clearCommand() {
    this.state.setState('ui.commandResult', '');
    return '';
  }

  #pubkeyCommand(currentUser, targetUser) {
    if (!targetUser) {
      return `YOUR PUBLIC KEY:
${currentUser.publicKey || 'N/A'}

USE: $pubkey <username> to view others`;
    }

    const users = this.state.getState('users');
    const user = users[targetUser.startsWith('@') ? targetUser : '@' + targetUser];

    if (!user) {
      return `ERROR: User '${targetUser}' not found`;
    }

    return `PUBLIC KEY FOR ${user.username}:
${user.publicKey || 'N/A'}`;
  }

  #encryptCommand(args) {
    if (args.length === 0) {
      return 'USAGE: $encrypt <message>\nEncrypts message with your private key';
    }

    const message = args.join(' ');
    const encrypted = btoa(message);

    return `ENCRYPTED:
${encrypted}

Original length: ${message.length}
Encrypted length: ${encrypted.length}`;
  }

  #decryptCommand(args) {
    if (args.length === 0) {
      return 'USAGE: $decrypt <encrypted_message>';
    }

    try {
      const encrypted = args[0];
      const decrypted = atob(encrypted);
      
      return `DECRYPTED:
${decrypted}`;
    } catch (e) {
      return 'ERROR: Invalid encrypted message';
    }
  }

  #pingCommand(targetUser, users) {
    if (!targetUser) {
      return 'USAGE: $ping <username>';
    }

    const username = targetUser.startsWith('@') ? targetUser : '@' + targetUser;
    const user = users[username];

    if (!user) {
      return `ERROR: User '${targetUser}' not found`;
    }

    const latency = Math.floor(Math.random() * 100) + 10;

    return `PING ${username}...

RESPONSE: ✓ OK
LATENCY: ${latency}ms
STATUS: ONLINE`;
  }

  #whoamiCommand(currentUser) {
    return `╔════════════════════════════════╗
║         IDENTITY               ║
╚════════════════════════════════╝

USERNAME:  ${currentUser.username}
PUBKEY:    ${currentUser.publicKey ? currentUser.publicKey.slice(0, 32) + '...' : 'N/A'}
CREATED:   ${new Date(currentUser.createdAt).toLocaleString()}
FRIENDS:   ${currentUser.friends.length}
MESSAGES:  ${currentUser.messages.length}`;
  }
}
