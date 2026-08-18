export type PresignPartCommand = {
  partNumber: number;
};

export type PresignPartResult = {
  url: string;
  partNumber: number;
  uploadId: string;
};
