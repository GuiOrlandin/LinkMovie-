declare const brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [brand]: B };

/** Stable identity of a Video (CONTEXT.md). */
export type VideoId = Brand<string, 'VideoId'>;

/** Opaque token identifying the active UploadSession in HTTP paths (CONTEXT.md). */
export type UploadToken = Brand<string, 'UploadToken'>;

/** Stable identity of a MediaJob (ADR 0005 / CONTEXT MediaJob). */
export type MediaJobId = Brand<string, 'MediaJobId'>;

export function asVideoId(value: string): VideoId {
  return value as VideoId;
}

export function asUploadToken(value: string): UploadToken {
  return value as UploadToken;
}

export function asMediaJobId(value: string): MediaJobId {
  return value as MediaJobId;
}
