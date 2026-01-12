
export interface PolaroidPhoto {
  id: string;
  url: string;
  caption: string;
  filter: string;
  createdAt: number;
  scale?: number;
  posX?: number;
  posY?: number;
}

export enum PhotoFilter {
  NONE = 'none',
  VINTAGE = 'sepia(0.6) contrast(1.1) brightness(0.9)',
  B_W = 'grayscale(1) contrast(1.2)',
  WARM = 'sepia(0.2) saturate(1.4) brightness(1.1)',
  COOL = 'hue-rotate(180deg) saturate(0.8) brightness(1.1)'
}
