type OutputType = 'object' | 'json' | 'string';

export interface Options {
  file: string;
  help?: boolean;
  language?: string;
  interfaces: string[];
  outFile?: string,
  fixed?: boolean;
  outputFormat?: OutputType;
}

export type Output =  {
  [index: string]: {}
}