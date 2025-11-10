'use server';
/**
 * @fileOverview Provides real-time audio feedback for yoga pose correction.
 *
 * - audioFeedbackForPoseCorrection - A function that generates audio feedback based on pose analysis.
 * - AudioFeedbackForPoseCorrectionInput - The input type for the audioFeedbackForPoseCorrection function.
 * - AudioFeedbackForPoseCorrectionOutput - The return type for the audioFeedbackForPoseCorrection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import {googleAI} from '@genkit-ai/google-genai';

const AudioFeedbackForPoseCorrectionInputSchema = z.object({
  feedbackText: z.string().describe('The text to be converted into speech for audio feedback.'),
});
export type AudioFeedbackForPoseCorrectionInput = z.infer<typeof AudioFeedbackForPoseCorrectionInputSchema>;

const AudioFeedbackForPoseCorrectionOutputSchema = z.object({
  audioDataUri: z.string().describe('The audio data URI containing the speech synthesis of the feedback text.'),
});
export type AudioFeedbackForPoseCorrectionOutput = z.infer<typeof AudioFeedbackForPoseCorrectionOutputSchema>;

export async function audioFeedbackForPoseCorrection(input: AudioFeedbackForPoseCorrectionInput): Promise<AudioFeedbackForPoseCorrectionOutput> {
  return audioFeedbackForPoseCorrectionFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const audioFeedbackForPoseCorrectionFlow = ai.defineFlow(
  {
    name: 'audioFeedbackForPoseCorrectionFlow',
    inputSchema: AudioFeedbackForPoseCorrectionInputSchema,
    outputSchema: AudioFeedbackForPoseCorrectionOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: input.feedbackText,
    });

    if (!media) {
      throw new Error('No media returned from TTS.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const audioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    return {
      audioDataUri: audioDataUri,
    };
  }
);
