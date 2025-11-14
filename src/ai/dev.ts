'use server';
/**
 * @fileOverview This file imports all the Genkit flows and makes them available to the development server.
 */
import { config } from 'dotenv';
config();

import '@/features/yoga-plan/flows/generate-yoga-plan';
import '@/features/pose-correction/flows/generate-audio-feedback';
import '@/features/custom-poses/flows/generate-pose-rules';
import '@/features/custom-poses/flows/generate-pose-image';
