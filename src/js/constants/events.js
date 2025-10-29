export const EVENTS = {
  USER: {
    LOGIN_ATTEMPT: 'user:login:attempt',
    LOGIN_SUCCESS: 'user:login:success',
    LOGIN_FAILURE: 'user:login:failure',
    LOGOUT: 'user:logout',
    PROFILE_UPDATE: 'user:profile:update',
    STATUS_CHANGE: 'user:status:change',
  },
  CHAT: {
    MESSAGE_SENT: 'chat:message:sent',
    MESSAGE_RECEIVED: 'chat:message:received',
    TYPING_START: 'chat:typing:start',
    TYPING_STOP: 'chat:typing:stop',
  },
  WEB3: {
    CONNECTED: 'web3:connected',
    DISCONNECTED: 'web3:disconnected',
    ACCOUNT_CHANGED: 'web3:account:changed',
    NETWORK_CHANGED: 'web3:network:changed',
  },
  UI: {
    THEME_CHANGE: 'ui:theme:change',
    NOTIFICATION: 'ui:notification',
    ERROR: 'ui:error',
  }
};
