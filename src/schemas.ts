import { string, regex, Input } from 'valibot';

// @example
// mhekkeeijkeeadploidppfdfhafnhoho
// ofdnipdnlkiocgonfdjclgopdnjkdehj
// gbgmenmdglilmbmemagekpeaodajbeei
export const ExtensionIdSchema = string([
	regex(/[a-z]{32}/, 'Invalid extension ID'),
]);

export type ExtensionId = Input<typeof ExtensionIdSchema>;

export { safeParse } from 'valibot';
