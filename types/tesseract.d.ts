declare module 'tesseract.js' {
  export interface RecognizeResult {
    data: {
      text: string;
      hocr?: string;
      tsv?: string;
      box?: string;
      unlv?: string;
      osd?: string;
      confidence: number;
      lines: Array<any>;
      blocks: Array<any>;
      paragraphs: Array<any>;
      words: Array<any>;
      symbols: Array<any>;
    };
  }

  export interface Worker {
    recognize(image: any): Promise<RecognizeResult>;
    terminate(): Promise<void>;
    load(): Promise<Worker>;
  }

  export function createWorker(language?: string): Promise<Worker>;
  export function createScheduler(): any;
  export const PSM: Record<string, number>;
  export const OEM: Record<string, number>;
} 