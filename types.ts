
export interface ProcessingStatus {
  step: 'idle' | 'reading' | 'parsing' | 'converting' | 'completed' | 'error';
  progress: number;
  message: string;
}

export interface ConversionStats {
  totalVariants: number;
  processedVariants: number;
  skippedVariants: number;
  referenceBuild?: string;
}

export interface VcfLine {
  chrom: string;
  pos: string;
  id: string;
  ref: string;
  alt: string;
  genotype: string;
}
