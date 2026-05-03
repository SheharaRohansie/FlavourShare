import type { PipelineStage as MongoosePipelineStage } from 'mongoose';

declare module 'mongodb' {
  export type PipelineStage = MongoosePipelineStage;
}