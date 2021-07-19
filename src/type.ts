export interface Options {
  file: string;
  help?: boolean;
  language?: string;
  interfaces: string[];
  outFile?: string;
  fixed?: boolean;
  format?: boolean;
  silence?: boolean;
  repeat?: number;
}

export type Output =  {
  [index: string]: {}
}