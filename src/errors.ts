export class HttpError extends Error {
	status: number;

	constructor(message?: string, status?: number) {
		super(message);
		this.name = this.constructor.name;
		this.status = status || 500;
	}
}

export class NotFound extends HttpError {
	constructor(message?: string) {
		super(message || 'Not Found', 404);
	}
}

export class BadRequest extends HttpError {
	constructor(message?: string) {
		super(message || 'Bad Request', 400);
	}
}

export class InternalServerError extends HttpError {
	constructor(message?: string) {
		super(message || 'Internal Server Error', 500);
	}
}
