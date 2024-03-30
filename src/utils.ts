export const getPathsFromUrl = (url: string) => {
	return new URL(url).pathname.substring(1).split('/');
};

export const formatShieldsIo = (data: { version: string }) => {
	return {
		schemaVersion: 1,
		label: 'version',
		message: `v${data.version}`,
	};
};

