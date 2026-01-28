export type NotificationType = 'alert' | 'info' | 'warning' | 'error';

export interface Notification {
  title: string;
  body: string;
  type: NotificationType;
  [key: string]: string ;
}



export * from './sendMessage.js';
