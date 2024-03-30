import { HttpError } from './errors';

export const getPathsFromUrl = (url: string) => {
	return new URL(url).pathname.substring(1).split('/');
};

export const errorToHttpResponse = (error: any) => {
	if (error instanceof HttpError) {
		return Response.json({ message: error.message }, { status: error.status });
	}
	return Response.json({ message: error.message }, { status: 500 });
}
