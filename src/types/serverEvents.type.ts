export interface ServerEvents {
  'file:saved': (file: {id:string, key:string} ) => void;
}
