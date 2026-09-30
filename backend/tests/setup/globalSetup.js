// Chạy 1 lần cho cả test run: khởi động MongoDB in-memory, chia sẻ URI cho các worker.
import { MongoMemoryServer } from 'mongodb-memory-server';

/** @param {import('vitest/node').TestProject} project */
export default async function setup(project) {
  const mongo = await MongoMemoryServer.create();
  project.provide('mongoUri', mongo.getUri());

  return async function teardown() {
    await mongo.stop();
  };
}
