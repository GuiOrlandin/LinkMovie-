/** Nest injection tokens — port interfaces do not exist at runtime. */
export const OBJECT_STORAGE = Symbol('ObjectStoragePort');
export const MEDIA_JOB_PUBLISHER = Symbol('MediaJobPublisherPort');
export const AMQP_CONNECTION = Symbol('AmqpConnection');
export const AMQP_CHANNEL = Symbol('AmqpChannel');
