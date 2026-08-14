declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfData {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  }

  const parsePdf: (buffer: Buffer, options?: Record<string, unknown>) => Promise<PdfData>;
  export default parsePdf;
}
