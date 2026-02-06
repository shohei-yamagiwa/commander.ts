class CommanderError extends Error {
  public readonly code: string;
  public readonly exitCode: number;
  public nestedError: Error | undefined;

  /**
   * Constructs the CommanderError instance
   *
   * @param {number} exitCode suggested exit code which could be used with process.exit
   * @param {string} code an id string representing the error
   * @param {string} message human-readable description of the error
   */
  constructor(exitCode: number, code: string, message?: string) {
    super(message);
    // properly capture stack trace in Node.js
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
    this.nestedError = undefined;
  }
}

class InvalidArgumentError extends CommanderError {
  /**
   * Constructs the InvalidArgumentError instance
   *
   * @param {string} [message] explanation of why argument is invalid
   */
  constructor(message?: string) {
    super(1, "commander.invalidArgument", message);
    // properly capture stack trace in Node.js
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
}

export { CommanderError, InvalidArgumentError };
