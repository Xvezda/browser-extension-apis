import { string, regex, object, Input, ValiError } from 'valibot';

// @ts-ignore
export const ManifestSchema = object<chrome.runtime.Manifest>({});

// @example
// mhekkeeijkeeadploidppfdfhafnhoho
// ofdnipdnlkiocgonfdjclgopdnjkdehj
// gbgmenmdglilmbmemagekpeaodajbeei
export const ExtensionIdSchema = string([
	regex(/[a-z]{32}/, 'Invalid extension ID'),
]);

export type ExtensionId = Input<typeof ExtensionIdSchema>;

export const isValidateError = (error: any): error is ValiError => {
	return error instanceof ValiError;
}

export const getErrorMessage = (error: any) => {
	if (isValidateError(error)) {
		return error.message;
	}
	return error.message || 'Internal Server Error';
}

export { parse as validate } from 'valibot';
