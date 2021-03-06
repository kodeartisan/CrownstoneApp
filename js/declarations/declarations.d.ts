// node require
declare const require: {
  (path: string): any;
  <T>(path: string): T;
  (paths: string[], callback: (...modules: any[]) => void): void;
  ensure: (paths: string[], callback: (require: <T>(path: string) => T) => void) => void;
};


declare module 'react-native-image-resizer' {
  const createResizedImage: any;
  export default createResizedImage;
}

declare const global: {
  __DEV__: boolean
};

interface locationDataContainer {
  region:   string,
  location: string,
}

type map = { [proptype: string] : boolean } | {}
type numberMap = { [proptype: string] : number } | {}
type stringMap = { [proptype: string] : string } | {}

declare const module: any;

type PromiseCallback = (any) => Promise<any>